import { randomBytes, randomUUID, createHash } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, foodWorkspacesTable, foodLessonRequestsTable } from "@workspace/db";
import {
  GetFoodWorkspaceResponse, UpdateFoodWorkspaceBody, UpdateFoodWorkspaceResponse,
  MatchFoodIngredientsBody, MatchFoodIngredientsResponse, CreateLessonRequestBody,
  CreateLessonRequestResponse, DeleteLessonRequestParams, GetFoodSummaryResponse,
} from "@workspace/api-zod";
import { getCatalog } from "../lib/food-catalog";

const router: IRouter = Router();
const COOKIE = "food_hub_guest";
const defaults = () => ({
  nickname: "Home cook", savedRecipeIds: [], plan: [], groceries: [], basket: [],
  voucher: "", courseProgress: [],
});

function workspaceId(req: Request): string | undefined {
  const token = req.headers.cookie?.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex") : undefined;
}

async function readWorkspace(id: string) {
  const [row] = await db.select().from(foodWorkspacesTable).where(eq(foodWorkspacesTable.id, id));
  if (!row) return undefined;
  const requests = await db.select().from(foodLessonRequestsTable)
    .where(eq(foodLessonRequestsTable.workspaceId, id)).orderBy(desc(foodLessonRequestsTable.createdAt));
  return GetFoodWorkspaceResponse.parse({ ...defaults(), ...row.data, guest: true, lessonRequests: requests.map((r) => r.data) });
}

// A guest workspace is an unregistered browser's private scratchpad, not a login.
// No client-supplied user IDs, identity documents, payment details or access roles.
router.use("/food", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    const host = req.get("x-forwarded-host")?.split(",")[0]?.trim() ?? req.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          res.status(403).json({ error: "Cross-site changes are not allowed." }); return;
        }
      } catch {
        res.status(403).json({ error: "Invalid origin." }); return;
      }
    }
  }
  next();
});

router.get("/food/catalog", async (_req, res): Promise<void> => {
  res.json(await getCatalog());
});

router.get("/food/workspace", async (req, res): Promise<void> => {
  let id = workspaceId(req);
  let state = id ? await readWorkspace(id) : undefined;
  if (!state) {
    const token = randomBytes(32).toString("hex");
    id = createHash("sha256").update(token).digest("hex");
    await db.insert(foodWorkspacesTable).values({ id, data: defaults() });
    res.cookie(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 365 * 86400000, path: "/api/food" });
    state = await readWorkspace(id);
  }
  res.json(state);
});

router.patch("/food/workspace", async (req, res): Promise<void> => {
  const id = workspaceId(req);
  if (!id) { res.status(401).json({ error: "Open your cooking workspace before saving." }); return; }
  const body = UpdateFoodWorkspaceBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Some saved details are invalid.", details: body.error.flatten() }); return; }
  const data = body.data;
  const catalog = await getCatalog();
  const recipes = new Set(catalog.recipes.map((r) => r.id));
  const courses = new Set(catalog.courses.map((r) => r.id));
  if (data.savedRecipeIds?.some((r) => !recipes.has(r))
    || data.plan?.some((r) => !recipes.has(r.recipeId) || Number.isNaN(Date.parse(`${r.date}T12:00:00Z`)))
    || data.courseProgress?.some((p) => !courses.has(p.courseId) || p.completed.some((i) => i >= (catalog.courses.find((c) => c.id === p.courseId)?.lessons.length ?? 0)))
    || (data.voucher && !catalog.vouchers.some((v) => v.code === data.voucher))
    || data.basket?.some((item) => item.kind === "course" && !courses.has(item.referenceId))) {
    res.status(400).json({ error: "The selection contains an unknown recipe, course or voucher." }); return;
  }
  // Atomic JSON merge: updating a nickname cannot erase a simultaneous meal-plan save.
  const [updated] = await db.update(foodWorkspacesTable)
    .set({ data: sql`${foodWorkspacesTable.data} || ${JSON.stringify(data)}::jsonb`, updatedAt: new Date() })
    .where(eq(foodWorkspacesTable.id, id)).returning({ id: foodWorkspacesTable.id });
  if (!updated) { res.status(401).json({ error: "Your guest workspace expired. Reload to start a new one." }); return; }
  res.json(UpdateFoodWorkspaceResponse.parse(await readWorkspace(id)));
});

router.post("/food/match", async (req, res): Promise<void> => {
  const body = MatchFoodIngredientsBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Choose up to 50 ingredients." }); return; }
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/s$/, "");
  const selected = body.data.ingredients.map(normalize).filter(Boolean);
  const catalog = await getCatalog();
  const result = catalog.recipes.map((recipe) => {
    const matches = (name: string) => selected.some((s) => normalize(name).includes(s) || s.includes(normalize(name)));
    const matched = recipe.ingredients.filter((i) => matches(i.name)).map((i) => i.name);
    const missing = recipe.ingredients.filter((i) => !matches(i.name)).map((i) => i.name);
    return { recipeId: recipe.id, percentage: Math.round(matched.length / recipe.ingredients.length * 100), matched, missing };
  }).sort((a, b) => b.percentage - a.percentage);
  res.json(MatchFoodIngredientsResponse.parse(result));
});

router.post("/food/lesson-requests", async (req, res): Promise<void> => {
  const id = workspaceId(req);
  if (!id || !await readWorkspace(id)) { res.status(401).json({ error: "Open your workspace first." }); return; }
  const body = CreateLessonRequestBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Select a cook, dish and valid future time." }); return; }
  const data = body.data;
  const startsAt = new Date(data.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() + 60000 || startsAt.getTime() > Date.now() + 365 * 86400000) {
    res.status(400).json({ error: "Choose a time between one minute and one year from now." }); return;
  }
  if (data.format !== "online") { res.status(422).json({ error: "Home visits are unavailable until location and safety verification are connected." }); return; }
  const catalog = await getCatalog();
  const cook = catalog.cooks.find((c) => c.id === data.cookId);
  if (!cook || !cook.dishes.includes(data.recipeId)) { res.status(400).json({ error: "Select a dish offered by this sample cook." }); return; }
  const existing = await db.select({ id: foodLessonRequestsTable.id }).from(foodLessonRequestsTable).where(eq(foodLessonRequestsTable.workspaceId, id));
  if (existing.length >= 20) { res.status(400).json({ error: "You can save up to 20 draft requests. Remove an old draft first." }); return; }
  const request = CreateLessonRequestResponse.parse({
    ...data, startsAt: startsAt.toISOString(), id: randomUUID(), status: "draft",
    total: Math.round(cook.hourlyRate * data.packageSize * (data.packageSize === 5 ? .85 : 1)),
    currency: cook.currency, createdAt: new Date().toISOString(),
  });
  const [saved] = await db.insert(foodLessonRequestsTable)
    .values({ id: request.id, workspaceId: id, startsAt: startsAt.toISOString(), data: request })
    .onConflictDoNothing().returning({ id: foodLessonRequestsTable.id });
  if (!saved) { res.status(409).json({ error: "You already have a draft request at this time." }); return; }
  res.status(201).json(request);
});

router.delete("/food/lesson-requests/:id", async (req, res): Promise<void> => {
  const id = workspaceId(req);
  const params = DeleteLessonRequestParams.safeParse(req.params);
  if (!id) { res.status(401).json({ error: "Open your workspace first." }); return; }
  if (!params.success) { res.status(400).json({ error: "Invalid request." }); return; }
  const deleted = await db.delete(foodLessonRequestsTable).where(and(
    eq(foodLessonRequestsTable.id, params.data.id), eq(foodLessonRequestsTable.workspaceId, id),
  )).returning({ id: foodLessonRequestsTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Draft request not found." }); return; }
  res.sendStatus(204);
});

router.get("/food/summary", async (req, res): Promise<void> => {
  const id = workspaceId(req);
  const state = id ? await readWorkspace(id) : undefined;
  res.json(GetFoodSummaryResponse.parse({
    savedRecipes: state?.savedRecipeIds?.length ?? 0,
    plannedMeals: state?.plan?.length ?? 0,
    groceryItems: state?.groceries?.filter((g) => !g.checked).length ?? 0,
    lessonRequests: state?.lessonRequests.length ?? 0,
    completedLessons: state?.courseProgress?.reduce((n, c) => n + c.completed.length, 0) ?? 0,
  }));
});

export default router;

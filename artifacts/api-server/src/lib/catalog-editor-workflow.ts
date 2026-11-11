import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { recipes } from "../scripts/seed-food";
import { buildCatalogRelease } from "./catalog-release";
import { checkId, canonical, containedFile, readJson, sha256, validateDraft, type EditorPaths, type ValidatedDraft } from "./catalog-editor-validation";
import { photoCredit, renderDraftPreview } from "./catalog-editor-preview";

type Approval = {
  version: 1; recipeId: string; draftSha256: string; previewSha256: string;
  approvedBy: string; approvedAt: string; confirmed: { recipe: true; photoRights: true };
};
type ReleaseHistory = { recipeHashes: Record<string, string>; draftHashes: Record<string, string> };
const basePhotoHashes: Record<string, string> = {
  "mahshi.jpg": "92c82f675d8f1a4f8df09ae2fd46697f31e6e6ee5f3bdd9b5fce76c179e6fb40",
  "molokhia.jpg": "6d3e4e7a1c8982ac5acc32c4051b0fff7b42d3dcb81f7fe11e67528f9e87e43a",
  "koshari.jpg": "151b801084f6dfbf3cf7d0f12caaec42e627cb88426534c8c90d7f9b5cf498d7",
};
const subdir = (paths: EditorPaths, name: string) => resolve(paths.catalogRoot, name);
function ensure(paths: EditorPaths) {
  for (const name of ["drafts", "photos", "rights", "approvals", "prepared-releases"]) mkdirSync(subdir(paths, name), { recursive: true });
  mkdirSync(paths.outputRoot, { recursive: true });
}
function json(path: string, data: unknown, exclusive = false) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { flag: exclusive ? "wx" : "w" });
}
function reviewerAlias(value: string) {
  if (!value || value.trim().length < 3 || value.length > 80 || /[\n\r<>]/.test(value)) throw new Error("Provide a reviewer alias of 3–80 characters, not credentials or personal documents.");
  return value.trim();
}
export function loadDraft(paths: EditorPaths, id: string) {
  checkId(id);
  const value = readJson(containedFile(subdir(paths, "drafts"), `${id}.json`));
  const entry = validateDraft(value, paths, recipes.map((r) => r.id));
  if (entry.draft.recipe.id !== id) throw new Error("Recipe ID must match its draft filename. Existing IDs cannot be renamed.");
  return entry;
}

export function createDraft(paths: EditorPaths, id: string) {
  checkId(id); ensure(paths);
  if (recipes.some((r) => r.id === id)) throw new Error("An existing launch recipe already uses this ID.");
  const path = resolve(subdir(paths, "drafts"), `${id}.json`);
  // Intentionally invalid until an editor supplies real recipe and rights details.
  json(path, {
    version: 1,
    recipe: { id, title: "", subtitle: "", description: "", image: `/images/food-hub/${id}.jpg`, minutes: 0, servings: 4, category: "Everyday", vegetarian: false, calories: 0, difficulty: "Easy",
      ingredients: [{ name: "", quantity: 0, unit: "" }], steps: [{ text: "", timerSeconds: 0 }] },
    editorial: { cuisine: "Egyptian", dishContext: "", instructionSource: "", allergens: "", safetyNotes: "", nutritionBasis: "" },
    photo: { file: `${id}.jpg`, title: "", creator: "", sourceUrl: "", license: "", licenseUrl: "", changes: "", dishMatch: "", evidenceFile: `${id}.md`, sha256: "" },
  }, true);
  return path;
}

export function previewDraft(paths: EditorPaths, id: string) {
  const entry = loadDraft(paths, id);
  const out = resolve(paths.outputRoot, "reviews", id);
  mkdirSync(out, { recursive: true });
  const html = renderDraftPreview(entry);
  const path = resolve(out, "preview.html");
  writeFileSync(path, html);
  json(resolve(out, "review.json"), { draftSha256: entry.fingerprint, previewSha256: sha256(html) });
  return { path, fingerprint: entry.fingerprint };
}

export function approveDraft(paths: EditorPaths, id: string, options: {
  reviewedSha: string; reviewer: string; confirmRecipe: boolean; confirmRights: boolean;
}) {
  const entry = loadDraft(paths, id);
  if (!options.confirmRecipe || !options.confirmRights) throw new Error("Explicit --confirm-recipe and --confirm-rights are both required.");
  if (options.reviewedSha !== entry.fingerprint) throw new Error("Reviewed fingerprint is stale or incorrect. Generate and review a new preview.");
  const reviewDir = resolve(paths.outputRoot, "reviews", id);
  const preview = readFileSync(resolve(reviewDir, "preview.html"), "utf8");
  const review = readJson(resolve(reviewDir, "review.json")) as Record<string, unknown>;
  if (review.draftSha256 !== entry.fingerprint || review.previewSha256 !== sha256(preview) || preview !== renderDraftPreview(entry)) {
    throw new Error("The preview changed or is stale. Generate and review it again.");
  }
  const approval: Approval = {
    version: 1, recipeId: id, draftSha256: entry.fingerprint, previewSha256: sha256(preview),
    approvedBy: reviewerAlias(options.reviewer), approvedAt: new Date().toISOString(),
    confirmed: { recipe: true, photoRights: true },
  };
  mkdirSync(subdir(paths, "approvals"), { recursive: true });
  const file = resolve(subdir(paths, "approvals"), `${id}.json`);
  if (existsSync(file)) {
    const previous = readJson(file) as Approval;
    if (canonical({ ...previous, approvedAt: "" }) === canonical({ ...approval, approvedAt: "" })) return previous;
    throw new Error("An approval already exists. Do not overwrite it; retain the audit trail and follow the documented withdrawal procedure.");
  }
  json(file, approval, true);
  return approval;
}

function checkApproval(paths: EditorPaths, id: string, entry: ValidatedDraft): Approval {
  const a = readJson(containedFile(subdir(paths, "approvals"), `${id}.json`)) as Approval;
  if (a.version !== 1 || a.recipeId !== id || a.draftSha256 !== entry.fingerprint ||
      a.previewSha256 !== sha256(renderDraftPreview(entry)) ||
      a.confirmed?.recipe !== true || a.confirmed?.photoRights !== true ||
      !Number.isFinite(Date.parse(a.approvedAt))) {
    throw new Error(`Approval for ${id} is missing, stale or invalid. Recipe, photo and evidence changes require a new review.`);
  }
  reviewerAlias(a.approvedBy);
  return a;
}

/** Creates an approved release package, never a database write or app install. */
export function prepareRecipeRelease(paths: EditorPaths, options: { reviewer: string; confirmRelease: boolean }) {
  if (!options.confirmRelease) throw new Error("Release requires --confirm-approved-release.");
  const releasedBy = reviewerAlias(options.reviewer);
  ensure(paths);
  const ids = readdirSync(subdir(paths, "approvals")).filter((f) => f.endsWith(".json"))
    .map((f) => checkId(f.slice(0, -5))).sort();
  if (!ids.length) throw new Error("No approved recipe additions. Create, validate, preview and explicitly approve a draft first.");
  const additions = ids.map((id) => loadDraft(paths, id));
  const approvals = additions.map((entry) => checkApproval(paths, entry.draft.recipe.id, entry));
  const allRecipes = [...recipes, ...additions.map((e) => e.draft.recipe)];
  const history: ReleaseHistory = {
    recipeHashes: Object.fromEntries(allRecipes.map((r) => [r.id, sha256(canonical(r))])),
    draftHashes: Object.fromEntries(additions.map((e) => [e.draft.recipe.id, e.fingerprint])),
  };
  // Prepared releases are retained in source control. Removing/renaming an
  // already-prepared recipe, photo or approval cannot create a smaller release.
  for (const filename of readdirSync(subdir(paths, "prepared-releases")).filter((f) => f.endsWith(".json"))) {
    const previous = readJson(containedFile(subdir(paths, "prepared-releases"), filename)) as ReleaseHistory;
    if (!previous.recipeHashes || !previous.draftHashes) throw new Error("Malformed release history; stop and review it.");
    for (const [id, hash] of Object.entries(previous.recipeHashes)) {
      if (history.recipeHashes[id] !== hash) throw new Error(`Previously prepared recipe ${id} is missing or changed. Additions never update or rename released IDs.`);
    }
    for (const [id, hash] of Object.entries(previous.draftHashes)) {
      if (history.draftHashes[id] !== hash) throw new Error(`Previously prepared review ${id} changed. Release a separately reviewed update workflow instead.`);
    }
  }
  const release = buildCatalogRelease(allRecipes);
  const baseCredits = readFileSync(resolve(paths.publicRoot, "photo-credits.html"), "utf8")
    .replace(/<!-- FOOD-HUB-EDITOR-CREDITS:START -->[\s\S]*?<!-- FOOD-HUB-EDITOR-CREDITS:END -->/g, "");
  if (!baseCredits.includes("</main>") || !["Mkevy", "Habib Mhenni", "Basma", "Ibrahim.ID", "PetarM"].every((s) => baseCredits.includes(s))) {
    throw new Error("The original launch photo credits are missing. Restore the licensed baseline.");
  }
  const credits = baseCredits.replace("</main>", `<!-- FOOD-HUB-EDITOR-CREDITS:START -->${additions.map(photoCredit).join("\n")}<!-- FOOD-HUB-EDITOR-CREDITS:END -->\n</main>`);
  const basePhotos = Object.entries(basePhotoHashes).map(([file, hash]) => {
    const bytes = readFileSync(containedFile(resolve(paths.publicRoot, "images/food-hub"), file));
    if (sha256(bytes) !== hash) throw new Error(`Launch photo ${file} changed. Do not bypass its existing licensing review.`);
    return { path: `/images/food-hub/${file}`, sha256: hash, contentType: "image/jpeg", bytes };
  });
  const photos = [...basePhotos, ...additions.map((e) => ({
    path: e.draft.recipe.image, sha256: e.draft.photo.sha256, contentType: e.contentType, bytes: e.photoBytes,
  }))];
  const approvalHashes = approvals.map((a) => sha256(canonical(a)));
  const editorialReleaseSha256 = sha256(canonical({
    catalogSha256: release.fingerprint, photos: photos.map(({ bytes: _bytes, ...p }) => p),
    creditsSha256: sha256(credits), approvalHashes,
  }));
  const out = resolve(paths.outputRoot, "releases", editorialReleaseSha256);
  mkdirSync(resolve(out, "public/images/food-hub"), { recursive: true });
  const manifest = {
    sha256: release.fingerprint, recipeIds: allRecipes.map((r) => r.id), recipesOnly: true,
    editorialReleaseSha256, photos: photos.map(({ bytes: _bytes, ...p }) => p),
    creditsSha256: sha256(credits), approvalHashes,
  };
  json(resolve(out, "recipes.json"), release.catalog);
  json(resolve(out, "release.json"), manifest);
  json(resolve(out, "approvals.json"), approvals);
  writeFileSync(resolve(out, "import.sql"), release.sql);
  writeFileSync(resolve(out, "verify.sql"), release.verificationSql);
  writeFileSync(resolve(out, "public/photo-credits.html"), credits);
  for (const p of photos) writeFileSync(resolve(out, `public${p.path}`), p.bytes);
  const historyPath = resolve(subdir(paths, "prepared-releases"), `${editorialReleaseSha256}.json`);
  if (!existsSync(historyPath)) json(historyPath, { ...history, editorialReleaseSha256, preparedBy: releasedBy, preparedAt: new Date().toISOString(), status: "prepared-not-published" }, true);
  return { out, fingerprint: editorialReleaseSha256, recipeIds: manifest.recipeIds };
}

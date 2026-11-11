import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { GetFoodCatalogResponse } from "@workspace/api-zod";

export type Recipe = ReturnType<typeof GetFoodCatalogResponse.parse>["recipes"][number];
export type EditorPaths = { catalogRoot: string; publicRoot: string; outputRoot: string };
export type Photo = {
  file: string; title: string; creator: string; sourceUrl: string;
  license: string; licenseUrl: string; changes: string; dishMatch: string;
  evidenceFile: string; sha256: string;
};
export type RecipeDraft = {
  version: 1; recipe: Recipe; photo: Photo;
  editorial: { cuisine: "Egyptian"; dishContext: string; instructionSource: string; allergens: string; safetyNotes: string; nutritionBasis: string };
};
export type ValidatedDraft = {
  draft: RecipeDraft; fingerprint: string; photoBytes: Buffer;
  contentType: string; evidenceSha256: string;
};

export const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
export function checkId(id: string) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 60) {
    throw new Error("Recipe ID must be a lowercase hyphenated slug, at most 60 characters.");
  }
  return id;
}
export function readJson(path: string): unknown {
  if (statSync(path).size > 256 * 1024) throw new Error("JSON files must be no larger than 256 KB.");
  return JSON.parse(readFileSync(path, "utf8"));
}
export function containedFile(root: string, relative: string): string {
  const base = realpathSync(root);
  const file = realpathSync(resolve(root, relative));
  if (!file.startsWith(`${base}${sep}`)) throw new Error("File must remain inside its catalog directory; symlinks cannot escape.");
  if (!statSync(file).isFile()) throw new Error("Expected a regular file.");
  return file;
}

const ccLicenses: Record<string, string> = {
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC-BY-SA-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC-BY-SA-3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
};
function httpsUrl(value: string, field: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search) throw new Error(`${field} must be a public HTTPS URL without credentials or signed/query parameters.`);
}
function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object.`);
  return value as Record<string, unknown>;
}
function onlyKeys(obj: Record<string, unknown>, keys: string[], name: string) {
  if (Object.keys(obj).some((k) => !keys.includes(k)) || keys.some((k) => !(k in obj))) {
    throw new Error(`${name} must have exactly these fields: ${keys.join(", ")}.`);
  }
}
function text(value: unknown, field: string, min = 1, max = 4000): asserts value is string {
  if (typeof value !== "string" || value.trim().length < min || value.length > max || /\u0000/.test(value)) {
    throw new Error(`${field} must contain ${min}–${max} characters, without null bytes.`);
  }
}

export function validateDraft(value: unknown, paths: EditorPaths, existingIds: string[]): ValidatedDraft {
  const raw = record(value, "Draft");
  onlyKeys(raw, ["version", "recipe", "photo", "editorial"], "Draft");
  if (raw.version !== 1) throw new Error("Unsupported draft version.");
  const parsed = GetFoodCatalogResponse.shape.recipes.element.strict().safeParse(raw.recipe);
  if (!parsed.success) throw new Error(`Recipe fields: ${parsed.error.message}`);
  const recipe = parsed.data;
  checkId(recipe.id);
  if (existingIds.includes(recipe.id)) throw new Error("This ID already belongs to a launch recipe. This workflow adds dishes; it never replaces or renames recipes.");
  for (const field of ["title", "subtitle", "description", "category"] as const) text(recipe[field], `recipe.${field}`, 3, field === "description" ? 4000 : 160);
  if (!["Easy", "Medium", "Advanced"].includes(recipe.difficulty)) throw new Error("Difficulty must be Easy, Medium or Advanced.");
  if (recipe.minutes < 1 || recipe.minutes > 2880) throw new Error("Cooking time must be 1–2880 minutes.");
  if (recipe.servings < 1 || recipe.servings > 20) throw new Error("Servings must be 1–20.");
  if (recipe.calories < 0 || recipe.calories > 5000) throw new Error("Calories must be 0–5000 per serving, with a documented basis.");
  if (!recipe.ingredients.length || recipe.ingredients.length > 60) throw new Error("Include 1–60 ingredients.");
  const ingredientKeys = new Set<string>();
  for (const ing of recipe.ingredients) {
    text(ing.name, "Ingredient name", 2, 100); text(ing.unit, "Ingredient unit", 1, 30);
    if (!Number.isFinite(ing.quantity) || ing.quantity <= 0 || ing.quantity > 100000) throw new Error("Every ingredient needs a positive finite quantity, at most 100000.");
    const key = `${ing.name.trim().toLowerCase()}|${ing.unit.trim().toLowerCase()}`;
    if (ingredientKeys.has(key)) throw new Error("Combine duplicate ingredient lines using the same name and unit.");
    ingredientKeys.add(key);
  }
  if (!recipe.steps.length || recipe.steps.length > 40) throw new Error("Include 1–40 cooking steps.");
  for (const step of recipe.steps) {
    text(step.text, "Step instruction", 12, 3000);
    if (step.timerSeconds < 0 || step.timerSeconds > 86400) throw new Error("Step timers must be 0–86400 seconds.");
  }
  const editorial = record(raw.editorial, "Editorial review");
  onlyKeys(editorial, ["cuisine", "dishContext", "instructionSource", "allergens", "safetyNotes", "nutritionBasis"], "Editorial review");
  if (editorial.cuisine !== "Egyptian") throw new Error("Document the dish's Egyptian context.");
  for (const k of ["dishContext", "instructionSource", "allergens", "safetyNotes", "nutritionBasis"]) text(editorial[k], `editorial.${k}`, 10);
  const photo = record(raw.photo, "Photo");
  onlyKeys(photo, ["file", "title", "creator", "sourceUrl", "license", "licenseUrl", "changes", "dishMatch", "evidenceFile", "sha256"], "Photo");
  for (const k of Object.keys(photo)) {
    if (k === "licenseUrl" && ["owned", "permission"].includes(String(photo.license))) continue;
    text(photo[k], `photo.${k}`, 1);
  }
  const p = photo as unknown as Photo;
  if (!/^[a-z][a-z0-9-]*\.(jpg|png|webp)$/.test(p.file)) throw new Error("Use a lowercase photo filename ending in .jpg, .png or .webp, without directories.");
  if (!p.file.startsWith(`${recipe.id}.`) || recipe.image !== `/images/food-hub/${p.file}`) throw new Error("Photo filename and recipe.image must match the stable recipe ID exactly.");
  httpsUrl(p.sourceUrl, "Photo source");
  if (ccLicenses[p.license]) {
    if (p.licenseUrl !== ccLicenses[p.license]) throw new Error("The license link does not match the selected Creative Commons license.");
  } else if (["owned", "permission"].includes(p.license)) {
    if (typeof p.licenseUrl !== "string") throw new Error("licenseUrl must be a string (may be empty for owned/permission).");
    if (p.licenseUrl) httpsUrl(p.licenseUrl, "License link");
  } else {
    throw new Error("Use CC0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-SA-3.0, owned or permission. Non-commercial/unknown licenses cannot be released.");
  }
  text(p.dishMatch, "Dish-match explanation", 20);
  text(p.changes, "Image changes", 4);
  if (!/^[a-z0-9-]+\.(md|txt)$/.test(p.evidenceFile)) throw new Error("Evidence must be a plain .md/.txt filename in catalog/rights.");
  const imagePath = containedFile(resolve(paths.catalogRoot, "photos"), p.file);
  const imageSize = statSync(imagePath).size;
  if (imageSize < 100 || imageSize > 5 * 1024 * 1024) throw new Error("Photos must be 100 bytes–5 MB.");
  const photoBytes = readFileSync(imagePath);
  const isJpeg = photoBytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isPng = photoBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = photoBytes.toString("ascii", 0, 4) === "RIFF" && photoBytes.toString("ascii", 8, 12) === "WEBP";
  if (!(p.file.endsWith(".jpg") ? isJpeg : p.file.endsWith(".png") ? isPng : isWebp)) throw new Error("Photo bytes do not match the image extension.");
  if (p.sha256 !== sha256(photoBytes)) throw new Error("Photo SHA-256 does not match the local file. Review the actual photo and record its hash.");
  const evidencePath = containedFile(resolve(paths.catalogRoot, "rights"), p.evidenceFile);
  if (statSync(evidencePath).size > 256 * 1024) throw new Error("Rights evidence must be at most 256 KB; do not include private documents or secrets.");
  const evidence = readFileSync(evidencePath, "utf8");
  if (evidence.trim().length < 40) throw new Error("Document commercial reuse permission, attribution and any adaptation requirements in the rights evidence.");
  const draft = { version: 1, recipe, photo: p, editorial } as RecipeDraft;
  const evidenceSha256 = sha256(evidence);
  return { draft, photoBytes, evidenceSha256, contentType: isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp",
    fingerprint: sha256(canonical({ draft, evidenceSha256 })) };
}

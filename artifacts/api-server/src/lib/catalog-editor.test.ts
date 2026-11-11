import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, symlinkSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createServer } from "node:http";
import { recipes } from "../scripts/seed-food";
import { sha256, validateDraft, type EditorPaths, type RecipeDraft } from "./catalog-editor-validation";
import { createDraft, loadDraft, previewDraft, approveDraft, prepareRecipeRelease } from "./catalog-editor-workflow";
import { buildCatalogRelease } from "./catalog-release";

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "food-editor-"));
  const paths: EditorPaths = { catalogRoot: resolve(root, "catalog"), publicRoot: resolve("../food-hub/public"), outputRoot: resolve(root, "output") };
  for (const dir of ["drafts", "photos", "rights", "approvals", "prepared-releases"]) mkdirSync(resolve(paths.catalogRoot, dir), { recursive: true });
  // Reuse a licensed image ONLY as synthetic workflow test data; no recipe is published.
  const id = "koshari-test";
  const bytes = readFileSync(resolve(paths.publicRoot, "images/food-hub/koshari.jpg"));
  writeFileSync(resolve(paths.catalogRoot, "photos", `${id}.jpg`), bytes);
  writeFileSync(resolve(paths.catalogRoot, "rights", `${id}.md`), "TEST FIXTURE: Egyptian Koshari by Basma, version edits Ibrahim.ID and PetarM, CC BY-SA 4.0. Attribution and ShareAlike required; source https://commons.wikimedia.org/wiki/File:Egyptian_Koshari.jpg");
  const draft: RecipeDraft = {
    version: 1, recipe: { ...structuredClone(recipes[2]), id, image: `/images/food-hub/${id}.jpg` },
    photo: { file: `${id}.jpg`, title: "Egyptian Koshari (test fixture)", creator: "Basma; version edits Ibrahim.ID and PetarM", sourceUrl: "https://commons.wikimedia.org/wiki/File:Egyptian_Koshari.jpg", license: "CC-BY-SA-4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", changes: "Test copy of licensed 1280px thumbnail; display crops.", dishMatch: "The photographed rice, lentils and pasta match the koshari test fixture.", evidenceFile: `${id}.md`, sha256: sha256(bytes) },
    editorial: { cuisine: "Egyptian", dishContext: "Synthetic test fixture for an Egyptian koshari recipe.", instructionSource: "Existing Food Hub curated koshari instructions, test only.", allergens: "Contains wheat pasta; check ingredient packaging.", safetyNotes: "Cool and refrigerate cooked rice promptly within two hours.", nutritionBasis: "Illustrative calorie estimate, not independently tested." },
  };
  const draftFile = resolve(paths.catalogRoot, "drafts", `${id}.json`);
  const save = () => writeFileSync(draftFile, JSON.stringify(draft));
  save();
  const approval = () => {
    const preview = previewDraft(paths, id);
    return approveDraft(paths, id, { reviewedSha: preview.fingerprint, reviewer: "test-editor", confirmRecipe: true, confirmRights: true });
  };
  return { paths, id, draft, save, approval, root, clean: () => rmSync(root, { recursive: true, force: true }) };
}

test("create makes an intentionally incomplete draft and never overwrites or reuses a launch ID", () => {
  const f = fixture();
  try {
    createDraft(f.paths, "basbousa");
    assert.throws(() => loadDraft(f.paths, "basbousa"), /Recipe fields|characters|Cooking time/);
    assert.throws(() => createDraft(f.paths, "basbousa"), /EEXIST/);
    assert.throws(() => createDraft(f.paths, "mahshi"), /existing launch recipe/);
    assert.throws(() => createDraft(f.paths, "../escape"), /slug/);
    assert.equal(readdirSync(resolve(f.paths.catalogRoot, "approvals")).length, 0);
  } finally { f.clean(); }
});

test("ingredient, step, quantity, timer, servings, uniqueness and editorial validation fail closed", () => {
  const f = fixture();
  try {
    const invalid = [
      (d: RecipeDraft) => { d.recipe.ingredients = []; },
      (d: RecipeDraft) => { d.recipe.ingredients[0].quantity = 0; },
      (d: RecipeDraft) => { d.recipe.ingredients[0].quantity = Infinity; },
      (d: RecipeDraft) => { d.recipe.ingredients.push({ ...d.recipe.ingredients[0] }); },
      (d: RecipeDraft) => { d.recipe.steps = []; },
      (d: RecipeDraft) => { d.recipe.steps[0].timerSeconds = -1; },
      (d: RecipeDraft) => { d.recipe.steps[0].text = "cook"; },
      (d: RecipeDraft) => { d.recipe.servings = 0; },
      (d: RecipeDraft) => { d.recipe.minutes = 0; },
      (d: RecipeDraft) => { d.editorial.safetyNotes = ""; },
      (d: RecipeDraft) => { d.editorial.nutritionBasis = ""; },
      (d: RecipeDraft) => { d.recipe.id = "mahshi"; },
    ];
    for (const mutate of invalid) {
      const copy = structuredClone(f.draft); mutate(copy);
      assert.throws(() => validateDraft(copy, f.paths, recipes.map((r) => r.id)));
    }
    assert.equal(loadDraft(f.paths, f.id).draft.recipe.id, f.id);
  } finally { f.clean(); }
});

test("photo mismatch, unknown/commercially restricted license, changed bytes and escaping evidence are rejected", () => {
  const f = fixture();
  try {
    for (const mutate of [
      (d: RecipeDraft) => { d.recipe.image = "/images/food-hub/mahshi.jpg"; },
      (d: RecipeDraft) => { d.photo.license = "CC-BY-NC"; },
      (d: RecipeDraft) => { d.photo.licenseUrl = "https://example.com/unknown"; },
      (d: RecipeDraft) => { d.photo.sha256 = "a".repeat(64); },
      (d: RecipeDraft) => { d.photo.dishMatch = "food"; },
      (d: RecipeDraft) => { d.photo.sourceUrl = "javascript:alert(1)"; },
      (d: RecipeDraft) => { d.photo.evidenceFile = "../outside.md"; },
    ]) {
      const copy = structuredClone(f.draft); mutate(copy);
      assert.throws(() => validateDraft(copy, f.paths, []));
    }
    writeFileSync(resolve(f.root, "outside.md"), "Private content outside the catalog is not permitted.");
    symlinkSync(resolve(f.root, "outside.md"), resolve(f.paths.catalogRoot, "rights", "link.md"));
    const copy = structuredClone(f.draft); copy.photo.evidenceFile = "link.md";
    assert.throws(() => validateDraft(copy, f.paths, []), /inside its catalog/);
  } finally { f.clean(); }
});

test("preview escapes executable HTML and binds recipe, real photo and rights evidence", () => {
  const f = fixture();
  try {
    f.draft.recipe.title = "<script>alert('test')</script>"; f.save();
    const preview = previewDraft(f.paths, f.id);
    const html = readFileSync(preview.path, "utf8");
    assert.match(html, /DRAFT — NOT PUBLISHED/);
    assert.match(html, /data:image\/jpeg;base64,/);
    assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>/);
    assert.match(html, /default-src 'none'/);
    assert.ok(html.includes(preview.fingerprint));
    const before = loadDraft(f.paths, f.id).fingerprint;
    writeFileSync(resolve(f.paths.catalogRoot, "rights", `${f.id}.md`), "Changed rights evidence document: a new permission review must invalidate the previous preview.");
    assert.notEqual(loadDraft(f.paths, f.id).fingerprint, before);
  } finally { f.clean(); }
});

test("approval requires exact reviewed preview, both confirmations and a reviewer; edits invalidate it", () => {
  const f = fixture();
  try {
    const p = previewDraft(f.paths, f.id);
    const opts = { reviewedSha: p.fingerprint, reviewer: "test-editor", confirmRecipe: true, confirmRights: true };
    assert.throws(() => approveDraft(f.paths, f.id, { ...opts, confirmRights: false }), /both required/);
    assert.throws(() => approveDraft(f.paths, f.id, { ...opts, reviewedSha: "old" }), /stale/);
    assert.throws(() => approveDraft(f.paths, f.id, { ...opts, reviewer: "" }), /reviewer alias/);
    writeFileSync(p.path, "tampered");
    assert.throws(() => approveDraft(f.paths, f.id, opts), /preview changed/);
    previewDraft(f.paths, f.id);
    const a = approveDraft(f.paths, f.id, opts);
    assert.equal(a.recipeId, f.id);
    assert.deepEqual(approveDraft(f.paths, f.id, opts), a);
    f.draft.recipe.minutes += 1; f.save();
    assert.throws(() => prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true }), /stale/);
  } finally { f.clean(); }
});

test("release is explicit, additive and reproducible; drafts stay out and history prevents ID loss", () => {
  const f = fixture();
  try {
    assert.throws(() => prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true }), /No approved/);
    f.approval();
    assert.throws(() => prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: false }), /confirm-approved-release/);
    createDraft(f.paths, "unreviewed-dish");
    const result = prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true });
    assert.deepEqual(result.recipeIds, ["mahshi", "molokhia", "koshari", f.id]);
    assert.equal(prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true }).fingerprint, result.fingerprint);
    const catalog = JSON.parse(readFileSync(resolve(result.out, "recipes.json"), "utf8"));
    assert.deepEqual(catalog.recipes.slice(0, 3), recipes);
    assert.deepEqual(catalog.cooks, []);
    const manifest = JSON.parse(readFileSync(resolve(result.out, "release.json"), "utf8"));
    assert.equal(manifest.photos.length, 4); assert.equal(manifest.approvalHashes.length, 1);
    assert.equal(sha256(readFileSync(resolve(result.out, "public/photo-credits.html"))), manifest.creditsSha256);
    const sql = readFileSync(resolve(result.out, "import.sql"), "utf8");
    assert.match(sql, /ON CONFLICT \(id\) DO NOTHING/);
    assert.doesNotMatch(sql, /\b(UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/);
    // A removed previously prepared ID cannot be silently omitted from the next release.
    rmSync(resolve(f.paths.catalogRoot, "approvals", `${f.id}.json`));
    // A second approved recipe permits a release attempt and exercises the history gate.
    const secondId = "koshari-second";
    f.draft.recipe.id = secondId; f.draft.recipe.image = `/images/food-hub/${secondId}.jpg`;
    f.draft.photo.file = `${secondId}.jpg`;
    writeFileSync(resolve(f.paths.catalogRoot, "drafts", `${secondId}.json`), JSON.stringify(f.draft));
    copyFileSync(resolve(f.paths.catalogRoot, "photos", `${f.id}.jpg`), resolve(f.paths.catalogRoot, "photos", `${secondId}.jpg`));
    const p = previewDraft(f.paths, secondId);
    approveDraft(f.paths, secondId, { reviewedSha: p.fingerprint, reviewer: "test-editor", confirmRecipe: true, confirmRights: true });
    assert.throws(() => prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true }), /missing or changed/);
  } finally { f.clean(); }
});

test("SQL payloads cannot terminate an anonymous block or a quoted literal", () => {
  const recipe = { ...structuredClone(recipes[0]), description: "Test $foodhub$; DROP TABLE food_catalog; -- ' \\ example" };
  const result = buildCatalogRelease([recipe]);
  assert.doesNotMatch(result.sql, /\bDO \$foodhub\$/);
  assert.ok(result.sql.includes("-- '' \\\\ example") || result.sql.includes("-- '' \\ example"));
  assert.equal(JSON.parse(JSON.stringify(result.catalog)).recipes[0].description, recipe.description);
});

test("extended release verifies all added images and credits and detects altered approval records", async () => {
  const f = fixture();
  let server: ReturnType<typeof createServer> | undefined;
  try {
    f.approval();
    const result = prepareRecipeRelease(f.paths, { reviewer: "test-editor", confirmRelease: true });
    const catalog = readFileSync(resolve(result.out, "recipes.json"));
    server = createServer((req, res) => {
      if (req.url === "/api/food/catalog") { res.setHeader("Content-Type", "application/json"); res.end(catalog); return; }
      if (req.url === "/photo-credits.html") { res.setHeader("Content-Type", "text/html"); res.end(readFileSync(resolve(result.out, "public/photo-credits.html"))); return; }
      if (/^\/images\/food-hub\/[a-z-]+\.jpg$/.test(req.url ?? "")) { res.setHeader("Content-Type", "image/jpeg"); res.end(readFileSync(resolve(result.out, `public${req.url}`))); return; }
      res.writeHead(404).end();
    });
    await new Promise<void>((done) => server!.listen(0, "127.0.0.1", done));
    const address = server.address() as { port: number };
    // Async child needed: the fixture HTTP server must keep handling requests.
    const { spawn } = await import("node:child_process");
    const verify = () => new Promise<{ code: number | null; output: string }>((done, reject) => {
      const child = spawn(process.execPath, ["src/scripts/catalog-verify.mjs", `http://127.0.0.1:${address.port}`, result.out, "--allow-development"]);
      let output = ""; child.stdout.on("data", (x) => { output += x; }); child.stderr.on("data", (x) => { output += x; });
      child.on("error", reject); child.on("close", (code) => done({ code, output }));
    });
    const pass = await verify(); assert.equal(pass.code, 0, pass.output);
    writeFileSync(resolve(result.out, "approvals.json"), "[]");
    const fail = await verify(); assert.equal(fail.code, 1); assert.match(fail.output, /approval fingerprints/);
  } finally {
    if (server) await new Promise<void>((done) => server!.close(() => done()));
    f.clean();
  }
});

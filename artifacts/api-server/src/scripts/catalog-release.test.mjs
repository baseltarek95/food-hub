import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const releasePath = "../../generated-artifacts/food-catalog";
const expected = JSON.parse(readFileSync(`${releasePath}/recipes.json`, "utf8"));
const publicPath = "../food-hub/public";
const credits = readFileSync(`${publicPath}/photo-credits.html`, "utf8");

function verify(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/scripts/catalog-verify.mjs", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function withSite(overrides, run) {
  const server = createServer((req, res) => {
    if (req.url === "/api/food/catalog") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(overrides.catalog ?? expected));
    } else if (req.url === "/photo-credits.html") {
      res.setHeader("content-type", "text/html");
      res.end(overrides.credits ?? credits);
    } else if (req.url?.startsWith("/images/food-hub/")) {
      const name = req.url.split("/").pop();
      if (!["mahshi.jpg", "molokhia.jpg", "koshari.jpg"].includes(name)) { res.writeHead(404).end(); return; }
      res.setHeader("content-type", "image/jpeg");
      res.end(overrides.badPhoto ? Buffer.from("incorrect-image") : readFileSync(`${publicPath}/images/food-hub/${name}`));
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("release contains only the curated recipes and has a reproducible fingerprint", () => {
  assert.deepEqual(expected.recipes.map((r) => r.id), ["mahshi", "molokhia", "koshari"]);
  for (const kind of ["cooks", "courses", "vouchers"]) assert.deepEqual(expected[kind], []);
  assert.equal(expected.servicesLive, false);
  const manifest = JSON.parse(readFileSync(`${releasePath}/release.json`, "utf8"));
  const rows = expected.recipes.map((data) => ({ id: `recipe:${data.id}`, kind: "recipe", data }));
  assert.equal(manifest.sha256, createHash("sha256").update(JSON.stringify(rows)).digest("hex"));
  const sql = readFileSync(`${releasePath}/import.sql`, "utf8");
  assert.match(sql, /\bBEGIN;/);
  assert.match(sql, /\bCOMMIT;/);
  assert.match(sql, /RAISE EXCEPTION/);
  assert.match(sql, /ON CONFLICT \(id\) DO NOTHING/);
  assert.doesNotMatch(sql, /\b(CREATE|ALTER|DROP|TRUNCATE|DELETE|UPDATE)\b/);
});

test("complete catalog, licensed photos and attribution pass development rehearsal only", async () => {
  await withSite({}, async (url) => {
    const result = await verify(["--", url, "--allow-development"]);
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /NOT published launch approval/);
  });
});

test("missing or changed published recipes fail closed", async () => {
  for (const recipes of [expected.recipes.slice(1), expected.recipes.map((r) => ({ ...r, servings: 99 }))]) {
    await withSite({ catalog: { ...expected, recipes } }, async (url) => {
      const result = await verify([url, "--allow-development"]);
      assert.equal(result.code, 1);
      assert.match(result.output, /recipe missing or different|exactly the reviewed recipe IDs/);
    });
  }
});

test("additional recipes and development sample rows fail the recipe-only launch guard", async () => {
  const invalidCatalogs = [
    { ...expected, recipes: [...expected.recipes, { ...expected.recipes[0], id: "unreviewed" }] },
    { ...expected, recipes: [expected.recipes[0], expected.recipes[0], expected.recipes[2]] },
    ...["cooks", "courses", "vouchers"].map((kind) => ({ ...expected, [kind]: [{ id: "development-sample", sample: true }] })),
    ...["cooks", "courses", "vouchers"].map((kind) => ({ ...expected, [kind]: undefined })),
  ];
  for (const catalog of invalidCatalogs) {
    await withSite({ catalog }, async (url) => {
      const result = await verify([url, "--allow-development"]);
      assert.equal(result.code, 1, result.output);
      assert.match(result.output, /exactly the reviewed recipe IDs|recipe missing or different|recipe-only release must have no/);
    });
  }
});

test("missing attribution or unlicensed replacement bytes prevent launch verification", async () => {
  for (const overrides of [{ credits: "<h1>Food Hub</h1>" }, { badPhoto: true }]) {
    await withSite(overrides, async (url) => {
      const result = await verify([url, "--allow-development"]);
      assert.equal(result.code, 1);
      assert.match(result.output, /attribution is incomplete|photograph differs/);
    });
  }
});

test("production mode refuses workspace URLs and credentials", async () => {
  for (const url of ["http://localhost:80", "https://app.replit.dev", "https://user:secret@example.com"]) {
    const result = await verify([url]);
    assert.equal(result.code, 1);
    assert.doesNotMatch(result.output, /user:secret/);
  }
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import pino from "pino";

const logger = pino();

// Explicit URL only; never infer a published URL from workspace environment variables.
// Use getDeploymentInfo to obtain the actual published URL before running.
const photos = {
  "mahshi.jpg": "92c82f675d8f1a4f8df09ae2fd46697f31e6e6ee5f3bdd9b5fce76c179e6fb40",
  "molokhia.jpg": "6d3e4e7a1c8982ac5acc32c4051b0fff7b42d3dcb81f7fe11e67528f9e87e43a",
  "koshari.jpg": "151b801084f6dfbf3cf7d0f12caaec42e627cb88426534c8c90d7f9b5cf498d7",
};

try {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const allowDevelopment = args.includes("--allow-development");
  const positional = args.filter((arg) => arg !== "--allow-development");
  if (!positional[0] || positional.length > 2) {
    throw new Error("Usage: catalog:verify <published-url> [release-directory]. Development testing requires --allow-development.");
  }
  const base = new URL(positional[0]);
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("Use a bare site origin without credentials, paths, query parameters or fragments.");
  }
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("An HTTP(S) URL is required.");
  if (!allowDevelopment && (base.protocol !== "https:" || /(^|\.)(localhost|replit\.dev|repl\.co)$/.test(base.hostname) || /^[\d.]+$/.test(base.hostname) || base.hostname.includes(":"))) {
    throw new Error("Production verification requires a published HTTPS URL, not a development host.");
  }
  const expected = JSON.parse(readFileSync(resolve(positional[1] ?? "../../generated-artifacts/food-catalog", "recipes.json"), "utf8"));
  if (!Array.isArray(expected.recipes) || expected.recipes.length !== 3 ||
      !["mahshi", "molokhia", "koshari"].every((id) => expected.recipes.some((r) => r.id === id))) {
    throw new Error("Export the current curated recipe release before verifying.");
  }
  async function request(path) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000), redirect: "error" });
    if (!response.ok) throw new Error(`Published request failed (${response.status}): ${path}`);
    return response;
  }
  const response = await request("/api/food/catalog");
  const actual = await response.json();
  if (!Array.isArray(actual.recipes)) throw new Error("Published API did not return a recipe catalog.");
  const expectedIds = new Set(expected.recipes.map((r) => r.id));
  if (actual.recipes.length !== expectedIds.size || actual.recipes.some((r) => !expectedIds.has(r.id))) {
    throw new Error("Published catalog must contain exactly the reviewed recipe IDs; review missing or additional recipes.");
  }
  for (const kind of ["cooks", "courses", "vouchers"]) {
    if (!Array.isArray(actual[kind]) || actual[kind].length !== 0) {
      throw new Error(`Published recipe-only release must have no ${kind}; review existing development or unrelated content explicitly.`);
    }
  }
  for (const recipe of expected.recipes) {
    const matches = actual.recipes.filter((r) => r.id === recipe.id);
    if (matches.length !== 1 || !isDeepStrictEqual(matches[0], recipe)) {
      throw new Error(`Published recipe missing or different from reviewed release: ${recipe.id}`);
    }
  }
  if (actual.servicesLive !== false) throw new Error("Unexpected live-service flag; review launch scope.");
  const credits = await (await request("/photo-credits.html")).text();
  for (const credit of ["Mkevy", "Habib Mhenni", "Basma", "Ibrahim.ID", "PetarM", "https://creativecommons.org/licenses/by-sa/4.0/", "https://creativecommons.org/licenses/by-sa/3.0/"]) {
    if (!credits.includes(credit)) throw new Error("Published photo attribution is incomplete.");
  }
  for (const [file, expectedHash] of Object.entries(photos)) {
    const image = await request(`/images/food-hub/${file}`);
    if (!image.headers.get("content-type")?.includes("image/jpeg")) throw new Error(`Not a JPEG: ${file}`);
    const hash = createHash("sha256").update(Buffer.from(await image.arrayBuffer())).digest("hex");
    if (hash !== expectedHash) throw new Error(`Published photograph differs from licensed release: ${file}`);
  }
  logger.info({ environment: allowDevelopment ? "development" : "published", recipes: expected.recipes.length },
    allowDevelopment
      ? "Development catalog and licensed photos verified. This is NOT published launch approval."
      : "Published catalog, licensed photos and credits verified. Other launch requirements still apply.");
} catch (err) {
  logger.error({ message: err.message }, "Catalog verification failed; do not recommend public launch.");
  process.exitCode = 1;
}

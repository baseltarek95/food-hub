import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { recipes } from "./seed-food";
import { logger } from "../lib/logger";
import { buildCatalogRelease } from "../lib/catalog-release";

try {
  const release = buildCatalogRelease(recipes);
  const out = resolve(process.argv[2] ?? "../../generated-artifacts/food-catalog");
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, "recipes.json"), `${JSON.stringify(release.catalog, null, 2)}\n`);
  writeFileSync(resolve(out, "import.sql"), release.sql);
  writeFileSync(resolve(out, "verify.sql"), release.verificationSql);
  writeFileSync(resolve(out, "release.json"), `${JSON.stringify({
    sha256: release.fingerprint,
    recipeIds: release.catalog.recipes.map((r) => r.id),
    recipesOnly: true,
  }, null, 2)}\n`);
  logger.info({ out, sha256: release.fingerprint, recipes: release.catalog.recipes.length },
    "Recipe release exported for review only. No database was accessed.");
} catch (err) {
  logger.error({ err }, "Catalog export failed");
  process.exitCode = 1;
}

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { GetFoodCatalogResponse } from "@workspace/api-zod";
import { recipes } from "./seed-food";
import { logger } from "../lib/logger";

/** Deliberate, reviewed DML export. No database import, connection or schema changes. */
export function buildCatalogRelease() {
  const catalog = GetFoodCatalogResponse.parse({
    recipes, cooks: [], courses: [], vouchers: [], currency: "EGP", servicesLive: false,
  });
  if (!catalog.recipes.length || new Set(catalog.recipes.map((r) => r.id)).size !== catalog.recipes.length) {
    throw new Error("Catalog must contain recipes with unique IDs.");
  }
  const rows = catalog.recipes.map((data) => ({ id: `recipe:${data.id}`, kind: "recipe", data }));
  const fingerprint = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  // SQL string literal quoting, not shell interpolation; JSON never becomes executable SQL.
  const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const payload = literal(JSON.stringify(rows));
  const recordset = `jsonb_to_recordset(${payload}::jsonb) AS r(id text, kind text, data jsonb)`;
  const sql = `-- Food Hub recipe-only catalog release SHA-256: ${fingerprint}
-- Review CATALOG-LAUNCH.md and the target database before running manually.
-- No cooks, courses, vouchers, user data or schema changes. Safe to rerun unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL standard_conforming_strings = on;
LOCK TABLE food_catalog IN SHARE ROW EXCLUSIVE MODE;
DO $foodhub$
BEGIN
  IF EXISTS (
    SELECT 1 FROM ${recordset}
    JOIN food_catalog AS c ON c.id = r.id
    WHERE c.kind IS DISTINCT FROM r.kind OR c.data IS DISTINCT FROM r.data
  ) THEN
    RAISE EXCEPTION 'Catalog conflicts with existing recipes; nothing imported. Review differences explicitly.';
  END IF;
END
$foodhub$;
INSERT INTO food_catalog (id, kind, data)
SELECT r.id, r.kind, r.data FROM ${recordset}
ON CONFLICT (id) DO NOTHING;
COMMIT;
`;
  const verificationSql = `-- Run read-only against the published database. Every row must report present=true and matches=true.
SELECT r.id, c.id IS NOT NULL AS present,
  c.kind = r.kind AND c.data = r.data AS matches
FROM ${recordset}
LEFT JOIN food_catalog AS c ON c.id = r.id
ORDER BY r.id;
-- This second result must be EMPTY. Existing unrelated/sample content is not removed automatically.
SELECT c.id, c.kind AS unexpected_kind
FROM food_catalog AS c
LEFT JOIN ${recordset} ON r.id = c.id
WHERE r.id IS NULL
ORDER BY c.id;
`;
  return { catalog, fingerprint, sql, verificationSql };
}

try {
  const release = buildCatalogRelease();
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

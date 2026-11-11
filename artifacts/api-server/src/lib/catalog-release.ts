import { createHash } from "node:crypto";
import { GetFoodCatalogResponse } from "@workspace/api-zod";

type Recipe = ReturnType<typeof GetFoodCatalogResponse.parse>["recipes"][number];

/** Pure, additive release builder. Never connects to a database. */
export function buildCatalogRelease(recipes: Recipe[]) {
  const catalog = GetFoodCatalogResponse.parse({
    recipes, cooks: [], courses: [], vouchers: [], currency: "EGP", servicesLive: false,
  });
  if (!catalog.recipes.length || new Set(catalog.recipes.map((r) => r.id)).size !== catalog.recipes.length) {
    throw new Error("Catalog must contain recipes with unique IDs.");
  }
  const rows = catalog.recipes.map((data) => ({ id: `recipe:${data.id}`, kind: "recipe", data }));
  const fingerprint = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const recordset = `jsonb_to_recordset(${literal(JSON.stringify(rows))}::jsonb) AS r(id text, kind text, data jsonb)`;
  // Do not put untrusted recipe text inside a dollar-quoted DO block: it can
  // contain the delimiter. The assertion is an expression outside any block.
  const sql = `-- Food Hub recipe-only catalog release SHA-256: ${fingerprint}
-- Review CATALOG-LAUNCH.md and the target database before running manually.
-- No cooks, courses, vouchers, user data or schema changes. Safe to rerun unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL standard_conforming_strings = on;
LOCK TABLE food_catalog IN SHARE ROW EXCLUSIVE MODE;
-- A conflicting row triggers division by zero; the transaction must be rolled back.
SELECT 1 / CASE WHEN EXISTS (
  SELECT 1 FROM ${recordset}
  JOIN food_catalog AS c ON c.id = r.id
  WHERE c.kind IS DISTINCT FROM r.kind OR c.data IS DISTINCT FROM r.data
) THEN 0 ELSE 1 END AS no_conflicting_recipes;
INSERT INTO food_catalog (id, kind, data)
SELECT r.id, r.kind, r.data FROM ${recordset}
ON CONFLICT (id) DO NOTHING;
COMMIT;
`;
  const verificationSql = `-- Run read-only. Every row must report present=true and matches=true.
SELECT r.id, c.id IS NOT NULL AS present,
  c.kind = r.kind AND c.data = r.data AS matches
FROM ${recordset}
LEFT JOIN food_catalog AS c ON c.id = r.id
ORDER BY r.id;
-- This second result must be EMPTY. No automatic cleanup.
SELECT c.id, c.kind AS unexpected_kind
FROM food_catalog AS c
LEFT JOIN ${recordset} ON r.id = c.id
WHERE r.id IS NULL
ORDER BY c.id;
`;
  return { catalog, fingerprint, sql, verificationSql };
}

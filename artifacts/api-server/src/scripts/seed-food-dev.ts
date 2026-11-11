import { db, pool, foodCatalogTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { recipes, cooks, courses, vouchers } from "./seed-food";

async function seed() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Sample seeding requires NODE_ENV=development. Use catalog:export for production recipes.");
  }
  await db.transaction(async (tx) => {
    for (const [kind, records] of [["recipe", recipes], ["cook", cooks], ["course", courses], ["voucher", vouchers]] as const) {
      for (const data of records) {
        const id = "id" in data ? data.id : data.code;
        await tx.insert(foodCatalogTable).values({ id: `${kind}:${id}`, kind, data }).onConflictDoNothing();
      }
    }
  });
  logger.info("Food Hub development sample catalog seeded; services remain unavailable.");
}

seed().catch((err) => {
  logger.error({ err }, "Food Hub development seeding failed");
  process.exitCode = 1;
}).finally(() => pool.end());

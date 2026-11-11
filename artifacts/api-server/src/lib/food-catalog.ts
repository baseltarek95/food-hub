import { db, foodCatalogTable } from "@workspace/db";
import { GetFoodCatalogResponse } from "@workspace/api-zod";

export async function getCatalog() {
  const rows = await db.select().from(foodCatalogTable);
  return GetFoodCatalogResponse.parse({
    recipes: rows.filter((r) => r.kind === "recipe").map((r) => r.data),
    cooks: rows.filter((r) => r.kind === "cook").map((r) => r.data),
    courses: rows.filter((r) => r.kind === "course").map((r) => r.data),
    vouchers: rows.filter((r) => r.kind === "voucher").map((r) => r.data),
    currency: "EGP",
    servicesLive: false,
  });
}

import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const foodCatalogTable = pgTable("food_catalog", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
});

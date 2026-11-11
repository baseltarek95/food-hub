import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const foodWorkspacesTable = pgTable("food_workspaces", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

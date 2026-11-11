import { pgTable, text, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const foodWorkspacesTable = pgTable("food_workspaces", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("food_workspace_owner").on(table.ownerId)]);

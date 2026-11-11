import { pgTable, text, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { foodWorkspacesTable } from "./food-workspaces";

export const foodLessonRequestsTable = pgTable("food_lesson_requests", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => foodWorkspacesTable.id, { onDelete: "cascade" }),
  startsAt: text("starts_at").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("food_request_workspace_time").on(table.workspaceId, table.startsAt),
]);

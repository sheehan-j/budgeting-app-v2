import { integer, pgTable, text, bigint } from "drizzle-orm/pg-core";
import { user } from "./authSchema.js";

export const userCategories = pgTable("user_categories", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
	name: text("name").primaryKey(),
	position: integer("position").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

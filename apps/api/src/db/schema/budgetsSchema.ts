import { bigint, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const budgets = pgTable("budgets", {
	categoryId: bigint("categoryId", { mode: "number" })
		.notNull()
		.references(() => categories.id, { onUpdate: "cascade" }),
	limit: numeric("limit").notNull(),
	userId: text("userId").notNull(),
});

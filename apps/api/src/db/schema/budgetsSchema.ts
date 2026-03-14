import { numeric, pgTable, text } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const budgets = pgTable("budgets", {
	categoryName: text("categoryName")
		.notNull()
		.references(() => categories.name, { onUpdate: "cascade" }),
	limit: numeric("limit").notNull(),
	userId: text("userId").notNull(),
});


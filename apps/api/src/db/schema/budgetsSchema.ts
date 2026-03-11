import { numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const budgets = pgTable("budgets", {
	categoryName: text("categoryName")
		.notNull()
		.references(() => categories.name, { onUpdate: "cascade" }),
	limit: numeric("limit").notNull(),
	userId: uuid("userId").notNull(),
});


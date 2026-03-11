import { bigint, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const merchants = pgTable("merchants", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
	text: text("text").notNull(),
	type: text("type").notNull(),
	categoryName: text("categoryName")
		.notNull()
		.references(() => categories.name, { onUpdate: "cascade" }),
	userId: uuid("userId").notNull(),
});


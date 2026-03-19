import { bigint, pgTable, text } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const merchants = pgTable("merchants", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
	text: text("text").notNull(),
	type: text("type").notNull(),
	categoryId: bigint("categoryId", { mode: "number" })
		.notNull()
		.references(() => categories.id, { onUpdate: "cascade" }),
	userId: text("userId").notNull(),
});

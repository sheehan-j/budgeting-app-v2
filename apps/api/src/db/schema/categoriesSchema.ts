import { pgTable, text, bigint } from "drizzle-orm/pg-core";
import { user } from "./authSchema.js";

export const categories = pgTable("categories", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
	name: text("name").notNull(),
	color: text("color").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

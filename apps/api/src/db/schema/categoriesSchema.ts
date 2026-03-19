import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
	name: text("name").primaryKey(),
	color: text("color").notNull(),
	colorDark: text("colorDark").notNull(),
	position: integer("position").notNull(),
	colorLight: text("colorLight"),
});

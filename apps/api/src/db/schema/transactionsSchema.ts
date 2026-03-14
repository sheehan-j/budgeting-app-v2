import {
  bigint,
  boolean,
  numeric,
  pgTable,
  smallint,
  text,
} from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";

export const transactions = pgTable("transactions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  date: text("date").notNull(),
  amount: numeric("amount").notNull(),
  merchant: text("merchant").notNull(),
  configurationName: text("configurationName").notNull(),
  userId: text("userId").notNull(),
  categoryName: text("categoryName")
    .notNull()
    .references(() => categories.name, { onUpdate: "cascade" }),
  month: smallint("month").notNull(),
  day: smallint("day").notNull(),
  year: smallint("year").notNull(),
  ignored: boolean("ignored").notNull().default(false),
  notes: text("notes"),
});


import { bigint, boolean, index, numeric, pgTable, smallint, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { categories } from "./categoriesSchema.js";
import { plaidAccounts } from "./plaidAccountsSchema.js";
import { plaidItems } from "./plaidItemsSchema.js";

export const transactions = pgTable(
	"transactions",
	{
		id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
		date: text("date").notNull(),
		amount: numeric("amount").notNull(),
		merchant: text("merchant").notNull(),
		configurationName: text("configurationName").notNull(),
		userId: text("userId").notNull(),
		categoryId: bigint("categoryId", { mode: "number" })
			.notNull()
			.references(() => categories.id, { onUpdate: "cascade" }),
		month: smallint("month").notNull(),
		day: smallint("day").notNull(),
		year: smallint("year").notNull(),
		ignored: boolean("ignored").notNull().default(false),
		notes: text("notes"),
		plaidTransactionId: text("plaidTransactionId"),
		plaidItemId: bigint("plaidItemId", { mode: "number" }).references(() => plaidItems.id, {
			onDelete: "set null",
		}),
		plaidAccountId: bigint("plaidAccountId", { mode: "number" }).references(() => plaidAccounts.id, {
			onDelete: "set null",
		}),
		rawMerchantName: text("rawMerchantName"),
		authorizedDate: text("authorizedDate"),
		isoCurrencyCode: text("isoCurrencyCode"),
		pending: boolean("pending"),
		removedAt: timestamp("removedAt"),
	},
	(table) => [
		index("transactions_plaidItemId_idx").on(table.plaidItemId),
		index("transactions_plaidAccountId_idx").on(table.plaidAccountId),
		uniqueIndex("transactions_plaidTransactionId_key").on(table.plaidTransactionId),
	],
);

import {
	bigint,
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { plaidItems } from "./plaidItemsSchema.js";

export const plaidAccounts = pgTable(
	"plaid_accounts",
	{
		id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
		plaidItemId: bigint("plaidItemId", { mode: "number" })
			.notNull()
			.references(() => plaidItems.id, { onDelete: "cascade" }),
		plaidAccountId: text("plaidAccountId").notNull(),
		name: text("name").notNull(),
		mask: text("mask"),
		type: text("type").notNull(),
		subtype: text("subtype"),
		isActive: boolean("isActive").notNull().default(true),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("plaid_accounts_plaidItemId_idx").on(table.plaidItemId),
		uniqueIndex("plaid_accounts_plaidAccountId_key").on(table.plaidAccountId),
	],
);

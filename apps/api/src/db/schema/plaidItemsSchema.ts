import { bigint, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./authSchema.js";

export const plaidItems = pgTable(
	"plaid_items",
	{
		id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		plaidItemId: text("plaidItemId").notNull(),
		accessTokenEncrypted: text("accessTokenEncrypted").notNull(),
		institutionId: text("institutionId"),
		institutionName: text("institutionName"),
		cursor: text("cursor"),
		status: text("status").notNull().default("active"),
		lastSyncedAt: timestamp("lastSyncedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("plaid_items_userId_idx").on(table.userId),
		uniqueIndex("plaid_items_plaidItemId_key").on(table.plaidItemId),
	],
);

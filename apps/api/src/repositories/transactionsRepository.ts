import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions } from "../db/schema/transactionsSchema.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";
import type { UpsertPlaidTransactionInput } from "../types/plaidTypes.js";

type TransactionRow = typeof transactions.$inferSelect;

export const getTransactionsRows = async ({ month, year, limit, userId }: TransactionFilters = {}) => {
	const conditions = [isNull(transactions.removedAt)];
	if (month !== undefined) conditions.push(eq(transactions.month, month));
	if (year !== undefined) conditions.push(eq(transactions.year, year));
	if (userId !== undefined) conditions.push(eq(transactions.userId, userId));
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	if (limit !== undefined) {
		return whereClause
			? db.select().from(transactions).where(whereClause).orderBy(desc(transactions.id)).limit(limit)
			: db.select().from(transactions).orderBy(desc(transactions.date)).limit(limit);
	}

	return whereClause
		? db.select().from(transactions).where(whereClause).orderBy(desc(transactions.id))
		: db.select().from(transactions).orderBy(desc(transactions.date));
};

export const getTransactionsRowCount = async () => {
	const result = await db
		.select({ count: count() })
		.from(transactions)
		.where(isNull(transactions.removedAt));
	return result[0]?.count ?? 0;
};

export const getTransactionsRowCountByUser = async (userId: string) => {
	const result = await db
		.select({ count: count() })
		.from(transactions)
		.where(and(eq(transactions.userId, userId), isNull(transactions.removedAt)));
	return result[0]?.count ?? 0;
};

export const upsertPlaidTransactionsRows = async (values: UpsertPlaidTransactionInput[]) => {
	if (values.length === 0) return [];

	return db.transaction(async (tx) => {
		const rows: TransactionRow[] = [];

		for (const value of values) {
			const result = await tx
				.insert(transactions)
				.values(value)
				.onConflictDoUpdate({
					target: transactions.plaidTransactionId,
					set: {
						date: value.date,
						amount: value.amount,
						merchant: value.merchant,
						configurationName: value.configurationName,
						month: value.month,
						day: value.day,
						year: value.year,
						plaidItemId: value.plaidItemId,
						plaidAccountId: value.plaidAccountId,
						rawMerchantName: value.rawMerchantName,
						authorizedDate: value.authorizedDate,
						isoCurrencyCode: value.isoCurrencyCode,
						pending: value.pending,
						removedAt: null,
					},
				})
				.returning();

			if (result[0]) rows.push(result[0]);
		}

		return rows;
	});
};

export const markPlaidTransactionsRemovedRows = async (
	plaidTransactionIds: string[],
	userId: string,
	removedAt = new Date(),
) => {
	if (plaidTransactionIds.length === 0) return [];

	return db
		.update(transactions)
		.set({ removedAt })
		.where(and(inArray(transactions.plaidTransactionId, plaidTransactionIds), eq(transactions.userId, userId)))
		.returning();
};

export const updateTransactionsIgnoredRows = async (ids: number[], ignored: boolean, userId: string) => {
	return db
		.update(transactions)
		.set({ ignored })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning();
};

export const updateTransactionsCategoryRows = async (ids: number[], categoryName: string, userId: string) => {
	return db
		.update(transactions)
		.set({ categoryName })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning();
};

export const updateTransactionsNotesRows = async (ids: number[], notes: string | null, userId: string) => {
	return db
		.update(transactions)
		.set({ notes })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning();
};

export const deleteTransactionRows = async (ids: number[], userId: string) => {
	return db
		.delete(transactions)
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning();
};

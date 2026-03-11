import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions } from "../db/schema/transactionsSchema.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";

export const getTransactionsRows = async ({ month, year, limit, userId }: TransactionFilters = {}) => {
	const conditions = [];
	if (month !== undefined) conditions.push(eq(transactions.month, month));
	if (year !== undefined) conditions.push(eq(transactions.year, year));
	if (userId !== undefined) conditions.push(eq(transactions.userId, userId));
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	if (limit !== undefined) {
		return whereClause
			? db.select().from(transactions).where(whereClause).orderBy(desc(transactions.id)).limit(limit)
			: db.select().from(transactions).orderBy(desc(transactions.id)).limit(limit);
	}

	return whereClause
		? db.select().from(transactions).where(whereClause).orderBy(desc(transactions.id))
		: db.select().from(transactions).orderBy(desc(transactions.id));
};

export const getTransactionsRowCount = async () => {
	const result = await db.select({ count: count() }).from(transactions);
	return result[0]?.count ?? 0;
};

export const updateTransactionsIgnoredRows = async (ids: number[], ignored: boolean) => {
	return db
		.update(transactions)
		.set({ ignored })
		.where(inArray(transactions.id, ids))
		.returning();
};

export const updateTransactionsCategoryRows = async (ids: number[], categoryName: string) => {
	return db
		.update(transactions)
		.set({ categoryName })
		.where(inArray(transactions.id, ids))
		.returning();
};

export const updateTransactionsNotesRows = async (ids: number[], notes: string | null) => {
	return db
		.update(transactions)
		.set({ notes })
		.where(inArray(transactions.id, ids))
		.returning();
};

export const deleteTransactionRows = async (ids: number[]) => {
	return db.delete(transactions).where(inArray(transactions.id, ids)).returning();
};

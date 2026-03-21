import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { transactions } from "../db/schema/transactionsSchema.js";
import { encryptTransactionField } from "../lib/transactionFieldCrypto.js";
import type { InsertImportedTransactionInput, TransactionFilters } from "../types/transactionsTypes.js";
import type { UpsertPlaidTransactionInput } from "../types/plaidTypes.js";

type TransactionRow = typeof transactions.$inferSelect;

const transactionWithCategorySelection = {
	id: transactions.id,
	date: transactions.date,
	amount: transactions.amount,
	merchant: transactions.merchant,
	configurationName: transactions.configurationName,
	userId: transactions.userId,
	categoryId: transactions.categoryId,
	categoryName: categories.name,
	month: transactions.month,
	day: transactions.day,
	year: transactions.year,
	ignored: transactions.ignored,
	notes: transactions.notes,
	plaidTransactionId: transactions.plaidTransactionId,
	plaidItemId: transactions.plaidItemId,
	plaidAccountId: transactions.plaidAccountId,
	rawMerchantName: transactions.rawMerchantName,
	authorizedDate: transactions.authorizedDate,
	isoCurrencyCode: transactions.isoCurrencyCode,
	pending: transactions.pending,
	removedAt: transactions.removedAt,
};

const getTransactionsRowsByIds = async (ids: number[], userId: string) => {
	if (ids.length === 0) return [];

	return db
		.select(transactionWithCategorySelection)
		.from(transactions)
		.innerJoin(categories, eq(transactions.categoryId, categories.id))
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.orderBy(desc(transactions.id));
};

export const getTransactionsRows = async ({ month, year, limit, userId }: TransactionFilters = {}) => {
	const conditions = [isNull(transactions.removedAt)];
	if (month !== undefined) conditions.push(eq(transactions.month, month));
	if (year !== undefined) conditions.push(eq(transactions.year, year));
	if (userId !== undefined) conditions.push(eq(transactions.userId, userId));
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	if (limit !== undefined) {
		return whereClause
			? db
					.select(transactionWithCategorySelection)
					.from(transactions)
					.innerJoin(categories, eq(transactions.categoryId, categories.id))
					.where(whereClause)
					.orderBy(desc(transactions.id))
					.limit(limit)
			: db
					.select(transactionWithCategorySelection)
					.from(transactions)
					.innerJoin(categories, eq(transactions.categoryId, categories.id))
					.orderBy(desc(transactions.date))
					.limit(limit);
	}

	return whereClause
		? db
				.select(transactionWithCategorySelection)
				.from(transactions)
				.innerJoin(categories, eq(transactions.categoryId, categories.id))
				.where(whereClause)
				.orderBy(desc(transactions.id))
		: db
				.select(transactionWithCategorySelection)
				.from(transactions)
				.innerJoin(categories, eq(transactions.categoryId, categories.id))
				.orderBy(desc(transactions.date));
};

export const getTransactionsRowCount = async () => {
	const result = await db.select({ count: count() }).from(transactions).where(isNull(transactions.removedAt));
	return result[0]?.count ?? 0;
};

export const getTransactionsRowCountByUser = async (userId: string) => {
	const result = await db
		.select({ count: count() })
		.from(transactions)
		.where(and(eq(transactions.userId, userId), isNull(transactions.removedAt)));
	return result[0]?.count ?? 0;
};

export const getTransactionsRowsByPlaidAccount = async (plaidAccountId: number, userId: string) => {
	return db
		.select()
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.plaidAccountId, plaidAccountId),
				isNull(transactions.removedAt),
			),
		)
		.orderBy(desc(transactions.date), desc(transactions.id));
};

export const upsertPlaidTransactionsRows = async (values: UpsertPlaidTransactionInput[]) => {
	if (values.length === 0) return [];

	return db.transaction(async (tx) => {
		const rows: TransactionRow[] = [];

		for (const value of values) {
			const encryptedRawMerchantName = value.rawMerchantName
				? encryptTransactionField(value.rawMerchantName)
				: null;

			const result = await tx
				.insert(transactions)
				.values({
					...value,
					rawMerchantName: encryptedRawMerchantName,
				})
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
						rawMerchantName: encryptedRawMerchantName,
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
	const updatedRows = await db
		.update(transactions)
		.set({ ignored })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning({ id: transactions.id });

	return getTransactionsRowsByIds(
		updatedRows.map((row) => row.id),
		userId,
	);
};

export const updateTransactionsCategoryRows = async (ids: number[], categoryId: number, userId: string) => {
	const updatedRows = await db
		.update(transactions)
		.set({ categoryId })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning({ id: transactions.id });

	return getTransactionsRowsByIds(
		updatedRows.map((row) => row.id),
		userId,
	);
};

export const updateTransactionsNotesRows = async (ids: number[], notes: string | null, userId: string) => {
	const updatedRows = await db
		.update(transactions)
		.set({ notes })
		.where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)))
		.returning({ id: transactions.id });

	return getTransactionsRowsByIds(
		updatedRows.map((row) => row.id),
		userId,
	);
};

export const deleteTransactionRows = async (ids: number[], userId: string) => {
	const deletedRows = await getTransactionsRowsByIds(ids, userId);

	await db.delete(transactions).where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)));

	return deletedRows;
};

export const recategorizeTransactionRows = async (
	initialCategoryId: number,
	targetCategoryId: number,
	userId: string,
) => {
	const result = await db
		.update(transactions)
		.set({ categoryId: targetCategoryId })
		.where(and(eq(transactions.categoryId, initialCategoryId), eq(transactions.userId, userId)))
		.returning();
	return result.length;
};

export const insertImportedTransactionsRows = async (values: InsertImportedTransactionInput[]) => {
	if (values.length === 0) return [];

	return db
		.insert(transactions)
		.values(
			values.map((value) => ({
				...value,
				rawMerchantName: value.rawMerchantName ? encryptTransactionField(value.rawMerchantName) : null,
			})),
		)
		.returning();
};

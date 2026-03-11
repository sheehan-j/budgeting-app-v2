import {
	deleteTransactionRows,
	getTransactionsRowCount,
	getTransactionsRows,
	updateTransactionsCategoryRows,
	updateTransactionsIgnoredRows,
	updateTransactionsNotesRows,
} from "../repositories/transactionsRepository.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";

type TransactionRow = Awaited<ReturnType<typeof getTransactionsRows>>[number];

const normalizeTransaction = (transaction: TransactionRow) => ({
	...transaction,
	amount: Number(transaction.amount),
});

export const getTransactions = async (filters: TransactionFilters = {}) => {
	const rows = await getTransactionsRows(filters);
	return rows.map(normalizeTransaction);
};

export const getTransactionsCount = async () => {
	return getTransactionsRowCount();
};

export const setTransactionsIgnored = async (ids: number[], ignored: boolean) => {
	const rows = await updateTransactionsIgnoredRows(ids, ignored);
	return rows.map(normalizeTransaction);
};

export const setTransactionCategories = async (ids: number[], categoryName: string) => {
	const rows = await updateTransactionsCategoryRows(ids, categoryName);
	return rows.map(normalizeTransaction);
};

export const setTransactionNotes = async (ids: number[], notes: string | null) => {
	const rows = await updateTransactionsNotesRows(ids, notes);
	return rows.map(normalizeTransaction);
};

export const deleteTransactions = async (ids: number[]) => {
	const rows = await deleteTransactionRows(ids);
	return rows.map(normalizeTransaction);
};

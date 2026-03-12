import {
	deleteTransactionRows,
	getTransactionsRowCount,
	updateTransactionsCategoryRows,
	updateTransactionsIgnoredRows,
	updateTransactionsNotesRows,
} from "../repositories/transactionsRepository.js";
import { getNormalizedTransactions, normalizeTransactions } from "./transactionsShared.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";

export const getTransactions = async (filters: TransactionFilters = {}) => {
	return getNormalizedTransactions(filters);
};

export const getTransactionsCount = async () => {
	return getTransactionsRowCount();
};

export const setTransactionsIgnored = async (ids: number[], ignored: boolean) => {
	const rows = await updateTransactionsIgnoredRows(ids, ignored);
	return normalizeTransactions(rows);
};

export const setTransactionCategories = async (ids: number[], categoryName: string) => {
	const rows = await updateTransactionsCategoryRows(ids, categoryName);
	return normalizeTransactions(rows);
};

export const setTransactionNotes = async (ids: number[], notes: string | null) => {
	const rows = await updateTransactionsNotesRows(ids, notes);
	return normalizeTransactions(rows);
};

export const deleteTransactions = async (ids: number[]) => {
	const rows = await deleteTransactionRows(ids);
	return normalizeTransactions(rows);
};

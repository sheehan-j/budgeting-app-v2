import {
	deleteTransactionRows,
	getTransactionsRowCount,
	updateTransactionsCategoryRows,
	updateTransactionsIgnoredRows,
	updateTransactionsNotesRows,
} from "../repositories/transactionsRepository.js";
import { getNormalizedTransactions, normalizeTransactions } from "./transactionsShared.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";
import { getMerchantSettings } from "./merchantSettingsService.js";

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

export const applyMerchantSettingsToTransactions = async (userId: string) => {
	const [transactions, merchantSettings] = await Promise.all([
		getNormalizedTransactions({ userId }),
		getMerchantSettings(userId),
	]);

	const idsByCategoryName = new Map<string, number[]>();

	for (const transaction of transactions) {
		let nextCategoryName = transaction.categoryName;

		for (const merchantSetting of merchantSettings) {
			if (merchantSetting.type === "contains" && transaction.merchant.includes(merchantSetting.text)) {
				nextCategoryName = merchantSetting.category.name;
			} else if (merchantSetting.type === "equals" && transaction.merchant === merchantSetting.text) {
				nextCategoryName = merchantSetting.category.name;
			}
		}

		if (nextCategoryName === transaction.categoryName) continue;

		const matchingIds = idsByCategoryName.get(nextCategoryName) ?? [];
		matchingIds.push(transaction.id);
		idsByCategoryName.set(nextCategoryName, matchingIds);
	}

	for (const [categoryName, ids] of idsByCategoryName.entries()) {
		await updateTransactionsCategoryRows(ids, categoryName);
	}

	return {
		updatedCount: Array.from(idsByCategoryName.values()).reduce((count, ids) => count + ids.length, 0),
	};
};

export const deleteTransactions = async (ids: number[]) => {
	const rows = await deleteTransactionRows(ids);
	return normalizeTransactions(rows);
};

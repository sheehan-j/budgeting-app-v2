import {
	deleteTransactionRows,
	getTransactionsRowsByPlaidAccount,
	insertImportedTransactionsRows,
	getTransactionsRowCountByUser,
	updateTransactionsCategoryRows,
	updateTransactionsIgnoredRows,
	updateTransactionsNotesRows,
	recategorizeTransactionRows,
} from "../repositories/transactionsRepository.js";
import { getNormalizedTransactions, normalizeTransactions } from "./transactionsShared.js";
import { parseCapitalOneCsv } from "../lib/capitalOneCsv.js";
import type { ImportCapitalOneCsvInput, TransactionFilters } from "../types/transactionsTypes.js";
import { getMerchantSettings } from "./merchantSettingsService.js";
import { getPlaidItems } from "./plaidService.js";
import { getCategoriesRows } from "../repositories/categoriesRepository.js";

export const getTransactions = async (userId: string, filters: TransactionFilters = {}) => {
	return getNormalizedTransactions({ ...filters, userId });
};

export const getTransactionsCount = async (userId: string) => {
	return getTransactionsRowCountByUser(userId);
};

const getCategoryIdForMerchant = (
	merchant: string,
	merchantSettings: Awaited<ReturnType<typeof getMerchantSettings>>,
	defaultCategoryId: number,
) => {
	let categoryId = defaultCategoryId;

	for (const merchantSetting of merchantSettings) {
		if (merchantSetting.type === "contains" && merchant.includes(merchantSetting.text)) {
			categoryId = merchantSetting.category.id;
		} else if (merchantSetting.type === "equals" && merchant === merchantSetting.text) {
			categoryId = merchantSetting.category.id;
		}
	}

	return categoryId;
};

const getDateParts = (date: string) => {
	const [year, month, day] = date.split("-").map((value) => Number(value));

	if (!year || !month || !day) {
		throw new Error(`Invalid imported transaction date: ${date}`);
	}

	return { year, month, day };
};

const buildTransactionSignature = ({
	date,
	amount,
	merchant,
}: {
	date: string;
	amount: string | number;
	merchant: string;
}) => {
	return `${date}|${Number(amount).toFixed(2)}|${merchant.trim().toLowerCase().replace(/\s+/g, " ")}`;
};

export const setTransactionsIgnored = async (ids: number[], ignored: boolean, userId: string) => {
	const rows = await updateTransactionsIgnoredRows(ids, ignored, userId);
	return normalizeTransactions(rows);
};

export const setTransactionCategories = async (ids: number[], categoryId: number, userId: string) => {
	const rows = await updateTransactionsCategoryRows(ids, categoryId, userId);
	return normalizeTransactions(rows);
};

export const setTransactionNotes = async (ids: number[], notes: string | null, userId: string) => {
	const rows = await updateTransactionsNotesRows(ids, notes, userId);
	return normalizeTransactions(rows);
};

export const applyMerchantSettingsToTransactions = async (userId: string) => {
	const [transactions, merchantSettings, categoryRows] = await Promise.all([
		getNormalizedTransactions({ userId }),
		getMerchantSettings(userId),
		getCategoriesRows(userId),
	]);
	const uncategorizedCategory = categoryRows.find((category) => category.name === "Uncategorized");
	if (!uncategorizedCategory) {
		throw new Error('Default "Uncategorized" category not found.');
	}

	const idsByCategoryId = new Map<number, number[]>();

	for (const transaction of transactions) {
		let nextCategoryId = transaction.categoryId;

		for (const merchantSetting of merchantSettings) {
			if (merchantSetting.type === "contains" && transaction.merchant.includes(merchantSetting.text)) {
				nextCategoryId = merchantSetting.category.id;
			} else if (merchantSetting.type === "equals" && transaction.merchant === merchantSetting.text) {
				nextCategoryId = merchantSetting.category.id;
			}
		}

		if (!nextCategoryId) {
			nextCategoryId = uncategorizedCategory.id;
		}

		if (nextCategoryId === transaction.categoryId) continue;

		const matchingIds = idsByCategoryId.get(nextCategoryId) ?? [];
		matchingIds.push(transaction.id);
		idsByCategoryId.set(nextCategoryId, matchingIds);
	}

	for (const [categoryId, ids] of idsByCategoryId.entries()) {
		await updateTransactionsCategoryRows(ids, categoryId, userId);
	}

	return {
		updatedCount: Array.from(idsByCategoryId.values()).reduce((count, ids) => count + ids.length, 0),
	};
};

export const deleteTransactions = async (ids: number[], userId: string) => {
	const rows = await deleteTransactionRows(ids, userId);
	return normalizeTransactions(rows);
};

export const recategorizeTransactions = async (initialCategoryId: number, targetCategoryId: number, userId: string) => {
	return await recategorizeTransactionRows(initialCategoryId, targetCategoryId, userId);
};

// IMPORTING FUNCTIONALITY
const getImportedRangeValue = (dates: string[], direction: "min" | "max") => {
	if (dates.length === 0) return null;

	return direction === "min"
		? dates.reduce((earliest, date) => (date < earliest ? date : earliest))
		: dates.reduce((latest, date) => (date > latest ? date : latest));
};

export const importCapitalOneCsvTransactions = async (
	{ itemId, accountId, csvText }: ImportCapitalOneCsvInput,
	userId: string,
) => {
	const item = (await getPlaidItems(userId)).find((candidate) => candidate.id === itemId);
	if (!item) {
		throw new Error("Connected institution not found.");
	}

	if (!/capital one/i.test(item.institutionName ?? "")) {
		throw new Error("Capital One CSV import is only available for Capital One connections.");
	}

	const account = item.accounts.find((candidate) => candidate.id === accountId);
	if (!account || !account.isActive) {
		throw new Error("Connected account not found.");
	}

	const parsedTransactions = parseCapitalOneCsv(csvText);
	if (parsedTransactions.length === 0) {
		throw new Error("No transactions were found in this CSV.");
	}

	const [merchantSettings, existingTransactions, categoryRows] = await Promise.all([
		getMerchantSettings(userId),
		getTransactionsRowsByPlaidAccount(accountId, userId),
		getCategoriesRows(userId),
	]);
	const uncategorizedCategory = categoryRows.find((category) => category.name === "Uncategorized");
	if (!uncategorizedCategory) {
		throw new Error('Default "Uncategorized" category not found.');
	}
	const existingTransactionSignatures = new Set(
		existingTransactions.map((transaction) =>
			buildTransactionSignature({
				date: transaction.date,
				amount: transaction.amount,
				merchant: transaction.merchant,
			}),
		),
	);

	const firstExistingTransaction = existingTransactions[0];
	const oldestExistingDate = firstExistingTransaction
		? existingTransactions.reduce(
				(oldest, transaction) => (transaction.date < oldest ? transaction.date : oldest),
				firstExistingTransaction.date,
			)
		: null;

	let duplicateSkippedCount = 0;
	let overlapSkippedCount = 0;
	const importedDates: string[] = [];
	const importRows = parsedTransactions.flatMap((transaction) => {
		if (oldestExistingDate && transaction.date >= oldestExistingDate) {
			overlapSkippedCount += 1;
			return [];
		}

		const signature = buildTransactionSignature(transaction);
		if (existingTransactionSignatures.has(signature)) {
			duplicateSkippedCount += 1;
			return [];
		}

		existingTransactionSignatures.add(signature);
		importedDates.push(transaction.date);
		const { year, month, day } = getDateParts(transaction.date);

		return [
			{
				date: transaction.date,
				amount: transaction.amount,
				merchant: transaction.merchant,
				configurationName: account.name,
				userId,
				categoryId: getCategoryIdForMerchant(transaction.merchant, merchantSettings, uncategorizedCategory.id),
				month,
				day,
				year,
				plaidTransactionId: null,
				plaidItemId: item.id,
				plaidAccountId: account.id,
				rawMerchantName: transaction.rawMerchantName,
				authorizedDate: null,
				isoCurrencyCode: "USD",
				pending: false,
				removedAt: null,
			},
		];
	});

	await insertImportedTransactionsRows(importRows);

	return {
		institutionName: item.institutionName,
		accountName: account.name,
		insertedCount: importRows.length,
		duplicateSkippedCount,
		overlapSkippedCount,
		importedRangeStart: getImportedRangeValue(importedDates, "min"),
		importedRangeEnd: getImportedRangeValue(importedDates, "max"),
	};
};

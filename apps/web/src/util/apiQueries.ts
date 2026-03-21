import { ZodNumberFormat } from "better-auth";
import apiClient from "./apiClient";

type Transaction = {
	id: number;
	date: string;
	amount: number;
	merchant: string;
	configurationName: string;
	userId: string;
	categoryId: number;
	categoryName: string;
	month: number;
	day: number;
	year: number;
	ignored: boolean;
	notes?: string | null;
	selected?: boolean;
	buttonRef?: unknown;
};

type TransactionCountResponse = {
	count: number;
};

type Category = {
	id: number;
	name: string;
	position: number;
	color: string;
	colorDark: string;
	colorLight?: string | null;
};

type CategoryInput = {
	id?: number;
	name: string;
	color: string;
};

type BudgetRecord = {
	limit: number | null;
};

type CategoryBudget = Category & {
	budgets?: BudgetRecord[];
	limit?: number | string | null;
	spending?: number;
	percentage?: number | null;
};

type MerchantCategory = {
	id: number;
	name: string;
	color: string;
	colorDark: string;
	colorLight: string;
};

type MerchantSetting = {
	id: number;
	text: string;
	type: string;
	category?: MerchantCategory;
	categoryId?: number;
	[key: string]: unknown;
};

type DashboardDateFilter = {
	type: "Date";
	start: {
		month: number;
		day: number;
		year: number;
	};
	end: {
		month: number;
		day: number;
		year: number;
	};
};

type DashboardMerchantFilter = {
	type: "Merchant";
	merchant: string;
};

type DashboardCategoryFilter = {
	type: "Category";
	category: {
		name: string;
		color?: string;
		colorDark?: string;
		colorLight?: string | null;
	};
};

type DashboardConfigurationFilter = {
	type: "Configuration";
	configuration: string;
};

type DashboardAmountFilter = {
	type: "Amount";
	condition: "lessThan" | "greaterThan" | "equals";
	amount: string | number;
};

type DashboardFilter =
	| DashboardDateFilter
	| DashboardMerchantFilter
	| DashboardCategoryFilter
	| DashboardConfigurationFilter
	| DashboardAmountFilter;

type DashboardStatsCategory = {
	name: string;
	amount: number;
	color: string;
	colorDark: string;
	colorLight: string | null;
	percentage: number;
};

type DashboardStats = {
	spending: {
		amount: number;
		title?: string;
	};
	categories?: DashboardStatsCategory[];
	specialCaseCategory: boolean;
	category?: {
		name: string;
		color?: string;
		colorDark?: string;
		colorLight?: string | null;
	};
	filters: DashboardFilter[];
};

type DashboardResponse = {
	transactions: Transaction[];
	stats: DashboardStats;
};

type BudgetResponse = {
	ok: boolean;
	budgets: CategoryBudget[];
};

type MerchantSettingResponse = {
	ok: boolean;
	merchantSetting: MerchantSetting;
};

type PlaidAccount = {
	id: number;
	plaidAccountId: string;
	name: string;
	mask: string | null;
	type: string;
	subtype: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type PlaidItem = {
	id: number;
	userId: string;
	plaidItemId: string;
	institutionId: string | null;
	institutionName: string | null;
	cursor: string | null;
	status: string;
	lastSyncedAt: string | null;
	createdAt: string;
	updatedAt: string;
	accounts: PlaidAccount[];
};

type ApplyMerchantSettingsResponse = {
	ok: boolean;
	updatedCount: number;
};

type RecagetorizeTransactionsResponse = {
	ok: boolean;
	updatedCount: number;
};

type PlaidLinkTokenResponse = {
	linkToken: string;
	expiration: string;
};

type PlaidSyncSummary = {
	itemId: number;
	plaidItemId: string;
	addedCount: number;
	modifiedCount: number;
	removedCount: number;
	cursor: string | null;
};

type ExchangePlaidPublicTokenResponse = {
	ok: boolean;
	item: PlaidItem;
	sync: PlaidSyncSummary | null;
};

type CompletePlaidUpdateModeResponse = {
	ok: boolean;
	item: PlaidItem;
	sync: PlaidSyncSummary | null;
};

type RemovePlaidItemResponse = {
	ok: boolean;
	itemId: number;
	institutionName: string | null;
};

type SyncAllPlaidItemsResponse = {
	ok: boolean;
	items: PlaidSyncSummary[];
};

type ImportCapitalOneCsvResponse = {
	ok: boolean;
	institutionName: string | null;
	accountName: string;
	insertedCount: number;
	duplicateSkippedCount: number;
	overlapSkippedCount: number;
	importedRangeStart: string | null;
	importedRangeEnd: string | null;
};

type Color = {
	position: number;
	color: string;
	colorDark: string;
	colorLight: string;
};

type ColorsByName = Record<string, Color>;

type OkResponse = {
	ok: boolean;
};

const throwWithMessage = (message: string): never => {
	throw new Error(message);
};

export const getTransactions = async (): Promise<Transaction[]> => {
	try {
		const data = await apiClient.get<Transaction[]>("/transactions");

		if (data.length === 100000) {
			console.warn("Transaction count has reached 100000.");
		}

		return formatTransactions(data);
	} catch {
		return throwWithMessage("Could not fetch transactions.");
	}
};

export const getTransactionsByMonth = async (dateObj: Date): Promise<Transaction[]> => {
	try {
		const data = await apiClient.get<Transaction[]>("/transactions", {
			month: dateObj.getMonth() + 1,
			year: dateObj.getFullYear(),
		});

		return formatTransactions(data);
	} catch {
		return throwWithMessage("Could not fetch dashboard transactions.");
	}
};

export const getTransactionCount = async (): Promise<number> => {
	try {
		const data = await apiClient.get<TransactionCountResponse>("/transactions/count");
		return data.count;
	} catch {
		return throwWithMessage("Could not fetch transaction count.");
	}
};

const formatTransactions = (transactions: Transaction[]): Transaction[] => {
	const formattedTransactions = transactions.map((transaction) => ({
		...transaction,
		date: new Date(transaction.date).toLocaleDateString("en-US"),
	}));

	formattedTransactions.sort((a, b) => {
		const dateA = new Date(a.date);
		const dateB = new Date(b.date);

		if (dateA > dateB) return -1;
		if (dateA < dateB) return 1;
		return a.merchant.localeCompare(b.merchant);
	});

	return formattedTransactions;
};

export const setTransactionCategories = async (transactionIds: number[], categoryId: number): Promise<boolean> => {
	try {
		if (transactionIds.length === 0) return true;

		await apiClient.patch("/transactions/category", {
			ids: transactionIds,
			categoryId,
		});
		return true;
	} catch {
		return throwWithMessage("Could not update transaction categories.");
	}
};

export const setTransactionNotes = async (
	transactionId: number,
	notes: string | null | undefined,
): Promise<boolean> => {
	try {
		await apiClient.patch(`/transactions/${transactionId}/notes`, {
			notes: notes ?? null,
		});
		return true;
	} catch {
		return throwWithMessage("Could not update transaction notes.");
	}
};

export const setTransactionsIgnored = async (transactionIds: number[], ignored: boolean): Promise<boolean> => {
	try {
		if (transactionIds.length === 0) return true;

		await apiClient.patch("/transactions/ignored", {
			ids: transactionIds,
			ignored,
		});
		return true;
	} catch {
		return throwWithMessage("Could not update transactions.");
	}
};

export const deleteTransactions = async (transactionIds: number[]): Promise<boolean> => {
	try {
		if (transactionIds.length === 0) return true;

		await apiClient.del("/transactions", { ids: transactionIds });
		return true;
	} catch {
		return throwWithMessage("Could not delete transactions.");
	}
};

export const getCategories = async (): Promise<Category[]> => {
	try {
		const data = await apiClient.get<Category[]>("/categories");
		return [...data].sort((a, b) => a.position - b.position);
	} catch {
		return throwWithMessage("Could not fetch categories.");
	}
};

export const saveCategory = async (input: CategoryInput): Promise<boolean> => {
	const response = await apiClient.put<OkResponse>("/categories", input);
	return response.ok;
};

export const deleteCategory = async (categoryId: number): Promise<boolean> => {
	const response = await apiClient.del<OkResponse>(`/categories/${categoryId}`);
	return response.ok;
};

export const getDashboardData = async (filters: DashboardFilter[]): Promise<DashboardResponse> => {
	try {
		const data = await apiClient.post<DashboardResponse, { filters: DashboardFilter[] }>("/dashboard/stats", {
			filters,
		});

		return {
			transactions: formatTransactions(data.transactions),
			stats: data.stats,
		};
	} catch {
		return throwWithMessage("Could not fetch dashboard data.");
	}
};

export const getSpending = async (year: number | string): Promise<Record<string, number>[]> => {
	try {
		return await apiClient.get<Record<string, number>[]>("/dashboard/spending", {
			year: Number(year),
		});
	} catch {
		return throwWithMessage("Could not fetch spending data.");
	}
};

export const getBudgets = async (month: number | string, year: number | string): Promise<CategoryBudget[]> => {
	try {
		return await apiClient.get<CategoryBudget[]>("/budgets", {
			month: Number(month),
			year: Number(year),
		});
	} catch {
		return throwWithMessage("Could not fetch budgets.");
	}
};

export const updateBudget = async (
	newBudgets: CategoryBudget[],
	month: number | string,
	year: number | string,
): Promise<CategoryBudget[]> => {
	try {
		const response = await apiClient.put<
			BudgetResponse,
			{
				month: number;
				year: number;
				budgets: {
					categoryId: number | null;
					name: string;
					limit: number | string | null | undefined;
				}[];
			}
		>("/budgets", {
			month: Number(month),
			year: Number(year),
			budgets: newBudgets.map((budget) => ({
				categoryId: budget.id ?? null,
				name: budget.name,
				limit: budget.limit ?? null,
			})),
		});

		return response.budgets;
	} catch {
		return throwWithMessage("Could not update budgets.");
	}
};

export const getMerchantSettings = async (): Promise<MerchantSetting[]> => {
	try {
		const merchantSettings = await apiClient.get<MerchantSetting[]>("/merchants");
		return [...merchantSettings].sort((a, b) => a.id - b.id);
	} catch {
		return throwWithMessage("Could not fetch merchant settings.");
	}
};

export const upsertMerchantSetting = async (merchantSetting: MerchantSetting): Promise<boolean> => {
	try {
		const response = await apiClient.put<MerchantSettingResponse, MerchantSetting>("/merchants", merchantSetting);
		return response.ok;
	} catch {
		return throwWithMessage("Could not save merchant setting.");
	}
};

export const deleteMerchantSetting = async (merchantSettingId: number): Promise<boolean> => {
	try {
		const response = await apiClient.del<OkResponse>(`/merchants/${merchantSettingId}`);
		return response.ok;
	} catch {
		return throwWithMessage("Could not delete merchant setting.");
	}
};

export const applyMerchantSettingsToExistingTransactions = async (): Promise<number> => {
	try {
		const response = await apiClient.post<ApplyMerchantSettingsResponse, Record<string, never>>(
			"/transactions/apply-merchant-settings",
			{},
		);

		return response.updatedCount;
	} catch {
		return throwWithMessage("Could not apply merchant settings to existing transactions.");
	}
};

export const recategorizeTransactions = async (
	initialCategoryId: number,
	targetCategoryId: number,
): Promise<number> => {
	try {
		const response = await apiClient.post<
			RecagetorizeTransactionsResponse,
			{ initialCategoryId: number; targetCategoryId: number }
		>("/transactions/recategorize", {
			initialCategoryId,
			targetCategoryId,
		});

		return response.updatedCount;
	} catch {
		return throwWithMessage("Could not recategorize transactions.");
	}
};

export const getPlaidItems = async (): Promise<PlaidItem[]> => {
	try {
		const plaidItems = await apiClient.get<PlaidItem[]>("/plaid/items");
		return [...plaidItems].sort((a, b) => a.id - b.id);
	} catch {
		return throwWithMessage("Could not fetch connected accounts.");
	}
};

export const createPlaidLinkToken = async (): Promise<PlaidLinkTokenResponse> => {
	try {
		return await apiClient.post<PlaidLinkTokenResponse, Record<string, never>>("/plaid/link-token", {});
	} catch {
		return throwWithMessage("Could not start Plaid Link.");
	}
};

export const createPlaidUpdateLinkToken = async (itemId: number): Promise<PlaidLinkTokenResponse> => {
	try {
		return await apiClient.post<PlaidLinkTokenResponse, { itemId: number }>("/plaid/update-link-token", {
			itemId,
		});
	} catch {
		return throwWithMessage("Could not start Plaid update mode.");
	}
};

export const exchangePlaidPublicToken = async (publicToken: string): Promise<ExchangePlaidPublicTokenResponse> => {
	try {
		return await apiClient.post<
			ExchangePlaidPublicTokenResponse,
			{
				publicToken: string;
			}
		>("/plaid/exchange-public-token", {
			publicToken,
		});
	} catch {
		return throwWithMessage("Could not connect this institution.");
	}
};

export const completePlaidUpdateMode = async (itemId: number): Promise<CompletePlaidUpdateModeResponse> => {
	try {
		return await apiClient.post<CompletePlaidUpdateModeResponse, { itemId: number }>(
			"/plaid/complete-update-mode",
			{
				itemId,
			},
		);
	} catch {
		return throwWithMessage("Could not refresh this institution.");
	}
};

export const removePlaidItem = async (itemId: number): Promise<RemovePlaidItemResponse> => {
	try {
		return await apiClient.del<RemovePlaidItemResponse, { itemId: number }>("/plaid/items", { itemId });
	} catch {
		return throwWithMessage("Could not remove this institution.");
	}
};

export const syncAllPlaidItems = async (): Promise<PlaidSyncSummary[]> => {
	try {
		const response = await apiClient.post<SyncAllPlaidItemsResponse, Record<string, never>>("/plaid/sync-all", {});
		return response.items;
	} catch {
		return throwWithMessage("Could not sync connected accounts.");
	}
};

export const importCapitalOneCsv = async (
	itemId: number,
	accountId: number,
	csvText: string,
	fileName?: string,
): Promise<ImportCapitalOneCsvResponse> => {
	try {
		return await apiClient.post<
			ImportCapitalOneCsvResponse,
			{
				itemId: number;
				accountId: number;
				csvText: string;
				fileName?: string;
			}
		>("/transactions/import/capital-one", {
			itemId,
			accountId,
			csvText,
			fileName,
		});
	} catch (error) {
		return throwWithMessage(error instanceof Error ? error.message : "Could not import Capital One transactions.");
	}
};

export const getColors = async (): Promise<ColorsByName> => {
	try {
		return await apiClient.get<ColorsByName>("/categories/colors");
	} catch (error) {
		return throwWithMessage(error instanceof Error ? error.message : "Could not fetch categories colors.");
	}
};

export type {
	Transaction,
	Category,
	CategoryInput,
	CategoryBudget,
	MerchantSetting,
	PlaidAccount,
	PlaidItem,
	PlaidSyncSummary,
	ImportCapitalOneCsvResponse,
	DashboardFilter,
	DashboardStats,
	DashboardResponse,
	Color,
	ColorsByName,
};

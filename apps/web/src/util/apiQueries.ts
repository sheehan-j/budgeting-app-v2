import apiClient from "./apiClient";

type Transaction = {
	id: number;
	date: string;
	amount: number;
	merchant: string;
	configurationName: string;
	userId: string;
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
	name: string;
	orderIndex: number;
	color: string;
	colorDark: string;
	colorLight?: string | null;
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
	categoryName?: string;
	userId?: string;
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

type ApplyMerchantSettingsResponse = {
	ok: boolean;
	updatedCount: number;
};

type OkResponse = {
	ok: boolean;
};

export const getTransactions = async (): Promise<Transaction[]> => {
	try {
		const data = await apiClient.get<Transaction[]>("/transactions");

		if (data.length === 100000) {
			alert("Transaction count has reached 100000.");
		}

		return formatTransactions(data);
	} catch (error: any) {
		alert("Error retrieving transactions:" + error.message);
		return [];
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
		alert("Could not fetch dashboard statistics");
		return [];
	}
};

export const getTransactionCount = async (): Promise<number> => {
	try {
		const data = await apiClient.get<TransactionCountResponse>("/transactions/count");
		return data.count;
	} catch {
		return 0;
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

export const setTransactionCategories = async (
	transactionIds: number[],
	categoryName: string,
): Promise<boolean> => {
	try {
		if (transactionIds.length === 0) return true;

		await apiClient.patch("/transactions/category", {
			ids: transactionIds,
			categoryName,
		});
		return true;
	} catch {
		return false;
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
		return false;
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
		return false;
	}
};

export const deleteTransactions = async (transactionIds: number[]): Promise<boolean> => {
	try {
		if (transactionIds.length === 0) return true;

		await apiClient.del("/transactions", { ids: transactionIds });
		return true;
	} catch {
		return false;
	}
};

export const getCategories = async (): Promise<Category[]> => {
	try {
		const data = await apiClient.get<Category[]>("/categories");
		return [...data].sort((a, b) => a.orderIndex - b.orderIndex);
	} catch {
		alert("Could not fetch categories");
		return [];
	}
};

export const getDashboardData = async (
	userId: string,
	filters: DashboardFilter[],
): Promise<DashboardResponse | null> => {
	try {
		const data = await apiClient.post<DashboardResponse, { userId: string; filters: DashboardFilter[] }>(
			"/dashboard/stats",
			{ userId, filters },
		);

		return {
			transactions: formatTransactions(data.transactions),
			stats: data.stats,
		};
	} catch {
		alert("Could not fetch dashboard data");
		return null;
	}
};

export const getSpending = async (
	year: number | string,
	userId?: string,
): Promise<Record<string, number>[]> => {
	if (!userId) return [];

	try {
		return await apiClient.get<Record<string, number>[]>("/dashboard/spending", {
			userId,
			year: Number(year),
		});
	} catch {
		alert("Could not fetch spending data");
		return [];
	}
};

export const getBudgets = async (
	month: number | string,
	year: number | string,
	userId?: string,
): Promise<CategoryBudget[]> => {
	try {
		if (!userId) return [];

		return await apiClient.get<CategoryBudget[]>("/budgets", {
			month: Number(month),
			year: Number(year),
			userId,
		});
	} catch {
		alert("Could not fetch budgets");
		return [];
	}
};

export const updateBudget = async (
	newBudgets: CategoryBudget[],
	userId: string,
	month: number | string,
	year: number | string,
): Promise<CategoryBudget[] | null> => {
	try {
		const response = await apiClient.put<
			BudgetResponse,
			{
				month: number;
				year: number;
				userId: string;
				budgets: { name: string; limit: number | string | null | undefined }[];
			}
		>("/budgets", {
			month: Number(month),
			year: Number(year),
			userId,
			budgets: newBudgets.map((budget) => ({
				name: budget.name,
				limit: budget.limit ?? null,
			})),
		});

		return response.ok ? response.budgets : null;
	} catch {
		return null;
	}
};

export const getMerchantSettings = async (): Promise<MerchantSetting[]> => {
	try {
		const userId = "b82387f7-9d75-4711-91c9-e7558fff4dc6";

		const merchantSettings = await apiClient.get<MerchantSetting[]>("/merchants", { userId });
		return [...merchantSettings].sort((a, b) => a.id - b.id);
	} catch {
		alert("Could not fetch merchant settings");
		return [];
	}
};

export const upsertMerchantSetting = async (merchantSetting: MerchantSetting): Promise<boolean> => {
	try {
		const response = await apiClient.put<MerchantSettingResponse, MerchantSetting>("/merchants", merchantSetting);
		return response.ok;
	} catch {
		return false;
	}
};

export const deleteMerchantSetting = async (merchantSettingId: number): Promise<boolean> => {
	try {
		const response = await apiClient.del<OkResponse>(`/merchants/${merchantSettingId}`);
		return response.ok;
	} catch {
		return false;
	}
};

export const applyMerchantSettingsToExistingTransactions = async (
	userId: string,
): Promise<number | null> => {
	try {
		const response = await apiClient.post<
			ApplyMerchantSettingsResponse,
			{
				userId: string;
			}
		>("/transactions/apply-merchant-settings", { userId });

		return response.updatedCount;
	} catch {
		return null;
	}
};

export type {
	Transaction,
	Category,
	CategoryBudget,
	MerchantSetting,
	DashboardFilter,
	DashboardStats,
	DashboardResponse,
};

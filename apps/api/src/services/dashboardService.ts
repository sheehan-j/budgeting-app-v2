import { ignoredCategories } from "../constants/categories.js";
import { getCategoriesRows } from "../repositories/categoriesRepository.js";
import { getNormalizedTransactions } from "./transactionsShared.js";
import type {
  Category,
	DashboardFilter,
	DashboardRequest,
	DashboardStatsCategory,
	DashboardStatsResponse,
	YearlySpendingRequest,
	YearlySpendingResponse,
} from "../types/dashboardTypes.js";
import type { NormalizedTransaction } from "./transactionsShared.js";

const filterTransactions = (transactions: NormalizedTransaction[], filters: DashboardFilter[]) => {
	const filterTypes: DashboardFilter["type"][] = ["Date", "Merchant", "Category", "Configuration", "Amount"];
	let filteredTransactions = [...transactions];

	filterTypes.forEach((filterType) => {
		const matchingFilters = filters.filter((filter) => filter.type === filterType);

		if (matchingFilters.length > 0) {
			const matchingTransactions: NormalizedTransaction[] = [];

			matchingFilters.forEach((filter) => {
				filteredTransactions.forEach((transaction) => {
					let isMatchingTransaction = false;

					if (filter.type === "Date") {
						const transactionDate = new Date(transaction.date);
						const startDate = new Date(`${filter.start.month}/${filter.start.day}/${filter.start.year}`);
						const endDate = new Date(`${filter.end.month}/${filter.end.day}/${filter.end.year}`);
						isMatchingTransaction = transactionDate >= startDate && transactionDate <= endDate;
					} else if (filter.type === "Merchant") {
						isMatchingTransaction = transaction.merchant
							.toLowerCase()
							.includes(filter.merchant.toLowerCase());
					} else if (filter.type === "Category") {
						isMatchingTransaction = transaction.categoryName === filter.category.name;
					} else if (filter.type === "Configuration") {
						isMatchingTransaction = transaction.configurationName === filter.configuration;
					} else if (filter.type === "Amount") {
						const transactionAmount = Number(transaction.amount);
						const filterAmount = Number(filter.amount);
						isMatchingTransaction =
							(filter.condition === "lessThan" && transactionAmount < filterAmount) ||
							(filter.condition === "greaterThan" && transactionAmount > filterAmount) ||
							(filter.condition === "equals" && transactionAmount === filterAmount);
					}

					if (
						isMatchingTransaction &&
						!matchingTransactions.some((existingTransaction) => existingTransaction.id === transaction.id)
					) {
						matchingTransactions.push(transaction);
					}
				});
			});

			filteredTransactions = [...matchingTransactions];
		}
	});

	return filteredTransactions;
};

const getCategoricalSpending = (transactions: NormalizedTransaction[]) => {
	const categoricalSpending: Record<string, number> = {};

	transactions.forEach((transaction) => {
		if (transaction.ignored) return;

		const currentAmount = categoricalSpending[transaction.categoryName] || 0;
		categoricalSpending[transaction.categoryName] = currentAmount + transaction.amount;
	});

	return categoricalSpending;
};

// Special refers to when the only selected category filter is a non-spending category like "Income" or "Credits/Payments"
const handleSpecialCaseCategoryFilter = (
	transactions: NormalizedTransaction[],
	filters: DashboardFilter[],
): DashboardStatsResponse | null => {
	const categoryFilters = filters.filter((filter) => filter.type === "Category");

	if (
		categoryFilters.length === 1 &&
		categoryFilters[0] !== undefined &&
		ignoredCategories.includes(categoryFilters[0].category.name)
	) {
		const categoricalSpending = getCategoricalSpending(transactions);
		const category = categoryFilters[0].category;

		let amount = 0;
		if (category.name === "Income") {
			amount = "Income" in categoricalSpending ? categoricalSpending.Income * -1 : 0;
		} else if (category.name === "Credits/Payments") {
			amount = "Credits/Payments" in categoricalSpending ? categoricalSpending["Credits/Payments"] : 0;
		}

		return {
			spending: {
				amount,
			},
			categories: [],
			specialCaseCategory: true,
			category,
			filters,
		};
	}

	return null;
};

const buildDashboardStats = (
	transactions: NormalizedTransaction[],
	filters: DashboardFilter[],
	categories: Category[],
): DashboardStatsResponse => {
	const today = new Date();
	const specialCase = handleSpecialCaseCategoryFilter(transactions, filters);
	if (specialCase) return specialCase;

	const spendingAmount = transactions.reduce((acc, transaction) => {
		if (!ignoredCategories.includes(transaction.categoryName) && !transaction.ignored) acc += transaction.amount;
		return acc;
	}, 0);

	const categoricalSpending = getCategoricalSpending(transactions);
	ignoredCategories.forEach((category) => {
		delete categoricalSpending[category];
	});

	let sortedCategories = Object.entries(categoricalSpending).sort((a, b) => b[1] - a[1]);
	const categoryStats: DashboardStatsCategory[] = sortedCategories.map(([categoryName, amount]) => {
		const categoryData = categories.find((category) => category.name === categoryName);

		return {
			name: categoryName,
			amount,
			color: categoryData?.color || "white",
			colorDark: categoryData?.colorDark || "rgb(226 232 240)",
			colorLight: categoryData?.colorLight || "rgb(248 250 252)",
			percentage: spendingAmount === 0 ? 0 : (amount / spendingAmount) * 100,
		};
	});

	return {
		spending: {
			amount: spendingAmount,
			title: `${today.toLocaleString("default", { month: "long" })} Spending`,
		},
		categories: categoryStats,
		specialCaseCategory: false,
		filters,
	};
};

export const getDashboardStats = async ({ userId, filters }: DashboardRequest) => {
	const [transactions, categories] = await Promise.all([getNormalizedTransactions({ userId }), getCategoriesRows()]);

	const filteredTransactions = filterTransactions(transactions, filters);
	const stats = buildDashboardStats(filteredTransactions, filters, categories);

	return {
		transactions: filteredTransactions,
		stats,
	};
};

export const getYearlySpending = async ({ userId, year }: YearlySpendingRequest): Promise<YearlySpendingResponse> => {
	const transactions = await getNormalizedTransactions({ userId, year });
	const spending: Record<string, number>[] = [];
	const yearTotals: Record<string, number> = { Total: 0 };

	for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
		const monthTransactions = transactions.filter((transaction) => transaction.month === monthIndex + 1);
		const categoricalSpending = getCategoricalSpending(monthTransactions);

		let total = 0;
		Object.keys(categoricalSpending).forEach((categoryName) => {
			if (!ignoredCategories.includes(categoryName)) total += categoricalSpending[categoryName] || 0;
			yearTotals[categoryName] = (yearTotals[categoryName] || 0) + (categoricalSpending[categoryName] || 0);
		});

		categoricalSpending.Total = total;
		yearTotals.Total = (yearTotals.Total || 0) + total;

		if (categoricalSpending.Income !== undefined) {
			categoricalSpending.Income *= -1;
		}

		spending[monthIndex] = categoricalSpending;
	}

	if (yearTotals.Income !== undefined) {
		yearTotals.Income *= -1;
	}

	spending[12] = yearTotals;
	return spending;
};

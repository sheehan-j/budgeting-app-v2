import { getBudgetRows, replaceBudgetRows } from "../repositories/budgetsRepository.js";
import { getCategoriesRows } from "../repositories/categoriesRepository.js";
import { getTransactionsRows } from "../repositories/transactionsRepository.js";
import type { BudgetUpdateInput, Budget, CategoryBudget } from "../types/budgetsTypes.js";
import { ignoredCategories, nonEditableBudgets } from "../constants/categories.js";

const getCategoricalSpending = (transactions: { categoryName: string; amount: number; ignored: boolean }[]) => {
	const categoricalSpending: Record<string, number> = {};

	transactions.forEach((transaction) => {
		if (transaction.ignored) return;
		categoricalSpending[transaction.categoryName] =
			(categoricalSpending[transaction.categoryName] || 0) + transaction.amount;
	});

	return categoricalSpending;
};

export const getBudgets = async ({ month, year, userId }: { month: number; year: number; userId: string }) => {
	const [categoryRows, budgetRows, transactionRows] = await Promise.all([
		getCategoriesRows(),
		getBudgetRows(userId),
		getTransactionsRows({ userId, month, year }),
	]);

	const normalizedTransactions = transactionRows.map((transaction) => ({
		...transaction,
		amount: Number(transaction.amount),
	}));
	const categoricalSpending = getCategoricalSpending(normalizedTransactions);

	// Iterate through each category, find the matching budget to get its limit, pull spending from categoricalSpending,
	// and keep running limit to get total budget limit
	let totalLimit = 0;
	let totalSpending = 0;
	let formattedBudgets: CategoryBudget[] = categoryRows.map((category) => {
		const matchingBudget = budgetRows.find((budget) => budget.categoryName === category.name);
		const limit = matchingBudget ? Number(matchingBudget.limit) : null;
		const spending = categoricalSpending[category.name] || 0;
		const percentage = limit ? (spending / limit) * 100 : null;

		if (!ignoredCategories.includes(category.name)) {
			if (limit) totalLimit += limit;
			totalSpending += spending;
		}

		return {
			...category,
			limit,
			spending,
			percentage,
		};
	});

	formattedBudgets.sort((a, b) => a.orderIndex - b.orderIndex);

	// Construct total buidget with combined limit and spending across all categories
	const totalBudget: Budget = {
		name: "Total",
		orderIndex: null,
		limit: totalLimit > 0 ? totalLimit : null,
		spending: totalSpending,
		percentage: totalLimit > 0 ? (totalSpending / totalLimit) * 100 : null,
		color: "white",
		colorDark: "rgb(226 232 240)",
		colorLight: "rgb(248 250 252)",
	};

	return [totalBudget, ...formattedBudgets] as Budget[];
};

// updateBudgets function by deleting all existing budgets and inserting new rows for any budgets with a non-null limit
// This results in any budgets without a limit not existing in the DB
export const updateBudgets = async (month: number, year: number, userId: string, budgets: BudgetUpdateInput[]) => {
	// Filter out non-editable budgets defined in constants.js, includes budgets like "Total" which is dynamically calcualated and "Income" which is not a spending category
	const editableBudgets = budgets.filter((budget) => !nonEditableBudgets.includes(budget.name));

	const replacements = editableBudgets
		.filter((budget) => budget.limit !== null && budget.limit !== "") // Filter out any budgets where there is no limit
		.map((budget) => ({
			categoryName: budget.name,
			limit: String(budget.limit),
		}));

	await replaceBudgetRows(userId, replacements);

  // Call getBudgets to return new budgets (rather than result of replaceBudgetRows) due to processing occuring in getBudgets
	return getBudgets({ month, year, userId });
};

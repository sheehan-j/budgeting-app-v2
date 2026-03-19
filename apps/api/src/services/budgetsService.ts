import { getBudgetRows, replaceBudgetRows } from "../repositories/budgetsRepository.js";
import { getNormalizedTransactions } from "./transactionsShared.js";
import type { BudgetUpdateInput, Budget, CategoryBudget } from "../types/budgetsTypes.js";
import { ignoredCategories, nonEditableBudgets } from "../constants/categories.js";
import { getCategoriesRows } from "../repositories/categoriesRepository.js";

const getCategoricalSpending = (transactions: { categoryId: number; amount: number; ignored: boolean }[]) => {
	const categoricalSpending: Record<number, number> = {};

	transactions.forEach((transaction) => {
		if (transaction.ignored) return;
		categoricalSpending[transaction.categoryId] =
			(categoricalSpending[transaction.categoryId] || 0) + transaction.amount;
	});

	return categoricalSpending;
};

export const getBudgets = async ({ month, year, userId }: { month: number; year: number; userId: string }) => {
	const [categoryRows, budgetRows, transactions] = await Promise.all([
		getCategoriesRows(userId),
		getBudgetRows(userId),
		getNormalizedTransactions({ userId, month, year }),
	]);

	const categoricalSpending = getCategoricalSpending(transactions);

	// Iterate through each category, find the matching budget to get its limit, pull spending from categoricalSpending,
	// and keep running limit to get total budget limit
	let totalLimit = 0;
	let totalSpending = 0;
	let formattedBudgets: CategoryBudget[] = categoryRows.map((category) => {
		const matchingBudget = budgetRows.find((budget) => budget.categoryId === category.id);
		const limit = matchingBudget ? Number(matchingBudget.limit) : null;
		const spending = categoricalSpending[category.id] || 0;
		const percentage = limit ? (spending / limit) * 100 : null;

		if (!ignoredCategories.includes(category.name)) {
			if (limit) totalLimit += limit;
			totalSpending += spending;
		}

		return {
			categoryId: category.id,
			name: category.name,
			color: category.color,
			colorDark: category.colorDark,
			colorLight: category.colorLight,
			position: category.position,
			limit,
			spending,
			percentage,
		};
	});

	formattedBudgets.sort((a, b) => a.position - b.position);

	// Construct total buidget with combined limit and spending across all categories
	const totalBudget: Budget = {
		categoryId: null,
		name: "Total",
		position: null,
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
			categoryId: budget.categoryId!,
			limit: String(budget.limit),
		}));

	await replaceBudgetRows(userId, replacements);

	// Call getBudgets to return new budgets (rather than result of replaceBudgetRows) due to processing occuring in getBudgets
	return getBudgets({ month, year, userId });
};

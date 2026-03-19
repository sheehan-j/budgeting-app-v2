export type BudgetQuery = {
	month: number;
	year: number;
};

export type BudgetUpdateInput = {
	name: string;
	limit: number | string | null;
};

// Parent type for all "budget" objects, accomodates both total and categorical budgets
export type Budget = {
	name: string;
	color: string;
	colorDark: string;
	colorLight: string | null;
	position: number | null; // Allow nullable since totalBudget object won't have this property
	limit: number | null;
	spending: number;
	percentage: number | null;
};

// More specific view for categorical budgets, which require position for sorting
export type CategoryBudget = Budget & {
	position: number;
};

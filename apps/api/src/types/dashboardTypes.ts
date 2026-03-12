import { getCategoriesRows } from "../repositories/categoriesRepository.js";

// Dashboard filter types
export type DashboardDateFilter = {
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

export type DashboardMerchantFilter = {
	type: "Merchant";
	merchant: string;
};

export type DashboardCategoryFilter = {
	type: "Category";
	category: {
		name: string;
		color?: string;
		colorDark?: string;
		colorLight?: string | null;
	};
};

export type DashboardConfigurationFilter = {
	type: "Configuration";
	configuration: string;
};

export type DashboardAmountFilter = {
	type: "Amount";
	condition: "lessThan" | "greaterThan" | "equals";
	amount: string | number;
};

export type DashboardFilter =
	| DashboardDateFilter
	| DashboardMerchantFilter
	| DashboardCategoryFilter
	| DashboardConfigurationFilter
	| DashboardAmountFilter;

export type DashboardRequest = {
	userId: string;
	filters: DashboardFilter[];
};

export type YearlySpendingRequest = {
	userId: string;
	year: number;
};

// Simple to represent category returned from DB
export type Category = Awaited<ReturnType<typeof getCategoriesRows>>[number];

// Structure for category object that will be displayed at the top pane of the dashboard
export type DashboardStatsCategory = {
	name: string;
	amount: number;
	color: string;
	colorDark: string;
	colorLight: string | null;
	percentage: number;
};

// Full stats object ot be displayed in the top pane of the dashboard
export type DashboardStatsResponse = {
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

export type YearlySpendingResponse = Record<string, number>[];

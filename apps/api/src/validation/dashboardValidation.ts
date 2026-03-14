import { z } from "zod";

const dateSchema = z.object({
	month: z.number().int().min(1).max(12),
	day: z.number().int().min(1).max(31),
	year: z.number().int(),
});

const dateFilterSchema = z.object({
	type: z.literal("Date"),
	start: dateSchema,
	end: dateSchema,
});

const merchantFilterSchema = z.object({
	type: z.literal("Merchant"),
	merchant: z.string(),
});

const categoryFilterSchema = z.object({
	type: z.literal("Category"),
	category: z.object({
		name: z.string().min(1),
		color: z.string().optional(),
		colorDark: z.string().optional(),
		colorLight: z.string().nullable().optional(),
	}),
});

const configurationFilterSchema = z.object({
	type: z.literal("Configuration"),
	configuration: z.string().min(1),
});

const amountFilterSchema = z.object({
	type: z.literal("Amount"),
	condition: z.enum(["lessThan", "greaterThan", "equals"]),
	amount: z.union([z.string(), z.number()]),
});

export const dashboardFilterSchema = z.discriminatedUnion("type", [
	dateFilterSchema,
	merchantFilterSchema,
	categoryFilterSchema,
	configurationFilterSchema,
	amountFilterSchema,
]);

export const getDashboardBodySchema = z.object({
	filters: z.array(dashboardFilterSchema),
});

export const getYearlySpendingQuerySchema = z.object({
	year: z.coerce.number().int(),
});

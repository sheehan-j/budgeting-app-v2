import { z } from "zod";

export const transactionIdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const getTransactionsQuerySchema = z
	.object({
		month: z.coerce.number().int().min(1).max(12).optional(),
		year: z.coerce.number().int().optional(),
		limit: z.coerce.number().int().positive().optional(),
	})
	.refine(({ month, year }) => (month === undefined) === (year === undefined), {
		message: "month and year must be provided together",
		path: ["month"],
	});

const transactionIdsSchema = z.object({
	ids: z.array(z.coerce.number().int().positive()).min(1),
});

export const deleteTransactionsBodySchema = transactionIdsSchema;

export const updateTransactionsIgnoredBodySchema = transactionIdsSchema.extend({
	ignored: z.boolean(),
});

export const updateTransactionsCategoryBodySchema = transactionIdsSchema.extend({
	categoryId: z.coerce.number().int().positive(),
});

export const updateTransactionNotesBodySchema = z.object({
	notes: z.union([z.string(), z.null()]).transform((value) => (value === "" ? null : value)),
});

export const applyMerchantSettingsBodySchema = z.object({}).strict();

export const recategorizeTransactionsBodySchema = z.object({
	initialCategoryId: z.coerce.number().int().positive(),
	targetCategoryId: z.coerce.number().int().positive(),
});

export const importCapitalOneCsvBodySchema = z.object({
	itemId: z.coerce.number().int().positive(),
	accountId: z.coerce.number().int().positive(),
	csvText: z.string().min(1).max(2_000_000),
	fileName: z.string().trim().min(1).max(255).optional(),
});

export const importAppleCsvBodySchema = z.object({
	csvText: z.string().min(1).max(2_000_000),
	fileName: z.string().trim().min(1).max(255).optional(),
});

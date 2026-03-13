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
	categoryName: z.string().trim().min(1),
});

export const updateTransactionNotesBodySchema = z.object({
	notes: z.union([z.string(), z.null()]).transform((value) => (value === "" ? null : value)),
});

export const applyMerchantSettingsBodySchema = z.object({
	userId: z.string().uuid(),
});

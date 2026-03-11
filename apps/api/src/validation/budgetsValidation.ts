import { z } from "zod";

export const budgetsQuerySchema = z.object({
	month: z.coerce.number().int().min(1).max(12),
	year: z.coerce.number().int(),
	userId: z.string().uuid(),
});

export const budgetsUpdateBodySchema = z.object({
	month: z.coerce.number().int().min(1).max(12),
	year: z.coerce.number().int(),
	userId: z.string().uuid(),
	budgets: z.array(
    z.object({
      name: z.string().trim().min(1),
      limit: z.union([z.number(), z.string(), z.null()]).transform((value) => (value === "" ? null : value)),
    })
  ),
});

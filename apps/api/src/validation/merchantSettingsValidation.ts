import { z } from "zod";

export const merchantSettingIdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const saveMerchantSettingBodySchema = z.object({
	id: z.coerce.number().int().positive().optional(),
	text: z.string().trim().min(1),
	type: z.enum(["contains", "equals"]),
	categoryId: z.coerce.number().int().positive(),
});

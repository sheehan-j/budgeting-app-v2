import { z } from "zod";

export const exchangePlaidPublicTokenBodySchema = z.object({
	publicToken: z.string().trim().min(1),
});

export const plaidWebhookBodySchema = z
	.object({
		webhook_type: z.string().trim().min(1),
		webhook_code: z.string().trim().min(1),
		item_id: z.string().trim().min(1).optional(),
	})
	.passthrough();

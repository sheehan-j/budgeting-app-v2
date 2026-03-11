import { Hono, type Context } from "hono";
import { z } from "zod";
import {
	deleteMerchantSetting,
	getMerchantSettings,
	saveMerchantSetting,
} from "../services/merchantSettingsService.js";
import {
	merchantSettingIdParamsSchema,
	merchantSettingsQuerySchema,
	saveMerchantSettingBodySchema,
} from "../validation/merchantSettingsValidation.js";

const merchantSettingsRoutes = new Hono();

const badRequest = (c: Context, error: unknown) => {
	return c.json({ error }, 400);
};

merchantSettingsRoutes.get("/", async (c) => {
	try {
		const queryResult = merchantSettingsQuerySchema.safeParse({
			userId: c.req.query("userId"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const merchantSettings = await getMerchantSettings(queryResult.data.userId);
		return c.json(merchantSettings);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch merchant settings" }, 500);
	}
});

merchantSettingsRoutes.put("/", async (c) => {
	try {
		const bodyResult = saveMerchantSettingBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const merchantSetting = await saveMerchantSetting(bodyResult.data);

		if (!merchantSetting) return c.json({ error: "Failed to save merchant setting" }, 500);

		return c.json({ ok: true, merchantSetting });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to save merchant setting" }, 500);
	}
});

merchantSettingsRoutes.delete("/:id", async (c) => {
	try {
		const paramsResult = merchantSettingIdParamsSchema.safeParse({ id: c.req.param("id") });

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));

		const merchantSetting = await deleteMerchantSetting(paramsResult.data.id);
		if (!merchantSetting) return c.json({ error: "Merchant setting not found" }, 404);

		return c.json({ ok: true });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete merchant setting" }, 500);
	}
});

export default merchantSettingsRoutes;

import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import {
	deleteMerchantSetting,
	getMerchantSettings,
	saveMerchantSetting,
} from "../services/merchantSettingsService.js";
import {
	merchantSettingIdParamsSchema,
	saveMerchantSettingBodySchema,
} from "../validation/merchantSettingsValidation.js";

const merchantSettingsRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};

const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

merchantSettingsRoutes.get("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const merchantSettings = await getMerchantSettings(user.id);
		return c.json(merchantSettings);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch merchant settings" }, 500);
	}
});

merchantSettingsRoutes.put("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = saveMerchantSettingBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const merchantSetting = await saveMerchantSetting(bodyResult.data, user.id);

		if (!merchantSetting) return c.json({ error: "Failed to save merchant setting" }, 500);

		return c.json({ ok: true, merchantSetting });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to save merchant setting" }, 500);
	}
});

merchantSettingsRoutes.delete("/:id", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const paramsResult = merchantSettingIdParamsSchema.safeParse({ id: c.req.param("id") });

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));

		const merchantSetting = await deleteMerchantSetting(paramsResult.data.id, user.id);
		if (!merchantSetting) return c.json({ error: "Merchant setting not found" }, 404);

		return c.json({ ok: true });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete merchant setting" }, 500);
	}
});

export default merchantSettingsRoutes;

import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import {
	completePlaidUpdateMode,
	createPlaidLinkToken,
	createPlaidUpdateLinkToken,
	exchangePlaidPublicToken,
	getPlaidItems,
	removePlaidItem,
	syncPlaidItemByPlaidItemId,
	syncAllPlaidItems,
} from "../services/plaidService.js";
import {
	completePlaidUpdateModeBodySchema,
	createPlaidUpdateLinkTokenBodySchema,
	exchangePlaidPublicTokenBodySchema,
	plaidWebhookBodySchema,
	removePlaidItemBodySchema,
} from "../validation/plaidValidation.js";

const plaidRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};

const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

plaidRoutes.post("/webhook", async (c) => {
	try {
		const bodyResult = plaidWebhookBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const { webhook_type: webhookType, webhook_code: webhookCode, item_id: itemId } = bodyResult.data;

		if (webhookType === "TRANSACTIONS" && webhookCode === "SYNC_UPDATES_AVAILABLE") {
			if (!itemId) {
				return badRequest(c, { item_id: ["Required for transaction sync webhooks"] });
			}

			void syncPlaidItemByPlaidItemId(itemId).catch((error) => {
				console.error("Failed to process Plaid transactions webhook", {
					itemId,
					error,
				});
			});

			return c.json({ ok: true, handled: true });
		}

		return c.json({ ok: true, handled: false });
	} catch (error) {
		console.error("Failed to process Plaid webhook", error);
		return c.json({ error: "Failed to process Plaid webhook" }, 500);
	}
});

plaidRoutes.get("/items", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const items = await getPlaidItems(user.id);
		return c.json(items);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch Plaid items" }, 500);
	}
});

plaidRoutes.post("/link-token", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const linkToken = await createPlaidLinkToken(user.id);
		return c.json(linkToken);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to create Plaid link token" }, 500);
	}
});

plaidRoutes.post("/update-link-token", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = createPlaidUpdateLinkTokenBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const linkToken = await createPlaidUpdateLinkToken(bodyResult.data.itemId, user.id);
		if (!linkToken) return c.json({ error: "Plaid item not found" }, 404);

		return c.json(linkToken);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to create Plaid update link token" }, 500);
	}
});

plaidRoutes.post("/exchange-public-token", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = exchangePlaidPublicTokenBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await exchangePlaidPublicToken(bodyResult.data.publicToken, user.id);
		return c.json({ ok: true, ...result });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to exchange Plaid public token" }, 500);
	}
});

plaidRoutes.post("/complete-update-mode", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = completePlaidUpdateModeBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await completePlaidUpdateMode(bodyResult.data.itemId, user.id);
		if (!result) return c.json({ error: "Plaid item not found" }, 404);

		return c.json({ ok: true, ...result });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to complete Plaid update mode" }, 500);
	}
});

plaidRoutes.delete("/items", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = removePlaidItemBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await removePlaidItem(bodyResult.data.itemId, user.id);
		if (!result) return c.json({ error: "Plaid item not found" }, 404);

		return c.json({ ok: true, ...result });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to remove Plaid institution" }, 500);
	}
});

plaidRoutes.post("/sync-all", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const results = await syncAllPlaidItems(user.id);
		return c.json({ ok: true, items: results });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to sync Plaid transactions" }, 500);
	}
});

export default plaidRoutes;

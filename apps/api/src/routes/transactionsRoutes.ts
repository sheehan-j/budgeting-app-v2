import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import {
	applyMerchantSettingsToTransactions,
	deleteTransactions,
	getTransactions,
	getTransactionsCount,
	importCapitalOneCsvTransactions,
	recategorizeTransactions,
	setTransactionCategories,
	setTransactionNotes,
	setTransactionsIgnored,
} from "../services/transactionsService.js";
import {
	applyMerchantSettingsBodySchema,
	deleteTransactionsBodySchema,
	getTransactionsQuerySchema,
	importCapitalOneCsvBodySchema,
	recategorizeTransactionsBodySchema,
	transactionIdParamsSchema,
	updateTransactionNotesBodySchema,
	updateTransactionsCategoryBodySchema,
	updateTransactionsIgnoredBodySchema,
} from "../validation/transactionsValidation.js";
import { validateCategoriesOwnership } from "../services/categoriesService.js";

const transactionsRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};

const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

transactionsRoutes.get("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const queryResult = getTransactionsQuerySchema.safeParse({
			month: c.req.query("month"),
			year: c.req.query("year"),
			limit: c.req.query("limit"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const rows = await getTransactions(user.id, queryResult.data);
		return c.json(rows);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch transactions" }, 500);
	}
});

transactionsRoutes.get("/count", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const count = await getTransactionsCount(user.id);
		return c.json({ count });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch transaction count" }, 500);
	}
});

transactionsRoutes.delete("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = deleteTransactionsBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const deletedTransactions = await deleteTransactions(bodyResult.data.ids, user.id);
		return c.json({ ok: true, transactions: deletedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete transactions" }, 500);
	}
});

transactionsRoutes.patch("/ignored", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = updateTransactionsIgnoredBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const updatedTransactions = await setTransactionsIgnored(bodyResult.data.ids, bodyResult.data.ignored, user.id);
		return c.json({ ok: true, transactions: updatedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transactions" }, 500);
	}
});

transactionsRoutes.patch("/category", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = updateTransactionsCategoryBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const updatedTransactions = await setTransactionCategories(
			bodyResult.data.ids,
			bodyResult.data.categoryId,
			user.id,
		);
		return c.json({ ok: true, transactions: updatedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transactions" }, 500);
	}
});

transactionsRoutes.post("/apply-merchant-settings", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = applyMerchantSettingsBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await applyMerchantSettingsToTransactions(user.id);
		return c.json({ ok: true, updatedCount: result.updatedCount });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to apply merchant settings" }, 500);
	}
});

transactionsRoutes.patch("/:id/notes", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const paramsResult = transactionIdParamsSchema.safeParse({ id: c.req.param("id") });
		const bodyResult = updateTransactionNotesBodySchema.safeParse(await c.req.json());

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const updatedTransactions = await setTransactionNotes([paramsResult.data.id], bodyResult.data.notes, user.id);
		const transaction = updatedTransactions[0];
		if (!transaction) return c.json({ error: "Transaction not found" }, 404);

		return c.json({ ok: true, transaction });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transaction notes" }, 500);
	}
});

transactionsRoutes.post("/recategorize", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = recategorizeTransactionsBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		if (
			!validateCategoriesOwnership([bodyResult.data.initialCategoryId, bodyResult.data.targetCategoryId], user.id)
		) {
			throw new Error("An invalid category ID was provided");
		}

		const updatedCount = await recategorizeTransactions(
			bodyResult.data.initialCategoryId,
			bodyResult.data.targetCategoryId,
			user.id,
		);
		return c.json({ ok: true, updatedCount });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to apply merchant settings" }, 500);
	}
});

transactionsRoutes.post("/import/capital-one", async (c) => {
	try {
		if (!(String(process.env.IMPORT_ENABLED ?? "").toLowerCase() === "true"))
			return c.json({ error: "This feature is disabled" }, 403);

		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = importCapitalOneCsvBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await importCapitalOneCsvTransactions(bodyResult.data, user.id);
		return c.json({ ok: true, ...result });
	} catch (error) {
		console.error(error);
		return c.json(
			{
				error: error instanceof Error ? error.message : "Failed to import Capital One CSV transactions",
			},
			400,
		);
	}
});

export default transactionsRoutes;

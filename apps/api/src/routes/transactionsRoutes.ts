import { Hono, type Context } from "hono";
import { z } from "zod";
import {
	applyMerchantSettingsToTransactions,
	deleteTransactions,
	getTransactions,
	getTransactionsCount,
	setTransactionCategories,
	setTransactionNotes,
	setTransactionsIgnored,
} from "../services/transactionsService.js";
import {
	applyMerchantSettingsBodySchema,
	deleteTransactionsBodySchema,
	getTransactionsQuerySchema,
	transactionIdParamsSchema,
	updateTransactionNotesBodySchema,
	updateTransactionsCategoryBodySchema,
	updateTransactionsIgnoredBodySchema,
} from "../validation/transactionsValidation.js";

const transactionsRoutes = new Hono();

const badRequest = (c: Context, error: unknown) => {
	return c.json({ error }, 400);
};

transactionsRoutes.get("/", async (c) => {
	try {
		const queryResult = getTransactionsQuerySchema.safeParse({
			month: c.req.query("month"),
			year: c.req.query("year"),
			limit: c.req.query("limit"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const rows = await getTransactions(queryResult.data);
		return c.json(rows);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch transactions" }, 500);
	}
});

transactionsRoutes.get("/count", async (c) => {
	try {
		const count = await getTransactionsCount();
		return c.json({ count });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch transaction count" }, 500);
	}
});

transactionsRoutes.delete("/", async (c) => {
	try {
		const bodyResult = deleteTransactionsBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const deletedTransactions = await deleteTransactions(bodyResult.data.ids);
		return c.json({ ok: true, transactions: deletedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete transactions" }, 500);
	}
});

transactionsRoutes.patch("/ignored", async (c) => {
	try {
		const bodyResult = updateTransactionsIgnoredBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const updatedTransactions = await setTransactionsIgnored(bodyResult.data.ids, bodyResult.data.ignored);
		return c.json({ ok: true, transactions: updatedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transactions" }, 500);
	}
});

transactionsRoutes.patch("/category", async (c) => {
	try {
		const bodyResult = updateTransactionsCategoryBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) {
			return badRequest(c, z.flattenError(bodyResult.error));
		}

		const updatedTransactions = await setTransactionCategories(bodyResult.data.ids, bodyResult.data.categoryName);
		return c.json({ ok: true, transactions: updatedTransactions });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transactions" }, 500);
	}
});

transactionsRoutes.post("/apply-merchant-settings", async (c) => {
	try {
		const bodyResult = applyMerchantSettingsBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await applyMerchantSettingsToTransactions(bodyResult.data.userId);
		return c.json({ ok: true, updatedCount: result.updatedCount });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to apply merchant settings" }, 500);
	}
});

transactionsRoutes.patch("/:id/notes", async (c) => {
	try {
		const paramsResult = transactionIdParamsSchema.safeParse({ id: c.req.param("id") });
		const bodyResult = updateTransactionNotesBodySchema.safeParse(await c.req.json());

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const updatedTransactions = await setTransactionNotes([paramsResult.data.id], bodyResult.data.notes);
		const transaction = updatedTransactions[0];
		if (!transaction) return c.json({ error: "Transaction not found" }, 404);

		return c.json({ ok: true, transaction });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transaction notes" }, 500);
	}
});

export default transactionsRoutes;

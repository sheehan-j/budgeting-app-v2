import { Hono, type Context } from "hono";
import { z } from "zod";
import {
	deleteTransactions,
	getTransactions,
	getTransactionsCount,
	setTransactionCategories,
	setTransactionNotes,
	setTransactionsIgnored,
} from "../services/transactionsService.js";
import {
	deleteTransactionsBodySchema,
	getTransactionsQuerySchema,
	transactionIdParamsSchema,
	updateTransactionCategoryBodySchema,
	updateTransactionIgnoredBodySchema,
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

transactionsRoutes.delete("/bulk", async (c) => {
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

transactionsRoutes.delete("/:id", async (c) => {
	try {
		const paramsResult = transactionIdParamsSchema.safeParse({ id: c.req.param("id") });
		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));

		const deletedTransactions = await deleteTransactions([paramsResult.data.id]);
		const transaction = deletedTransactions[0];
		if (!transaction) return c.json({ error: "Transaction not found" }, 404);

		return c.json({ ok: true, transaction });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete transaction" }, 500);
	}
});

transactionsRoutes.patch("/bulk/ignored", async (c) => {
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

transactionsRoutes.patch("/:id/ignored", async (c) => {
	try {
		const paramsResult = transactionIdParamsSchema.safeParse({ id: c.req.param("id") });
		const bodyResult = updateTransactionIgnoredBodySchema.safeParse(await c.req.json());

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const updatedTransactions = await setTransactionsIgnored([paramsResult.data.id], bodyResult.data.ignored);
		const transaction = updatedTransactions[0];
		if (!transaction) return c.json({ error: "Transaction not found" }, 404);

		return c.json({ ok: true, transaction });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transaction" }, 500);
	}
});

transactionsRoutes.patch("/bulk/category", async (c) => {
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

transactionsRoutes.patch("/:id/category", async (c) => {
	try {
		const paramsResult = transactionIdParamsSchema.safeParse({ id: c.req.param("id") });
		const bodyResult = updateTransactionCategoryBodySchema.safeParse(await c.req.json());

		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const updatedTransactions = await setTransactionCategories(
			[paramsResult.data.id],
			bodyResult.data.categoryName,
		);
		const transaction = updatedTransactions[0];
		if (!transaction) return c.json({ error: "Transaction not found" }, 404);

		return c.json({ ok: true, transaction });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update transaction" }, 500);
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

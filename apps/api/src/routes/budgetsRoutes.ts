import { Hono, type Context } from "hono";
import { z } from "zod";
import { getBudgets, updateBudgets } from "../services/budgetsService.js";
import { budgetsQuerySchema, budgetsUpdateBodySchema } from "../validation/budgetsValidation.js";

const budgetsRoutes = new Hono();

const badRequest = (c: Context, error: unknown) => {
	return c.json({ error }, 400);
};

budgetsRoutes.get("/", async (c) => {
	try {
		const queryResult = budgetsQuerySchema.safeParse({
			month: c.req.query("month"),
			year: c.req.query("year"),
			userId: c.req.query("userId"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const budgets = await getBudgets(queryResult.data);
		return c.json(budgets);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch budgets" }, 500);
	}
});

budgetsRoutes.put("/", async (c) => {
	try {
		const bodyResult = budgetsUpdateBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await updateBudgets(
			bodyResult.data.month,
			bodyResult.data.year,
			bodyResult.data.userId,
			bodyResult.data.budgets,
		);
		return c.json({ ok: true, budgets: result });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update budgets" }, 500);
	}
});

export default budgetsRoutes;

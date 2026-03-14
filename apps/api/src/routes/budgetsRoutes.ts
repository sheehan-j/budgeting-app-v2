import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import { getBudgets, updateBudgets } from "../services/budgetsService.js";
import { budgetsQuerySchema, budgetsUpdateBodySchema } from "../validation/budgetsValidation.js";

const budgetsRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};

const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

budgetsRoutes.get("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const queryResult = budgetsQuerySchema.safeParse({
			month: c.req.query("month"),
			year: c.req.query("year"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const budgets = await getBudgets({ ...queryResult.data, userId: user.id });
		return c.json(budgets);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch budgets" }, 500);
	}
});

budgetsRoutes.put("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = budgetsUpdateBodySchema.safeParse(await c.req.json());

		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const result = await updateBudgets(
			bodyResult.data.month,
			bodyResult.data.year,
			user.id,
			bodyResult.data.budgets,
		);
		return c.json({ ok: true, budgets: result });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to update budgets" }, 500);
	}
});

export default budgetsRoutes;

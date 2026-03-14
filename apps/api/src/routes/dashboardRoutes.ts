import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import { getDashboardStats, getYearlySpending } from "../services/dashboardService.js";
import { getDashboardBodySchema, getYearlySpendingQuerySchema } from "../validation/dashboardValidation.js";

const dashboardRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};

const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

dashboardRoutes.get("/spending", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const queryResult = getYearlySpendingQuerySchema.safeParse({
			year: c.req.query("year"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const spending = await getYearlySpending({ ...queryResult.data, userId: user.id });
		return c.json(spending);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch yearly spending" }, 500);
	}
});

dashboardRoutes.post("/stats", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = getDashboardBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));
		const dashboardData = await getDashboardStats({ ...bodyResult.data, userId: user.id });
		return c.json(dashboardData);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch dashboard data" }, 500);
	}
});

export default dashboardRoutes;

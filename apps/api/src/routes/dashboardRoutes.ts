import { Hono, type Context } from "hono";
import { z } from "zod";
import { getDashboardStats, getYearlySpending } from "../services/dashboardService.js";
import { getDashboardBodySchema, getYearlySpendingQuerySchema } from "../validation/dashboardValidation.js";

const dashboardRoutes = new Hono();

const badRequest = (c: Context, error: unknown) => {
	return c.json({ error }, 400);
};

dashboardRoutes.get("/spending", async (c) => {
	try {
		const queryResult = getYearlySpendingQuerySchema.safeParse({
			userId: c.req.query("userId"),
			year: c.req.query("year"),
		});

		if (!queryResult.success) return badRequest(c, z.flattenError(queryResult.error));

		const spending = await getYearlySpending(queryResult.data);
		return c.json(spending);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch yearly spending" }, 500);
	}
});

dashboardRoutes.post("/stats", async (c) => {
	try {
		const bodyResult = getDashboardBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));
		const dashboardData = await getDashboardStats(bodyResult.data);
		return c.json(dashboardData);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch dashboard data" }, 500);
	}
});

export default dashboardRoutes;

import { Hono } from "hono";
import { getCategories } from "../services/categoriesService.js";
import { Context } from "hono";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";

const categoriesRoutes = new Hono<AppBindings>();

// const badRequest = (c: Context<AppBindings>, error: unknown) => {
// 	return c.json({ error }, 400);
// };
const unauthorized = (c: Context<AppBindings>) => c.json({ error: "Unauthorized" }, 401);

categoriesRoutes.get("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const categories = await getCategories(user.id);
		return c.json(categories);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch categories" }, 500);
	}
});

export default categoriesRoutes;

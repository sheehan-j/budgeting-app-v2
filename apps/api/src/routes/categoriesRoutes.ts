import { Hono } from "hono";
import { getCategories } from "../services/categoriesService.js";

const categoriesRoutes = new Hono();

categoriesRoutes.get("/", async (c) => {
	try {
		const categories = await getCategories();
		return c.json(categories);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch categories" }, 500);
	}
});

export default categoriesRoutes;


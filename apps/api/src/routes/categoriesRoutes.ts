import { Hono } from "hono";
import {
	deleteCategory,
	getCategories,
	getUserUncategorizedCategory,
	validateCategoriesOwnership,
} from "../services/categoriesService.js";
import { Context } from "hono";
import { getAuthenticatedUser, type AppBindings } from "../lib/auth.js";
import { colors, nonCustomizableColors } from "../constants/colors.js";
import { categoryIdParamsSchema, saveCategoryBodySchema } from "../validation/categoriesValidation.js";
import z from "zod";
import { saveCategoryRow } from "../repositories/categoriesRepository.js";
import { recategorizeTransactions } from "../services/transactionsService.js";

const categoriesRoutes = new Hono<AppBindings>();

const badRequest = (c: Context<AppBindings>, error: unknown) => {
	return c.json({ error }, 400);
};
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

categoriesRoutes.get("/colors", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const result = Object.fromEntries(
			Object.entries(colors).filter(([key]) => !nonCustomizableColors.includes(key)),
		);

		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch colors" }, 500);
	}
});

categoriesRoutes.put("/", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const bodyResult = saveCategoryBodySchema.safeParse(await c.req.json());
		if (!bodyResult.success) return badRequest(c, z.flattenError(bodyResult.error));

		const category = await saveCategoryRow(bodyResult.data, user.id);
		if (!category) return c.json({ error: "Failed to save category" }, 500);

		return c.json({ ok: true });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch colors" }, 500);
	}
});

categoriesRoutes.delete("/:id", async (c) => {
	try {
		const user = getAuthenticatedUser(c);
		if (!user) return unauthorized(c);

		const paramsResult = categoryIdParamsSchema.safeParse({ id: c.req.param("id") });
		if (!paramsResult.success) return badRequest(c, z.flattenError(paramsResult.error));

		if (!validateCategoriesOwnership([paramsResult.data.id], user.id)) {
			return c.json({ error: "Invalid category ID" }, 400);
		}

		const uncategorizedCategory = await getUserUncategorizedCategory(user.id);
		if (!uncategorizedCategory) throw new Error();

		await recategorizeTransactions(paramsResult.data.id, uncategorizedCategory.id, user.id);

		const category = await deleteCategory(paramsResult.data.id);
		if (!category) return c.json({ error: "Failed to delete category" }, 500);

		return c.json({ ok: true });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to delete category" }, 500);
	}
});

export default categoriesRoutes;

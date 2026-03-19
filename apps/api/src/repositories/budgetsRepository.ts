import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { budgets } from "../db/schema/budgetsSchema.js";

export const getBudgetRows = async (userId: string) => {
	return db
		.select({
			categoryId: budgets.categoryId,
			limit: budgets.limit,
			userId: budgets.userId,
			categoryName: categories.name,
		})
		.from(budgets)
		.innerJoin(categories, eq(budgets.categoryId, categories.id))
		.where(eq(budgets.userId, userId));
};

export const replaceBudgetRows = async (userId: string, replacements: { categoryId: number; limit: string }[]) => {
	return db.transaction(async (tx) => {
    // Delete all existing budgets for the user
		await tx.delete(budgets).where(eq(budgets.userId, userId)).returning();

    // Only insert budgets where there is a limt provided
		if (replacements.length > 0) {
			await tx
				.insert(budgets)
				.values(replacements.map((budget) => ({ ...budget, userId })));
		}
	});
};

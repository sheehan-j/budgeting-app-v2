import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { colors } from "../constants/colors.js";
import type { RawCategory, Category, CategoryCreateInput } from "../types/categoriesTypes.js";

export const getCategoriesRows = async (userId: string) => {
	const rawCategories: RawCategory[] = await db
		.select({ id: categories.id, name: categories.name, color: categories.color })
		.from(categories)
		.where(eq(categories.userId, userId));

	return rawCategories.map((category) => {
		return {
			...category,
			...colors[category.color],
		};
	}) as Category[];
};

export const createCategoriesRows = async (newCategories: CategoryCreateInput[]) => {
	return db.insert(categories).values(newCategories).returning();
};

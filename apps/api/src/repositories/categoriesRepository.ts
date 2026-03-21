import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { MAX_CATEGORY_COUNT, nonCustomizableCategories } from "../constants/categories.js";
import { colors } from "../constants/colors.js";
import type { RawCategory, Category, CategoryInput } from "../types/categoriesTypes.js";

export const getCategoriesRows = async (userId: string) => {
	const rawCategories: RawCategory[] = await db
		.select({ id: categories.id, name: categories.name, color: categories.color })
		.from(categories)
		.where(eq(categories.userId, userId));

	return rawCategories.map((category) => {
		return {
			...category,
			...colors[category.color],
			colorName: category.color,
		};
	}) as Category[];
};

export const saveCategoryRow = async ({ id, name, color }: CategoryInput, userId: string) => {
	return db.transaction(async (tx) => {
		const categoryWithTargetColorResult = await tx
			.select()
			.from(categories)
			.where(and(eq(categories.color, color), eq(categories.userId, userId)));
		const categoryWithTargetColor = categoryWithTargetColorResult[0];

		if (id !== undefined) {
			if (categoryWithTargetColor !== undefined) {
				const categoryBeforeSaveResult = await tx
					.select()
					.from(categories)
					.where(and(eq(categories.id, id), eq(categories.userId, userId)));
				const categoryBeforeSave = categoryBeforeSaveResult[0];
				if (categoryBeforeSave === undefined) throw new Error("No category found at provided ID");

				await tx
					.update(categories)
					.set({ color: categoryBeforeSave.color })
					.where(eq(categories.id, categoryWithTargetColor.id));
			}

			const result = await tx
				.update(categories)
				.set({ name, color })
				.where(and(eq(categories.id, id), eq(categories.userId, userId)))
				.returning();
			return result[0] ?? null;
		}

		// Check if a new category can be created
		const allCategories = await tx.select().from(categories).where(eq(categories.userId, userId));
		if (
			allCategories.filter((category) => !nonCustomizableCategories.includes(category.name)).length >=
			MAX_CATEGORY_COUNT
		) {
			throw new Error("Max category count reached");
		}

		// If a new category is being created and wants the color an existing category already uses, make the existing category use the next available color
		if (categoryWithTargetColor) {
			const nextColorName = Object.entries(colors)[allCategories.length - 1]?.[0];
			const result = await tx
				.update(categories)
				.set({ color: nextColorName })
				.where(and(eq(categories.id, categoryWithTargetColor.id), eq(categories.userId, userId)))
				.returning();
			if (result.length !== 1) throw new Error("Error saving this category");
		}

		const result = await tx.insert(categories).values({ name, color, userId }).returning();
		return result[0] ?? null;
	});
};

export const createCategoriesRows = async (newCategories: CategoryInput[], userId: string) => {
	const values = newCategories.map((category) => {
		return { ...category, userId };
	});
	return db.insert(categories).values(values).returning();
};

export const deleteCategoryRow = async (categoryId: number) => {
	const result = await db.delete(categories).where(eq(categories.id, categoryId)).returning();
	return result[0] ?? null;
};

export const validateCategoriesRowsOwnership = async (categoryIds: number[], userId: string) => {
	const result = await db
		.select()
		.from(categories)
		.where(and(inArray(categories.id, categoryIds), eq(categories.userId, userId)));
	return result.length === categoryIds.length;
};

export const getUserUncategorizedCategoryRow = async (userId: string) => {
	const result = await db
		.select()
		.from(categories)
		.where(and(eq(categories.userId, userId), eq(categories.name, "Uncategorized")));
	return result[0] ?? null;
};

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { colors } from "../constants/colors.js";

type CategoryCreateInput = {
	name: string;
	color: string;
	userId: string;
};

type RawCategory = {
	id: number;
	name: string;
	color: string;
};

type Category = {
	id: number;
	name: string;
	position: number;
	color: string;
	colorLight: string;
	colorDark: string;
};

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

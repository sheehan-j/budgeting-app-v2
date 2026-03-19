import { asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";

export const getCategoriesRows = async () => {
	return db.select().from(categories).orderBy(asc(categories.position));
};

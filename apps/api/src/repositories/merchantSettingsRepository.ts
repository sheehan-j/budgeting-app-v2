import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/categoriesSchema.js";
import { merchants } from "../db/schema/merchantsSchema.js";
import type { MerchantSettingInput } from "../types/merchantSettingsTypes.js";

export const getMerchantSettingsRows = async (userId: string) => {
	return db
		.select({
			merchant: merchants,
			category: categories,
		})
		.from(merchants)
		.innerJoin(categories, eq(merchants.categoryName, categories.name))
    .where(eq(merchants.userId, userId))
		.orderBy(asc(merchants.id));
};

export const saveMerchantSettingRow = async ({ id, text, type, categoryName, userId }: MerchantSettingInput) => {
	if (id !== undefined) {
		const result = await db
			.update(merchants)
			.set({ text, type, categoryName, userId })
			.where(eq(merchants.id, id))
			.returning();

		return result[0] ?? null;
	}

	const result = await db.insert(merchants).values({ text, type, categoryName, userId }).returning();

	return result[0] ?? null;
};

export const deleteMerchantSettingRow = async (id: number) => {
	const result = await db.delete(merchants).where(eq(merchants.id, id)).returning();
	return result[0] ?? null;
};


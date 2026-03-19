import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { merchants } from "../db/schema/merchantsSchema.js";
import type { MerchantSettingInput } from "../types/merchantSettingsTypes.js";
import { getCategoriesRows } from "./categoriesRepository.js";

export const getMerchantSettingsRows = async (userId: string) => {
	const merchantSettings = await db
		.select()
		.from(merchants)
		.where(eq(merchants.userId, userId))
		.orderBy(asc(merchants.id));
	const categories = await getCategoriesRows(userId);

	return merchantSettings.map((merchantSetting) => {
		const matches = categories.filter((category) => category.id === merchantSetting.categoryId);
		if (matches.length !== 1) throw new Error("Merchant setting with dangling category.");

		return {
			id: merchantSetting.id,
      text: merchantSetting.text,
      type: merchantSetting.type,
			category: matches[0],
		};
	});
};

export const saveMerchantSettingRow = async ({ id, text, type, categoryId }: MerchantSettingInput, userId: string) => {
	if (id !== undefined) {
		const result = await db
			.update(merchants)
			.set({ text, type, categoryId })
			.where(and(eq(merchants.id, id), eq(merchants.userId, userId)))
			.returning();

		return result[0] ?? null;
	}

	const result = await db.insert(merchants).values({ text, type, categoryId, userId }).returning();

	return result[0] ?? null;
};

export const deleteMerchantSettingRow = async (id: number, userId: string) => {
	const result = await db
		.delete(merchants)
		.where(and(eq(merchants.id, id), eq(merchants.userId, userId)))
		.returning();
	return result[0] ?? null;
};

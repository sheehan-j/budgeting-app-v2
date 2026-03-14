import {
	getMerchantSettingsRows,
	deleteMerchantSettingRow,
	saveMerchantSettingRow,
} from "../repositories/merchantSettingsRepository.js";
import type { MerchantSettingInput } from "../types/merchantSettingsTypes.js";

type MerchantSettingRow = Awaited<ReturnType<typeof getMerchantSettingsRows>>[number];

const normalizeMerchantSetting = ({ merchant, category }: MerchantSettingRow) => ({
	id: merchant.id,
	text: merchant.text,
	type: merchant.type,
	category,
});

export const getMerchantSettings = async (userId: string) => {
	const rows = await getMerchantSettingsRows(userId);
	return rows.map(normalizeMerchantSetting);
};

export const saveMerchantSetting = async (input: MerchantSettingInput, userId: string) => {
	return saveMerchantSettingRow(input, userId);
};

export const deleteMerchantSetting = async (id: number, userId: string) => {
	return deleteMerchantSettingRow(id, userId);
};


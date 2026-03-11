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
	userId: merchant.userId,
	category,
});

export const getMerchantSettings = async (userId: string) => {
	const rows = await getMerchantSettingsRows(userId);
	return rows.map(normalizeMerchantSetting);
};

export const saveMerchantSetting = async (input: MerchantSettingInput) => {
	return saveMerchantSettingRow(input);
};

export const deleteMerchantSetting = async (id: number) => {
	return deleteMerchantSettingRow(id);
};


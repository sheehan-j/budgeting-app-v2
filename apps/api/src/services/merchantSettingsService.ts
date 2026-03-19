import {
	getMerchantSettingsRows,
	deleteMerchantSettingRow,
	saveMerchantSettingRow,
} from "../repositories/merchantSettingsRepository.js";
import type { MerchantSettingInput } from "../types/merchantSettingsTypes.js";

export const getMerchantSettings = async (userId: string) => {
	return await getMerchantSettingsRows(userId);
};

export const saveMerchantSetting = async (input: MerchantSettingInput, userId: string) => {
	return saveMerchantSettingRow(input, userId);
};

export const deleteMerchantSetting = async (id: number, userId: string) => {
	return deleteMerchantSettingRow(id, userId);
};


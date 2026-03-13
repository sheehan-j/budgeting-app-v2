import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MerchantSetting, upsertMerchantSetting } from "../util/apiQueries";

export const useUpsertMerchantSettingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (merchantSetting: MerchantSetting) => {
			return upsertMerchantSetting(merchantSetting);
		},
		onSuccess: async (success) => {
			if (!success) return;

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["merchantSettings"] }),
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

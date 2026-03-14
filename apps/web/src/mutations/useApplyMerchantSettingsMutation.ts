import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyMerchantSettingsToExistingTransactions } from "../util/apiQueries";

export const useApplyMerchantSettingsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			return applyMerchantSettingsToExistingTransactions();
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

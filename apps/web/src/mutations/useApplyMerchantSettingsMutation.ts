import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyMerchantSettingsToExistingTransactions } from "../util/apiQueries";

export const useApplyMerchantSettingsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (userId: string) => {
			return applyMerchantSettingsToExistingTransactions(userId);
		},
		onSuccess: async (updatedCount) => {
			if (updatedCount === null) return;

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

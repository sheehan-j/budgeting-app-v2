import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMerchantSetting } from "../util/apiQueries";

export const useDeleteMerchantSettingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (merchantSettingId: number) => {
			return deleteMerchantSetting(merchantSettingId);
		},
		onSuccess: async () => {
			await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
        queryClient.invalidateQueries({ queryKey: ["merchantSettings"] }),
      ]);
		},
	});
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completePlaidUpdateMode } from "../util/apiQueries";

type CompletePlaidUpdateModeVariables = {
	itemId: number;
};

export const useCompletePlaidUpdateModeMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ itemId }: CompletePlaidUpdateModeVariables) => {
			return completePlaidUpdateMode(itemId);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["plaidItems"] }),
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAllPlaidItems } from "../util/apiQueries";

export const useSyncAllPlaidItemsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			return syncAllPlaidItems();
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

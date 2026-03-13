import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransactions } from "../util/apiQueries";

export const useDeleteTransactionsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (transactionIds: number[]) => {
			return deleteTransactions(transactionIds);
		},
		onSuccess: async (success) => {
			if (!success) return;

			await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
        queryClient.invalidateQueries({ queryKey: ["merchantSettings"] }),
      ]);
		},
	});
};

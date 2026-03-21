import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recategorizeTransactions } from "../util/apiQueries";

type RecategorizeTransactionsVariables = {
	initialCategoryId: number;
	targetCategoryId: number;
};

export const useRecategorizeTransactionsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ initialCategoryId, targetCategoryId }: RecategorizeTransactionsVariables) => {
			return recategorizeTransactions(initialCategoryId, targetCategoryId);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

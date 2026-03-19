import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTransactionCategories } from "../util/apiQueries";

type UpdateTransactionsCategoryVariables = {
	transactionIds: number[];
	categoryId: number;
};

export const useUpdateTransactionsCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ transactionIds, categoryId }: UpdateTransactionsCategoryVariables) => {
			return setTransactionCategories(transactionIds, categoryId);
		},
		onSuccess: async () => {
			await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
      ]);
		},
	});
};

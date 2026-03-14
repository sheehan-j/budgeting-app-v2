import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTransactionCategories } from "../util/apiQueries";

type UpdateTransactionsCategoryVariables = {
	transactionIds: number[];
	categoryName: string;
};

export const useUpdateTransactionsCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ transactionIds, categoryName }: UpdateTransactionsCategoryVariables) => {
			return setTransactionCategories(transactionIds, categoryName);
		},
		onSuccess: async () => {
			await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
      ]);
		},
	});
};

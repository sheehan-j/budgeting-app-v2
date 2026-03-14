import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTransactionsIgnored } from "../util/apiQueries";

type UpdateTransactionsIgnoredVariables = {
	transactionIds: number[];
	ignored: boolean;
};

export const useUpdateTransactionsIgnoredMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ transactionIds, ignored }: UpdateTransactionsIgnoredVariables) => {
			return setTransactionsIgnored(transactionIds, ignored);
		},
		onSuccess: async () => {
			await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
      ]);
		},
	});
};

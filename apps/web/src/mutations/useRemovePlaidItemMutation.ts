import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removePlaidItem } from "../util/apiQueries";

type RemovePlaidItemVariables = {
	itemId: number;
};

export const useRemovePlaidItemMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ itemId }: RemovePlaidItemVariables) => {
			return removePlaidItem(itemId);
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

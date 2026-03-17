import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangePlaidPublicToken } from "../util/apiQueries";

type ExchangePlaidPublicTokenVariables = {
	publicToken: string;
};

export const useExchangePlaidPublicTokenMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ publicToken }: ExchangePlaidPublicTokenVariables) => {
			return exchangePlaidPublicToken(publicToken);
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

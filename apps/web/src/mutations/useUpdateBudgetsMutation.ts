import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { updateBudget, type CategoryBudget } from "../util/apiQueries";
import { getBudgetsQueryKey } from "../queries/budgetsQueryKey";

type UpdateBudgetsVariables = {
	budgets: CategoryBudget[];
	month: number | string;
	year: number | string;
};

export const useUpdateBudgetsMutation = () => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ budgets, month, year }: UpdateBudgetsVariables) => {
			return updateBudget(budgets, month, year);
		},
		onSuccess: async (updatedBudgets, variables) => {
			if (!userId) return;

			queryClient.setQueryData(
				getBudgetsQueryKey(userId, variables.month, variables.year),
				updatedBudgets,
			);
		},
	});
};

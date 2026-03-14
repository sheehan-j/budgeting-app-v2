import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBudget, type CategoryBudget } from "../util/apiQueries";
import { getBudgetsQueryKey } from "../queries/budgetsQueryKey";

type UpdateBudgetsVariables = {
	budgets: CategoryBudget[];
	userId: string;
	month: number | string;
	year: number | string;
};

export const useUpdateBudgetsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ budgets, userId, month, year }: UpdateBudgetsVariables) => {
			return updateBudget(budgets, userId, month, year);
		},
		onSuccess: async (updatedBudgets, variables) => {
			queryClient.setQueryData(
				getBudgetsQueryKey(variables.userId, variables.month, variables.year),
				updatedBudgets,
			);
		},
	});
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveCategory, CategoryInput, Category } from "../util/apiQueries";

export const useSaveCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: Category) => {
			return saveCategory(input);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["merchantSettings"] }),
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
			]);
		},
	});
};

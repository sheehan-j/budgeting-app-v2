import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "../util/apiQueries";

export const useDeleteCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (categoryId: number) => {
			return deleteCategory(categoryId);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
				queryClient.invalidateQueries({ queryKey: ["merchantSettings"] }),
				queryClient.invalidateQueries({ queryKey: ["categories"] }),
			]);
		},
	});
};

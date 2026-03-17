import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importCapitalOneCsv } from "../util/apiQueries";

export const useImportCapitalOneCsvMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			itemId,
			accountId,
			csvText,
			fileName,
		}: {
			itemId: number;
			accountId: number;
			csvText: string;
			fileName?: string;
		}) => {
			return importCapitalOneCsv(itemId, accountId, csvText, fileName);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

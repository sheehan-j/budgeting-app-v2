import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importAppleCsv } from "../util/apiQueries";

export const useImportAppleCsvMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ csvText, fileName }: { csvText: string; fileName?: string }) => {
			return importAppleCsv(csvText, fileName);
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
				queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
			]);
		},
	});
};

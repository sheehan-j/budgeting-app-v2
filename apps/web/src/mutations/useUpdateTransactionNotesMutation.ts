import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTransactionNotes } from "../util/apiQueries";

type UpdateTransactionNotesVariables = {
	transactionId: number;
	notes: string;
};

export const useUpdateTransactionNotesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ transactionId, notes }: UpdateTransactionNotesVariables) => {
			return setTransactionNotes(transactionId, notes);
		},
		onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["yearlySpending"] }),
      ]);
		},
	});
};

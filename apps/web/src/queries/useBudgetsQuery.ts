import { useQuery } from "@tanstack/react-query";
import { getBudgets } from "../util/apiQueries";
import { getBudgetsQueryKey } from "./budgetsQueryKey";

export const useBudgetsQuery = (
	userId: string | undefined,
	month: number | string,
	year: number | string,
) => {
	return useQuery({
		queryKey: getBudgetsQueryKey(userId, month, year),
		queryFn: () => getBudgets(Number(month), Number(year), userId as string),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 60_000,
	});
};

import { useQuery } from "@tanstack/react-query";
import { getSpending } from "../util/apiQueries";

export const useYearlySpendingQuery = (userId: string | undefined, year: number | string) => {
	return useQuery({
		queryKey: ["yearlySpending", userId, year],
		queryFn: () => getSpending(year, userId),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 60_000,
	});
};

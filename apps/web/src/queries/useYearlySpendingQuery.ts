import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { getSpending } from "../util/apiQueries";

export const useYearlySpendingQuery = (year: number | string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: ["yearlySpending", userId, year],
		queryFn: () => getSpending(year),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 60_000,
	});
};

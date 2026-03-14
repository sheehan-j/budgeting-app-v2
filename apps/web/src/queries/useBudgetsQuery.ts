import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { getBudgets } from "../util/apiQueries";
import { getBudgetsQueryKey } from "./budgetsQueryKey";

export const useBudgetsQuery = (month: number | string, year: number | string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: getBudgetsQueryKey(userId, month, year),
		queryFn: () => getBudgets(Number(month), Number(year)),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 60_000,
	});
};

import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { getDashboardData, type DashboardFilter } from "../util/apiQueries";
import { getDashboardQueryKey } from "./dashboardQueryKey";

// TODO: type filters properly
export const useDashboardQuery = (filters: any[]) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: getDashboardQueryKey(userId, filters),
		queryFn: () => getDashboardData(filters),
		enabled: typeof userId === "string" && userId.length > 0,
		staleTime: 60_000,
    placeholderData: (previousData) => previousData,
	});
};

import { useQuery } from "@tanstack/react-query";
import { getDashboardData, type DashboardFilter } from "../util/apiQueries";
import { getDashboardQueryKey } from "./dashboardQueryKey";

// TODO: type filters properly
export const useDashboardQuery = (userId: string | undefined, filters: any[]) => {
	return useQuery({
		queryKey: getDashboardQueryKey(userId, filters),
		queryFn: () => getDashboardData(userId as string, filters),
		enabled: typeof userId === "string" && userId.length > 0,
		staleTime: 60_000,
    placeholderData: (previousData) => previousData,
	});
};

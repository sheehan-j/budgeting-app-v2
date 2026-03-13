import type { DashboardFilter } from "../util/apiQueries";

// TODO: type filters properly
export const getDashboardQueryKey = (
	userId: string | undefined,
	filters: any[],
) => ["dashboard", userId, filters] as const;

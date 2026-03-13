import { useDataStore } from "../util/dataStore";
import { useDashboardQuery } from "./useDashboardQuery";

// Used in compponents other than the transactions table that want to subscribe to the same dashboard data
export const useCurrentDashboardQuery = () => {
	const filters = useDataStore((state) => state.filters);
	const userId = "b82387f7-9d75-4711-91c9-e7558fff4dc6";

	return useDashboardQuery(userId, filters);
};

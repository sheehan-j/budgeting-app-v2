import { useDataStore } from "../util/dataStore";
import { useDashboardQuery } from "./useDashboardQuery";

// Used in compponents other than the transactions table that want to subscribe to the same dashboard data
export const useCurrentDashboardQuery = () => {
	const filters = useDataStore((state) => state.filters);

	return useDashboardQuery(filters);
};

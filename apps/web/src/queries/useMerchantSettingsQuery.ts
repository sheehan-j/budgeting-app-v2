import { useQuery } from "@tanstack/react-query";
import { getMerchantSettings } from "../util/apiQueries";

export const useMerchantSettingsQuery = () => {
	return useQuery({
		queryKey: ["merchantSettings"],
		queryFn: () => getMerchantSettings(),
		placeholderData: [],
		staleTime: 60_000,
	});
};

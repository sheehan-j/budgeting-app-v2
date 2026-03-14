import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { getMerchantSettings } from "../util/apiQueries";

export const useMerchantSettingsQuery = () => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: ["merchantSettings", userId],
		queryFn: () => getMerchantSettings(),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 60_000,
	});
};

import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";
import { getPlaidItems } from "../util/apiQueries";

export const usePlaidItemsQuery = () => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: ["plaidItems", userId],
		queryFn: () => getPlaidItems(),
		enabled: typeof userId === "string" && userId.length > 0,
		placeholderData: [],
		staleTime: 30_000,
	});
};

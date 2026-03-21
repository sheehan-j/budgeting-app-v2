import { useQuery } from "@tanstack/react-query";
import { getColors } from "../util/apiQueries";

export const useColorsQuery = () => {
	return useQuery({
		queryKey: ["colors"],
		queryFn: getColors,
		placeholderData: {},
		staleTime: 60_000,
	});
};

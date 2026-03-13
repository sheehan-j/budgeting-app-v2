import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../util/apiQueries";

export const useCategoriesQuery = () => {
	return useQuery({
		queryKey: ["categories"],
		queryFn: getCategories,
		placeholderData: [],
		staleTime: 60_000,
	});
};

import { getCategoriesRows } from "../repositories/categoriesRepository.js";

export const getCategories = async (userId: string) => {
	return getCategoriesRows(userId);
};

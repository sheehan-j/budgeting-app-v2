import { getCategoriesRows } from "../repositories/categoriesRepository.js";

export const getCategories = async () => {
	return getCategoriesRows();
};


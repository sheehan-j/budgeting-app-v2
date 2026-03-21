import {
	getCategoriesRows,
	saveCategoryRow,
	deleteCategoryRow,
	validateCategoriesRowsOwnership,
	getUserUncategorizedCategoryRow,
} from "../repositories/categoriesRepository.js";
import { CategoryInput } from "../types/categoriesTypes.js";

export const getCategories = async (userId: string) => {
	return getCategoriesRows(userId);
};

export const saveCategory = async (input: CategoryInput, userId: string) => {
	return saveCategoryRow(input, userId);
};

export const deleteCategory = async (categoryId: number) => {
	return deleteCategoryRow(categoryId);
};

export const validateCategoriesOwnership = async (categoryIds: number[], userId: string) => {
	return validateCategoriesRowsOwnership(categoryIds, userId);
};

export const getUserUncategorizedCategory = async (userId: string) => {
	return getUserUncategorizedCategoryRow(userId);
};

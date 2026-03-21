import z from "zod";
import { colors } from "../constants/colors.js";

export const categoryIdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const saveCategoryBodySchema = z.object({
	id: z.coerce.number().int().positive().optional(),
	name: z.string().trim().max(25, {
		message: "Category name must be 25 characters or fewer",
	}),
	color: z
		.string()
		.trim()
		.refine((value) => Object.keys(colors).includes(value), {
			message: "Unknown color name provided",
		}),
});

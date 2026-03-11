import { daysByMonth } from "./Dates";

const today = new Date();
const currentMonthDays = daysByMonth[today.getMonth() + 1];

export const defaultFilter = {
	type: "Date",
	start: {
		month: today.getMonth() + 1,
		day: 1,
		year: today.getFullYear(),
	},
	end: {
		month: today.getMonth() + 1,
		day: currentMonthDays[currentMonthDays.length - 1],
		year: today.getFullYear(),
	},
};

export const daysTo30 = Array.from({ length: 30 }, (_, index) => index + 1);
export const daysTo31 = Array.from({ length: 31 }, (_, index) => index + 1);
export const daysTo28 = Array.from({ length: 28 }, (_, index) => index + 1);
export const daysByMonth = {
	1: daysTo31,
	2: daysTo28,
	3: daysTo31,
	4: daysTo30,
	5: daysTo31,
	6: daysTo30,
	7: daysTo31,
	8: daysTo31,
	9: daysTo30,
	10: daysTo31,
	11: daysTo30,
	12: daysTo31,
};
export const monthsByNumber = {
	1: "January",
	2: "February",
	3: "March",
	4: "April",
	5: "May",
	6: "June",
	7: "July",
	8: "August",
	9: "September",
	10: "October",
	11: "November",
	12: "December",
	13: "Year",
};

export const abbrevMonthsByNumber = {
	1: "Jan",
	2: "Feb",
	3: "Mar",
	4: "Apr",
	5: "May",
	6: "Jun",
	7: "Jul",
	8: "Aug",
	9: "Sep",
	10: "Oct",
	11: "Nov",
	12: "Dec",
	13: "Year",
};

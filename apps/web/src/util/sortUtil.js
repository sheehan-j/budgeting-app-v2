export const sortTransactions = (transactions, dashboardSortState) => {
	let sortedTransactions = [...transactions];
	sortedTransactions.sort((a, b) => {
		// Set sort column and direction, default to desc date
		const sortColumn = dashboardSortState?.column || "date";
		const sortDirection = dashboardSortState?.direction || "desc";

		let aVal, bVal;
		if (sortColumn === "date") {
			aVal = new Date(a[sortColumn]);
			bVal = new Date(b[sortColumn]);
		} else if (sortColumn == "amount") {
			aVal = parseFloat(a[sortColumn]);
			bVal = parseFloat(b[sortColumn]);
		} else {
			aVal = a[sortColumn];
			bVal = b[sortColumn];
		}

		if (aVal < bVal) {
			return sortDirection === "asc" ? -1 : 1;
		}
		if (aVal > bVal) {
			return sortDirection === "asc" ? 1 : -1;
		}
		return 0;
	});
	return sortedTransactions;
};

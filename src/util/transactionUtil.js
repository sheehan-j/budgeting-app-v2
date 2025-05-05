import { getTransactions } from "./supabaseQueries";

export const parseTransactionsFromCSV = (fileContent, configuration, userId, uploadId) => {
	const transactions = [];

	const rows = fileContent.split("\n");
	if (rows[rows.length - 1] === "") rows.pop();
	if (configuration.headerRows) rows.splice(0, configuration.headerRows);
	rows.forEach((row, rowIndex) => {
		row = row.replace(", ", ",");
		const cells = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

		const newTransaction = {
			userId,
			configurationName: configuration.name,
			categoryName: "Uncategorized",
			tempInsertId: crypto.randomUUID(), // Makes it easier to track which transactions are duplicates
			uploadId,
		};
		cells.forEach((cell, index) => {
			if (cell[0] == '"' && cell[cell.length - 1] == '"') cell = cell.substring(1, cell.length - 1);
			cell = cell.trim();

			if (index + 1 === configuration.chargesColNum || index + 1 === configuration.creditsColNum) {
				if (cell.includes("$")) cell = cell.replace("$", "");
				cell = cell.replace(/,/g, "");

				let coefficient = null;
				if (cell.includes("-")) {
					cell = cell.replace("-", "");
					if (configuration.chargesSymbol === "minus") coefficient = 1.0;
					else if (configuration.creditsSymbol === "minus") coefficient = -1.0;
					else
						throw new Error(
							`Encountered unexpected minus symbol in column ${
								index + 1
							}. Please check your configuration for charges/credits.`
						);
				} else if (cell.includes("+")) {
					cell = cell.replace("+", "");
					if (configuration.chargesSymbol === "plus") coefficient = 1.0;
					else if (configuration.creditsSymbol === "plus") coefficient = -1.0;
					else
						throw new Error(
							`Encountered unexpected plus symbol in column ${
								index + 1
							}. Please check your configuration charges/credits.`
						);
				} else {
					if (configuration.chargesSymbol === "none") coefficient = 1.0;
					else if (configuration.creditsSymbol === "none") coefficient = -1.0;
					else
						throw new Error(
							`Encountered unexpected amount without a symbol in column ${
								index + 1
							}. Please check your configuration for charges/credits.`
						);
				}

				if (coefficient < 0) {
					// If while parsing the merchant cell we determined the category is income, do not overwrite
					if (newTransaction.categoryName !== "Income") {
						newTransaction.categoryName = "Credits/Payments";
					}
				}

				newTransaction.amount = Math.round((parseFloat(cell) * coefficient + Number.EPSILON) * 100) / 100;

				// If this the amount is invalid and this isn't the last row, throw an error (last rows with invalid info are ignored)
				if (!newTransaction.amount && rowIndex < rows.length - 1) {
					throw new Error(
						`No transaction amount found in row ${
							rowIndex + 1
						}. Please check your configuration for charges/credits.`
					);
				}
			} else if (index + 1 === configuration.dateColNum) {
				const date = new Date(cell);
				newTransaction.date = date.toLocaleDateString("en-US");
				newTransaction.month = date.getMonth() + 1;
				newTransaction.year = date.getFullYear();
				newTransaction.day = date.getDate();
			} else if (index + 1 === configuration.merchantColNum) {
				newTransaction.merchant = cell;

				const payrollKeywords = ["payroll", "direct deposit", "salary", "direct dep"];
				if (payrollKeywords.some((keyword) => cell.toLowerCase().includes(keyword))) {
					newTransaction.categoryName = "Income";
				}
				const payrollRegexes = [/\bach\b/gi];
				if (payrollRegexes.some((regex) => regex.test(cell))) {
					newTransaction.categoryName = "Income";
				}
			}
		});
		transactions.push(newTransaction);
	});

	// Remove the last transaction from the list if its invalid in case the CSV was formatted weird
	const transactionCount = transactions.length;
	if (transactionCount > 0 && !transactions[transactionCount - 1].amount) transactions.pop();

	return transactions;
};

export const checkForDuplicateTransactions = async (transactions) => {
	const existingTransactions = await getTransactions();
	const duplicateTransactions = [];
	transactions.forEach((transaction) => {
		if (
			existingTransactions.some(
				(existingTransaction) =>
					existingTransaction.merchant === transaction.merchant &&
					existingTransaction.amount === transaction.amount &&
					existingTransaction.date === transaction.date &&
					existingTransaction.configurationName === transaction.configurationName
			)
		) {
			duplicateTransactions.push({ ...transaction, include: false });
		}
	});

	return duplicateTransactions;
};

export const checkForSavedMerchants = (transactions, merchantSettings) => {
	transactions = transactions.map((transaction) => {
		merchantSettings.forEach((merchantSetting) => {
			if (merchantSetting.type === "contains" && transaction.merchant.includes(merchantSetting.text)) {
				transaction.categoryName = merchantSetting.category.name;
			} else if (merchantSetting.type === "equals" && transaction.merchant === merchantSetting.text) {
				transaction.categoryName = merchantSetting.category.name;
			}
		});
		return transaction;
	});

	return transactions;
};

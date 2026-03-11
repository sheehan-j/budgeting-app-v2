import supabase from "../config/supabaseClient";
import { apiFetch } from "./apiClient";
import { getCategoricalSpending } from "./statsUtil";
import { ignoredCategories } from "../constants/Categories";

const transactionsTableName = import.meta.env.DEV ? "transactions_dev" : "transactions";
const budgetsTableName = import.meta.env.DEV ? "budgets_dev" : "budgets";

export const getTransactions = async () => {
	try {
		const data = await apiFetch("/transactions");

		if (data.length === 100000) {
			alert("Max transaction limit reached.");
		}

		return formatTransactions(data);
	} catch (error) {
		alert("Error retrieving transactions:" + error.message);
		return [];
	}
};

export const getTransactionCount = async () => {
	try {
		const { count } = await apiFetch("/transactions/count");
		return count;
	} catch (error) {
		alert("Could not fetch transaction count");
		return 0;
	}
};

export const getTransactionsByMonth = async (dateObj) => {
	try {
		const params = new URLSearchParams({
			month: String(dateObj.getMonth() + 1),
			year: String(dateObj.getFullYear()),
		});
		const data = await apiFetch(`/transactions?${params.toString()}`);
		return formatTransactions(data);
	} catch (error) {
		alert("Could not fetch dashboard statistics");
		return [];
	}
};

const formatTransactions = (transactions) => {
	transactions = transactions.map((transaction) => {
		transaction.date = new Date(transaction.date).toLocaleDateString("en-US");
		return transaction;
	});

	transactions.sort((a, b) => {
		const dateA = new Date(a.date);
		const dateB = new Date(b.date);

		if (dateA > dateB) return -1;
		else if (dateA < dateB) return 1;
		return a.merchant.localeCompare(b.merchant);
	});

	return transactions;
};

export const insertTransactions = async (transactions) => {
	const { error } = await supabase.from(transactionsTableName).insert(transactions);
	if (error) throw error;
};

export const setTransactionIgnored = async (transactionId, ignored) => {
	try {
		await apiFetch(`/transactions/${transactionId}/ignored`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ignored }),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const setTransactionsIgnored = async (transactions, ignored) => {
	try {
		await apiFetch("/transactions/bulk/ignored", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ids: transactions.map((transaction) => transaction.id),
				ignored,
			}),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const setTransactionCategory = async (transactionId, categoryName) => {
	try {
		await apiFetch(`/transactions/${transactionId}/category`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ categoryName }),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const setTransactionCategories = async (transactions, categoryName) => {
	try {
		await apiFetch("/transactions/bulk/category", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ids: transactions.map((transaction) => transaction.id),
				categoryName,
			}),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const updateTransactionNotes = async (transactionId, notes) => {
	try {
		await apiFetch(`/transactions/${transactionId}/notes`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ notes }),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const deleteTransaction = async (transactionId) => {
	try {
		await apiFetch(`/transactions/${transactionId}`, {
			method: "DELETE",
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const deleteTransactions = async (transactions) => {
	try {
		await apiFetch("/transactions/bulk", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ids: transactions.map((transaction) => transaction.id) }),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const getConfigurations = async () => {
	let { data, error } = await supabase.from("configurations").select("*");
	if (error) {
		alert("Could not fetch configurations");
		return [];
	}

	data.sort((a, b) => a.name.localeCompare(b.name));
	return data;
};

export const getCategories = async () => {
	try {
		const data = await apiFetch("/categories");
		data.sort((a, b) => a.orderIndex - b.orderIndex);
		return data;
	} catch (error) {
		alert("Could not fetch categories");
		return [];
	}
};

export const getSpending = async (year) => {
	let spending = [];
	const yearTotals = { Total: 0 };
	for (let i = 0; i < 12; i++) {
		const transactions = await getTransactionsByMonth(new Date(year, i, 1));
		const categoricalSpending = await getCategoricalSpending(transactions);

		let total = 0;
		Object.keys(categoricalSpending).forEach((categoryName) => {
			if (!ignoredCategories.includes(categoryName)) total += categoricalSpending[categoryName];
			if (!Object.keys(yearTotals).includes(categoryName)) yearTotals[categoryName] = 0;
			yearTotals[categoryName] += categoricalSpending[categoryName];
		});
		categoricalSpending["Total"] = total;
		yearTotals["Total"] += total;

		categoricalSpending["Income"] *= -1;

		spending[i] = categoricalSpending;
	}

	yearTotals["Income"] *= -1;
	spending[12] = yearTotals;

	return spending;
};

export const getBudgets = async (date) => {
	let { data, error } = await supabase.from("categories").select("*, budgets(*)");
	if (error) {
		alert("Could not fetch budgets");
		return [];
	}
	const transactions = await getTransactionsByMonth(date);
	const categoricalSpending = getCategoricalSpending(transactions);

	let totalLimit = 0;
	let totalSpending = 0;
	let budgets = data.map((budget) => {
		const newBudget = { ...budget };
		newBudget.limit = newBudget.budgets.length > 0 ? newBudget.budgets[0].limit : null;
		newBudget.spending = categoricalSpending[newBudget.name] || 0;
		newBudget.percentage = newBudget.limit ? (newBudget.spending / newBudget.limit) * 100 : null;

		if (!ignoredCategories.includes(newBudget.name)) {
			if (newBudget.limit) totalLimit += newBudget.limit;
			totalSpending += newBudget.spending;
		}

		delete newBudget.budgets;
		return newBudget;
	});

	budgets.sort((a, b) => a.orderIndex - b.orderIndex);

	const totalBudget = {
		name: "Total",
		limit: totalLimit > 0 ? totalLimit : null,
		spending: totalSpending,
		percentage: totalLimit > 0 ? (totalSpending / totalLimit) * 100 : null,
		color: "white",
		colorDark: "rgb(226 232 240)",
		colorLight: "rgb(248 250 252)",
	};
	budgets = [totalBudget, ...budgets];

	return budgets;
};

export const updateBudget = async (newBudgets, userId) => {
	const updates = [];
	const deletes = [];

	newBudgets.forEach((budget) => {
		if (budget.name === "Total") return;

		if (budget.limit) {
			updates.push({ categoryName: budget.name, limit: budget.limit, userId });
		} else {
			deletes.push(budget.name);
		}
	});

	if (updates.length > 0) {
		const { error } = await supabase.from(budgetsTableName).upsert(updates);
		if (error) return false;
	}

	if (deletes.length > 0) {
		const { error } = await supabase
			.from(budgetsTableName)
			.delete()
			.in("categoryName", deletes)
			.eq("userId", userId);
		if (error) return false;
	}
	return true;
};

export const getMerchantSettings = async () => {
	try {
		const data = await apiFetch("/merchants");
		data.sort((a, b) => a.id - b.id);
		return data;
	} catch (error) {
		alert("Could not fetch merchant settings");
		return [];
	}
};

export const upsertMerchantSetting = async (merchantSetting) => {
	try {
		await apiFetch("/merchants", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(merchantSetting),
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const deleteMerchantSetting = async (merchantSettingId) => {
	try {
		await apiFetch(`/merchants/${merchantSettingId}`, {
			method: "DELETE",
		});
		return true;
	} catch (error) {
		return false;
	}
};

export const getUploads = async () => {
	try {
		return await apiFetch("/uploads");
	} catch (error) {
		alert("Could not fetch uploads");
		return [];
	}
};

export const createUpload = async (userId, uploadId, files, transactionsUploaded) => {
	try {
		await apiFetch("/uploads", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: uploadId,
				userId,
				files,
				transactionsUploaded,
			}),
		});
	} catch (error) {
		throw Error("Could not upload transactions. Please try again later.");
	}
};

export const deleteUpload = async (uploadId) => {
	try {
		await apiFetch(`/uploads/${uploadId}`, {
			method: "DELETE",
		});
	} catch (error) {
		throw Error(error.message);
	}
};

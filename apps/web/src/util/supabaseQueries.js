import supabase from "../config/supabaseClient";
import { getCategoricalSpending } from "./statsUtil";
import { ignoredCategories } from "../constants/Categories";

const transactionsTableName = import.meta.env.DEV ? "transactions_dev" : "transactions";
const budgetsTableName = import.meta.env.DEV ? "budgets_dev" : "budgets";
const uploadsTableName = import.meta.env.DEV ? "uploads_dev" : "uploads";

export const getTransactions = async () => {
	let { data, error } = await supabase.from(transactionsTableName).select("*");
	if (error) {
		alert("Error retrieving transactions:" + error.message);
		return [];
	}

	if (data.length === 100000) {
		alert("Max transaction limit reached.");
	}

	return formatTransactions(data);
};

export const getTransactionCount = async () => {
	const { count } = await supabase.from(transactionsTableName).select("*", { count: "exact", head: true });
	return count;
};

export const getTransactionsByMonth = async (dateObj) => {
	let { data, error } = await supabase
		.from(transactionsTableName)
		.select("*")
		.eq("month", dateObj.getMonth() + 1)
		.eq("year", dateObj.getFullYear());
	if (error) {
		alert("Could not fetch dashboard statistics");
		return [];
	}

	return formatTransactions(data);
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
	const { error } = await supabase.from(transactionsTableName).update({ ignored }).eq("id", transactionId);
	if (error) return false;
	return true;
};

export const setTransactionsIgnored = async (transactions, ignored) => {
	const payload = transactions.map((t) => {
		return {
			amount: t.amount,
			categoryName: t.categoryName,
			configurationName: t.configurationName,
			date: t.date,
			day: t.day,
			id: t.id,
			ignored,
			merchant: t.merchant,
			month: t.month,
			userId: t.userId,
			year: t.year,
		};
	});
	const { error } = await supabase.from(transactionsTableName).upsert(payload);
	if (error) return false;
	return true;
};

export const setTransactionCategory = async (transactionId, categoryName) => {
	const { error } = await supabase.from(transactionsTableName).update({ categoryName }).eq("id", transactionId);
	if (error) return false;
	return true;
};

export const setTransactionCategories = async (transactions, categoryName) => {
	const payload = transactions.map((t) => {
		return {
			amount: t.amount,
			categoryName,
			configurationName: t.configurationName,
			date: t.date,
			day: t.day,
			id: t.id,
			ignored: t.ignored,
			merchant: t.merchant,
			month: t.month,
			userId: t.userId,
			year: t.year,
		};
	});
	const { error } = await supabase.from(transactionsTableName).upsert(payload);
	if (error) return false;
	return true;
};

export const updateTransactions = async (transactions) => {
	let { error } = await supabase.from(transactionsTableName).upsert(transactions);
	if (error) return false;
	return true;
};

export const deleteTransaction = async (transactionId) => {
	const { error } = await supabase.from(transactionsTableName).delete().eq("id", transactionId);
	if (error) return false;
	return true;
};

export const deleteTransactions = async (transactions) => {
	const transactionIds = transactions.map((transaction) => transaction.id);
	const { error } = await supabase.from(transactionsTableName).delete().in("id", transactionIds);
	if (error) return false;
	return true;
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
	let { data, error } = await supabase.from("categories").select("*");
	if (error) {
		alert("Could not fetch categories");
		return [];
	}

	data.sort((a, b) => a.orderIndex - b.orderIndex);
	return data;
};

export const getSpending = async (year) => {
	let spending = [];
	const yearTotals = { Total: 0 };
	for (let i = 0; i < 12; i++) {
		const transactions = await getTransactionsByMonth(new Date(year, i, 1));
		const categoricalSpending = await getCategoricalSpending(transactions);

		// Compute totals
		let total = 0;
		Object.keys(categoricalSpending).forEach((categoryName) => {
			if (!ignoredCategories.includes(categoryName)) total += categoricalSpending[categoryName];
			if (!Object.keys(yearTotals).includes(categoryName)) yearTotals[categoryName] = 0;
			yearTotals[categoryName] += categoricalSpending[categoryName];
		});
		categoricalSpending["Total"] = total;
		yearTotals["Total"] += total;

		// Flip the sign of income because it is treated as a negative for the normal transactions table
		categoricalSpending["Income"] *= -1;

		spending[i] = categoricalSpending;
	}

	yearTotals["Income"] *= -1; // Flip sign of income because it is normally treated as a negative
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
		// Deconstruct the budget fields if one is returned
		newBudget.limit = newBudget.budgets.length > 0 ? newBudget.budgets[0].limit : null;
		newBudget.spending = categoricalSpending[newBudget.name] || 0;
		newBudget.percentage = newBudget.limit ? (newBudget.spending / newBudget.limit) * 100 : null;

		// Calculate the total limit and spending
		if (!ignoredCategories.includes(newBudget.name)) {
			if (newBudget.limit) totalLimit += newBudget.limit;
			totalSpending += newBudget.spending;
		}

		// Remove the budgets fields after deconstructing
		delete newBudget.budgets;
		return newBudget;
	});

	// Sort the budgets by the orderIndex that is returned as part of the category table
	budgets.sort((a, b) => a.orderIndex - b.orderIndex);

	// Add the "total" to the list
	const totalBudget = {
		name: "Total",
		limit: totalLimit > 0 ? totalLimit : null,
		spending: totalSpending,
		percentage: totalLimit > 0 ? (totalSpending / totalLimit) * 100 : null,
		// color: "rgb(241 245 249)",
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
	let { data, error } = await supabase.from("merchants").select("*, category:categories(*)");
	if (error) {
		alert("Could not fetch merchant settings");
		return [];
	}

	data = data.map((merchantSetting) => {
		delete merchantSetting.categoryName;
		return merchantSetting;
	});

	data.sort((a, b) => a.id - b.id);

	return data;
};

export const upsertMerchantSetting = async (merchantSetting) => {
	const { error } = await supabase.from("merchants").upsert(merchantSetting);
	if (error) return false;
	return true;
};

export const deleteMerchantSetting = async (merchantSettingId) => {
	const { error } = await supabase.from("merchants").delete().eq("id", merchantSettingId);
	if (error) return false;
	return true;
};

export const getUploads = async () => {
	const { data, error } = await supabase.from(uploadsTableName).select("*");
	if (error) {
		alert("Could not fetch uploads");
		return [];
	}
	return data;
};

export const createUpload = async (userId, uploadId, files, transactionsUploaded) => {
	const { error } = await supabase
		.from(uploadsTableName)
		.insert({ id: uploadId, userId, files, transactionsUploaded });
	if (error) throw Error("Could not upload transactions. Please try again later.");
};

// This will CASCADE delete the any transactions that reference this upload
export const deleteUpload = async (uploadId) => {
	const { error } = await supabase.from(uploadsTableName).delete().eq("id", uploadId);
	if (error) throw Error(error.message);
};

export type TransactionFilters = {
	month?: number;
	year?: number;
	limit?: number;
	userId?: string;
};

export type InsertImportedTransactionInput = {
	date: string;
	amount: string;
	merchant: string;
	configurationName: string;
	userId: string;
	categoryId: number;
	month: number;
	day: number;
	year: number;
	plaidItemId: number | null;
	plaidAccountId: number | null;
	plaidTransactionId?: string | null;
	rawMerchantName: string | null;
	authorizedDate: string | null;
	isoCurrencyCode: string | null;
	pending: boolean;
	removedAt: null;
};

export type ImportCapitalOneCsvInput = {
	itemId: number;
	accountId: number;
	csvText: string;
	fileName?: string;
};

export type ImportAppleCsvInput = {
	csvText: string;
	fileName?: string;
};

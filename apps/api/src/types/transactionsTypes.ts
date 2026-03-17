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
	categoryName: string;
	month: number;
	day: number;
	year: number;
	plaidItemId: number;
	plaidAccountId: number;
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


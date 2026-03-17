export type PlaidAccountInput = {
	plaidAccountId: string;
	name: string;
	mask: string | null;
	type: string;
	subtype: string | null;
};

export type SavePlaidItemInput = {
	plaidItemId: string;
	accessToken: string;
	institutionId: string | null;
	institutionName: string | null;
	status?: string;
	accounts: PlaidAccountInput[];
};

export type SavePlaidItemRowInput = Omit<SavePlaidItemInput, "accessToken"> & {
	accessTokenEncrypted: string;
};

export type UpdatePlaidItemSyncInput = {
	cursor: string | null;
	lastSyncedAt?: Date;
	status?: string;
};

export type UpsertPlaidTransactionInput = {
	date: string;
	amount: string;
	merchant: string;
	configurationName: string;
	userId: string;
	categoryName: string;
	month: number;
	day: number;
	year: number;
	plaidTransactionId: string;
	plaidItemId: number;
	plaidAccountId: number;
	rawMerchantName: string | null;
	authorizedDate: string | null;
	isoCurrencyCode: string | null;
	pending: boolean;
	removedAt: null;
};

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

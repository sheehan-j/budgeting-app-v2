import {
	deletePlaidItemRow,
	getPlaidItemAccessTokenRows,
	getPlaidItemRowByPlaidItemId,
	getPlaidItemRows,
	savePlaidItemWithAccountsRow,
	updatePlaidItemSyncRow,
} from "../repositories/plaidRepository.js";
import {
	markPlaidTransactionsRemovedRows,
	upsertPlaidTransactionsRows,
} from "../repositories/transactionsRepository.js";
import {
	decryptPlaidAccessToken,
	encryptPlaidAccessToken,
} from "../lib/plaidAccessTokenCrypto.js";
import {
	getPlaidClientName,
	getPlaidCountryCodes,
	getPlaidProducts,
	getPlaidRedirectUri,
	getPlaidTransactionsDaysRequested,
	plaidClient,
} from "../lib/plaid.js";
import { getMerchantSettings } from "./merchantSettingsService.js";
import type {
	SavePlaidItemInput,
	UpdatePlaidItemSyncInput,
	UpsertPlaidTransactionInput,
} from "../types/plaidTypes.js";

type PlaidItemRow = Awaited<ReturnType<typeof getPlaidItemRows>>[number];

// Helpers
const normalizePlaidItem = (rows: PlaidItemRow[]) => {
	const item = rows[0]?.item;
	if (!item) return null;

	return {
		id: item.id,
		userId: item.userId,
		plaidItemId: item.plaidItemId,
		institutionId: item.institutionId,
		institutionName: item.institutionName,
		cursor: item.cursor,
		status: item.status,
		lastSyncedAt: item.lastSyncedAt,
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		accounts: rows.flatMap((row) =>
			row.account
				? [
						{
							id: row.account.id,
							plaidAccountId: row.account.plaidAccountId,
							name: row.account.name,
							mask: row.account.mask,
							type: row.account.type,
							subtype: row.account.subtype,
							isActive: row.account.isActive,
							createdAt: row.account.createdAt,
							updatedAt: row.account.updatedAt,
						},
					]
				: [],
		),
	};
};

const groupPlaidItemRows = (rows: PlaidItemRow[]) => {
	const rowsByItemId = new Map<number, PlaidItemRow[]>();

	for (const row of rows) {
		const itemRows = rowsByItemId.get(row.item.id) ?? [];
		itemRows.push(row);
		rowsByItemId.set(row.item.id, itemRows);
	}

	return Array.from(rowsByItemId.values())
		.map(normalizePlaidItem)
		.filter((item): item is NonNullable<typeof item> => item !== null);
};

type NormalizedPlaidItem = NonNullable<ReturnType<typeof normalizePlaidItem>>;

const getCategoryNameForMerchant = (
	merchant: string,
	merchantSettings: Awaited<ReturnType<typeof getMerchantSettings>>,
) => {
	let categoryName = "Uncategorized";

	for (const merchantSetting of merchantSettings) {
		if (merchantSetting.type === "contains" && merchant.includes(merchantSetting.text)) {
			categoryName = merchantSetting.category.name;
		} else if (merchantSetting.type === "equals" && merchant === merchantSetting.text) {
			categoryName = merchantSetting.category.name;
		}
	}

	return categoryName;
};

const getDateParts = (date: string) => {
	const [year, month, day] = date.split("-").map((value) => Number(value));

	if (!year || !month || !day) {
		throw new Error(`Invalid Plaid transaction date: ${date}`);
	}

	return { year, month, day };
};

// Getters/setters for Plaid items
export const getPlaidItems = async (userId: string) => {
	const rows = await getPlaidItemRows(userId);
	return groupPlaidItemRows(rows);
};

export const savePlaidItem = async (input: SavePlaidItemInput, userId: string) => {
	const rows = await savePlaidItemWithAccountsRow(
		{
			...input,
			accessTokenEncrypted: encryptPlaidAccessToken(input.accessToken),
		},
		userId,
	);

	return normalizePlaidItem(rows);
};

// Getters for Plaid item access tokens
const getPlaidItemById = async (id: number, userId: string) => {
	const items = await getPlaidItems(userId);
	return items.find((item) => item.id === id) ?? null;
};

const getPlaidItemAccessTokenById = async (id: number, userId: string) => {
	const rows = await getPlaidItemAccessTokenRows(userId);
	const item = rows.find((row) => row.id === id);
	if (!item) return null;

	return {
		...item,
		accessToken: decryptPlaidAccessToken(item.accessTokenEncrypted),
	};
};

export const getPlaidItemAccessTokenByPlaidItemId = async (plaidItemId: string) => {
	const item = await getPlaidItemRowByPlaidItemId(plaidItemId);
	if (!item) return null;

	return {
		...item,
		accessToken: decryptPlaidAccessToken(item.accessTokenEncrypted),
	};
};

const getPlaidItemAccessTokens = async (userId: string) => {
	const rows = await getPlaidItemAccessTokenRows(userId);

	return rows.map((item) => ({
		...item,
		accessToken: decryptPlaidAccessToken(item.accessTokenEncrypted),
	}));
};

const buildPlaidTransactionUpsertInput = (
	transaction: {
		transaction_id: string;
		account_id: string;
		date: string;
		authorized_date?: string | null;
		amount: number;
		merchant_name?: string | null;
		name: string;
		iso_currency_code?: string | null;
		pending?: boolean | null;
	},
	options: {
		userId: string;
		plaidItemId: number;
		plaidAccountId: number;
		configurationName: string;
		categoryName: string;
	},
): UpsertPlaidTransactionInput => {
	const merchant = transaction.merchant_name?.trim() || transaction.name.trim();
	const { year, month, day } = getDateParts(transaction.date);

	return {
		date: transaction.date,
		amount: String(transaction.amount),
		merchant,
		configurationName: options.configurationName,
		userId: options.userId,
		categoryName: options.categoryName,
		month,
		day,
		year,
		plaidTransactionId: transaction.transaction_id,
		plaidItemId: options.plaidItemId,
		plaidAccountId: options.plaidAccountId,
		rawMerchantName: transaction.name ?? null,
		authorizedDate: transaction.authorized_date ?? null,
		isoCurrencyCode: transaction.iso_currency_code ?? null,
		pending: transaction.pending ?? false,
		removedAt: null,
	};
};

// Plaid sync functionality
export const updatePlaidItemSyncState = async (id: number, userId: string, input: UpdatePlaidItemSyncInput) => {
	return updatePlaidItemSyncRow(id, userId, input);
};

// ** Main driver for sync functionality with transactionsSync call to Plaid
const syncPlaidItemTransactionsInternal = async (
	item: NormalizedPlaidItem,
	accessToken: string,
	userId: string,
) => {
	try {
		const merchantSettings = await getMerchantSettings(userId);
		const accountsByPlaidAccountId = new Map(item.accounts.map((account) => [account.plaidAccountId, account]));

		let cursor = item.cursor ?? null;
		let hasMore = true;
		let addedCount = 0;
		let modifiedCount = 0;
		let removedCount = 0;

		// Plaid transactionsSync responds with hasMore field in each response
		while (hasMore) {
			// Provide cursor stored against the plaid item
			const response = await plaidClient.transactionsSync({
				access_token: accessToken,
				cursor: cursor ?? undefined,
				count: 500,
			});

			// Map transactions that have been added or modified since last sync
			// Provide merchant name to category name helper to determine if a saved merchant setting can be applied
			// Build input acceptable by the DB to create transaction record (or update if there an existing match based on Plaid ID)
			const upsertValues = [...response.data.added, ...response.data.modified]
				.map((transaction) => {
					const account = accountsByPlaidAccountId.get(transaction.account_id);
					if (!account) return null;

					const merchant = transaction.merchant_name?.trim() || transaction.name.trim();

					return buildPlaidTransactionUpsertInput(transaction, {
						userId,
						plaidItemId: item.id,
						plaidAccountId: account.id,
						configurationName: account.name,
						categoryName: getCategoryNameForMerchant(merchant, merchantSettings),
					});
				})
				.filter((value): value is UpsertPlaidTransactionInput => value !== null);

			// Upsert new/modified transactions and soft delete transactions that came back as removed from Plaid
			await upsertPlaidTransactionsRows(upsertValues);
			await markPlaidTransactionsRemovedRows(
				response.data.removed.map((transaction) => transaction.transaction_id),
				userId,
			);

			addedCount += response.data.added.length;
			modifiedCount += response.data.modified.length;
			removedCount += response.data.removed.length;
			cursor = response.data.next_cursor;
			hasMore = response.data.has_more;
		}

		await updatePlaidItemSyncState(item.id, userId, {
			cursor,
			lastSyncedAt: new Date(),
			status: "active",
		});

		return {
			itemId: item.id,
			plaidItemId: item.plaidItemId,
			addedCount,
			modifiedCount,
			removedCount,
			cursor,
		};
	} catch (error) {
		await updatePlaidItemSyncState(item.id, userId, {
			cursor: item.cursor,
			lastSyncedAt: new Date(),
			status: "sync_error",
		});
		throw error;
	}
};

export const syncAllPlaidItems = async (userId: string) => {
	const [items, accessTokenRows] = await Promise.all([
		getPlaidItems(userId),
		getPlaidItemAccessTokens(userId),
	]);
	const itemById = new Map(items.map((item) => [item.id, item]));
	const results: Awaited<ReturnType<typeof syncPlaidItemTransactionsInternal>>[] = [];

	for (const accessTokenRow of accessTokenRows) {
		const item = itemById.get(accessTokenRow.id);
		if (!item) continue;

		results.push(await syncPlaidItemTransactionsInternal(item, accessTokenRow.accessToken, userId));
	}

	return results;
};

export const syncPlaidItemByPlaidItemId = async (plaidItemId: string) => {
	const accessTokenRow = await getPlaidItemAccessTokenByPlaidItemId(plaidItemId);
	if (!accessTokenRow) return null;

	const items = await getPlaidItems(accessTokenRow.userId);
	const item = items.find((candidate) => candidate.id === accessTokenRow.id);
	if (!item) {
		throw new Error(`Plaid item ${plaidItemId} was found without matching accounts state`);
	}

	return syncPlaidItemTransactionsInternal(item, accessTokenRow.accessToken, accessTokenRow.userId);
};

// Create/exchanging link token functionality

// Creates temporary token needed by client to begin flow to connect accounts through Plaid
export const createPlaidLinkToken = async (userId: string) => {
	const redirectUri = getPlaidRedirectUri();

	const response = await plaidClient.linkTokenCreate({
		client_name: getPlaidClientName(),
		country_codes: getPlaidCountryCodes(),
		language: "en",
		products: getPlaidProducts(),
		transactions: {
			days_requested: getPlaidTransactionsDaysRequested(),
		},
		user: {
			client_user_id: userId,
		},
		...(process.env.PLAID_WEBHOOK_URL ? { webhook: process.env.PLAID_WEBHOOK_URL } : {}),
		...(redirectUri ? { redirect_uri: redirectUri } : {}),
	});

	return {
		linkToken: response.data.link_token,
		expiration: response.data.expiration,
	};
};

export const createPlaidUpdateLinkToken = async (itemId: number, userId: string) => {
	const accessTokenRow = await getPlaidItemAccessTokenById(itemId, userId);
	if (!accessTokenRow) return null;

	const redirectUri = getPlaidRedirectUri();
	const response = await plaidClient.linkTokenCreate({
		client_name: getPlaidClientName(),
		country_codes: getPlaidCountryCodes(),
		language: "en",
		user: {
			client_user_id: userId,
		},
		access_token: accessTokenRow.accessToken,
		update: {
			account_selection_enabled: true,
		},
		...(process.env.PLAID_WEBHOOK_URL ? { webhook: process.env.PLAID_WEBHOOK_URL } : {}),
		...(redirectUri ? { redirect_uri: redirectUri } : {}),
	});

	return {
		linkToken: response.data.link_token,
		expiration: response.data.expiration,
	};
};

// Upon user connecting to an institution through Plaid flow, Plaid sends a public token to the client, client sends
// public token to this endpoint, and this public token is exchanged for a permanent access token
export const exchangePlaidPublicToken = async (publicToken: string, userId: string) => {
	const exchangeResponse = await plaidClient.itemPublicTokenExchange({
		public_token: publicToken,
	});

	const accessToken = exchangeResponse.data.access_token;
	const plaidItemId = exchangeResponse.data.item_id;

	const [accountsResponse, itemResponse] = await Promise.all([
		plaidClient.accountsGet({ access_token: accessToken }),
		plaidClient.itemGet({ access_token: accessToken }),
	]);

	const institutionId = itemResponse.data.item.institution_id ?? null;
	let institutionName: string | null = null;

	if (institutionId) {
		try {
			const institutionResponse = await plaidClient.institutionsGetById({
				institution_id: institutionId,
				country_codes: getPlaidCountryCodes(),
			});
			institutionName = institutionResponse.data.institution.name ?? null;
		} catch (error) {
			console.warn("Failed to fetch Plaid institution name", error);
		}
	}

	const item = await savePlaidItem(
		{
			plaidItemId,
			accessToken,
			institutionId,
			institutionName,
			accounts: accountsResponse.data.accounts.map((account) => ({
				plaidAccountId: account.account_id,
				name: account.name,
				mask: account.mask ?? null,
				type: account.type,
				subtype: account.subtype ?? null,
			})),
		},
		userId,
	);

	if (!item) {
		throw new Error("Failed to save Plaid item");
	}

	const sync = await syncPlaidItemTransactionsInternal(item, accessToken, userId);

	return { item, sync };
};

export const completePlaidUpdateMode = async (itemId: number, userId: string) => {
	const [existingItem, accessTokenRow] = await Promise.all([
		getPlaidItemById(itemId, userId),
		getPlaidItemAccessTokenById(itemId, userId),
	]);

	if (!existingItem || !accessTokenRow) return null;

	const accessToken = accessTokenRow.accessToken;
	const [accountsResponse, itemResponse] = await Promise.all([
		plaidClient.accountsGet({ access_token: accessToken }),
		plaidClient.itemGet({ access_token: accessToken }),
	]);

	const institutionId = itemResponse.data.item.institution_id ?? null;
	let institutionName: string | null = null;

	if (institutionId) {
		try {
			const institutionResponse = await plaidClient.institutionsGetById({
				institution_id: institutionId,
				country_codes: getPlaidCountryCodes(),
			});
			institutionName = institutionResponse.data.institution.name ?? null;
		} catch (error) {
			console.warn("Failed to fetch Plaid institution name", error);
		}
	}

	const item = await savePlaidItem(
		{
			plaidItemId: existingItem.plaidItemId,
			accessToken,
			institutionId,
			institutionName,
			accounts: accountsResponse.data.accounts.map((account) => ({
				plaidAccountId: account.account_id,
				name: account.name,
				mask: account.mask ?? null,
				type: account.type,
				subtype: account.subtype ?? null,
			})),
		},
		userId,
	);

	if (!item) {
		throw new Error("Failed to refresh Plaid item after update mode");
	}

	const sync = await syncPlaidItemTransactionsInternal(item, accessToken, userId);

	return { item, sync };
};

export const removePlaidItem = async (itemId: number, userId: string) => {
	const [existingItem, accessTokenRow] = await Promise.all([
		getPlaidItemById(itemId, userId),
		getPlaidItemAccessTokenById(itemId, userId),
	]);

	if (!existingItem || !accessTokenRow) return null;

	await plaidClient.itemRemove({
		access_token: accessTokenRow.accessToken,
	});

	await deletePlaidItemRow(itemId, userId);

	return {
		itemId,
		institutionName: existingItem.institutionName,
	};
};

import {
	getPlaidItemRowById,
	getPlaidItemRowByPlaidItemId,
	getPlaidItemRows,
	getPlaidItemRowsById,
	savePlaidItemWithAccountsRow,
	updatePlaidItemSyncRow,
} from "../repositories/plaidRepository.js";
import {
	decryptPlaidAccessToken,
	encryptPlaidAccessToken,
} from "../lib/plaidAccessTokenCrypto.js";
import type { SavePlaidItemInput, UpdatePlaidItemSyncInput } from "../types/plaidTypes.js";

type PlaidItemRow = Awaited<ReturnType<typeof getPlaidItemRows>>[number];

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

export const getPlaidItems = async (userId: string) => {
	const rows = await getPlaidItemRows(userId);
	return groupPlaidItemRows(rows);
};

export const getPlaidItem = async (id: number, userId: string) => {
	const rows = await getPlaidItemRowsById(id, userId);
	return normalizePlaidItem(rows);
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

export const getPlaidItemAccessToken = async (id: number, userId: string) => {
	const item = await getPlaidItemRowById(id, userId);
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

export const updatePlaidItemSyncState = async (
	id: number,
	userId: string,
	input: UpdatePlaidItemSyncInput,
) => {
	return updatePlaidItemSyncRow(id, userId, input);
};

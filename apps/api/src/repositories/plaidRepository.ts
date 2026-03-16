import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { plaidAccounts } from "../db/schema/plaidAccountsSchema.js";
import { plaidItems } from "../db/schema/plaidItemsSchema.js";
import type { SavePlaidItemRowInput, UpdatePlaidItemSyncInput } from "../types/plaidTypes.js";

const getPlaidItemJoinedRowsForUser = async (userId: string, itemId?: number) => {
	const conditions = [eq(plaidItems.userId, userId)];
	if (itemId !== undefined) conditions.push(eq(plaidItems.id, itemId));

	return db
		.select({
			item: plaidItems,
			account: plaidAccounts,
		})
		.from(plaidItems)
		.leftJoin(plaidAccounts, eq(plaidAccounts.plaidItemId, plaidItems.id))
		.where(and(...conditions))
		.orderBy(asc(plaidItems.id), asc(plaidAccounts.id));
};

export const getPlaidItemRows = async (userId: string) => {
	return getPlaidItemJoinedRowsForUser(userId);
};

export const getPlaidItemRowsById = async (id: number, userId: string) => {
	return getPlaidItemJoinedRowsForUser(userId, id);
};

export const getPlaidItemRowById = async (id: number, userId: string) => {
	const result = await db
		.select()
		.from(plaidItems)
		.where(and(eq(plaidItems.id, id), eq(plaidItems.userId, userId)))
		.limit(1);

	return result[0] ?? null;
};

export const getPlaidItemRowByPlaidItemId = async (plaidItemId: string) => {
	const result = await db
		.select()
		.from(plaidItems)
		.where(eq(plaidItems.plaidItemId, plaidItemId))
		.limit(1);

	return result[0] ?? null;
};

export const savePlaidItemWithAccountsRow = async (
	{ plaidItemId, accessTokenEncrypted, institutionId, institutionName, status = "active", accounts }: SavePlaidItemRowInput,
	userId: string,
) => {
	const itemId = await db.transaction(async (tx) => {
		const existingItemResult = await tx
			.select()
			.from(plaidItems)
			.where(and(eq(plaidItems.userId, userId), eq(plaidItems.plaidItemId, plaidItemId)))
			.limit(1);
		const existingItem = existingItemResult[0] ?? null;

		const persistedItem =
			existingItem !== null
				? (
						await tx
							.update(plaidItems)
							.set({
								accessTokenEncrypted,
								institutionId,
								institutionName,
								status,
							})
							.where(eq(plaidItems.id, existingItem.id))
							.returning()
				  )[0]
				: (
						await tx
							.insert(plaidItems)
							.values({
								userId,
								plaidItemId,
								accessTokenEncrypted,
								institutionId,
								institutionName,
								status,
							})
							.returning()
				  )[0];

		if (!persistedItem) {
			throw new Error("Failed to persist Plaid item");
		}

		const existingAccounts = await tx
			.select()
			.from(plaidAccounts)
			.where(eq(plaidAccounts.plaidItemId, persistedItem.id));
		const existingAccountsByPlaidAccountId = new Map(
			existingAccounts.map((account) => [account.plaidAccountId, account]),
		);

		for (const account of accounts) {
			const existingAccount = existingAccountsByPlaidAccountId.get(account.plaidAccountId);

			if (existingAccount) {
				await tx
					.update(plaidAccounts)
					.set({
						name: account.name,
						mask: account.mask,
						type: account.type,
						subtype: account.subtype,
						isActive: true,
					})
					.where(eq(plaidAccounts.id, existingAccount.id));
				continue;
			}

			await tx.insert(plaidAccounts).values({
				plaidItemId: persistedItem.id,
				plaidAccountId: account.plaidAccountId,
				name: account.name,
				mask: account.mask,
				type: account.type,
				subtype: account.subtype,
				isActive: true,
			});
		}

		const nextPlaidAccountIds = accounts.map((account) => account.plaidAccountId);
		const accountsToDeactivate = existingAccounts
			.filter((account) => !nextPlaidAccountIds.includes(account.plaidAccountId))
			.map((account) => account.plaidAccountId);

		if (accountsToDeactivate.length > 0) {
			await tx
				.update(plaidAccounts)
				.set({ isActive: false })
				.where(
					and(
						eq(plaidAccounts.plaidItemId, persistedItem.id),
						inArray(plaidAccounts.plaidAccountId, accountsToDeactivate),
					),
				);
		}

		return persistedItem.id;
	});

	return getPlaidItemRowsById(itemId, userId);
};

export const updatePlaidItemSyncRow = async (
	id: number,
	userId: string,
	{ cursor, lastSyncedAt = new Date(), status }: UpdatePlaidItemSyncInput,
) => {
	const result = await db
		.update(plaidItems)
		.set({
			cursor,
			lastSyncedAt,
			...(status !== undefined ? { status } : {}),
		})
		.where(and(eq(plaidItems.id, id), eq(plaidItems.userId, userId)))
		.returning();

	return result[0] ?? null;
};

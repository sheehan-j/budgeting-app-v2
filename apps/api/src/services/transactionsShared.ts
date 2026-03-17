import { getTransactionsRows } from "../repositories/transactionsRepository.js";
import { decryptTransactionField } from "../lib/transactionFieldCrypto.js";
import type { TransactionFilters } from "../types/transactionsTypes.js";

// ** This service exists so any service can get normalized transactions
// ** Transactions are not normalized at repo layer to keep concerns separate
// ** Normalization is extracted to these shared service instead of in transactionsService to avoid circular deps
// ** go gator

type TransactionRow = Awaited<ReturnType<typeof getTransactionsRows>>[number];

export type NormalizedTransaction = Omit<TransactionRow, "amount"> & {
	amount: number;
};

export const normalizeTransaction = (transaction: TransactionRow): NormalizedTransaction => ({
	...transaction,
	amount: Number(transaction.amount),
	rawMerchantName: transaction.rawMerchantName
		? decryptTransactionField(transaction.rawMerchantName)
		: null,
});

export const normalizeTransactions = (transactions: TransactionRow[]): NormalizedTransaction[] => {
	return transactions.map(normalizeTransaction);
};

export const getNormalizedTransactions = async (
	filters: TransactionFilters = {},
): Promise<NormalizedTransaction[]> => {
	const rows = await getTransactionsRows(filters);
	return normalizeTransactions(rows);
};

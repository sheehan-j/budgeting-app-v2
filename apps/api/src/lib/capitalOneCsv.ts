type ParsedCapitalOneCsvTransaction = {
	date: string;
	amount: string;
	merchant: string;
	rawMerchantName: string;
};

type CapitalOneCsvProfile =
	| {
			type: "credit";
			dateIndex: number;
			descriptionIndex: number;
			amountIndex: number;
			debitIndex: number;
			creditIndex: number;
	  }
	| {
			type: "deposit";
			dateIndex: number;
			descriptionIndex: number;
			amountIndex: number;
			transactionTypeIndex: number;
	  };

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");

const parseCsvRows = (csvText: string) => {
	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentValue = "";
	let inQuotes = false;

	for (let index = 0; index < csvText.length; index += 1) {
		const character = csvText[index];

		if (inQuotes) {
			if (character === '"') {
				if (csvText[index + 1] === '"') {
					currentValue += '"';
					index += 1;
				} else {
					inQuotes = false;
				}
			} else {
				currentValue += character;
			}
			continue;
		}

		if (character === '"') {
			inQuotes = true;
			continue;
		}

		if (character === ",") {
			currentRow.push(currentValue);
			currentValue = "";
			continue;
		}

		if (character === "\n") {
			currentRow.push(currentValue);
			rows.push(currentRow);
			currentRow = [];
			currentValue = "";
			continue;
		}

		if (character === "\r") {
			continue;
		}

		currentValue += character;
	}

	if (currentValue.length > 0 || currentRow.length > 0) {
		currentRow.push(currentValue);
		rows.push(currentRow);
	}

	return rows;
};

const findHeaderIndex = (headers: string[], candidates: string[]) => {
	return candidates
		.map((candidate) => headers.findIndex((header) => header === candidate))
		.find((index) => index !== undefined && index >= 0) ?? -1;
};

const detectCapitalOneCsvProfile = (headers: string[]): CapitalOneCsvProfile => {
	const dateIndex = findHeaderIndex(headers, ["transaction date", "posted date", "date"]);
	const descriptionIndex = findHeaderIndex(headers, ["description", "transaction description", "merchant"]);
	const amountIndex = findHeaderIndex(headers, ["amount", "transaction amount"]);
	const debitIndex = findHeaderIndex(headers, ["debit"]);
	const creditIndex = findHeaderIndex(headers, ["credit"]);
	const transactionTypeIndex = findHeaderIndex(headers, ["transaction type"]);

	if (dateIndex < 0 || descriptionIndex < 0) {
		throw new Error("Unsupported Capital One CSV format. Expected date and description columns.");
	}

	if (transactionTypeIndex >= 0 && amountIndex >= 0) {
		return {
			type: "deposit",
			dateIndex,
			descriptionIndex,
			amountIndex,
			transactionTypeIndex,
		};
	}

	if (amountIndex >= 0 || debitIndex >= 0 || creditIndex >= 0) {
		return {
			type: "credit",
			dateIndex,
			descriptionIndex,
			amountIndex,
			debitIndex,
			creditIndex,
		};
	}

	throw new Error(
		"Unsupported Capital One CSV format. Expected amount columns or transaction type plus transaction amount.",
	);
};

const normalizeAmount = (value: string) => {
	const trimmedValue = value.trim();
	if (!trimmedValue) return null;

	const normalizedValue = trimmedValue
		.replace(/[$,\s]/g, "")
		.replace(/^\((.*)\)$/, "-$1");
	const amount = Number(normalizedValue);

	if (!Number.isFinite(amount)) {
		throw new Error(`Invalid amount value: ${value}`);
	}

	return amount.toFixed(2);
};

const normalizeDate = (value: string) => {
	const trimmedValue = value.trim();
	const slashMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
	const isoMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

	let year: number;
	let month: number;
	let day: number;

	if (slashMatch) {
		const [, monthValue, dayValue, yearValue] = slashMatch;
		month = Number(monthValue);
		day = Number(dayValue);
		year = Number(yearValue.length === 2 ? `20${yearValue}` : yearValue);
	} else if (isoMatch) {
		const [, yearValue, monthValue, dayValue] = isoMatch;
		year = Number(yearValue);
		month = Number(monthValue);
		day = Number(dayValue);
	} else {
		throw new Error(`Invalid date value: ${value}`);
	}

	if (
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		!Number.isInteger(year) ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) {
		throw new Error(`Invalid date value: ${value}`);
	}

	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const parseCapitalOneCsv = (csvText: string): ParsedCapitalOneCsvTransaction[] => {
	const rows = parseCsvRows(csvText);
	if (rows.length < 2) {
		throw new Error("Capital One CSV must include headers and at least one transaction row.");
	}

	const headers = rows[0].map(normalizeHeader);
	const profile = detectCapitalOneCsvProfile(headers);

	return rows.slice(1).flatMap((row, index) => {
		const rowNumber = index + 2;
		const isEmptyRow = row.every((cell) => cell.trim() === "");
		if (isEmptyRow) return [];

		const description = row[profile.descriptionIndex]?.trim();
		if (!description) {
			throw new Error(`Missing description on CSV row ${rowNumber}.`);
		}

		const dateCell = row[profile.dateIndex] ?? "";
		const date = normalizeDate(dateCell);
		let amount: string | null = null;

		if (profile.type === "deposit") {
			const transactionType = (row[profile.transactionTypeIndex] ?? "").trim().toLowerCase();
			const baseAmount = normalizeAmount(row[profile.amountIndex] ?? "");

			if (baseAmount === null) {
				throw new Error(`Missing amount on CSV row ${rowNumber}.`);
			}

			if (transactionType === "debit") {
				amount = baseAmount;
			} else if (transactionType === "credit") {
				amount = (-Number(baseAmount)).toFixed(2);
			} else {
				throw new Error(`Unsupported transaction type on CSV row ${rowNumber}: ${row[profile.transactionTypeIndex]}`);
			}
		} else {
			amount = profile.amountIndex >= 0 ? normalizeAmount(row[profile.amountIndex] ?? "") : null;

			if (amount === null) {
				const debitAmount = profile.debitIndex >= 0 ? normalizeAmount(row[profile.debitIndex] ?? "") : null;
				const creditAmount = profile.creditIndex >= 0 ? normalizeAmount(row[profile.creditIndex] ?? "") : null;

				if (debitAmount !== null && creditAmount !== null) {
					throw new Error(`CSV row ${rowNumber} includes both debit and credit values.`);
				}

				if (debitAmount !== null) {
					amount = debitAmount;
				} else if (creditAmount !== null) {
					amount = (-Number(creditAmount)).toFixed(2);
				}
			}
		}

		if (amount === null) {
			throw new Error(`Missing amount on CSV row ${rowNumber}.`);
		}

		return [
			{
				date,
				amount,
				merchant: description,
				rawMerchantName: description,
			},
		];
	});
};

export type { ParsedCapitalOneCsvTransaction };

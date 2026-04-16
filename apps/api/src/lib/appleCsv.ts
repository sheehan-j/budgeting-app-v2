type ParsedAppleCsvTransaction = {
	date: string;
	amount: string;
	merchant: string;
	rawMerchantName: string;
};

const normalizeHeader = (value: string) =>
	value
		.replace(/^\uFEFF/, "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ");

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
	return (
		candidates
			.map((candidate) => headers.findIndex((header) => header === candidate))
			.find((index) => index !== undefined && index >= 0) ?? -1
	);
};

const normalizeAmount = (value: string) => {
	const trimmedValue = value.trim();
	if (!trimmedValue) return null;

	const normalizedValue = trimmedValue.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
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
		year = Number(yearValue!.length === 2 ? `20${yearValue}` : yearValue);
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

export const parseAppleCsv = (csvText: string): ParsedAppleCsvTransaction[] => {
	const rows = parseCsvRows(csvText);
	if (rows.length < 2) {
		throw new Error("Apple CSV must include headers and at least one transaction row.");
	}

	const headers = rows[0]!.map(normalizeHeader);

	const dateIndex = findHeaderIndex(headers, ["transaction date"]);
	const descriptionIndex = findHeaderIndex(headers, ["description"]);
	const merchantIndex = findHeaderIndex(headers, ["merchant"]);
	const amountIndex = findHeaderIndex(headers, ["amount (usd)", "amount"]);
	const typeIndex = findHeaderIndex(headers, ["type"]);

	if (dateIndex < 0) {
		throw new Error('Unsupported Apple CSV format. Expected "Transaction Date" column.');
	}
	if (merchantIndex < 0 && descriptionIndex < 0) {
		throw new Error('Unsupported Apple CSV format. Expected "Merchant" or "Description" column.');
	}
	if (amountIndex < 0) {
		throw new Error('Unsupported Apple CSV format. Expected "Amount (USD)" column.');
	}

	return rows.slice(1).flatMap((row, index) => {
		const rowNumber = index + 2;
		const isEmptyRow = row.every((cell) => cell.trim() === "");
		if (isEmptyRow) return [];

		if (typeIndex >= 0) {
			const type = (row[typeIndex] ?? "").trim().toLowerCase();
			if (type === "payment") return [];
		}

		const merchantValue = merchantIndex >= 0 ? (row[merchantIndex] ?? "").trim() : "";
		const descriptionValue = descriptionIndex >= 0 ? (row[descriptionIndex] ?? "").trim() : "";

		const merchant = merchantValue || descriptionValue;
		if (!merchant) {
			throw new Error(`Missing merchant on CSV row ${rowNumber}.`);
		}

		const dateCell = row[dateIndex] ?? "";
		const date = normalizeDate(dateCell);

		const amount = normalizeAmount(row[amountIndex] ?? "");
		if (amount === null) {
			throw new Error(`Missing amount on CSV row ${rowNumber}.`);
		}

		return [
			{
				date,
				amount,
				merchant,
				rawMerchantName: descriptionValue || merchantValue,
			},
		];
	});
};

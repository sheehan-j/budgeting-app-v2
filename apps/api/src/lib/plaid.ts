import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from "plaid";

const plaidEnvironmentByName = {
	sandbox: PlaidEnvironments.sandbox,
	development: PlaidEnvironments.development,
	production: PlaidEnvironments.production,
} as const;

const getPlaidEnvironment = () => {
	const envName = (process.env.PLAID_ENV ?? "sandbox").trim().toLowerCase();
	return plaidEnvironmentByName[envName as keyof typeof plaidEnvironmentByName] ?? PlaidEnvironments.sandbox;
};

export const getPlaidProducts = (): Products[] =>
	(process.env.PLAID_PRODUCTS ?? "transactions")
		.split(",")
		.map((product) => product.trim() as Products)
		.filter(Boolean);

export const getPlaidCountryCodes = (): CountryCode[] =>
	(process.env.PLAID_COUNTRY_CODES ?? "US")
		.split(",")
		.map((countryCode) => countryCode.trim().toUpperCase() as CountryCode)
		.filter(Boolean);

export const getPlaidClientName = () => process.env.PLAID_CLIENT_NAME?.trim() || "Budgeting App";

export const getPlaidRedirectUri = () => process.env.PLAID_REDIRECT_URI?.trim() || undefined;

const config = new Configuration({
	basePath: getPlaidEnvironment(),
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
			"PLAID-SECRET": process.env.PLAID_SECRET!,
		},
	},
});

export const plaidClient = new PlaidApi(config);

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const ENCRYPTION_KEY_ENV_NAME = "PLAID_ACCESS_TOKEN_ENCRYPTION_KEY";
const ENCRYPTION_VERSION = "v1";

const getEncryptionKey = () => {
	const encodedKey = process.env[ENCRYPTION_KEY_ENV_NAME];
	if (!encodedKey) {
		throw new Error(`${ENCRYPTION_KEY_ENV_NAME} is required to encrypt Plaid access tokens`);
	}

	const key = Buffer.from(encodedKey, "base64");
	if (key.length !== 32) {
		throw new Error(`${ENCRYPTION_KEY_ENV_NAME} must decode to exactly 32 bytes`);
	}

	return key;
};

export const encryptPlaidAccessToken = (accessToken: string) => {
	if (!accessToken) {
		throw new Error("Access token is required for encryption");
	}

	const iv = randomBytes(IV_LENGTH_BYTES);
	const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
	const ciphertext = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return [
		ENCRYPTION_VERSION,
		iv.toString("base64"),
		authTag.toString("base64"),
		ciphertext.toString("base64"),
	].join(":");
};

export const decryptPlaidAccessToken = (encryptedAccessToken: string) => {
	const [version, ivBase64, authTagBase64, ciphertextBase64] = encryptedAccessToken.split(":");
	if (
		version !== ENCRYPTION_VERSION ||
		!ivBase64 ||
		!authTagBase64 ||
		!ciphertextBase64
	) {
		throw new Error("Encrypted Plaid access token is malformed");
	}

	const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivBase64, "base64"));
	decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

	const plaintext = Buffer.concat([
		decipher.update(Buffer.from(ciphertextBase64, "base64")),
		decipher.final(),
	]);

	return plaintext.toString("utf8");
};

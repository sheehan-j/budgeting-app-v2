import { createAuthClient } from "better-auth/react";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const resolveBaseUrl = (value: string) => {
	const trimmedValue = value.replace(/\/$/, "");

	if (/^https?:\/\//i.test(trimmedValue)) {
		return trimmedValue;
	}

	if (typeof window !== "undefined") {
		return new URL(trimmedValue, window.location.origin).toString().replace(/\/$/, "");
	}

	return trimmedValue;
};

const authBaseUrl = resolveBaseUrl(
	import.meta.env.VITE_AUTH_BASE_URL || `${rawApiBaseUrl.replace(/\/$/, "")}/auth`,
);

export const authClient = createAuthClient({
	baseURL: authBaseUrl,
});

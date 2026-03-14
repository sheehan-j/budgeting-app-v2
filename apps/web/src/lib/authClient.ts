import { createAuthClient } from "better-auth/react";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL || `${rawApiBaseUrl.replace(/\/$/, "")}/auth`;

export const authClient = createAuthClient({
	baseURL: authBaseUrl,
});

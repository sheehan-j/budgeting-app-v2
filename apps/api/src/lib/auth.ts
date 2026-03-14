import { betterAuth } from "better-auth";
import type { Context } from "hono";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:5173"],
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
});

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AppBindings = {
	Variables: {
		user: AuthSession["user"] | null;
		session: AuthSession["session"] | null;
	};
};

export const getAuthSession = (headers: Headers) =>
	auth.api.getSession({
		headers,
	});

export const getAuthenticatedUser = (c: Context<AppBindings>) => c.get("user");

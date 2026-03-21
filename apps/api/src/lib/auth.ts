import { betterAuth } from "better-auth";
import type { Context } from "hono";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { createCategoriesRows } from "../repositories/categoriesRepository.js";
import { defaultCategories } from "../constants/defaultCategories.js";

const signupWhitelist = new Set(
	(process.env.EMAIL_WHITELIST ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean),
);

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:5173"],
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== "/sign-up/email") return;
			if (!(process.env.WHITELIST_ENABLED ?? true)) return;

			const email = ctx.body?.email?.trim().toLowerCase();
			if (!email || !signupWhitelist.has(email)) {
				throw new APIError("FORBIDDEN", {
					message:
						"This email is not whitelisted for signup. Please contact jordansheehan26@gmail.com if you're interested in signing up.",
				});
			}
		}),
	},
	databaseHooks: {
		user: {
			create: {
				// Insert default categories for the user upon creation but before request completes
				async after(user) {
					await createCategoriesRows(defaultCategories, user.id);
				},
			},
		},
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

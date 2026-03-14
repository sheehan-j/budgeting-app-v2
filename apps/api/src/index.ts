import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { startupBanner } from "./startupBanner.js";
import { auth, getAuthSession, type AppBindings } from "./lib/auth.js";
import budgetsRoutes from "./routes/budgetsRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import merchantSettingsRoutes from "./routes/merchantSettingsRoutes.js";
import transactionsRoutes from "./routes/transactionsRoutes.js";

const api = new Hono<AppBindings>();

api.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
	}),
);

api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

api.use("*", async (c, next) => {
	if (c.req.path.startsWith("/api/auth/")) {
		await next();
		return;
	}

	const authSession = await getAuthSession(c.req.raw.headers);
	c.set("user", authSession?.user ?? null);
	c.set("session", authSession?.session ?? null);

	await next();
});

api.route("/health", healthRoutes);
api.route("/transactions", transactionsRoutes);
api.route("/categories", categoriesRoutes);
api.route("/merchants", merchantSettingsRoutes);
api.route("/budgets", budgetsRoutes);
api.route("/dashboard", dashboardRoutes);

const app = new Hono();
app.route("/api", api);

startupBanner.forEach((line) => console.log(line));
const port = Number(process.env.PORT) || 3001;
console.log(`Server running on http://localhost:${port}`);
serve({
	fetch: app.fetch,
	port,
});

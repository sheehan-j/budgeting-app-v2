import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { startupBanner } from "./startupBanner.js";
import budgetsRoutes from "./routes/budgetsRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import merchantSettingsRoutes from "./routes/merchantSettingsRoutes.js";
import transactionsRoutes from "./routes/transactionsRoutes.js";

const app = new Hono();

app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
	}),
);

app.route("/health", healthRoutes);
app.route("/transactions", transactionsRoutes);
app.route("/categories", categoriesRoutes);
app.route("/merchants", merchantSettingsRoutes);
app.route("/budgets", budgetsRoutes);
app.route("/dashboard", dashboardRoutes);

startupBanner.forEach((line) => console.log(line));
const port = Number(process.env.PORT) || 3001;
console.log(`Server running on http://localhost:${port}`);
serve({
	fetch: app.fetch,
	port,
});

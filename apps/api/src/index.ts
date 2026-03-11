import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import healthRoutes from "./routes/health";

const app = new Hono();

app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
	}),
);

app.route("/health", healthRoutes);

const port = Number(process.env.PORT) || 3001;
console.log(`Server running on http://localhost:${port}`);
serve({
	fetch: app.fetch,
	port,
});

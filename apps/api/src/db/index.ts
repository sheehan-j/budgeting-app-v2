import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	connectionTimeoutMillis: 5000,
	idleTimeoutMillis: 30000,
	keepAlive: true,
});

pool.on("error", (error) => {
	console.error("Unexpected Postgres pool error", error);
});


export const db = drizzle(pool, { schema });


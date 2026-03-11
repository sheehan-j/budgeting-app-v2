import { Hono } from "hono";
import { db } from "../db/index.js";

const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({ ok: true });
});

healthRoutes.get("/db", async (c) => {
  try {
    const result = await db.query("SELECT NOW() AS now");
    return c.json({
      ok: true,
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    return c.json({ ok: false, error: "Database connection failed" }, 500);
  }
});

export default healthRoutes;

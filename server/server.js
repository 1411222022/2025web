import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("DB ready");
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, db: false });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { email, phone, name, message } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: "email required" });

    const r = await pool.query(
      `INSERT INTO messages (email, phone, name, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [email, phone || "", name || "", message || ""]
    );

    res.json({ ok: true, id: r.rows[0].id, created_at: r.rows[0].created_at });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// ✅ 你現在用瀏覽器看的就是這個
app.get("/api/messages", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, email, phone, name, message, created_at FROM messages ORDER BY id DESC LIMIT 20"
    );
    res.json({ ok: true, data: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

const port = process.env.PORT || 3000;

initDb()
  .then(() => app.listen(port, () => console.log("API listening on", port)))
  .catch((e) => {
    console.error("DB init failed:", e);
    process.exit(1);
  });
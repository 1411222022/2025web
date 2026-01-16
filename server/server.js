//接收前端送來的資料、寫進PostgreSQL資料庫、能確認資料有存成功
//node.js常用的後端框架，用來快速建立api
import express from "express";
//讓前端網站可以跨網域呼叫api
import cors from "cors";
//postgreSQL的套件，用來連線資料庫、下SQL指令
import pkg from "pg";
const { Pool } = pkg;


//初始化express
const app = express();
//*代表任何網站都能呼叫這個api
app.use(cors({ origin: "*" }));
app.use(express.json());

const pool = new Pool({
  //render會把資料庫連線放在環境變數database_url
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

//initdb啟動時先確認資料表存在
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


//用來確認伺服器有跑，且資料庫也連得上
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, db: false });
  }
});


//前端表單按send時會呼叫這個api
app.post("/api/messages", async (req, res) => {
  try {
    //從前端送來的json取出資料
    const { email, phone, name, message } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: "email required" });

    //values用陣列傳入對應的值
    const r = await pool.query(
      `INSERT INTO messages (email, phone, name, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [email, phone || "", name || "", message || ""]
    );


    //回傳成功結果
    res.json({ ok: true, id: r.rows[0].id, created_at: r.rows[0].created_at });
  } catch (e) {
    //錯誤處理
    console.error(e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});


//用來查看資料庫目前存了哪些訊息
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

//程式啟動流程，先initdb()確保資料表存在，資料庫好了才開放api
initDb()
  .then(() => app.listen(port, () => console.log("API listening on", port)))
  .catch((e) => {
    console.error("DB init failed:", e);
    process.exit(1);
  });
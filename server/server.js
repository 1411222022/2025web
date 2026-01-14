import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/messages", async (req, res) => {
  try {
    const { email, phone, name, message } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: "email required" });

    // 第3步才會真的寫DB；現在先回傳收到的資料
    res.json({ ok: true, note: "received", data: { email, phone, name, message } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API listening on", port));
const express = require("express");
const path = require("path");
const DB = require("nedb-promises");

const app = express();
const PORT = 8090;


const contactDb = DB.create(path.join(__dirname, "Contact.db"));


app.use(express.static(path.join(__dirname, "Public")));



app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "indexx.html"));
});


app.post("/contact", async (req, res) => {
  try {
    const data = {
      email: req.body.email || "",
      phone: req.body.phone || "",
      name: req.body.name || "",
      message: req.body.message || "",
      createdAt: new Date().toISOString()
    };

    await contactDb.insert(data);
    res.json({ ok: true, message: "Saved!", data });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Save failed", error: String(err) });
  }
});


app.get("/contacts", async (req, res) => {
  try {
    const list = await contactDb.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ ok: false, message: "Query failed", error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});

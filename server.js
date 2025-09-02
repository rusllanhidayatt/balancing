// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const { stringify } = require("csv-stringify");

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// === SQLite setup ===
const dbFile = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    nominal REAL,
    keterangan TEXT,
    buktiUrl TEXT,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  // Insert user default
  const defaultUsers = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "fenita", password: "1234", role: "user" },
    { username: "ruslan", password: "1234", role: "user" },
  ];
  defaultUsers.forEach((u) => {
    db.run(
      "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
      [u.username, u.password, u.role]
    );
  });
});

// === Upload bukti ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// === Auth ===
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT id, username, role FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json(row);
    }
  );
});

// === Items ===
app.post("/items", upload.single("file"), (req, res) => {
  const { userId, nominal, keterangan } = req.body;
  const buktiUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const createdAt = new Date().toISOString();

  db.run(
    "INSERT INTO items (userId, nominal, keterangan, buktiUrl, createdAt) VALUES (?, ?, ?, ?, ?)",
    [userId, nominal, keterangan, buktiUrl, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert failed" });
      res.json({
        id: this.lastID,
        userId,
        nominal,
        keterangan,
        buktiUrl,
        createdAt,
      });
    }
  );
});

app.get("/items/:userId", (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  if (role === "admin") {
    db.all("SELECT * FROM items", [], (err, rows) => {
      if (err) return res.status(500).json({ error: "Read failed" });
      res.json(rows);
    });
  } else {
    db.all("SELECT * FROM items WHERE userId=?", [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Read failed" });
      res.json(rows);
    });
  }
});

app.delete("/items/:id", (req, res) => {
  db.run("DELETE FROM items WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: this.changes > 0 });
  });
});

// === Summary ===
app.get("/summary/:userId", (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  let query = "SELECT nominal FROM items";
  let params = [];
  if (role !== "admin") {
    query += " WHERE userId=?";
    params = [userId];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Summary failed" });

    let pemasukan = 0;
    let pengeluaran = 0;

    rows.forEach((r) => {
      if (r.nominal >= 0) pemasukan += r.nominal;
      else pengeluaran += r.nominal;
    });

    res.json({
      pemasukan,
      pengeluaran,
      saldo: pemasukan + pengeluaran,
    });
  });
});

// === Export CSV ===
app.get("/export/:userId", (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  let query = "SELECT * FROM items";
  let params = [];
  if (role !== "admin") {
    query += " WHERE userId=?";
    params = [userId];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Export failed" });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transaksi.csv");

    const stringifier = stringify({ header: true });
    rows.forEach((row) => stringifier.write(row));
    stringifier.end();
    stringifier.pipe(res);
  });
});

// === Root ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// === Start ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

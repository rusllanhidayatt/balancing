// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === SQLite Setup ===
const db = new sqlite3.Database("./data.db");

// Buat tabel jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      nominal REAL,
      keterangan TEXT,
      buktiUrl TEXT,
      createdAt TEXT
    )
  `);

  // Seed user kalau kosong
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO users (username,password,role) VALUES (?,?,?)"
      );
      stmt.run("admin", "1234", "admin");
      stmt.run("fenita", "123", "user");
      stmt.run("ruslan", "123", "user");
      stmt.finalize();
      console.log("✅ Users seeded: admin, fenita, ruslan");
    }
  });
});

// === Auth Login ===
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT id, username, role FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.json({ success: false });

      res.json({ success: true, user: row });
    }
  );
});

// === CRUD Items ===
app.post("/items", (req, res) => {
  const { userId, nominal, keterangan, buktiUrl } = req.body;
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

  const sql =
    role === "admin"
      ? "SELECT SUM(nominal) as total FROM items"
      : "SELECT SUM(nominal) as total FROM items WHERE userId=?";

  db.get(sql, role === "admin" ? [] : [userId], (err, row) => {
    if (err) return res.status(500).json({ error: "Summary failed" });
    res.json({ total: row.total || 0 });
  });
});

// === Serve frontend ===
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Start server ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

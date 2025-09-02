const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const sharp = require("sharp");
const { google } = require("googleapis");
const { Readable } = require("stream");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// === SQLite init ===
const db = new sqlite3.Database("./data.db");
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
    createdAt TEXT
  )`);
});

// === Seed Users (1x insert kalau kosong) ===
db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
  if (row.count === 0) {
    db.run("INSERT INTO users (username,password,role) VALUES (?,?,?)", [
      "admin",
      "admin123",
      "admin",
    ]);
    db.run("INSERT INTO users (username,password,role) VALUES (?,?,?)", [
      "fenita",
      "fenita123",
      "user",
    ]);
    db.run("INSERT INTO users (username,password,role) VALUES (?,?,?)", [
      "ruslan",
      "ruslan123",
      "user",
    ]);
    console.log("✅ Default users inserted");
  }
});

// === Google Drive OAuth (opsional untuk bukti upload) ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const upload = multer({ storage: multer.memoryStorage() });

// === API ===

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT id,username,role FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (row) {
        res.json({ success: true, user: row });
      } else {
        res.json({ success: false });
      }
    }
  );
});

// Tambah item
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

// Get items
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

// Hapus item
app.delete("/items/:id", (req, res) => {
  db.run("DELETE FROM items WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: this.changes > 0 });
  });
});

// Summary
app.get("/summary/:userId", (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  let query =
    role === "admin"
      ? "SELECT * FROM items"
      : "SELECT * FROM items WHERE userId=?";
  let params = role === "admin" ? [] : [userId];

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Summary failed" });

    let income = 0,
      expense = 0;
    rows.forEach((i) => {
      if (i.nominal >= 0) income += i.nominal;
      else expense += Math.abs(i.nominal);
    });
    res.json({ income, expense, balance: income - expense });
  });
});

// Upload ke Google Drive
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const compressed = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileMeta = {
      name: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };
    const media = { mimeType: "image/jpeg", body: Readable.from(compressed) };

    const file = await drive.files.create({
      resource: fileMeta,
      media,
      fields: "id",
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    res.json({
      success: true,
      link: `https://drive.google.com/uc?export=view&id=${file.data.id}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("✅ API Running - buka /index.html");
});

// Start
app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});

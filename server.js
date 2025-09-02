// server.js
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const { google } = require("googleapis");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./data.json";

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === Users fix ===
const USERS = [
  { username: "admin", role: "admin" },
  { username: "fenita", role: "user" },
  { username: "ruslan", role: "user" },
];

// === Google Drive OAuth ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

// === File Upload Middleware ===
const upload = multer({ storage: multer.memoryStorage() });

// === Helper functions for local data.json ===
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]");
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("readData error:", err);
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// === Login API ===
app.post("/login", (req, res) => {
  const { username } = req.body;
  const user = USERS.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: "User tidak terdaftar" });
  res.json({ success: true, user });
});

// === Middleware cek user ===
function getUser(req) {
  const username = req.header("x-username");
  return USERS.find((u) => u.username === username);
}

// === CRUD APIs ===

// CREATE
app.post("/items", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData();
    const { nama, nominal, keterangan, tanggal, photoUrl } = req.body;
    const newItem = {
        id: Date.now(),
        user: user.username,
        nama,
        nominal,
        keterangan,
        tanggal,        // ✅ sekarang tanggal ikut disimpan
        photoUrl,       // ✅ sekalian simpan photoUrl biar konsisten
        createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

// READ ALL
app.get("/items", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData();
    if (user.role === "admin") {
      return res.json(items);
    }
    const ownItems = items.filter((i) => i.user === user.username);
    res.json(ownItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to read items" });
  }
});

// UPDATE
app.put("/items/:id", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let items = readData();
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    if (user.role !== "admin" && items[index].user !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    items[index] = { ...items[index], ...req.body };
    writeData(items);
    res.json(items[index]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE
app.delete("/items/:id", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let items = readData();
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    if (user.role !== "admin" && items[index].user !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const newItems = items.filter((i) => i.id != req.params.id);
    writeData(newItems);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// === Upload bukti pembayaran ke Google Drive ===
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: req.file.originalname.replace(/\.[^/.]+$/, "") + ".jpg",
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "image/jpeg",
      body: Readable.from(compressedBuffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    res.json({
      success: true,
      id: file.data.id,
      link: `https://drive.google.com/uc?export=view&id=${file.data.id}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
const path = require("path");
const multer = require("multer");

// === Local Upload Storage ===
const uploadLocal = multer({ dest: "uploads/" });

// Serve folder uploads biar bisa diakses publik
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === API Upload Local ===
app.post("/upload-local", uploadLocal.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      filename: req.file.originalname,
      url: publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// === Root endpoint ===
app.get("/", (req, res) => {
  res.send("API running! Use /login, /items or /upload");
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

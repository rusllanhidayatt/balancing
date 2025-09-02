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

// === CRUD APIs ===

// CREATE
app.post("/items", (req, res) => {
  try {
    const items = readData();
    const { nama, nominal, keterangan } = req.body;
    const newItem = {
      id: Date.now(),
      nama,
      nominal,
      keterangan,
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
    const items = readData();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to read items" });
  }
});

// READ ONE
app.get("/items/:id", (req, res) => {
  try {
    const items = readData();
    const item = items.find((i) => i.id == req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to read item" });
  }
});

// UPDATE
app.put("/items/:id", (req, res) => {
  try {
    let items = readData();
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

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
    let items = readData();
    const newItems = items.filter((i) => i.id != req.params.id);
    if (items.length === newItems.length)
      return res.status(404).json({ error: "Not found" });

    writeData(newItems);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// === Upload bukti pembayaran ke Google Drive ===
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // compress foto jadi JPEG max 1024px, kualitas 70%
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

    // set permission jadi public
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

// === Root endpoint ===
app.get("/", (req, res) => {
  res.send("API running! Use /items or /upload");
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

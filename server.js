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

app.use(cors());
app.use(bodyParser.json());

// === Google Drive OAuth ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const upload = multer({ storage: multer.memoryStorage() });

// === Helper JSON ===
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// === Middleware cek user dari header ===
function getUser(req) {
  return req.headers["x-username"] || "guest";
}

// === CRUD APIs ===
app.post("/items", (req, res) => {
  try {
    const items = readData();
    const user = getUser(req);
    const { nama, nominal, keterangan, tanggal, photoUrl } = req.body;

    const newItem = {
      id: Date.now(),
      user,
      nama,
      nominal,
      keterangan,
      tanggal: tanggal || new Date().toISOString().split("T")[0],
      photoUrl: photoUrl || null,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

app.get("/items", (req, res) => {
  try {
    const items = readData();
    const user = getUser(req);
    if (user === "admin") return res.json(items);
    res.json(items.filter((i) => i.user === user));
  } catch (err) {
    res.status(500).json({ error: "Failed to read items" });
  }
});

app.get("/items/:id", (req, res) => {
  try {
    const items = readData();
    const user = getUser(req);
    const item = items.find((i) => i.id == req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    if (user !== "admin" && item.user !== user)
      return res.status(403).json({ error: "Forbidden" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to read item" });
  }
});

app.put("/items/:id", (req, res) => {
  try {
    let items = readData();
    const user = getUser(req);
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    if (user !== "admin" && items[index].user !== user)
      return res.status(403).json({ error: "Forbidden" });

    items[index] = { ...items[index], ...req.body };
    writeData(items);
    res.json(items[index]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/items/:id", (req, res) => {
  try {
    let items = readData();
    const user = getUser(req);
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    if (user !== "admin" && items[index].user !== user)
      return res.status(403).json({ error: "Forbidden" });

    items.splice(index, 1);
    writeData(items);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// === Upload ke Google Drive ===
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
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

    const media = { mimeType: "image/jpeg", body: Readable.from(compressedBuffer) };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
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

// === Root ===
app.get("/", (req, res) => {
  res.send("API running! Use /items or /upload");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

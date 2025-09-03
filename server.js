// server.js
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./data.json";

// === Middleware ===
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// === Users ===
const USERS = [
  { username: "admin", role: "admin" },
  { username: "fenita", role: "user" },
  { username: "ruslan", role: "user" },
];

// === Cloudinary Config ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === File Upload Middleware ===
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

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
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("writeData error:", err);
  }
}

// === Login API ===
app.post("/login", (req, res) => {
  const { username } = req.body || {};
  const user = USERS.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: "User tidak terdaftar bilang sana ke Ruslan Kasep!" });
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
    const { nama, nominal, keterangan, tanggal, photoUrl, publicId } = req.body || {};

    // simple validation & normalization
    const parsedNominal = Number(nominal);
    if (!nama || Number.isNaN(parsedNominal)) {
      return res.status(400).json({ error: "Nama & nominal wajib diisi (nominal harus angka)" });
    }

    const newItem = {
      id: Date.now(),
      user: user.username,
      nama: String(nama),
      nominal: parsedNominal,
      keterangan: keterangan ? String(keterangan) : "",
      tanggal: tanggal ? String(tanggal) : new Date().toISOString().split("T")[0],
      photoUrl: photoUrl || null,
      publicId: publicId || null,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// READ ALL dengan sort & search
app.get("/items", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let items = readData();

    // Filter user
    if (user.role !== "admin") {
      items = items.filter((i) => i.user === user.username);
    }

    // Search
    if (req.query.search) {
      const keyword = req.query.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.nama.toLowerCase().includes(keyword) ||
          i.keterangan.toLowerCase().includes(keyword)
      );
    }

    // Sorting
    if (req.query.sort) {
    const field = req.query.sort;
    const order = req.query.order === "desc" ? -1 : 1;

    items.sort((a, b) => {
        if (field === "tanggal") {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return (dateA - dateB) * order;
        }
        if (field === "nominal") {
        return (a.nominal - b.nominal) * order;
        }
        // fallback generic
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
    });
    }

    res.json(items);
  } catch (err) {
    console.error("Read items error:", err);
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

    // optional: validate fields before merging
    items[index] = { ...items[index], ...req.body };
    writeData(items);
    res.json(items[index]);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE
app.delete("/items/:id", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let items = readData();
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    if (user.role !== "admin" && items[index].user !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Hapus dari Cloudinary kalau ada publicId
    if (items[index].publicId) {
      try {
        await cloudinary.uploader.destroy(items[index].publicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    const newItems = items.filter((i) => i.id != req.params.id);
    writeData(newItems);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// === Upload ke Cloudinary ===
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const compressedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "balancing",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ error: "Upload failed" });
        }
        res.json({
          success: true,
          id: result.public_id,
          link: result.secure_url,
        });
      }
    );

    // pipe compressed buffer into cloudinary stream
    Readable.from(compressedBuffer).pipe(stream);
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

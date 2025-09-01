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

    // === whitelist field yang boleh dipakai ===
    const allowedFields = ["nama", "nominal", "keterangan", "tanggal", "photoUrl", "publicId"];
    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    // validasi
    const parsedNominal = Number(data.nominal);
    if (!data.nama || Number.isNaN(parsedNominal)) {
      return res.status(400).json({ error: "Nama & nominal wajib diisi (nominal harus angka)" });
    }

    const newItem = {
      id: Date.now(),
      user: user.username,
      nama: String(data.nama),
      nominal: parsedNominal,
      keterangan: data.keterangan ? String(data.keterangan) : "",
      tanggal: data.tanggal ? String(data.tanggal) : new Date().toISOString().split("T")[0],
      photoUrl: data.photoUrl || null,
      publicId: data.publicId || null,
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

// === GET ITEMS ===
app.get("/items", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let items = readData();

    // Filter user (non-admin cuma lihat datanya sendiri)
    if (user.role !== "admin") {
      items = items.filter(i => i.user === user.username);
    }

    const { search, sort, order, page, limit, range } = req.query;

    // Search
    if (search) {
        const keywords = search.toLowerCase().split(/\s+/); // pisah per spasi
        items = items.filter(i =>
            keywords.every(kw =>
            (i.keterangan || "").toLowerCase().includes(kw) ||
            (String(i.nominal) || "").toLowerCase().includes(kw) ||
            (i.nama || "").toLowerCase().includes(kw) ||
            (i.user || "").toLowerCase().includes(kw) // biar admin bisa search nama user juga
            )
        );
    }

    // Sort
    if (sort) {
      items.sort((a, b) => {
        let valA = a[sort];
        let valB = b[sort];
        if (sort === "tanggal") {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        if (typeof valA === "string") {
          return order === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
        } else {
          return order === "desc" ? (valB - valA) : (valA - valB);
        }
      });
    }

    // === Filter by date range ===
    if (range && range !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize ke 00:00

        items = items.filter((i) => {
            const tgl = new Date(i.tanggal);
            tgl.setHours(0, 0, 0, 0); // normalize biar sama-sama 00:00

            if (range === "today") {
            return tgl.getTime() === today.getTime();
            }

            if (range === "week") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // minggu dimulai dari Minggu
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            return tgl >= startOfWeek && tgl < endOfWeek;
            }

            if (range === "month") {
            return (
                tgl.getMonth() === today.getMonth() &&
                tgl.getFullYear() === today.getFullYear()
            );
            }

            return true;
        });
    }

    // === SUMMARY (sebelum pagination) ===
    const total = items.length;
    const totalNominal = items.reduce((sum, i) => sum + i.nominal, 0);

    let breakdown = null;
    if (user.role === "admin") {
    breakdown = {};
    items.forEach(i => {
        if (!breakdown[i.user]) breakdown[i.user] = { totalItems: 0, totalNominal: 0 };
        breakdown[i.user].totalItems++;
        breakdown[i.user].totalNominal += i.nominal;
    });
    }

    const summary = {
    totalItems: total,
    totalNominal,
    breakdown, // null kalau user biasa
    };

    // === Pagination ===
    let paginated = items;
    if (page && limit) {
      const p = parseInt(page);
      const l = parseInt(limit);
      const start = (p - 1) * l;
      paginated = items.slice(start, start + l);
    }

    res.json({ data: paginated, total, summary });
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

    // === whitelist field yang boleh diupdate ===
    const allowedFields = ["nama", "nominal", "keterangan", "tanggal", "photoUrl", "publicId"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // validasi basic kalau ada nominal
    if (updates.nominal !== undefined) {
      const parsedNominal = Number(updates.nominal);
      if (Number.isNaN(parsedNominal)) {
        return res.status(400).json({ error: "Nominal harus angka" });
      }
      updates.nominal = parsedNominal;
    }

    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
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

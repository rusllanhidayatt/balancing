const express3 = require("express");
const { getUser } = require("../utils/auth");
const { readData, writeData } = require("../utils/fileHelper");
const { cloudinary } = require("../utils/cloudinary");
const path2 = require("path");

const router3 = express3.Router();
const DATA_FILE2 = path2.join(__dirname, "..", "data.json");

// CREATE
router3.post("/", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE2);
    const { nama, nominal, keterangan, tanggal, photoUrl, publicId } = req.body || {};

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
    writeData(items, DATA_FILE2);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// READ ALL
router3.get("/", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE2);
    if (user.role === "admin") return res.json(items);
    const ownItems = items.filter((i) => i.user === user.username);
    res.json(ownItems);
  } catch (err) {
    console.error("Read items error:", err);
    res.status(500).json({ error: "Failed to read items" });
  }
});

// UPDATE
router3.put("/:id", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE2);
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    if (user.role !== "admin" && items[index].user !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    items[index] = { ...items[index], ...req.body };
    writeData(items, DATA_FILE2);
    res.json(items[index]);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE
router3.delete("/:id", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE2);
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    if (user.role !== "admin" && items[index].user !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (items[index].publicId) {
      try { await cloudinary.uploader.destroy(items[index].publicId); } catch (e) { /* ignore */ }
    }

    const next = items.filter((i) => i.id != req.params.id);
    writeData(next, DATA_FILE2);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router3;
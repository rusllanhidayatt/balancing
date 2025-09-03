const express = require("express");
const path = require("path");
const { getUser } = require("../utils/auth");
const { readData, writeData } = require("../utils/fileHelper");
const { cloudinary } = require("../utils/cloudinary");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data.json");

// GET list (semua)
router.get("/", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const items = readData(DATA_FILE);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to read items" });
  }
});

// CREATE
router.post("/", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE);
    const { nama, nominal, keterangan, tanggal, photoUrl = null, publicId = null } = req.body || {};

    if (!nama || !nominal || !keterangan || !tanggal) {
      return res.status(400).json({ error: "Field wajib: nama, nominal, keterangan, tanggal" });
    }

    const id = String(Date.now());
    const item = { id, nama, nominal: Number(nominal), keterangan, tanggal, photoUrl, publicId, createdAt: new Date().toISOString() };
    items.push(item);
    writeData(items, DATA_FILE);

    res.json({ success: true, item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// UPDATE
router.put("/:id", (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE);
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Item not found" });

    const { nominal, keterangan, tanggal, photoUrl, publicId } = req.body || {};
    if (nominal !== undefined) items[idx].nominal = Number(nominal);
    if (keterangan !== undefined) items[idx].keterangan = keterangan;
    if (tanggal !== undefined) items[idx].tanggal = tanggal;
    if (photoUrl !== undefined) items[idx].photoUrl = photoUrl;
    if (publicId !== undefined) items[idx].publicId = publicId;

    writeData(items, DATA_FILE);
    res.json({ success: true, item: items[idx] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const items = readData(DATA_FILE);
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Item not found" });

    const toDel = items[idx];
    if (toDel.publicId) {
      try { await cloudinary.uploader.destroy(toDel.publicId); } catch (e) { /* ignore */ }
    }

    const next = items.filter((i) => i.id !== req.params.id);
    writeData(next, DATA_FILE);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router;

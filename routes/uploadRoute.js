const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const { cloudinary } = require("../utils/cloudinary");
const { getUser } = require("../utils/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const buf = await sharp(req.file.buffer).rotate().jpeg({ quality: 80 }).toBuffer();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "balancing" },
        (err, uploadResult) => (err ? reject(err) : resolve(uploadResult))
      );
      stream.end(buf);
    });

    res.json({ photoUrl: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("upload error:", err);
    res.status(500).json({ error: "Upload gagal" });
  }
});

module.exports = router;

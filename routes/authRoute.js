const express = require("express");
const { USERS } = require("../utils/users");
const router = express.Router();

router.post("/", (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "Username wajib diisi" });

  const user = USERS.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: "User tidak terdaftar" });

  res.json({ success: true, user });
});

module.exports = router;

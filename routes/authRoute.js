const express = require("express");
const { USERS } = require("../utils/users");
const router = express.Router();

router.post("/", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib." });
  }

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  res.json({ success: true, user: { username: user.username, role: user.role } });
});

module.exports = router;

const express = require("express");
const { USERS } = require("../utils/users");
const router = express.Router();

router.post("/", (req, res) => {
  const { username, password } = req.body || {};

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Username atau password salah minta ke Ruslan Kasep!" });
  }

  res.json({ success: true, user: { username: user.username } });
});

module.exports = router;

const express2 = require("express");
const { USERS } = require("../utils/users");
const router2 = express2.Router();


router2.post("/", (req, res) => {
const { username } = req.body || {};
const user = USERS.find((u) => u.username === username);
if (!user) return res.status(401).json({ error: "User tidak terdaftar" });
res.json({ success: true, user });
});


module.exports = router2;
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoute = require("./routes/authRoute");
const itemsRoute = require("./routes/itemsRoute");
const uploadRoute = require("./routes/uploadRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Routes
app.use("/login", authRoute); // POST /login
app.use("/items", itemsRoute); // CRUD items
app.use("/upload", uploadRoute); // POST /upload

// Health / root
app.get("/", (_req, res) => {
res.send("API running! Use /login, /items, /upload, /import");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
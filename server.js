const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoute = require("./routes/authRoute");
const itemsRoute = require("./routes/itemsRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Routes
app.use("/login", authRoute); // POST /login
app.use("/items", itemsRoute); // CRUD items

// Health / root
app.get("/", (_req, res) => {
res.send("API running! Use /login, /items, /import");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
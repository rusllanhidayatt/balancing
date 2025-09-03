const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const authRoute = require("./routes/authRoute");
const itemsRoute = require("./routes/itemsRoute");
const uploadRoute = require("./routes/uploadRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve public for quick testing
app.use(express.static(path.join(__dirname, "public")));

app.use("/login", authRoute);
app.use("/items", itemsRoute);
app.use("/upload", uploadRoute);

app.get("/", (_req, res) => {
  res.send("API running! Endpoints: POST /login, GET/POST/PUT/DELETE /items, POST /upload");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

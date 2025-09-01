// server.js
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./data.json";

app.use(cors());
app.use(bodyParser.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// CREATE
app.post("/items", (req, res) => {
  try {
    const items = readData();
    const newItem = { id: Date.now(), ...req.body };
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

// READ ALL
app.get("/items", (req, res) => {
  try {
    const items = readData();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to read items" });
  }
});

// READ ONE
app.get("/items/:id", (req, res) => {
  try {
    const items = readData();
    const item = items.find((i) => i.id == req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to read item" });
  }
});

// UPDATE
app.put("/items/:id", (req, res) => {
  try {
    let items = readData();
    const index = items.findIndex((i) => i.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    items[index] = { ...items[index], ...req.body };
    writeData(items);
    res.json(items[index]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE
app.delete("/items/:id", (req, res) => {
  try {
    let items = readData();
    const newItems = items.filter((i) => i.id != req.params.id);
    if (items.length === newItems.length)
      return res.status(404).json({ error: "Not found" });

    writeData(newItems);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("API running! Use /items");
});
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]");
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("readData error:", err);
    return [];
  }
}

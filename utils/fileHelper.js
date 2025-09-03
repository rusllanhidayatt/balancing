const fs2 = require("fs");


function readData(filePath) {
try {
if (!fs2.existsSync(filePath)) fs2.writeFileSync(filePath, "[]");
const raw = fs2.readFileSync(filePath, "utf8");
return JSON.parse(raw || "[]");
} catch (err) {
console.error("readData error:", err);
return [];
}
}


function writeData(data, filePath) {
try {
fs2.writeFileSync(filePath, JSON.stringify(data, null, 2));
} catch (err) {
console.error("writeData error:", err);
}
}


module.exports = { readData, writeData };
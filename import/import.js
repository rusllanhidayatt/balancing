// ==============================
// util functions
// ==============================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

function fmtRp(num) {
  if (num == null) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

function applyThemeByTime() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

// ==============================
// import logic
// ==============================
const API_URL = "https://balancing-wop-production.up.railway.app/items";

// standar nama kolom yang kita butuhkan
const FIELD_MAP = {
  nominal: ["nominal", "Nominal", "jumlah", "Jumlah"],
  keterangan: ["keterangan", "Keterangan", "deskripsi", "Deskripsi"],
  tanggal: ["tanggal", "Tanggal", "date", "Date"],
  photoUrl: ["photoUrl", "PhotoUrl", "foto", "Foto"],
  publicId: ["publicId", "PublicId"]
};

function normalizeRecord(record) {
  const findValue = (keys, fallback = null) => {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
        return record[key];
      }
    }
    return fallback;
  };

  return {
    nominal: Number(findValue(FIELD_MAP.nominal, 0)) || 0,
    keterangan: String(findValue(FIELD_MAP.keterangan, "")),
    tanggal: String(findValue(FIELD_MAP.tanggal, new Date().toISOString())).slice(0, 10),
    photoUrl: findValue(FIELD_MAP.photoUrl, null),
    publicId: findValue(FIELD_MAP.publicId, null)
  };
}

async function parseFile(file) {
  if (file.name.endsWith(".csv")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js");
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data),
        error: reject
      });
    });
  } else if (file.name.endsWith(".xlsx")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error("Format tidak didukung, gunakan CSV/XLSX");
  }
}

async function upsertRecord(normalized) {
  try {
    if (normalized.publicId) {
      // coba update kalau sudah ada publicId
      const res = await fetch(`${API_URL}/${normalized.publicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-username": localStorage.getItem("username")
        },
        body: JSON.stringify({
          nama: localStorage.getItem("username"),
          ...normalized
        })
      });

      if (res.ok) return "updated";
    }

    // fallback insert baru
    const resInsert = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": localStorage.getItem("username")
      },
      body: JSON.stringify({
        nama: localStorage.getItem("username"),
        ...normalized
      })
    });
    if (resInsert.ok) return "inserted";
    return "failed";
  } catch {
    return "failed";
  }
}

document.getElementById("btnImport").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) return alert("Pilih file CSV/Excel dulu");

  try {
    const rawRecords = await parseFile(file);
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const r of rawRecords) {
      const normalized = normalizeRecord(r);
      const result = await upsertRecord(normalized);
      if (result === "inserted") inserted++;
      else if (result === "updated") updated++;
      else failed++;
    }

    status.textContent = `✅ Import selesai. Insert: ${inserted}, Update: ${updated}, Gagal: ${failed}`;
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Import gagal: " + err.message;
  }
});

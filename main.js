const API_URL = "https://balancing-wop-production.up.railway.app";
const UPLOAD_ENDPOINT = API_URL + "/upload";
const ITEMS_ENDPOINT = API_URL + "/items";

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loadingOverlay = document.getElementById("loadingOverlay");

let allItems = [];
let currentPage = 1;
const itemsPerPage = 5;

// === HELPERS ===
function showLoader() {
  loadingOverlay.classList.remove("hidden");
}
function hideLoader() {
  loadingOverlay.classList.add("hidden");
}
function fmtRp(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// === LOGIN ===
document
  .getElementById("btnLogin")
  .addEventListener("click", async () => {
    const u = (document.getElementById("userInput").value || "").trim();
    const p = document.getElementById("passInput").value || "";
    if (!u) return alert("Masukkan username");
    if (p !== "fenisayangruslan")
      return alert("Password silahkan minta ke Ruslan Kasep!");

    try {
      showLoader();
      const res = await fetch(API_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login gagal");

      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("role", data.user.role);
      showApp();
    } catch (e) {
      alert(e.message);
    } finally {
      hideLoader();
    }
  });

document.getElementById("btnLogout").addEventListener("click", () => {
  showLoader();
  setTimeout(() => {
    localStorage.clear();
    location.reload();
  }, 600);
});

if (localStorage.getItem("loggedIn")) showApp();

// === THEME AUTO BY TIME ===
(function applyThemeByTime() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
})();

// === APP ===
function showApp() {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
  fetchAndRender();
}

// === FETCH DATA ===
async function fetchAndRender() {
  showLoader();
  const res = await fetch(ITEMS_ENDPOINT, {
    headers: { "x-username": localStorage.getItem("username") },
  });
  if (res.status === 401) return location.reload();
  allItems = await res.json();

  hideLoader();
  applyFiltersAndRender();
}

document
  .getElementById("filterRange")
  .addEventListener("change", applyFiltersAndRender);
document
  .getElementById("searchInput")
  .addEventListener("input", applyFiltersAndRender);
document
  .getElementById("sortSelect")
  .addEventListener("change", applyFiltersAndRender);

function applyFiltersAndRender() {
  const range = document.getElementById("filterRange").value;
  const search = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const sort = document.getElementById("sortSelect").value;

  let items = [...allItems];
  const today = new Date();

  // filter by range
  if (range === "today") {
    const todayStr = today.toISOString().split("T")[0];
    items = items.filter((i) => i.tanggal === todayStr);
  } else if (range === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    items = items.filter((i) => new Date(i.tanggal) >= weekAgo);
  } else if (range === "month") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    items = items.filter((i) => new Date(i.tanggal) >= monthAgo);
  }

  // search
  if (search) {
    items = items.filter(
      (i) =>
        (i.keterangan || "").toLowerCase().includes(search) ||
        String(i.nominal).includes(search)
    );
  }

  // sort
  items.sort((a, b) => {
    if (sort === "date_desc") return new Date(b.tanggal) - new Date(a.tanggal);
    if (sort === "date_asc") return new Date(a.tanggal) - new Date(b.tanggal);
    if (sort === "nominal_desc") return b.nominal - a.nominal;
    if (sort === "nominal_asc") return a.nominal - b.nominal;
    return 0;
  });

  render(items);
}

// === RENDER ===
function render(items) {
  let income = 0,
    expense = 0;
  items.forEach((i) => {
    const n = Number(i.nominal) || 0;
    if (n > 0) income += n;
    else expense += n;
  });
  document.getElementById("totalIncome").textContent = fmtRp(income);
  document.getElementById("totalExpense").textContent = fmtRp(Math.abs(expense));
  document.getElementById("totalBalance").textContent = fmtRp(income + expense);

  // pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = items.slice(start, start + itemsPerPage);

  // render table & cards
  const tbody = document.getElementById("tableBody");
  const card = document.getElementById("cardList");
  tbody.innerHTML = "";
  card.innerHTML = "";

  pageItems.forEach((it) => {
    tbody.innerHTML += `
      <tr class="border-b">
        <td class="p-2 ${it.nominal >= 0 ? "text-green-600" : "text-red-600"}">${fmtRp(it.nominal)}</td>
        <td class="p-2">${escapeHtml(it.keterangan || "-")}</td>
        <td class="p-2">${escapeHtml(it.tanggal || "-")}</td>
        <td class="p-2 text-center">${
          it.photoUrl
            ? `<a href="${it.photoUrl}" target="_blank" class="text-blue-500 underline">Lihat</a>`
            : "-"
        }</td>
        <td class="p-2 text-center"><button onclick="deleteItem(${it.id})" class="text-red-600">Hapus</button></td>
      </tr>`;

    card.innerHTML += `
      <div class="bg-gray-700 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <span>${escapeHtml(it.tanggal || "-")}</span>
          <span class="${
            it.nominal >= 0 ? "text-green-400" : "text-red-400"
          } font-bold">${fmtRp(it.nominal)}</span>
        </div>
        <p class="text-sm mt-2">${escapeHtml(it.keterangan || "-")}</p>
        <div class="flex justify-between mt-3 text-sm">
          ${
            it.photoUrl
              ? `<a href="${it.photoUrl}" target="_blank" class="text-blue-400 underline">Bukti</a>`
              : "-"
          }
          <button onclick="deleteItem(${it.id})" class="text-red-500">Hapus</button>
        </div>
      </div>`;
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  if (totalPages <= 1) return;

  function btn(label, page, active = false, disabled = false) {
    return `<button ${
      disabled ? "disabled" : ""
    } onclick="goPage(${page})" class="${
      active ? "active" : ""
    }">${label}</button>`;
  }

  container.innerHTML += btn("<<", 1, false, currentPage === 1);
  container.innerHTML += btn("<", currentPage - 1, false, currentPage === 1);

  for (let i = 1; i <= totalPages; i++) {
    container.innerHTML += btn(i, i, currentPage === i);
  }

  container.innerHTML += btn(">", currentPage + 1, false, currentPage === totalPages);
  container.innerHTML += btn(">>", totalPages, false, currentPage === totalPages);
}

function goPage(page) {
  currentPage = page;
  applyFiltersAndRender();
}
window.goPage = goPage;

// === NOMINAL FORMAT INPUT ===
const nominalInput = document.getElementById("fieldNominal");
nominalInput.addEventListener("input", (e) => {
  let raw = e.target.value.replace(/\D/g, "");
  if (!raw) {
    e.target.value = "";
    return;
  }
  e.target.value = Number(raw).toLocaleString("id-ID");
});

// === FORM SUBMIT ===
document
  .getElementById("itemForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nominalRaw = nominalInput.value.replace(/\./g, "").replace(/,/g, "");
    const nominal = Number(nominalRaw);
    const keterangan = document
      .getElementById("fieldKeterangan")
      .value.trim();
    const tanggal =
      document.getElementById("fieldTanggal").value ||
      new Date().toISOString().split("T")[0];
    const file = document.getElementById("fileInput").files[0];
    const statusEl = document.getElementById("uploadStatus");
    statusEl.textContent = "";
    if (!nominal) return alert("Nominal wajib diisi");

    let photoUrl = null,
      publicId = null;
    try {
      showLoader();
      if (file) {
        statusEl.textContent = "Uploading...";
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          headers: { "x-username": localStorage.getItem("username") },
          body: fd,
        });
        const j = await up.json();
        if (!up.ok) throw new Error(j.error || "Upload gagal");
        photoUrl = j.link || null;
        publicId = j.id || null;
        statusEl.textContent = "Upload selesai";
      }
      const createRes = await fetch(ITEMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-username": localStorage.getItem("username"),
        },
        body: JSON.stringify({
          nama: localStorage.getItem("username"),
          nominal,
          keterangan,
          tanggal,
          photoUrl,
          publicId,
        }),
      });
      if (!createRes.ok) throw new Error(await createRes.text());
      document.getElementById("itemForm").reset();
      nominalInput.value = "";
      statusEl.textContent = "Transaksi tersimpan";
      setTimeout(() => (statusEl.textContent = ""), 2000);
      fetchAndRender();
    } catch (err) {
      alert("Gagal: " + err.message);
      statusEl.textContent = "";
    } finally {
      hideLoader();
    }
  });

// === DELETE ===
async function deleteItem(id) {
  if (!confirm("Hapus transaksi?")) return;
  await fetch(ITEMS_ENDPOINT + "/" + id, {
    method: "DELETE",
    headers: { "x-username": localStorage.getItem("username") },
  });
  fetchAndRender();
}
window.deleteItem = deleteItem;

// === EXPORT ===
document
  .getElementById("btnExportCSV")
  .addEventListener("click", async () => {
    const res = await fetch(ITEMS_ENDPOINT, {
      headers: { "x-username": localStorage.getItem("username") },
    });
    const data = await res.json();
    if (!data.length) return alert("Data kosong");
    const headers = ["Nominal", "Keterangan", "Tanggal", "PhotoUrl"];
    const rows = data.map((i) => [
      i.nominal,
      i.keterangan,
      i.tanggal,
      i.photoUrl || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keuangan.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

document
  .getElementById("btnExportExcel")
  .addEventListener("click", async () => {
    if (typeof XLSX === "undefined")
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
      );
    const res = await fetch(ITEMS_ENDPOINT, {
      headers: { "x-username": localStorage.getItem("username") },
    });
    const data = await res.json();
    if (!data.length) return alert("Data kosong");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
    XLSX.writeFile(wb, "keuangan.xlsx");
  });

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

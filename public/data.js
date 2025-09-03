const API_URL =
  window.location.hostname.includes("github.io")
    ? "https://balancing-wop-production.up.railway.app"
    : "http://localhost:3000";

async function loadItems() {
  try {
    const res = await fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Gagal ambil data");

    const items = await res.json();
    const list = document.getElementById("dataList");
    list.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "border p-2 flex justify-between items-center";
      li.innerHTML = `
        <span>${item.name}</span>
        <div>
          <button onclick="editItem('${item._id}', '${item.name}')" 
                  class="bg-yellow-500 text-white px-2 py-1 rounded mr-2">
            Edit
          </button>
          <button onclick="deleteItem('${item._id}')" 
                  class="bg-red-500 text-white px-2 py-1 rounded">
            Hapus
          </button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Gagal load data");
  }
}

async function deleteItem(id) {
  if (!confirm("Yakin hapus data ini?")) return;
  try {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Gagal hapus");
    loadItems();
  } catch (err) {
    console.error(err);
    alert("Gagal hapus data");
  }
}

function editItem(id, oldName) {
  const newName = prompt("Edit nama:", oldName);
  if (!newName) return;

  fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ name: newName }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Update gagal");
      loadItems();
    })
    .catch((err) => {
      console.error(err);
      alert("Update error");
    });
}

document.addEventListener("DOMContentLoaded", loadItems);

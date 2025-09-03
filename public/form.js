const API_URL =
  window.location.hostname.includes("github.io")
    ? "https://balancing-wop-production.up.railway.app"
    : "http://localhost:3000";

const form = document.getElementById("itemForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;

    try {
      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Gagal simpan");
      alert("Data tersimpan");
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Gagal simpan data");
    }
  });
}

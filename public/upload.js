const API_URL =
  window.location.hostname.includes("github.io")
    ? "https://balancing-wop-production.up.railway.app"
    : "http://localhost:3000";

const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("fileInput").files[0];
    if (!file) {
      alert("Pilih file dulu");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload gagal");

      const data = await res.json();
      alert("Upload sukses: " + data.url);
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  });
}

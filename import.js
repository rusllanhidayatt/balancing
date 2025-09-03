// Import data via URL param ?import=<encodedData>
(function () {
  const params = new URLSearchParams(window.location.search);
  const data = params.get("import");
  if (!data) return;

  try {
    const decoded = JSON.parse(decodeURIComponent(data));
    if (!Array.isArray(decoded)) return;

    decoded.forEach(async (item) => {
      await fetch("https://balancing-wop-production.up.railway.app/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-username": localStorage.getItem("username") || "imported",
        },
        body: JSON.stringify(item),
      });
    });

    alert("✅ Data berhasil diimport!");
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (err) {
    console.error("Import error:", err);
  }
})();

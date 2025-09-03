const API_URL =
  window.location.hostname.includes("github.io")
    ? "https://balancing-wop-production.up.railway.app"
    : "http://localhost:3000";

function showLogin() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  if (show) {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

// Check auth saat load
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (token) {
    showApp();
  } else {
    showLogin();
  }
});

// LOGIN
const loginBtn = document.getElementById("btnLogin");
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Username dan password wajib diisi");
      return;
    }

    showLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        alert("Login gagal, periksa username/password");
        showLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showApp();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat login");
    } finally {
      showLoading(false);
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById("btnLogout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    showLoading(true);
    setTimeout(() => {
      localStorage.clear();
      showLogin();
      showLoading(false);
    }, 800); // kasih delay biar smooth
  });
}

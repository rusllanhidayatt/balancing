// Auth Guard
const token = localStorage.getItem("token");
const isLoginPage = window.location.pathname.endsWith("login.html");

if (!token && !isLoginPage) {
  window.location.href = "login.html";
}

// Login Button Handler
const loginBtn = document.getElementById("btnLogin");
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        alert("Login gagal");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  });
}

// Logout Button Handler
const logoutBtn = document.getElementById("btnLogout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
}

// Auth Guard
const token = localStorage.getItem("token");
const isLoginPage = window.location.pathname.endsWith("login.html");

if (!token && !isLoginPage) {
  window.location.href = "login.html";
}

// Logout Button Handler
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
}

const API_URL = location.hostname === "localhost" ? "http://localhost:3000" : "https://balancing-wop-production.up.railway.app";

const usernameInput = document.getElementById("userInput");
const passwordInput = document.getElementById("passInput");
const loginBtn = document.getElementById("btnLogin");

function showError(msg) { alert("❌ " + msg); }

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username) return showError("Username tidak valid!");
  if (!password) return showError("Password tidak valid!");

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      return showError(err.error || "Login gagal");
    }

    const data = await res.json();
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("role", data.user.role);

    // UI: sembunyi login, tampilin app
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
  } catch (e) {
    showError(e.message);
  }
}

loginBtn.addEventListener("click", handleLogin);
[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleLogin(); }
  });
});

export function initAuth() {
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
  }
}

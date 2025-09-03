const API_URL = "https://balancing-wop-production.up.railway.app";

const usernameInput = document.getElementById("userInput");
const passwordInput = document.getElementById("passInput");
const loginBtn = document.getElementById("btnLogin");

function showError(msg) {
  alert("❌ " + msg);
}

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username) return showError("Username tidak valid minta ke Ruslan Kasep!");
  if (!password) return showError("Password tidak valid minta ke Ruslan Kasep!");
  if (password !== "fenisayangruslan") return showError("Password salah minta ke Ruslan Kasep!");

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      const err = await res.json();
      return showError(err.error || "Login gagal");
    }

    const data = await res.json();
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("role", data.user.role);

    // Sembunyikan login, tampilkan dashboard
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
  } catch (err) {
    showError("Gagal koneksi ke server");
  }
}

// Klik tombol
loginBtn.addEventListener("click", handleLogin);

// Tekan Enter di input username atau password
[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });
});

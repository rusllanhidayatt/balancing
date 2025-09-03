import { fetchAndRender } from './data.js';

const API_URL = "https://balancing-wop-production.up.railway.app";

export function initAuth() {
  const app = document.getElementById('app');
  const loginScreen = document.getElementById('loginScreen');

  // enter key login
  loginScreen.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btnLogin').click();
    }
  });

  // tombol login
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const u = (document.getElementById('userInput').value || '').trim();
    const p = document.getElementById('passInput').value || '';
    if (!u) return alert('Masukkan username');
    if (p !== 'fenisayangruslan') return alert('Password silahkan minta ke Ruslan Kasep!');

    try {
      const res = await fetch(API_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('role', data.user.role);
      showApp();
    } catch (e) {
      alert(e.message);
    }
  });

  // tombol logout
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });

  // auto-login kalau sudah ada session
  if (localStorage.getItem('loggedIn')) showApp();

  function showApp() {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    fetchAndRender();
  }
}

// === UTILITAS ===

// Escape HTML biar aman
export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

// Format rupiah
export function fmtRp(num) {
  if (!num && num !== 0) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Load script eksternal (buat Excel export)
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Tema otomatis (light/dark) sesuai jam
export function applyThemeByTime() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

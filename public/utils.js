export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

export function fmtRp(num) {
  if (num == null) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

export function applyThemeByTime() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

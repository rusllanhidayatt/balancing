import { escapeHtml, fmtRp } from './utils.js';

const API_URL = location.hostname === "localhost" ? "http://localhost:3000" : "https://balancing-wop-production.up.railway.app";
const ITEMS_ENDPOINT = API_URL + "/items";

let currentPage = 1;
const itemsPerPage = 5;

export function initData() {
  document.getElementById('filterRange').addEventListener('change', fetchAndRender);
  fetchAndRender();
}

export async function fetchAndRender() {
  const res = await fetch(ITEMS_ENDPOINT, {
    headers: { 'x-username': localStorage.getItem('username') }
  });
  const data = await res.json();

  const range = document.getElementById('filterRange').value;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = data.filter(item => {
    const d = new Date(item.tanggal);
    if (range === 'today') return d >= startOfDay;
    if (range === 'week') return d >= startOfWeek;
    if (range === 'month') return d >= startOfMonth;
    return true;
  });

  renderTable(filtered);
}

function renderTable(items) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = items.slice(start, start + itemsPerPage);

  pageItems.forEach((i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-3 py-2">${escapeHtml(i.nama)}</td>
      <td class="px-3 py-2">${fmtRp(i.nominal)}</td>
      <td class="px-3 py-2">${escapeHtml(i.keterangan)}</td>
      <td class="px-3 py-2">${escapeHtml(i.tanggal)}</td>
      <td class="px-3 py-2">${i.photoUrl ? `<img src="${i.photoUrl}" class="w-16 h-16 object-cover rounded cursor-pointer" onclick="openModal('${i.photoUrl}')">` : '-'}</td>
      <td class="px-3 py-2">
        <button class="px-2 py-1 bg-red-600 text-white rounded" data-id="${i.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Yakin hapus?')) return;
      const id = btn.getAttribute('data-id');
      const res = await fetch(`${ITEMS_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: { 'x-username': localStorage.getItem('username') }
      });
      if (!res.ok) return alert('Gagal hapus');
      fetchAndRender();
    });
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.textContent = '‹ Prev';
  prev.disabled = currentPage === 1;
  prev.className = 'px-3 py-1 border rounded mr-2';
  prev.onclick = () => { currentPage--; fetchAndRender(); };

  const next = document.createElement('button');
  next.textContent = 'Next ›';
  next.disabled = currentPage === totalPages;
  next.className = 'px-3 py-1 border rounded ml-2';
  next.onclick = () => { currentPage++; fetchAndRender(); };

  const info = document.createElement('span');
  info.textContent = `Halaman ${currentPage} / ${totalPages}`;
  info.className = 'mx-2';

  container.append(prev, info, next);
}

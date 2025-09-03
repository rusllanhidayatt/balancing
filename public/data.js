import { escapeHtml, fmtRp } from './utils.js';

const API_URL = "https://balancing-wop-production.up.railway.app";
const ITEMS_ENDPOINT = API_URL + "/items";

let currentPage = 1;
const itemsPerPage = 5; // jumlah item per halaman

export function initData() {
  document.getElementById('filterRange').addEventListener('change', fetchAndRender);
}

export async function fetchAndRender() {
  const res = await fetch(ITEMS_ENDPOINT, {
    headers: { 'x-username': localStorage.getItem('username') }
  });
  if (res.status === 401) return location.reload();
  let items = await res.json();

  const range = document.getElementById('filterRange').value;
  const today = new Date();

  if (range === 'today') {
    const todayStr = today.toISOString().split('T')[0];
    items = items.filter(i => i.tanggal === todayStr);
  } else if (range === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    items = items.filter(i => new Date(i.tanggal) >= weekAgo);
  } else if (range === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    items = items.filter(i => new Date(i.tanggal) >= monthAgo);
  }

  render(items);
}

function paginate(items) {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return {
    paginated: items.slice(start, end),
    totalPages
  };
}

function render(items) {
  let income = 0, expense = 0;
  items.forEach(i => {
    const n = Number(i.nominal) || 0;
    if (n > 0) income += n;
    else expense += n;
  });
  document.getElementById('totalIncome').textContent = fmtRp(income);
  document.getElementById('totalExpense').textContent = fmtRp(Math.abs(expense));
  document.getElementById('totalBalance').textContent = fmtRp(income + expense);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  const card = document.getElementById('cardList');
  card.innerHTML = '';

  const { paginated, totalPages } = paginate(items);

  paginated.forEach(it => {
    tbody.innerHTML += `
      <tr class="border-b">
        <td class="p-2 ${it.nominal >= 0 ? 'text-green-600' : 'text-red-600'}">${fmtRp(it.nominal)}</td>
        <td class="p-2">${escapeHtml(it.keterangan || '-')}</td>
        <td class="p-2">${escapeHtml(it.tanggal || '-')}</td>
        <td class="p-2 text-center">
          ${it.photoUrl 
              ? `<img src="${it.photoUrl}" 
                      alt="Bukti" 
                      class="w-16 h-16 object-cover rounded cursor-pointer mx-auto"
                      onclick="openModal('${it.photoUrl}')">`
              : '-'}
        </td>
        <td class="p-2 text-center">
          <button onclick="deleteItem(${it.id})" class="text-red-600">Hapus</button>
        </td>
      </tr>`;
    card.innerHTML += `
      <div class="bg-gray-700 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <span>${escapeHtml(it.tanggal || '-')}</span>
          <span class="${it.nominal >= 0 ? 'text-green-400' : 'text-red-400'} font-bold">${fmtRp(it.nominal)}</span>
        </div>
        <p class="text-sm mt-2">${escapeHtml(it.keterangan || '-')}</p>
        <div class="flex justify-between mt-3 text-sm items-center">
          ${it.photoUrl 
              ? `<img src="${it.photoUrl}" 
                      alt="Bukti" 
                      class="w-20 h-20 object-cover rounded cursor-pointer"
                      onclick="openModal('${it.photoUrl}')">`
              : '-'}
          <button onclick="deleteItem(${it.id})" class="text-red-500">Hapus</button>
        </div>
      </div>`;
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';

  if (totalPages <= 1) return;

  let html = `<button ${currentPage===1?'disabled':''} onclick="changePage(${currentPage-1})" class="px-2">Prev</button>`;
  for (let i=1; i<=totalPages; i++) {
    html += `<button onclick="changePage(${i})" class="px-2 ${i===currentPage?'font-bold underline':''}">${i}</button>`;
  }
  html += `<button ${currentPage===totalPages?'disabled':''} onclick="changePage(${currentPage+1})" class="px-2">Next</button>`;

  container.innerHTML = html;
}

function changePage(p) {
  currentPage = p;
  fetchAndRender();
}
window.changePage = changePage;

// Hapus item
async function deleteItem(id) {
  if (!confirm('Hapus transaksi?')) return;
  await fetch(ITEMS_ENDPOINT + '/' + id, {
    method: 'DELETE',
    headers: { 'x-username': localStorage.getItem('username') }
  });
  fetchAndRender();
}
window.deleteItem = deleteItem;

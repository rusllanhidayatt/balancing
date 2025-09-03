import { loadScript } from './utils.js';

const API_URL = "https://balancing-wop-production.up.railway.app";
const ITEMS_ENDPOINT = API_URL + "/items";

export function initExport() {
  // Export CSV
  document.getElementById('btnExportCSV').addEventListener('click', async () => {
    const res = await fetch(ITEMS_ENDPOINT, {
      headers: { 'x-username': localStorage.getItem('username') }
    });
    const data = await res.json();
    if (!data.length) return alert('Data kosong');
    const headers = ['Nominal','Keterangan','Tanggal','PhotoUrl'];
    const rows = data.map(i => [i.nominal,i.keterangan,i.tanggal,i.photoUrl||'']);
    const csv = [headers, ...rows].map(r => r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='keuangan.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Export Excel
  document.getElementById('btnExportExcel').addEventListener('click', async () => {
    if (typeof XLSX === 'undefined') await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    const res = await fetch(ITEMS_ENDPOINT, {
      headers: { 'x-username': localStorage.getItem('username') }
    });
    const data = await res.json();
    if (!data.length) return alert('Data kosong');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Keuangan');
    XLSX.writeFile(wb, 'keuangan.xlsx');
  });
}

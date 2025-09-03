import { fetchAndRender } from './data.js';

const API_URL = "https://balancing-wop-production.up.railway.app";
const UPLOAD_ENDPOINT = API_URL + "/upload";
const ITEMS_ENDPOINT = API_URL + "/items";

export function initForm() {
  const nominalInput = document.getElementById('fieldNominal');

  // format nominal
  nominalInput.addEventListener('input', (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      e.target.value = '';
      return;
    }
    e.target.value = Number(raw).toLocaleString('id-ID');
  });

  // submit form
  document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nominalRaw = nominalInput.value.replace(/\./g, '').replace(/,/g, '');
    const nominal = Number(nominalRaw);
    const keterangan = document.getElementById('fieldKeterangan').value.trim();
    const tanggal = document.getElementById('fieldTanggal').value || new Date().toISOString().split('T')[0];
    const file = document.getElementById('fileInput').files[0];
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = '';
    if (!nominal) return alert('Nominal wajib diisi');

    let photoUrl = null, publicId = null;
    try {
      if (file) {
        statusEl.textContent = 'Uploading...';
        const fd = new FormData();
        fd.append('file', file);
        const up = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          headers: { 'x-username': localStorage.getItem('username') },
          body: fd
        });
        const j = await up.json();
        if (!up.ok) throw new Error(j.error || 'Upload gagal');
        photoUrl = j.link || null;
        publicId = j.id || null;
        statusEl.textContent = 'Upload selesai';
      }
      const createRes = await fetch(ITEMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': localStorage.getItem('username')
        },
        body: JSON.stringify({ nama: localStorage.getItem('username'), nominal, keterangan, tanggal, photoUrl, publicId })
      });
      if (!createRes.ok) throw new Error(await createRes.text());
      document.getElementById('itemForm').reset();
      nominalInput.value = '';
      statusEl.textContent = 'Transaksi tersimpan';
      setTimeout(() => statusEl.textContent = '', 2000);
      fetchAndRender();
    } catch (err) {
      alert('Gagal: ' + err.message);
      statusEl.textContent = '';
    }
  });
}

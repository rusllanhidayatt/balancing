const API_URL = location.hostname === "localhost" ? "http://localhost:3000" : "https://balancing-wop-production.up.railway.app";
const UPLOAD_ENDPOINT = API_URL + "/upload";
const ITEMS_ENDPOINT = API_URL + "/items";

export function initForm() {
  const nominalInput = document.getElementById('fieldNominal');
  const form = document.getElementById('itemForm');
  const statusEl = document.getElementById('formStatus');

  nominalInput.addEventListener('input', (e) => {
    let raw = e.target.value.replace(/[^\d]/g, '');
    e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Menyimpan...';

    try {
      const nama = localStorage.getItem('username');
      const nominal = Number((document.getElementById('fieldNominal').value || '').replace(/\./g,'').replace(/,/g,'').replace(/\s/g,'').replace(/[^\d]/g,''));
      const keterangan = document.getElementById('fieldKeterangan').value.trim();
      const tanggal = document.getElementById('fieldTanggal').value;
      const file = document.getElementById('fieldBukti').files[0];

      let photoUrl = null, publicId = null;

      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const resUp = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          headers: { 'x-username': nama },
          body: fd
        });
        if (!resUp.ok) throw new Error('Upload gagal');
        const up = await resUp.json();
        photoUrl = up.photoUrl; publicId = up.publicId;
      }

      const createRes = await fetch(ITEMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-username': nama },
        body: JSON.stringify({ nama, nominal, keterangan, tanggal, photoUrl, publicId })
      });
      if (!createRes.ok) throw new Error(await createRes.text());

      form.reset();
      nominalInput.value = '';
      statusEl.textContent = 'Transaksi tersimpan';
      setTimeout(() => statusEl.textContent = '', 1500);
      // dispatch event to refresh list if needed
      if (window.fetchAndRender) window.fetchAndRender();
    } catch (err) {
      alert('Gagal: ' + err.message);
      statusEl.textContent = '';
    }
  });
}

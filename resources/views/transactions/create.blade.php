<!DOCTYPE html>
<html>
<head><title>Tambah Transaksi</title></head>
<body>
    <h2>Tambah Transaksi</h2>
    <form method="POST" action="/store">
        @csrf
        <label>Tanggal</label>
        <input type="date" name="tanggal" value="{{ old('tanggal') }}"><br>

        <label>Keterangan</label>
        <input type="text" name="keterangan" value="{{ old('keterangan') }}"><br>

        <label>Tipe</label>
        <select name="tipe">
            <option value="pemasukan" {{ old('tipe')=='pemasukan'?'selected':'' }}>Pemasukan</option>
            <option value="pengeluaran" {{ old('tipe')=='pengeluaran'?'selected':'' }}>Pengeluaran</option>
        </select><br>

        <label>Jumlah</label>
        <input type="number" step="0.01" name="jumlah" value="{{ old('jumlah') }}"><br>

        <button type="submit">Simpan</button>
        <a href="/">Batal</a>
    </form>
</body>
</html>


<!DOCTYPE html>
<html>
<head><title>Edit Transaksi</title></head>
<body>
    <h2>Edit Transaksi</h2>
    <form method="POST" action="/update/{{ $transaction->id }}">
        @csrf
        <label>Tanggal</label>
        <input type="date" name="tanggal" value="{{ old('tanggal', $transaction->tanggal) }}"><br>

        <label>Keterangan</label>
        <input type="text" name="keterangan" value="{{ old('keterangan', $transaction->keterangan) }}"><br>

        <label>Tipe</label>
        <select name="tipe">
            <option value="pemasukan" {{ old('tipe', $transaction->tipe)=='pemasukan'?'selected':'' }}>Pemasukan</option>
            <option value="pengeluaran" {{ old('tipe', $transaction->tipe)=='pengeluaran'?'selected':'' }}>Pengeluaran</option>
        </select><br>

        <label>Jumlah</label>
        <input type="number" step="0.01" name="jumlah" value="{{ old('jumlah', $transaction->jumlah) }}"><br>

        <button type="submit">Update</button>
        <a href="/">Batal</a>
    </form>
</body>
</html>

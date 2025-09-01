
<!DOCTYPE html>
<html>
<head><title>Keuangan</title></head>
<body>
    <a href="/create">Tambah Transaksi</a> | <a href="/logout">Logout</a>
    <table border="1">
        <tr>
            <th>Tanggal</th><th>Keterangan</th><th>Tipe</th><th>Jumlah</th><th>Aksi</th>
        </tr>
        @foreach($transactions as $t)
        <tr>
            <td>{{ $t->tanggal }}</td>
            <td>{{ $t->keterangan }}</td>
            <td>{{ $t->tipe }}</td>
            <td>{{ $t->jumlah }}</td>
            <td>
                <a href="/edit/{{ $t->id }}">Edit</a> | 
                <a href="/delete/{{ $t->id }}">Hapus</a>
            </td>
        </tr>
        @endforeach
    </table>
</body>
</html>

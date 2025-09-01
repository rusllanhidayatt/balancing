# app.py
import json
import os
from datetime import datetime

DATA_FILE = "transactions.json"


def init_data_file():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f)


def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


def get_valid_int(prompt):
    while True:
        value = input(prompt)
        if value.isdigit():
            return int(value)
        print("Input harus berupa angka!")


def add_transaction():
    tanggal = input("Masukkan tanggal (YYYY-MM-DD, kosongkan untuk hari ini): ").strip()
    if not tanggal:
        tanggal = datetime.now().strftime("%Y-%m-%d")
    keterangan = input("Masukkan keterangan: ").strip()
    tipe = ""
    while tipe not in ["masuk", "keluar"]:
        tipe = input("Tipe transaksi (masuk/keluar): ").strip().lower()
    jumlah = get_valid_int("Masukkan jumlah: ")

    data = load_data()
    new_entry = {
        "id": len(data) + 1,
        "tanggal": tanggal,
        "keterangan": keterangan,
        "tipe": tipe,
        "jumlah": jumlah,
    }
    data.append(new_entry)
    save_data(data)
    print("Transaksi berhasil ditambahkan!")


def view_transactions():
    data = load_data()
    if not data:
        print("Belum ada transaksi.")
        return
    for entry in data:
        print(
            f"ID: {entry['id']} | {entry['tanggal']} | {entry['keterangan']} | {entry['tipe']} | Rp{entry['jumlah']}"
        )


def calculate_balance():
    data = load_data()
    total_masuk = sum(e["jumlah"] for e in data if e["tipe"] == "masuk")
    total_keluar = sum(e["jumlah"] for e in data if e["tipe"] == "keluar")
    saldo = total_masuk - total_keluar
    print(f"Total Masuk : Rp{total_masuk}")
    print(f"Total Keluar: Rp{total_keluar}")
    print(f"Saldo Akhir : Rp{saldo}")


def update_transaction():
    data = load_data()
    entry_id = get_valid_int("Masukkan ID transaksi yang mau diupdate: ")
    for entry in data:
        if entry["id"] == entry_id:
            new_keterangan = input("Keterangan baru (kosongkan untuk tidak diubah): ").strip()
            new_tipe = input("Tipe baru (masuk/keluar, kosongkan untuk tidak diubah): ").strip().lower()
            new_jumlah = input("Jumlah baru (kosongkan untuk tidak diubah): ").strip()

            if new_keterangan:
                entry["keterangan"] = new_keterangan
            if new_tipe in ["masuk", "keluar"]:
                entry["tipe"] = new_tipe
            if new_jumlah:
                if new_jumlah.isdigit():
                    entry["jumlah"] = int(new_jumlah)
                else:
                    print("Jumlah tidak valid, tetap menggunakan nilai lama.")

            save_data(data)
            print("Transaksi berhasil diupdate!")
            return
    print("ID tidak ditemukan.")


def delete_transaction():
    data = load_data()
    entry_id = get_valid_int("Masukkan ID transaksi yang mau dihapus: ")
    new_data = [entry for entry in data if entry["id"] != entry_id]
    if len(new_data) != len(data):
        save_data(new_data)
        print("Transaksi berhasil dihapus!")
    else:
        print("ID tidak ditemukan.")


def main():
    init_data_file()
    while True:
        print("\nMenu:")
        print("1. Tambah Transaksi")
        print("2. Lihat Semua Transaksi")
        print("3. Lihat Saldo")
        print("4. Update Transaksi")
        print("5. Hapus Transaksi")
        print("6. Keluar")
        choice = input("Pilih menu: ").strip()

        if choice == "1":
            add_transaction()
        elif choice == "2":
            view_transactions()
        elif choice == "3":
            calculate_balance()
        elif choice == "4":
            update_transaction()
        elif choice == "5":
            delete_transaction()
        elif choice == "6":
            print("Keluar...")
            break
        else:
            print("Pilihan tidak valid!")


if __name__ == "__main__":
    main()
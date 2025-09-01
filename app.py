# app.py
import json
import os
from datetime import datetime
from collections import defaultdict
from flask import Flask, request, jsonify

app = Flask(__name__)
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


@app.route("/transactions", methods=["GET"])
def view_transactions():
    return jsonify(load_data())


@app.route("/transactions", methods=["POST"])
def add_transaction():
    data = load_data()
    body = request.json
    tanggal = body.get("tanggal", datetime.now().strftime("%Y-%m-%d"))
    new_entry = {
        "id": len(data) + 1,
        "tanggal": tanggal,
        "keterangan": body.get("keterangan", ""),
        "tipe": body.get("tipe", "masuk"),
        "jumlah": int(body.get("jumlah", 0)),
    }
    data.append(new_entry)
    save_data(data)
    return jsonify(new_entry), 201


@app.route("/transactions/<int:entry_id>", methods=["PUT"])
def update_transaction(entry_id):
    data = load_data()
    for entry in data:
        if entry["id"] == entry_id:
            body = request.json
            if "keterangan" in body:
                entry["keterangan"] = body["keterangan"]
            if "tipe" in body and body["tipe"] in ["masuk", "keluar"]:
                entry["tipe"] = body["tipe"]
            if "jumlah" in body:
                entry["jumlah"] = int(body["jumlah"])
            save_data(data)
            return jsonify(entry)
    return jsonify({"error": "ID tidak ditemukan"}), 404


@app.route("/transactions/<int:entry_id>", methods=["DELETE"])
def delete_transaction(entry_id):
    data = load_data()
    new_data = [entry for entry in data if entry["id"] != entry_id]
    if len(new_data) == len(data):
        return jsonify({"error": "ID tidak ditemukan"}), 404
    save_data(new_data)
    return jsonify({"message": "Transaksi berhasil dihapus"})


@app.route("/balance", methods=["GET"])
def calculate_balance():
    data = load_data()
    total_masuk = sum(e["jumlah"] for e in data if e["tipe"] == "masuk")
    total_keluar = sum(e["jumlah"] for e in data if e["tipe"] == "keluar")
    saldo = total_masuk - total_keluar
    return jsonify(
        {"total_masuk": total_masuk, "total_keluar": total_keluar, "saldo": saldo}
    )


@app.route("/transactions/filter", methods=["GET"])
def filter_transactions_by_date():
    data = load_data()
    start_date = request.args.get("start")
    end_date = request.args.get("end")
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except Exception:
        return jsonify({"error": "Format tanggal salah! Gunakan YYYY-MM-DD"}), 400

    filtered = [
        entry
        for entry in data
        if start_dt <= datetime.strptime(entry["tanggal"], "%Y-%m-%d") <= end_dt
    ]
    return jsonify(filtered)


@app.route("/report/monthly", methods=["GET"])
def monthly_report():
    data = load_data()
    report = defaultdict(lambda: {"masuk": 0, "keluar": 0})
    for entry in data:
        bulan = datetime.strptime(entry["tanggal"], "%Y-%m-%d").strftime("%Y-%m")
        report[bulan][entry["tipe"]] += entry["jumlah"]

    result = []
    for bulan, totals in sorted(report.items()):
        saldo = totals["masuk"] - totals["keluar"]
        result.append(
            {
                "bulan": bulan,
                "masuk": totals["masuk"],
                "keluar": totals["keluar"],
                "saldo": saldo,
            }
        )
    return jsonify(result)


if __name__ == "__main__":
    init_data_file()
    app.run(host="0.0.0.0", port=5000)

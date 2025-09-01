# CRUD JSON (Express) — siap deploy ke Railway


Project simple CRUD API (Express) yang menyimpan data di `data.json` — cocok untuk demo / learning.


## Cara pakai (lokal)


1. Salin file-file dari canvas ke folder project.
2. Install dependency:


```bash
npm install
```


3. Jalankan server (development):


```bash
npm run dev # butuh nodemon, atau
npm start
```


4. Coba endpoint:


```bash
curl http://localhost:3000/items
```


## Deploy ke Railway (singkat)


1. Install Railway CLI (npm atau brew):


```bash
npm i -g @railway/cli
# atau (macOS)
brew tap railwayapp/railway
brew install railway
```


2. Login ke Railway:


```bash
railway login
```


3a. Deploy langsung dari terminal (quick):


```bash
railway init
railway up
```


Railway akan membuild dan memberikan URL publik untuk API.


3b. (Alternatif) Push repo ke GitHub lalu hubungkan repo di dashboard Railway untuk CD.


## Catatan penting


- Railway memberikan filesystem **ephemeral** untuk service (10GB). Data di `data.json` bisa hilang saat redeploy atau restart. Untuk production, ganti ke database (Postgres, SQLite dengan volume, dsb.) atau gunakan Railway Volumes.


*/
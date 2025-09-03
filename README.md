# Fixed Balancing Project (patched)

This archive contains a patched, runnable local copy of your project with fixes applied:
- Proper login with username/password and role
- Upload endpoint `/upload` (multer + sharp + cloudinary stream)
- Fixed async delete handler
- Replaced truncated files (no `...`)
- Frontend uses local API_URL on localhost

How to run:
1. Copy or unzip this to your project directory.
2. Install deps: `npm install`
3. Create `.env` or set env vars:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
4. Start: `npm run dev` or `npm start`
5. Serve `public` folder (e.g. open `public/index.html` with Live Server) or configure express static to serve it.

Files included:
- server.js
- routes/: authRoute.js, itemsRoute.js, uploadRoute.js
- utils/: users.js, auth.js, cloudinary.js, fileHelper.js
- public/: html + js modules (auth.js, form.js, data.js, export.js, utils.js, app.js)
- data.json (initial empty array)

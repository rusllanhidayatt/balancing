/*
get_refresh_token.js
Usage: generate a Google OAuth refresh token (run locally)

Steps:
1. Create OAuth Client (Web app) on Google Cloud Console with Redirect URI: http://localhost:3000/oauth2callback
2. Set env vars before running:
   export GOOGLE_CLIENT_ID="..."
   export GOOGLE_CLIENT_SECRET="..."
3. Install deps:
   npm install googleapis express open
4. Run:
   node get_refresh_token.js

The script will print/open an authorization URL. Open it (or allow the script to open). After consenting, Google will redirect back to http://localhost:3000/oauth2callback and the server will exchange the code for tokens and print them (including refresh_token) in the terminal.

Save the printed `refresh_token` into Railway environment variable: GOOGLE_REFRESH_TOKEN
*/

const express = require('express');
const { google } = require('googleapis');
const open = require('open'); // optional: auto-open browser

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as env vars before running.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// scope: allow creating files and setting permissions in Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata'
];

const app = express();

app.get('/', (req, res) => {
  res.send(`<p>Open <a href="/auth">/auth</a> to start OAuth flow</p>`);
});

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // important to receive refresh_token
    scope: SCOPES,
    prompt: 'consent' // force consent to receive refresh_token
  });
  console.log('Open this URL in your browser (or allow the script to open it):', authUrl);
  // try auto-open
  open(authUrl).catch(() => {});
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    const { tokens } = await oauth2Client.getToken(code);
    // tokens contains access_token, refresh_token (if granted), expiry_date
    console.log('\n=== TOKENS ===');
    console.log(JSON.stringify(tokens, null, 2));
    console.log('\nCopy the value of refresh_token and save it to Railway env var GOOGLE_REFRESH_TOKEN');
    res.send('<h2>Success</h2><p>Tokens printed to terminal. You can close this page.</p>');
    setTimeout(() => process.exit(0), 1500);
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.status(500).send('Error exchanging code for tokens. See terminal.');
  }
});

app.listen(PORT, () => {
  console.log(`OAuth server listening on http://localhost:${PORT}`);
  console.log('Visit http://localhost:3000/auth if browser did not open automatically.');
});

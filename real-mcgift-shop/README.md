# Real McGift Premier Services Limited - Mum Shop

## What's included
- Simple Node.js + Express app that serves a responsive list-style shop.
- Admin page at `/admin` protected by the password you provided.
- Upload, edit, delete items (images saved in `public/products/`, metadata saved in `items.json`).
- Works offline locally and can be deployed to Render/Railway.

## Quick start (local)
1. Install Node.js (if not installed) from https://nodejs.org/
2. Unzip the package and open a terminal in the project folder.
3. Run `npm install` to install dependencies.
4. Start the server: `npm start`
5. Open http://localhost:3000 in your browser.
6. Admin panel: http://localhost:3000/admin
   - Password is set in `config.json` (currently **Mom12345**). You can change it there or set the `ADMIN_PASS` environment variable.

## Change WhatsApp number
Edit `public/script.js` and replace `WA_NUMBER` with your mum's number in international format (no + or 00), e.g. `2348012345678`.

## Deploy to Render (example)
1. Create a GitHub repo and push the project.
2. Sign up on https://render.com and create a new **Web Service**.
3. Connect your GitHub repo, set build command: `npm install` and start command: `npm start`.
4. Add environment variable `ADMIN_PASS` in Render dashboard to override the password (recommended).
5. Deploy — Render will provide a public URL.

## Notes
- When deployed online, uploaded images saved to the instance's `public/products` folder. For persistent storage across redeploys, consider using a proper object storage (S3) or add an admin uploader that stores files in cloud storage.
- Don't commit `config.json` with real password to public repos — add it to `.gitignore` if you push to GitHub.

## Support
If you want, I can walk you step-by-step through deploying to Render and show screenshots.

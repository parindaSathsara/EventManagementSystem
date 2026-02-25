# Event Management System - Proposal Web App

This repository contains a hostable web application version of the Event Management & Ticketing System proposal.

## Files

- `index.html` - Main proposal page
- `styles.css` - Futuristic responsive styling
- `app.js` - UI interactions (scroll progress, reveal animations, mobile nav, print)
- `PROJECT_PROPOSAL_WEB.md` - Markdown source proposal

## Run Locally

You can open `index.html` directly, but using a local server is recommended.

### Option 1: Python

```bash
python -m http.server 8080
```

Then open: `http://localhost:8080`

### Option 2: VS Code Live Server

Open the folder in VS Code and run **Live Server** on `index.html`.

## Deploy / Host

### Netlify (Fastest)
1. Go to Netlify and create a new site from local files.
2. Drag and drop this project folder.
3. Share the generated URL with your client.

### Vercel
1. Import this folder as a project.
2. Framework preset: `Other`.
3. Deploy and share the public URL.

### GitHub Pages
1. Push this repo to GitHub.
2. Enable GitHub Pages from branch root.
3. Share the published URL.

## Customize Before Sending

- Update team names and contact block in `index.html`.
- Adjust colors/typography in `styles.css` if your brand palette changes.
- Use the `Export / Print` button to create a PDF copy for formal submission.

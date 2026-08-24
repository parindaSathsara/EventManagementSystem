# Stage Web

The responsive web application for Stage. It lives beside the Expo mobile app
and uses the same REST backend without importing or changing mobile source.

## Applications

- `../Project/` — existing Expo Android/iOS application
- `./` — Next.js website
- `../backend/` — shared Express/Prisma API

## Local development

1. Install dependencies:

   ```powershell
   cd web
   npm install
   ```

2. Optionally create `.env.local` when using a different API:

   ```text
   API_BASE_URL=http://localhost:8000/api
   ```

3. Start the site:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:3000`.

The default API is `https://events-api.aahaas.com/api`.

## Production

```powershell
npm run build
npm start
```

Set `API_BASE_URL` before building or starting the server. Next.js proxies
same-origin `/api/*` requests to that API, so the website works without changing
the backend CORS policy. `NEXT_PUBLIC_API_BASE_URL` remains available when a
direct browser-to-API connection is intentionally preferred.

## Preview URL (Vercel)

For a shareable URL without touching the GCP box. Run from **this** directory —
`web/` is the project root; the repo root holds the mobile app and API too.

```powershell
cd web
npx vercel login     # one-time, opens a browser
npx vercel           # preview URL
npx vercel --prod    # promote to the stable *.vercel.app URL
```

Zero config is correct here: every page is a client component and the API is
reached through the `rewrites()` in `next.config.ts`, which run on Vercel's Node
runtime. The browser only ever calls same-origin `/api/*`, so **the backend's
`CORS_ORIGINS` does not need to change** — that would not be true of a static
export or a direct `NEXT_PUBLIC_API_BASE_URL`.

`API_BASE_URL` defaults to the live API, so no environment variables are
required. Set one only to point a preview at a different backend:

```powershell
npx vercel env add API_BASE_URL preview
```

Note the site is public once deployed, including `/auth` and the `/studio`
organizer area. That mirrors the mobile app — the backend enforces
authentication — but it is a link anyone can open, so treat it as a client
preview, not a private staging site.

## Included flows

- Public homepage, event discovery, search and categories
- Event details, social sharing, saving and guest/account reservations
- Artist discovery, profiles and following
- Calendar, reels and upcoming reminders
- Sign up, sign in, customer profile, saved events and tickets
- Organizer onboarding, profile editing, event CRUD, media uploads and reels
- Responsive desktop, tablet and mobile-browser navigation

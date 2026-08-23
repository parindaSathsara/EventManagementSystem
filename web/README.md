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

## Included flows

- Public homepage, event discovery, search and categories
- Event details, social sharing, saving and guest/account reservations
- Artist discovery, profiles and following
- Calendar, reels and upcoming reminders
- Sign up, sign in, customer profile, saved events and tickets
- Organizer onboarding, profile editing, event CRUD, media uploads and reels
- Responsive desktop, tablet and mobile-browser navigation

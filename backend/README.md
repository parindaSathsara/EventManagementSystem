# EventSocial Backend

REST API for the EventSocial mobile app — Node.js + Express + Prisma + MySQL +
JWT.

Designed to be **small, fast, and easy to reason about**. Each feature lives in
its own folder under `src/modules/<name>/` with a consistent
`routes → controller → service → schema` split. No giant `models/` directory,
no class hierarchies, no surprise globals.

---

## Tech

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| HTTP           | Express 4                               |
| DB / ORM       | MySQL via Prisma 5                      |
| Auth           | JWT (Bearer) + bcryptjs                 |
| Validation     | zod                                     |
| Security       | helmet, cors, express-rate-limit        |
| Logging        | morgan                                  |
| Dev loop       | nodemon                                 |

Runtime target: **Node.js 20+**.

---

## Project layout

```
backend/
├── prisma/
│   ├── schema.prisma     # Single source of truth for the DB shape
│   └── seed.js           # Idempotent demo data
├── src/
│   ├── index.js          # HTTP listener + graceful shutdown
│   ├── app.js            # Express composition (middleware order)
│   ├── routes.js         # Mounts every feature module under /api/*
│   ├── config.js         # Env loading + validation
│   ├── prisma.js         # Singleton PrismaClient
│   ├── lib/              # jwt, password, errors, async-handler
│   ├── middleware/       # auth, validate, error, notFound
│   └── modules/
│       ├── auth/         # signup, login, me, complete-profile
│       ├── artists/      # list, get, become, update, follow
│       ├── events/       # CRUD + save
│       ├── reels/        # list, get, create, react, save, repost
│       └── tickets/      # list mine, get mine, purchase, update status
└── package.json
```

---

## Setup

1. **Install Node 20+** and a running MySQL 8 you can reach.

2. **Install deps:**
   ```bash
   cd backend
   npm install
   ```

3. **Create `.env`** by copying the template:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `JWT_SECRET`, and (optionally) `CORS_ORIGINS`.

   > Special characters in the MySQL password **must be URL-encoded** in the
   > `DATABASE_URL`. The common ones: `&` → `%26`, `@` → `%40`, `+` → `%2B`,
   > `>` → `%3E`, `=` → `%3D`. e.g. an example like `Foo&Bar+Baz` would become
   > `Foo%26Bar%2BBaz`. Generate the real value with
   > `node -e "console.log(encodeURIComponent('your-password-here'))"`
   > — do not commit the real password to source.

4. **Generate the Prisma client and create tables:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init       # first time on a dev DB
   # or, against an existing prod DB:
   npx prisma migrate deploy
   ```

5. **Seed demo data (optional):**
   ```bash
   npm run db:seed
   ```

6. **Run the dev server:**
   ```bash
   npm run dev
   # → http://localhost:8000/api/health
   ```

---

## Deploying to `35.197.143.222`

The simplest production setup, since the DB already lives on the same box:

```bash
# On the server, as a non-root user
git clone <your-repo>.git eventsocial
cd eventsocial/backend
npm ci
cp .env.example .env
nano .env                       # fill in DATABASE_URL, JWT_SECRET, CORS_ORIGINS
npx prisma migrate deploy
npm run db:seed                 # optional
NODE_ENV=production npm start   # bind to :8000

# Or with pm2 for auto-restart + log rotation:
npm i -g pm2
pm2 start src/index.js --name eventsocial-api --update-env
pm2 save
pm2 startup
```

Front the API with NGINX / Caddy on :443 if you want HTTPS — the app sets
`trust proxy = 1` so it'll pick up the real client IP for rate limiting.

The mobile app reads `EXPO_PUBLIC_API_BASE_URL` (or falls back to
`http://35.197.143.222:8000/api`). Update the constant in
`Project/src/services/api/client.js` if you change the public URL.

---

## API surface

All responses are JSON. Authenticated endpoints expect
`Authorization: Bearer <token>`. Validation failures return:

```json
{ "message": "Validation failed", "code": "VALIDATION", "details": [...] }
```

### Auth — `/api/auth`

| Method | Path                | Auth | Description                                  |
| ------ | ------------------- | ---- | -------------------------------------------- |
| POST   | `/signup`           | —    | `{ email, password, name, phone? }`          |
| POST   | `/login`            | —    | `{ email, password }`                        |
| GET    | `/me`               | ✓    | Current user                                 |
| PATCH  | `/complete-profile` | ✓    | `{ phone?, city?, name? }` (post-first-login)|

`signup` and `login` return `{ user, token }`.

### Artists — `/api/artists`

| Method | Path             | Auth | Description                       |
| ------ | ---------------- | ---- | --------------------------------- |
| GET    | `/`              | opt  | List (`?search=…&verifiedOnly=…`) |
| GET    | `/me`            | ✓    | Caller's own artist (null if none)|
| GET    | `/:id`           | opt  | Artist detail                     |
| POST   | `/become`        | ✓    | Upgrade user → artist (`{ handle, bio }`) |
| PATCH  | `/me`            | ✓    | Update own profile (`{ handle, bio, category, socialsJson }`) |
| POST   | `/:id/follow`    | ✓    | Toggle follow                     |

`Artist.isPreferred` controls whether the artist's reels/events skip the
approval queue. Default is `false` (manual approval); admin can flip it
later. The seed script sets the demo artist as preferred so the demo flow
publishes immediately.

### Events — `/api/events`

| Method | Path             | Auth | Description                                                |
| ------ | ---------------- | ---- | ---------------------------------------------------------- |
| GET    | `/`              | opt  | `?status=upcoming\|live\|past\|all\|draft&search=…`        |
| GET    | `/:id`           | opt  | Event detail (incl. ticket types, lineup, isSaved)         |
| POST   | `/`              | ✓ artist | Create event (with ticket types + lineup)               |
| PATCH  | `/:id`           | ✓ artist | Update own event                                        |
| DELETE | `/:id`           | ✓ artist | Delete own event                                        |
| POST   | `/:id/save`      | ✓    | Toggle save                                                 |

### Reels — `/api/reels`

| Method | Path             | Auth | Description                                |
| ------ | ---------------- | ---- | ------------------------------------------ |
| GET    | `/`              | opt  | `?feed=forYou\|following&artistId=…&tag=…` |
| GET    | `/:id`           | opt  | Reel detail (decorated per viewer)         |
| POST   | `/`              | ✓ artist | Publish a reel (verified only)          |
| POST   | `/:id/react`     | ✓    | `{ code: "fire"\|"love"\|... \| null }`    |
| POST   | `/:id/save`     | ✓    | Toggle save                                |
| POST   | `/:id/repost`   | ✓    | Toggle repost                              |

Reel statuses (per FR-S5): `draft | pending_approval | published | hidden | removed | rejected`.
When a non-preferred artist creates a reel it lands in `pending_approval`; preferred
artists go straight to `published`. The public feed (`GET /reels`) only returns
`published`, so customers never see unreviewed content.

### Uploads — `/api/uploads`

| Method | Path             | Auth | Description                                          |
| ------ | ---------------- | ---- | ---------------------------------------------------- |
| POST   | `/video`         | ✓    | `multipart/form-data` field `file` — video up to `UPLOAD_MAX_VIDEO_MB` (default 100MB). Returns `{ url, filename, sizeBytes, mimeType }`. |
| POST   | `/image`         | ✓    | Same shape, allowed mime types: jpeg/png/webp/gif. Default cap 10MB. |

Files are stored under `UPLOAD_DIR` (default `./uploads`) and served at
`/uploads/<filename>` with a 7-day immutable cache. Filenames are randomised
on save — the client must use the returned `url` (the originalname is never
trusted).

The mobile app uses `XMLHttpRequest` so it can show real upload progress;
fetch() in React Native doesn't expose upload events. See
`Project/src/services/api/uploads.js` for the client.

### Tickets — `/api/tickets`

| Method | Path             | Auth | Description                              |
| ------ | ---------------- | ---- | ---------------------------------------- |
| GET    | `/`              | ✓    | List the caller's tickets                |
| GET    | `/:id`           | ✓    | Ticket detail (owner only)               |
| POST   | `/`              | ✓    | Purchase `{ eventId, ticketTypeId, holderName }` |
| PATCH  | `/:id/status`    | ✓    | `{ status: "active"\|"used"\|… }`        |

Purchases run in a transaction so ticket stock can't oversell.

### Misc

- `GET /api/health` → `{ ok: true, time: "…" }` (use for uptime checks)

---

## Conventions / gotchas

- **Prisma client** is a singleton (`src/prisma.js`). Don't `new PrismaClient()`
  anywhere else — it leaks connections on hot reload.
- **Errors** thrown from services should be one of the typed errors in
  `src/lib/errors.js` (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`,
  `Conflict`). The global error handler renders them as JSON with the right
  status. Anything else surfaces as a generic 500 — that's by design.
- **Async handlers** must be wrapped with `asyncHandler(...)` (see
  `src/lib/async-handler.js`) so thrown promises don't crash the process.
- **Validation** lives next to each route in `<module>/schema.js`. Always
  validate `body`, `params`, and `query` so the rest of the stack can trust
  types.
- **Rate limiting** has a generous global cap (300/15min) and a tighter one
  on `/auth/*` (30/15min) to slow credential stuffing.
- **Adding a module:** create `src/modules/<name>/{routes,controller,service,schema}.js`,
  add one line to `src/routes.js`. Done.

---

## Security checklist for prod

- [ ] Rotate the `JWT_SECRET` to a 32+ char random string.
- [ ] Set `NODE_ENV=production` so config validates env vars hard.
- [ ] Narrow `CORS_ORIGINS` from `*` to the actual mobile/web origins.
- [ ] Rotate the MySQL password (the one in the chat history is compromised).
- [ ] Put the API behind HTTPS (Caddy is easiest — automatic Let's Encrypt).
- [ ] Back up the `events` DB on a schedule (e.g. `mysqldump` cron → S3 / GCS).

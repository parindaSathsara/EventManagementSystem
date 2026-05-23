# EventSocial Backend — Deployment Runbook

Target: workspace container `aahaas-workspace-1` on `aahaas-staging-backend`
(192.168.126.7). Code lives at `/var/www/events-ai/`. Public URL via nginx
at `https://events-api.aahaas.dev`. Process supervisor: PM2.

---

## 0. Topology

```
mobile app  ─►  https://events-api.aahaas.dev  ─►  nginx (host) ─►  127.0.0.1:8000  ─►  node (PM2, in workspace container)
                                                                                          │
                                                                                          └─► MySQL @ 35.197.143.222:3306 (db: events)

                                                  /uploads/*  ─► nginx alias ─► /var/www/events-ai/uploads/*  (no Node hop)
```

---

## 1. First-time deploy

### 1.1 SSH chain to the workspace container

```bash
# from your laptop
ssh -i .ssh/id_rsa techlabs@aahaas-staging-dbproxy
ssh -i .ssh/id_rsa techlabs@192.168.126.7
sudo docker exec -it --user root aahaas-workspace-1 bash
```

You're now inside the workspace container, prompt `root@…:/var/www#`.

### 1.2 Clone

```bash
cd /var/www
git clone <your-repo-url> events-ai
cd events-ai/backend
```

### 1.3 Create the production `.env`

```bash
cp .env.production.example .env
nano .env
```

Fill in:

| Var | Value |
|---|---|
| `DATABASE_URL` | `mysql://root:<URL-ENCODED-PASSWORD>@35.197.143.222:3306/events` |
| `JWT_SECRET` | `openssl rand -hex 32` (run it, paste the output) |
| `CORS_ORIGINS` | `https://events-api.aahaas.dev` (and any web origin you'll add later) |
| `PUBLIC_BASE_URL` | `https://events-api.aahaas.dev` |
| `SEED_ADMIN_PASSWORD` | A strong one — leave only if you're going to run the seed |

> **URL-encoding the DB password.** Special chars must be percent-encoded.
> Your password `&l+>XV7=Q@iF&B9s` becomes `%26l%2B%3EXV7%3DQ%40iF%26B9s`.
> Other chars: `@`→`%40`, `:`→`%3A`, `/`→`%2F`, `?`→`%3F`, `#`→`%23`.

### 1.4 Bootstrap

```bash
chmod +x deploy/bootstrap.sh deploy/deploy.sh
./deploy/bootstrap.sh           # without seed
# or
SEED=yes ./deploy/bootstrap.sh  # with seed (creates admin + demo artist)
```

Bootstrap will:
- verify Node 20+, install PM2 if missing
- create `/var/log/events-ai/` and `/var/www/events-ai/uploads/`
- `npm ci` + `prisma generate` + `prisma migrate deploy`
- (optional) `npm run db:seed`
- start under PM2 with `--env production`
- hit `http://127.0.0.1:8000/api/health` to confirm

You should see `✓ health OK …` and a banner. If anything fails, the script
exits with the failing step shown.

### 1.5 Install the nginx site (on the host, NOT inside the container)

Exit out of the workspace container (`exit`) back to the host, then:

```bash
# Copy the nginx server block. Adjust the source path to wherever you
# cloned the repo on the host — if /var/www is a bind mount from the host,
# the same file is already there.
sudo cp /var/www/events-ai/backend/deploy/nginx/events-api.conf \
        /etc/nginx/sites-available/events-api

sudo ln -s /etc/nginx/sites-available/events-api \
           /etc/nginx/sites-enabled/events-api

# IMPORTANT: comment out the four `ssl_*` lines in the config first time
# through — they reference a cert that doesn't exist yet. Certbot will
# uncomment + rewrite them in step 1.6.

sudo nginx -t                # syntax check
sudo systemctl reload nginx
```

Test the plain-HTTP path works (will redirect / pre-cert):
```bash
curl -I http://events-api.aahaas.dev/api/health
```

### 1.6 Point DNS

In the GCP DNS console (or wherever `aahaas.dev` lives), add an `A` record:

```
events-api.aahaas.dev   →   <public IP of the load balancer / server>
```

Wait for propagation (`dig +short events-api.aahaas.dev` should resolve).

### 1.7 Issue TLS with Let's Encrypt

On the host:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d events-api.aahaas.dev --redirect --agree-tos -m ops@aahaas.dev
```

Certbot will:
- prove ownership via HTTP-01
- write the cert to `/etc/letsencrypt/live/events-api.aahaas.dev/`
- rewrite the nginx server block to enable SSL
- install a systemd timer for auto-renewal

Verify:
```bash
curl -I https://events-api.aahaas.dev/api/health
# HTTP/2 200 …
```

### 1.8 Point the mobile app at the new URL

Edit `Project/src/services/api/client.js`:

```js
const DEFAULT_BASE_URL = 'https://events-api.aahaas.dev/api';
```

Or override per build with `EXPO_PUBLIC_API_BASE_URL`. Once on HTTPS you
should also remove the cleartext exceptions from `Project/app.json`
(`usesCleartextTraffic`, `NSAllowsArbitraryLoads`).

---

## 2. Ongoing deploys

After pushing changes to `main` on GitHub:

```bash
# from your laptop: ssh into the workspace container (1.1)
cd /var/www/events-ai/backend
./deploy/deploy.sh
```

`deploy.sh` will:
- `git fetch && git reset --hard origin/main`
- skip `npm ci` if `package*.json` and `prisma/schema.prisma` are unchanged
- always run `prisma migrate deploy` (idempotent — no-op when nothing to apply)
- `pm2 reload` (zero-downtime restart)
- poll `/api/health` until it answers, fail loudly if not

Useful flags:
```bash
SKIP_INSTALL=1 ./deploy/deploy.sh   # only code changed
SKIP_MIGRATE=1 ./deploy/deploy.sh   # avoid running migrations
BRANCH=hotfix ./deploy/deploy.sh    # deploy a non-main branch
```

---

## 3. Operations

| Task | Command |
|---|---|
| Status | `pm2 status` |
| Live logs | `pm2 logs events-ai` |
| Last 200 log lines | `pm2 logs events-ai --lines 200 --nostream` |
| Restart | `pm2 restart events-ai` |
| Stop | `pm2 stop events-ai` |
| Reload (zero-downtime) | `pm2 reload events-ai` |
| Open a DB shell | `mysql -h 35.197.143.222 -u root -p events` |
| Prisma data browser | `npx prisma studio` (then port-forward 5555) |
| Tail nginx | `sudo tail -f /var/log/nginx/events-api.access.log` |

### Disk / upload housekeeping
Videos accumulate under `/var/www/events-ai/uploads/`. Once the admin web
app ships a moderation tool, deletes should run through the API. Until
then, manual cleanup of rejected reels is fine:

```bash
# find files older than 30d and not referenced in DB (manual review only)
find /var/www/events-ai/uploads/ -type f -mtime +30
```

---

## 4. Rollback

PM2 doesn't keep code history, so rollback is a `git reset` + redeploy.
Pick the commit you want:

```bash
cd /var/www/events-ai
git log --oneline -10
cd backend
BRANCH=<known-good-commit-sha> ./deploy/deploy.sh
```

(Yes, `BRANCH` accepts any ref — branch, tag, or SHA.)

For schema rollbacks, write a corrective Prisma migration and deploy it —
**do not** edit existing migrations or use `prisma migrate reset` against
the production DB.

---

## 5. Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| `EACCES … bind :::8000` on boot | Another process owns 8000 | `lsof -i :8000`, kill or change `PORT` in `.env` |
| `P1001 … reach the database server` | Bad `DATABASE_URL`, encoding, or DB firewall | Re-check URL-encoding, test with `mysql -h … -u …` from inside the container |
| Health OK locally, 502 from nginx | nginx pointing at wrong port, or container not exposing it | Match `proxy_pass` port to `PORT` in `.env`; if PM2 runs inside container, the container needs `-p 8000:8000` on `docker run` |
| `nginx: [emerg] open() … fullchain.pem` | TLS lines uncommented before certbot ran | Comment them, `nginx -t`, reload, then run certbot |
| Mobile uploads time out at ~5 MB | nginx `client_max_body_size` not raised | Already 200M in the supplied config — confirm you didn't overwrite |
| Reels publish "Submitted for review" forever | Artist is not preferred and there's no admin to approve | Toggle `Artist.isPreferred = true` in the DB (or build the admin app) |

---

## 6. Things explicitly NOT done here

- **Container image build / push** — we run from source via PM2. If we
  later want immutable releases, switch to the Dockerfile path.
- **Blue/green** — `pm2 reload` gives zero-downtime in-place restarts.
  True blue/green needs two app dirs + nginx upstream swap.
- **Backups** — DB lives on GCP Cloud SQL; turn on automated backups
  there. Uploaded files live on local disk and are **not** backed up.
  Migration to a bucket (GCS/S3) is the right answer when traffic justifies it.
- **Secrets rotation** — `JWT_SECRET` rotation invalidates every active
  session. Rotate at maintenance windows only.

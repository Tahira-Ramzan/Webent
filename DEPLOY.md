# Putting Webent live

This pack is the whole site: the React front end **and** the small Node server that serves
it and stores contact-form enquiries in SQLite. There is no third-party backend, no build
service and no external database — one process, one folder, one file for your data.

```
webent-website/
├── START-HERE.txt          ← the 5-minute version
├── DEPLOY.md               ← this file
├── README.md               ← how the code is organised, and what to change where
├── dist/                   ← the site, already built (upload this too)
├── src/                    ← React + TypeScript source
├── public/                 ← fonts, logo, static assets
├── server/                 ← Express API: enquiries, admin, sitemap, robots
├── shared/business.json    ← prices, contact details, the 80% offer (single source of truth)
├── scripts/                ← dev helper
├── .env.example            ← copy to .env and fill in
└── package.json
```

---

## 0. What "live" means here

| Piece | Where it runs | Needed? |
|---|---|---|
| Static site (`dist/`) | any web host | yes |
| API (`/api/inquiries`, `/api/admin`) | Node 20 or 22 | yes — without it the contact form cannot honestly report success |
| SQLite database (`data/webent.db`) | same machine as the API | created automatically |
| E-mail notifications | optional SMTP | no — enquiries are stored whether or not mail is set up |

The front end calls `/api/...` on **its own origin**, so the site and the API must be served
from the same domain (that is what `npm start` does). No CORS setup is required or wanted.

---

## 1. The 5-minute version (any Node host: Render, Railway, Fly, VPS, cPanel)

```bash
# 1. install
npm ci                 # dev + prod dependencies (needed only if you rebuild)

# 2. configure
cp .env.example .env
#   then edit .env — at minimum SITE_URL and ADMIN_PASSWORD

# 3. build (skip if you are happy with the dist/ included in this pack)
npm run build

# 4. run
NODE_ENV=production node server/index.js
# or: npm start
```

Open `http://localhost:8787` — that is the finished site. Submit the form once; the enquiry
lands in `data/webent.db` and shows up at `/admin`.

**On a host, the same four steps, except:**

* you do not run anything by hand — the platform runs `npm ci` and `npm start`;
* `PORT` is given to you by the platform (the server reads it, default 8787);
* `NODE_ENV=production` must be set in the host's environment settings;
* the build step can be skipped because `dist/` is already in the pack.

---

## 2. Environment variables

| Name | Required | Example | Notes |
|---|---|---|---|
| `PORT` | host-set | `8787` | Most hosts inject this. Do not hard-code. |
| `SITE_URL` | yes | `https://webent.pk` | Used for canonical URLs, `sitemap.xml` and `robots.txt`. No trailing slash. |
| `DATA_DIR` | yes in production | `/var/data` | Folder for `webent.db`. **Must be on a persistent disk**, otherwise enquiries are lost on every deploy. |
| `ADMIN_PASSWORD` | yes for `/admin` | `long-random-string` | Leave empty and the admin panel is disabled entirely. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_TO` `MAIL_FROM` | no | `smtp.gmail.com` `587` … | Notifications only send when **all** of these are set. Use a Gmail App Password, not your login password. |

`server/index.js` reads `.env` itself (it never overwrites variables the platform already set),
so `.env` works on a VPS and is harmless on Render/Railway.

---

## 3. Host-by-host

### 3a. Render (free-ish, easiest)

1. Push this folder to a GitHub repository (no `node_modules`, no `data/`, no `.env` —
   the included `.gitignore` already handles that).
2. Render → **New → Web Service** → connect the repo.
3. Build command: `npm ci` · Start command: `npm start`.
4. Environment: `NODE_ENV=production`, `SITE_URL=https://your-domain`, `ADMIN_PASSWORD=…`,
   `DATA_DIR=/var/data`.
5. **Disks → Add disk**: mount path `/var/data`, 1 GB. Without this the database resets.
6. Deploy, then add your custom domain under **Settings → Custom Domains** and point the DNS
   record they show you at your registrar.

### 3b. Railway / Fly.io

Same shape: Node buildpack, `npm ci` + `npm start`, environment variables as above, and a
persistent volume mounted at `/var/data` with `DATA_DIR=/var/data`.

### 3c. VPS (Ubuntu, DigitalOcean, Contabo, Hetzner)

```bash
# on the server
apt update && apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
mkdir -p /var/www/webent && cd /var/www/webent
# upload this pack (scp/rsync) or git clone, then:
npm ci --omit=dev      # dist/ is already built, so prod deps are enough
cp .env.example .env && nano .env     # SITE_URL, DATA_DIR=/var/www/webent/data, ADMIN_PASSWORD
```

`/etc/systemd/system/webent.service`:

```ini
[Unit]
Description=Webent
After=network.target

[Service]
WorkingDirectory=/var/www/webent
Environment=NODE_ENV=production
EnvironmentFile=/var/www/webent/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now webent
```

nginx reverse proxy (`/etc/nginx/sites-available/webent`):

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;
  client_max_body_size 1m;
  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/webent /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx && certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3d. cPanel / shared hosting ("Setup Node.js App")

1. Upload the pack into `~/webent` (File Manager → Upload → Extract).
2. **Setup Node.js App** → Create application: Node 20/22, application root `webent`,
   application URL your domain, startup file `server/index.js`.
3. Run NPM Install (or `npm ci --omit=dev`), then add the environment variables from §2
   (cPanel lets you paste them), and **Restart** the app.

### 3e. Static host only (Netlify / Vercel / GitHub Pages / plain Apache)

You can publish `dist/` on its own in about a minute — but the contact form will honestly
report *"couldn't send"*, because there is no API to receive it. If you must split the two,
host the API from §3a/§3c on a subdomain and add a proxy so the browser still sees one origin:

`netlify.toml`

```toml
[[redirects]]
  from = "/api/*"
  to = "https://api.your-domain.com/api/:splat"
  status = 200
  force = true
```

Because the form only claims success when the endpoint confirms it, a broken split deployment
is visible to you rather than to your customers — but the simpler fix is to keep both halves
on one Node host.

---

## 4. After the first deploy — checklist

- [ ] `SITE_URL` matches the live address exactly (https, no trailing slash) — check `/sitemap.xml`.
- [ ] `DATA_DIR` points at a persistent disk. Restart the app and confirm `/admin` still lists old enquiries.
- [ ] Set a real `ADMIN_PASSWORD`; `https://your-domain/admin` is the enquiry panel.
- [ ] Submit the contact form once from a phone, then check it appears in `/admin`.
- [ ] Add SMTP if you want the e-mail notification (optional; storage works without it).
- [ ] Confirm `https://your-domain/robots.txt` and `/sitemap.xml` return the live domain.
- [ ] Back up `data/webent.db` (cron: `sqlite3 webent.db ".backup /backups/webent-$(date +\%F).db"`).
- [ ] Node process owned by a non-root user; `.env` not readable by the web.

## 5. Changing content later

| Change | File | Rebuild? |
|---|---|---|
| Prices, registration fees, WhatsApp/email, the 80% offer label | `shared/business.json` | yes (`npm run build`) |
| Headlines and copy on any page | `src/pages/*.tsx` | yes |
| Colours, spacing, type | `src/styles/global.css` | yes |
| Domain, port, admin password, SMTP | `.env` / host environment | no — restart only |

## 6. Honest status of the pack

Built and tested in this workspace: all four pages, the animated hero, the ten-scene film,
the pinned statement, the pricing cards with the rolling 80% offer, the contact form
(validated, rate-limited, stored, reference number returned), `/admin`, `robots.txt`,
`sitemap.xml`, reduced-motion handling, 0 px horizontal overflow at 390 / 768 / 1440.

Not configured, because the details do not exist yet: SMTP sending, the production domain,
and a real `ADMIN_PASSWORD`. See `README.md` §9 for the full missing-information list.

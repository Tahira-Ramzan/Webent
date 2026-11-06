# Deploying Webent for free — what actually works

You asked: where can I host this for free, because `workers.dev` is not working.

Short answer: **Render's free plan** — it runs this exact project unchanged (website + working
contact form + `/admin`), and Render's free tier is the only one here that is fine for a
commercial site, has no bandwidth meter, and needs no credit card.
If you only need the site online *right now* and the form can wait, **Netlify** static upload
takes two minutes.

---

## 1. First: why `workers.dev` is failing

`workers.dev` is a *subdomain Cloudflare gives your account*, not a per-project setting. It fails
in three distinct ways, and the fix differs:

| What you see | What it means | Fix |
|---|---|---|
| Worker deploys, dashboard says **"No URLs enabled"**, no `*.workers.dev` address shown | Your account never got a workers.dev subdomain assigned | Register one at **Workers & Pages → your subdomain**, or contact Cloudflare |
| **"Subdomain is blocked"** (error `8000030`) or **error `10039`** when registering | Cloudflare has restricted subdomain creation on the account (new-account review, or a namesake abuse flag) | E-mail `abusereply@cloudflare.com` — or deploy somewhere else, which is faster |
| Browser says **`DNS_PROBE_FINISHED_NXDOMAIN`** / "site can't be reached" but the dashboard is green | Your DNS resolver is blocking `*.workers.dev` (a known ISP-level block in some regions) | Switch to encrypted DNS (1.1.1.1 / 8.8.8.8 over HTTPS), or use a host that isn't `workers.dev` |

It is worth 60 seconds to test which one you have: open your Worker URL on mobile data and on
Wi-Fi. **Only the third case** is your network — cases 1 and 2 are the account.

Two things to know before you switch:

- Cloudflare's **`pages.dev`** and **`workers.dev`**, and free hosts generally, are not the same
  domain, so if the block is your ISP, try a non-Cloudflare host.
- A Worker bound to **your own domain** bypasses `workers.dev` completely and keeps D1 (persistent
  data). A domain costs roughly PKR 1,500–3,000 a year — not free, but it is the cheapest permanent
  fix, and the free Cloudflare tier stays free.

---

## 2. Free options, compared for *this* project

| Host | Site | Working contact form | Persistent data | Commercial use | The catch |
|---|---|---|---|---|---|
| **Render** (free web service) | Yes | **Yes — unchanged** | SQLite on ephemeral disk | Allowed | Sleeps after ~15 min idle (~30–60 s cold start); database resets on redeploy/restart |
| **Netlify** (free) | Yes | Only static — form shows "could not send" | No | Allowed | 300 credits/month since Sep 2025 (≈15 GB bandwidth); project pauses at 0 credits |
| **Cloudflare Pages** (free) | Yes | No (static only) | No | Allowed | Unlimited bandwidth, but the form needs a Worker — and Workers is what's failing for you |
| **GitHub Pages** | Yes | No | No | Tolerated, not intended | Free and permanent, but no backend at all |
| **Vercel Hobby** | Yes | Functions possible | No | **Personal, non-commercial only** | A site selling web design is commercial — the wrong fit despite the good limits |
| **Koyeb / Zeabur / Cloud Run** | Yes | Yes (via `Dockerfile`) | Depends | Allowed | Card verification often required; free tiers smaller |

Deliberately excluded: Railway (no real free tier any more), Fly.io (free allowance removed for
new accounts), Heroku (no free tier), Deno Deploy (announced shutdown ~6 months after Oct 2026).

---

## 3. Recommended: Render, free plan

This project is already one Node process that serves both the website and the API
(`server/index.js`), so Render runs it with **no code changes**.

### Steps

1. Put the project on GitHub (private repo is fine).
2. Render → **New → Blueprint** → choose the repo. It reads `render.yaml` from this folder and
   creates one free web service named `webent`.
   *(No blueprint? New → Web Service, then: build `npm ci && npm run build`, start `npm start`.)*
3. Open the service → **Environment**:
   - `ADMIN_PASSWORD` — already generated for you; copy it, this is your `/admin` login.
   - `SITE_URL` — paste the URL Render gave you (e.g. `https://webent.onrender.com`), then redeploy
     so `robots.txt` and `sitemap.xml` point at the right place.
   - Optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` — then every enquiry is
     also e-mailed to you.
4. Visit `https://<your-service>.onrender.com` — the site is live, and
   `https://<your-service>.onrender.com/admin` is the enquiry list.

### Verified, not assumed

Run in this workspace on plain Node 20 in production mode (`npm ci && npm run build && npm start`),
same code Render runs:

```
/           200      /api/health     200   {"ok":true,"storage":"sqlite","adminPanel":"configured"}
/services   200      /robots.txt     200
/pricing    200      /sitemap.xml    200
/contact    200
/admin      200
POST /api/inquiries  → 201  {"ok":true,"reference":"WB-WWTQF3FD2",...}
POST /api/inquiries (same again) → 409 "already received (reference WB-WWTQF3FD2)"
GET /api/admin/inquiries (not signed in) → 401
POST /api/admin/login → 200, then the enquiry list returns the stored row
```

The free plan's honest limits, so nothing surprises you later:

- **It sleeps.** After ~15 minutes with no visitors the service stops; the next visit takes
  ~30–60 seconds to come back. Normal for free tiers.
- **The database is on ephemeral disk.** A redeploy, restart or awake-from-sleep can wipe stored
  enquiries. Two safe answers: configure the five `SMTP_*` variables so each enquiry is e-mailed to
  you the moment it arrives, or move to a paid instance type with a persistent disk (about $7/month)
  when enquiries start mattering.
- 512 MB RAM is plenty here — the site is static files plus a tiny SQLite file.

---

## 4. Quickest route: Netlify static upload (site only)

Use this if you want a public link today and will sort the form afterwards.

1. netlify.com → **Add new site → Deploy manually**.
2. Drag **`webent-pages-static.zip`** (or the `dist` folder) into the drop zone.
3. Done — a `*.netlify.app` address appears. Rename it under Site configuration → Change site name.

All four pages work. The contact form will say **"could not send"** and point people to WhatsApp,
because there is no server behind a static upload. It does not pretend to succeed.

If you want those form submissions mailed to you without running a server, say so — Netlify's
built-in Forms can do that (free tier: 100 submissions/month) and it is a small change to the
contact form and no backend at all.

---

## 5. Container hosts

`Dockerfile` in this folder is ready for Koyeb, Zeabur, Google Cloud Run, Fly.io or SnapDeploy:
it builds the site, runs the API, exposes port 8080 and mounts a `/data` volume for SQLite.
*Written but not built here — the authoring sandbox has no Docker daemon. The identical command
chain was verified on Node 20.*

```bash
docker build -t webent .
docker run -p 8080:8080 -e ADMIN_PASSWORD=yourpassword -e SITE_URL=http://localhost:8080 webent
```

---

## 6. Which should you pick?

- **You want it live in 5 minutes, form later** → Netlify static upload (§4).
- **You want the form working, cheapest possible, fine with 30–60 s cold starts** → Render free (§3).
- **You are going to keep this as a business site for years** → buy a domain (~PKR 1,500–3,000/yr),
  attach it to the Cloudflare Worker (or to Render), and the `workers.dev` problem disappears while
  your data stays persistent.
- **You want zero servers and zero databases, and 100 enquiries/month is plenty** → Netlify static
  plus Netlify Forms — ask me and I will wire it.

Files involved: `render.yaml` (free plan blueprint), `Dockerfile` + `.dockerignore` (container
hosts), `webent-pages-static.zip` (static upload), `cloudflare/` (Cloudflare path, if their account
starts working or you attach a domain).

---

## 7. Any host at all — the `portable/` folder

If you do not want to choose a platform, upload **`portable/`** (or `webent-anyhost.zip`) to
whichever host you already pay for. It contains the site plus a PHP backend, so on Hostinger,
cPanel or any Apache/LiteSpeed box the contact form and `/admin` work with no terminal and no
database: copy `api-config.sample.php` to `api-config.php`, set a password, done. The same folder
also carries `.htaccess`, `nginx.conf.example`, `netlify.toml` and `vercel.json`, so static hosts
serve it correctly too (form switched off there, honestly so). Details: `portable/README.md`.

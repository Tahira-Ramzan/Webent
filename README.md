# Webent — website design studio site

A complete, working website for **Webent**: landing pages, one-page websites and multi-page
websites. React + TypeScript on the front, Express + SQLite behind it, with a real contact-form
submission flow, a private owner area and configurable WhatsApp / email contact.

| | |
|---|---|
| Business name | **Webent** (taken from the supplied logo) |
| Email | webentstudio@gmail.com |
| WhatsApp | +92 370 3427722 (`wa.me/923703427722`) |
| Prices | Landing Page **PKR 3,000** · One-Page Website **PKR 4,000** · Multi-Page Website **PKR 10,000** (+ registration fee **PKR 500 / 1,000 / 3,000**, non-refundable) |

---

## 1. Quick start (development)

```bash
npm install
cp .env.example .env          # then set ADMIN_PASSWORD (and SMTP_* only if you want email alerts)
npm run dev                   # API on :8787 + Vite on :5173
```

Open <http://localhost:5173>.

Other scripts:

```bash
npm run dev:api     # API only
npm run dev:web     # front-end only (proxies /api to :8787)
npm run typecheck   # TypeScript, no emit
npm run build       # production bundle into dist/
npm start           # production: Express serves dist/ + /api on PORT (NODE_ENV=production)
```

## 2. Production deployment

1. `npm ci && npm run build`
2. Set environment variables on the host (see `.env.example`):
   `PORT`, `SITE_URL` (your real domain — used for canonical URLs, `sitemap.xml`, `robots.txt`),
   `DATA_DIR` (writeable folder for the database), `ADMIN_PASSWORD`, optional `SMTP_*`.
3. `NODE_ENV=production npm start`
4. Point your domain at the server, terminate TLS at the proxy (nginx, Caddy, Fly, Railway, Render…).
   Because `NODE_ENV=production`, the admin session cookie is issued with the `Secure` flag — the
   site must therefore be served over HTTPS for owner sign-in to work.
5. `data/webent.db` is the database. Back it up; never expose `data/` as static content.

Any Node host works (the database is a single file). Docker/PM2/systemd: run `npm start` as the
service command.

## 3. Where to change things

| What | File |
|---|---|
| Business name, logo paths, email, WhatsApp number, services & prices | `shared/business.json` (single source of truth; the server validates against it) |
| Typed client config + link builders (`whatsappLink`, `mailtoLink`, `inquiryPath`) | `src/config/site.ts` |
| Copy for the homepage, FAQ, services, privacy policy | `src/pages/*.tsx` |
| Colours, type scale, spacing, animations | `src/styles/global.css` (`:root` tokens at the top) |
| API routes, validation, rate limits, admin | `server/index.js` |
| SQLite schema and queries | `server/db.js` |
| Optional email notification | `server/mailer.js` |

Prices are defined once (`shared/business.json`) and read by the front-end **and** the server, so a
price change cannot drift out of sync between the pricing cards and the stored inquiry.

### Offer, registration fee and the countdown

The 80% offer is configured in **one place** — `shared/business.json` → `offer`:

```json
{ "enabled": true, "label": "80% off", "discountPercent": 80,
  "mode": "rolling", "cycleHours": 24, "cycleAnchor": "2026-01-01T00:00:00Z" }
```

* **`mode: "rolling"` (current)** — the badge and the discounted prices are always live. The
  countdown is a 24-hour cycle measured from `cycleAnchor`, computed from the visitor's clock on
  every tick: when it reaches `00:00:00` it starts again from `23:59:59` by itself. Nothing is
  stored, nothing expires, and every visitor sees a running clock. Change `cycleHours` (e.g. `48`)
  to make the cycle longer.
* **`mode: "fixed"`** — use a single `endsAt` date instead; the badge disappears and the standard
  price (`wasPrice`) applies once that date passes.
* `enabled: false` removes the badge, the struck-through prices and the discount wording everywhere
  (frontend and API validation both read this flag).

Prices are the discounted figures and are **not** touched by the countdown:
Landing Page **PKR 3,000** (+ PKR 500 registration), One-Page Website **PKR 4,000** (+ PKR 1,000),
Multi-Page Website **PKR 10,000** (+ PKR 3,000). Registration fees are non-refundable and are shown
in every box, with the "total to start" figure underneath and in the WhatsApp message.

### Free domain and free hosting

Wording lives in `shared/business.json` → `includes` and is rendered by one component
(`src/components/Included.tsx`), so it cannot drift between pages:

> **Free domain** · **Free hosting** · **No paid hosting or paid domain set up**
> Free domain and free hosting are included with every package. Paid hosting plans and paid domains
> are not provided or set up — only free hosting and a free domain.

Shown on: both pricing card views (small tags on each card), the pricing section on the home page,
the Pricing page, the Services page, the Contact page, a reason block on the home page and the FAQ
("Do you provide the domain and hosting?"). The old FAQ line that said a domain and hosting were
"agreed separately" has been replaced, because it contradicted this.

## 4. Pages

| Route | Contents |
|---|---|
| `/` | Hero, service cards, chapters 01–05, how it works, why, FAQ, final CTA, footer |
| `/services` | One section per service: interactive layout demo, description, price, inquiry + WhatsApp buttons |
| `/pricing` | Three packages with exact prices; each select button opens the form pre-selected |
| `/contact` | Validated inquiry form, direct contact block, "what happens next", service list |
| `/privacy` | Editable privacy policy with a boxed list of items needing owner approval |
| `/admin` | Owner sign-in + stored inquiries (server-enforced session, `noindex`) |

## 5. Contact form — how it actually works

```
Browser ──POST /api/inquiries──▶ Express ──▶ validation ──▶ SQLite (data/webent.db)
                                          └─▶ optional SMTP notification
```

* **Stored for real.** Each accepted inquiry is written to SQLite with name, email, phone, selected
  service (name + price), requirements, submission timestamp, hashed IP, user agent and the email
  notification status. Success is only shown after the server returns `201` with a reference
  (`WB-…`), which is the stored row's reference — not a decoration.
* **Validated twice.** Client-side for fast feedback, server-side as the actual guard (types,
  lengths, email format, service id must exist in the canonical service list).
* **Spam / abuse handling.** Hidden honeypot field, a minimum 2.5 s fill time, a sliding-window rate
  limit of 6 accepted submissions per IP per 15 minutes, and a duplicate guard (same email +
  service within 2 minutes returns `409` with the existing reference).
* **Repeated submissions.** The submit button disables while in flight, the form is replaced by a
  success panel, and re-submitting identical data is rejected by the duplicate guard.
* **Failure handling.** `422` field errors are mapped back onto the inputs; `429`, `409`, `5xx` and
  network failures each render a specific message plus a WhatsApp fallback.
* **Nothing is publicly readable.** There is no public endpoint that lists inquiries.

### Email notifications — **NOT configured on this deployment**

The stored record is always real. The *email alert* to the business is a separate function and only
runs when `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_TO` exist in the server
environment. With no SMTP settings the API returns `emailNotification: "not_configured"` and stores
that status on the row, which the admin list displays. Nothing claims an email was delivered.

To enable: add the SMTP values from your mail provider to `.env` (for Gmail use an App Password,
not your account password) and restart. Credentials stay on the server; nothing reaches the browser.

### Admin panel

`/admin` is real, not a mock: `POST /api/admin/login` checks the password against a bcrypt hash made
from `ADMIN_PASSWORD` at boot, creates a 32-byte session token stored (hashed) in SQLite, and sets it
as an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production, 8 h expiry). `/api/admin/inquiries`
requires that session. If `ADMIN_PASSWORD` is empty the panel returns `503` and the page explains how
to enable it — it never pretends to work.

Owner config editing (changing prices from the panel) is **not** implemented; prices live in
`shared/business.json` and change with a redeploy.

## 6. WhatsApp & email integration

All WhatsApp links are built by `whatsappLink(serviceId)` in `src/config/site.ts` from the number in
`shared/business.json`, URL-encoding a message such as:

```
Hello Webent, I am interested in your Multi-Page Website at PKR 10,000 plus the PKR 3,000 registration fee. I would like to discuss my website requirements.
```

`https://wa.me/923703427722?text=…` opens WhatsApp with the message pre-filled — the visitor reviews
and presses send. Nothing is sent automatically. Email links use `mailto:webentstudio@gmail.com`.
WhatsApp entry points: header, mobile menu, hero section, every service card, every pricing card,
services page, contact page, footer and a mobile floating button.

To change the number, edit `shared/business.json` (`countryCode` + `nationalNumber` + `display`).
Set `site.whatsapp.enabled = false` in `src/config/site.ts` to hide WhatsApp everywhere (the buttons
are currently always rendered; disabling requires wrapping them or removing the number).

## 7. Design & animation notes

Visual direction follows the reference sites' *principles* — a dark ink base, oversized uppercase
grotesk headlines with an italic accent word, mono annotation labels, hairline rules, numbered
chapters, alternating dark/paper sections, drafting-style line illustrations and generous
whitespace. All copy, layouts, illustrations and code are original to Webent; nothing from the
reference brands is reused.

* **Type:** three self-hosted faces in `public/fonts/` (~140 kB total, preloaded, `font-display: swap`),
  no CDN or Google Fonts request at runtime:
  * **Syne** (variable 400–800, `syne-latin.woff2`) for every display heading, set uppercase at 800
    with `-0.028em` tracking. Syne is a deliberately odd, wide-shouldered geometric face — the
    headlines read as *designed type* rather than default web type, which a neutral grotesk (and the
    earlier Bricolage Grotesque attempt, now removed) did not.
  * The accent word in each headline is the same face at weight 500 in lime: the stroke contrast
    alone separates it, no faux italic and no second family.
  * **Geist** (variable) for body copy and UI, **Geist Mono** for every micro-label, price note,
    caption, countdown and footer line.
  * Licences: Syne, Geist and Geist Mono are all SIL OFL 1.1 — free for commercial use, files included.
* **The title strip (`Header.tsx`):** the navigation is a fixed hairline *title strip*, not a bar with
  pills — a logo cell, a rule, then numbered cells (`01 Home` … `04 Contact`) separated by vertical
  hairlines, each with a lime underline rule that scales in on hover/active, a spacer, a solid lime
  WhatsApp cell and a burger. It compresses 76 px → 60 px on scroll and carries a lime scroll-progress
  hairline along its bottom edge. Under 1000 px it collapses into a full-screen menu that reveals with
  a `clip-path` wipe.
* **The film (`Film.tsx` + `lib/film.ts`):** a dependency-free 3D point engine showing
  **ten things that define a business**: `STOREFRONT · SIGN · COUNTER · LIST · PARCEL · PRICE · PIN ·
  HOURS · BELL · NAME`. Nothing in the sequence is decorative — each frame is an object every small
  business already owns (a front, a name above the door, the counter, the list of what you sell, the
  parcel that leaves, the price anyone can read, the place on the map, the hours, the bell over the
  door), and the tenth frame is the page that carries all nine: the wordmark, drawn as a dot matrix.
  * **Real bodies, not cards.** Every drawing is authored flat and then *extruded* (`volume()`):
    a front face, a back face and the edges that join them, so the camera has something to orbit.
    Depth is per scene (a 0.9-deep counter, a 0.1-thin tag), which is why some frames read as wire
    boxes and others as paper.
  * **A room, not a void.** A projected floor grid (`floorLines()`) recedes to the horizon behind the
    object and fades with distance, and points are sized and brightened by their depth factor, so the
    object reads as standing in space.
  * **Camera.** One perspective camera (`project()`, focal 3.1) with per-scene yaw/pitch/zoom plus a
    slow drift, so no two frames sit at the same angle.
  * **Hand-over.** Each object holds for ~58% of its slice of the scroll and then dissolves into the
    next — the outgoing cloud shrinks very slightly as it goes. The finale (the wordmark) is
    cross-faded the same way, because point-for-point morphing between a bell and a word only ever
    produced a tangle.
  * **Read-out.** A ten-line index on the right edge names the whole sequence and lights the current
    line, with the count, caption and note bottom-left, and a lime progress hairline beneath.
  * It runs in two modes: `scroll` (a 320 vh sticky room on the home page; 220 vh on a phone) and
    `hero` (a slow backdrop loop in the arrival room). `prefers-reduced-motion` collapses it to one
    static frame per scene.
* **Room rhythm:** section padding runs `clamp(122px, 17vw, 252px)` and every section head keeps
  `clamp(64px, 9vw, 132px)` of air beneath it, so each room opens and closes on whitespace instead of
  stacking. Section titles are set at `clamp(2.35rem, 5.7vw, 5.05rem)` in Syne 800 with a measure of
  `min(100%, 47rem)` so they break in two or three lines instead of five — they read as room
  titles from across the page, which is why no extra `Section` label is needed on top of them.
* **The pinned statement (`PinnedStatement.tsx`):** "Built like it matters." sticks for 260 vh while the
  characters light up in turn (0 → 44% of the scroll), holds at full opacity while the lime bloom on
  the last characters finishes (44% → 80%), and only then lifts away over the last fifth. Earlier the
  block started dissolving at 58% while characters were still lighting, so the words left the screen
  mid-glow.
* **The lime room:** "How it works" is the one room that inverts the palette — solid lime, ink type,
  the accent word drawn as a hairline outline instead of a fill, and ink hairlines between the steps.
  It exists so the tour changes temperature halfway through instead of alternating two greys.
* **FAQ as a room, not a list:** a sticky left column (room title, answer count, "ask something else"
  link) beside a rail of numbered rows on hairlines, questions in Syne, a lime rail that draws down
  whichever row is open, a warm tint on hover, and the answer indented behind an "A" mark — same disclosure
  behaviour (one open at a time, keyboard operable, `aria-expanded`/`aria-controls`) with the visual
  weight of a chapter.
* **Phone title strip:** below 1000 px the four numbered cells are replaced by the name of the room
  you are standing in (`• ROOM TWO · CHOOSE YOUR WEBSITE`) plus a row of tour ticks — one per station,
  the ones behind you dimmed lime and the current one wide and bright — read from the nearest section
  label as you scroll, followed by the chat cell and the menu. The strip never opens a sideways scroll —
  `html, body { overflow-x: clip }` guards the arrow decorations that sit outside the frame.
* **Rooms:** every page is a numbered room (Home 01, Services 02, Pricing 03, Contact 04) and every
  home section is a room inside it — dark ink rooms and paper rooms alternate, the film room owns a
  whole screen, and the giant outlined room numeral sits in the corner of each inner-page header.
* **Drafting illustration (`DraftElevation`):** the home page carries a technical elevation drawing
  of a website drawn the way an architect draws a building — hairline facade, window grid as content
  blocks, stipple-shaded cast shadow, procedural bare trees (recursive strokes, not an image),
  corner registration marks, dimension strings ("1440 PX") and a lime accent square. It is inline
  SVG: ~6 kB, no image request, and the line work draws itself as the sheet scrolls into view.
  Phones get a tighter crop with the micro-annotation removed so the drawing stays legible.
* **The layout drawing (`LayoutDemo`):** each product figure is drawn as a sheet pinned to a board —
  dotted board, lime registration marks, a `FIG. A / B / C` specimen line, then the page itself on
  paper: Syne headline, mono kicker, a hatched image plate with a lime bloom, numbered cards, and one
  lime action band. A slow specular sweep crosses the sheet. Blocks are labelled only while pointed
  at (`Headline`, `Buttons`, `Media`…), so the drawing rests quiet. `Wide / Narrow` re-sizes the
  sheet; on the multi-page variant the demo navigation switches pages. Nothing is a screenshot of
  client work.
* **Phone trims:** below 760 px the drawing always shows the narrow sheet, drops the URL bar, support
  copy, image plate, card captions and hint line; the chapter rail is hidden below 1180 px; the
  elevation loses its dimension notes and foot labels; the "free domain / free hosting" tick row is
  dropped from the pricing block (the chips are already printed on every card, and the boundary
  sentence stays); price-card notes and the two money cells in the footer are dropped as well.
* **Arrow language (five behaviours, all guarded):**
  1. **Sketch-draw** — every arrow path is normalised with `pathLength="1"`, so hovering a button
     redraws the arrow from tail to tip in 0.5 s (`stroke-dashoffset` animation). The arrow looks
     like it is being pencilled in as you reach for it.
  2. **Magnetic compass** — while the pointer is inside a button, its arrow leans towards the cursor
     (5 px pull, rotation clamped to ±20°) and returns to rest on leave.
  3. **Iron-filing field** — the closing band carries a grid of arrows (`ArrowField`): each one
     swings to point at the pointer, the nearest ones grow and brighten, and it settles into a slow
     idle drift when the pointer is gone. One SVG, transform-only, paused when off-screen.
  4. **Cursor trail** — five echo arrows follow the cursor with decreasing lag, rotation and opacity,
     then fade out when the pointer rests.
  5. **Click burst** — pressing any button releases six arrows from the click point (Web Animations
     API, removed on finish).
  All five are desktop-pointer only and disabled under `prefers-reduced-motion`.
* **Scrolling:** `Lenis` inertial scrolling (MIT, ~7 kB) runs the whole site for precise pointers
  only — touch devices keep native scrolling, and `prefers-reduced-motion` turns it off entirely.
  Anchors and route changes scroll through Lenis so the two never fight.
* **Motion system (no GSAP, no animation library beyond Lenis):**
  * *Small* — pointer tilt with a cursor-tracking spotlight on service/pricing cards, a lime arrow
    that trails the cursor with a live `X / Y PX` readout, arrow nudges that leave and re-enter,
    two-label slide swaps, nav underline, FAQ answer settle.
  * *Medium* — headline words rise out of masked lines, staggered card and reason reveals, clip-wipe
    figures, hairline rules drawn under section labels, arrow dividers whose curve and arrowhead
    draw in on scroll, a marquee that accelerates with scroll velocity, reading-progress line.
  * *Large* — cinematic hero entrance, the pinned "BUILT LIKE IT MATTERS." statement (characters
    light up one by one as the page scrolls, then dissolve), the drafting elevation drawing itself,
    the footer wordmark filling in from outline to solid, editorial chapter rail on the right.
  * Driver: one shared `IntersectionObserver` (`src/hooks/useReveal.ts`) plus rAF helpers in
    `src/hooks/useMotion.ts`. Everything animates `transform`, `opacity`, `clip-path`,
    `stroke-dashoffset` or `filter` only — no layout thrash, no scroll hijacking of page content.
  * Mobile: parallax, tilt, the chapter rail and the cursor companion are switched off; the pinned
    statement collapses to a static block; only cheap opacity/transform reveals run.
* **Footer (`sheet-footer`):** a hairline title-block grid — studio statement, page and package
  columns, email, WhatsApp, starting price, back-to-top, then a full-width drafting wordmark that
  fills from outline to solid as it enters, a ruler strip and a mono copyright bar. The floating
  WhatsApp pill steps out of the way whenever a package button or the footer is on screen.
* **Graceful degradation:** reveal states are added only after JS sets `html.has-reveal`. Without
  JS, or with `prefers-reduced-motion: reduce`, all content is visible and static.
* **Performance:** no images beyond the logo and the inline SVG; the demos are HTML and CSS.
  Bundle ≈ 273 kB JS (82 kB gzip), 76 kB CSS (16 kB gzip), fonts 84 kB.
* **Motion preview:** `docs/motion-preview.gif` (hero entrance + scroll reveal) and
  `docs/motion-preview.webm` (full scroll-through, including the pinned statement and footer).

## 8. Accessibility & SEO implemented

Skip link, keyboard-operable navigation and accordions with correct `aria-expanded`/`aria-controls`,
focus trap + Escape close in the mobile menu, visible focus rings, labelled fields with
`aria-invalid`/`aria-describedby` and `role="alert"` error text, ≥4.5:1 text contrast on both themes,
reduced-motion support, per-route `<title>`/description/canonical/OG tags (`usePageMeta`),
`noindex` on `/admin`, semantic landmarks, descriptive `alt` text and `role="img"` labels on the
CSS/HTML layout demos, plus `sitemap.xml` and `robots.txt` served by the API.

Set `SITE_URL` (server) and optionally `VITE_SITE_URL` (build) to your real domain so canonical URLs
and the sitemap are absolute and correct.

## 9. Missing information / before you publish

1. **Business name spelling.** "Webent" is taken from the supplied wordmark; confirm capitalisation
   and whether a legal/registered name should appear in the footer.
2. **Logo file.** The supplied file is a 1080×1080 PNG with the logo on a dark plate. It is used
   as-is; a transparent-background copy (`webent-wordmark-transparent.png`) was derived pixel-for-pixel
   from it (identical colours and geometry, background removed) so the mark sits cleanly on the dark
   layout. A vector (SVG/AI/EPS) version would be better for print and retina — please send one if
   you have it.
3. **Privacy policy approval.** The policy is drafted from what the site actually does, but it needs
   your sign-off — especially the retention period (none is set), whether email notifications will
   be enabled, and any legal entity details. The page shows a "needs owner approval" box listing
   exactly these items; delete the box once confirmed.
4. **Scope wording.** The FAQ and the pricing notes say anything outside the published price (domain,
   hosting, extra pages) is agreed separately before work starts. That is a process statement, not a
   promise of what is included — confirm you are happy with it.
5. **Email notifications** are off until SMTP credentials are added.
6. **Admin password** must be set (a demo value is in `.env`, which is git-ignored — replace it
   before going live).
7. Not invented, therefore absent: physical address, social profiles, delivery timelines, revision
   policy, payment methods, client names/logos/testimonials, team details, statistics.
8. No analytics, cookie banner or third-party trackers are installed. Add them (and update the
   privacy policy) if you want them.

## 10. Test results

See [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) for the feature-by-feature matrix of what was
actually executed in this environment, and what still needs configuration.

## 11. Project structure

```
shared/business.json     canonical business + service data (client & server)
server/
  index.js               API, validation, rate limits, admin, SEO files, static hosting
  db.js                  SQLite schema, queries, sessions, rate limiting
  mailer.js              optional SMTP notification
src/
  config/site.ts         typed config + WhatsApp/mailto/path helpers
  components/            Header, MobileNav(drawer), Footer, ServiceCard, PricingCard, Faq,
                         ContactForm, LayoutDemo, Offer/PriceBlock, Marquee, Reveal, SplitWords,
                         ChapterRail,
                         ScrollProgress, Icons
  hooks/                 useReveal / useScrolled / useParallax, useMotion (tilt, parallax
                         layers, progress, count-up), usePageMeta
  pages/                 Home, Services, Pricing, Contact, Privacy, Admin
  styles/global.css      design tokens, layout, components, animation, responsive, motion prefs
docs/screenshots/        captured desktop / tablet / mobile views
scripts/dev.js           runs API + Vite together
```

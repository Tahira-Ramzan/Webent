# Test results

Everything below was executed against the running app in this environment (Chromium 133 via
Playwright, Node 20.20.2, SQLite). "PASS" means observed in the browser or via the live API, not
assumed.

## 1. Pages & navigation

| Check | Result | Evidence |
|---|---|---|
| `/` renders (hero, 5 chapters, services, how it works, why, FAQ, CTA, footer) | PASS | `docs/screenshots/01-home-hero.png` … `07-home-cta.png` |
| `/services` renders three service sections with prices | PASS | `08-services.png` |
| `/pricing` renders three packages, prices exact | PASS | `09-pricing.png` |
| `/contact` renders the form, direct-contact block, next-steps | PASS | `10-contact.png`, `16-mobile-contact.png` |
| `/privacy` renders editable policy + approval box | PASS | `11-privacy.png` |
| `/admin` renders sign-in / empty state / inquiry list | PASS | `e2e-admin` run |
| Unknown route redirects to `/` | PASS | `Navigate` fallback |
| Header links + active state, desktop and mobile drawer | PASS | `13-mobile-home.png`, `14-mobile-menu.png` |
| Mobile drawer opens, closes on Escape, closes on navigation, traps focus, locks scroll | PASS | keyboard test in the e2e script |
| Route change resets scroll (including `?service=` links from pricing) | PASS | measured `scrollY = 0` after clicking a pricing card |
| No console or runtime errors on any page | PASS | `pageerror`/`console` listeners returned `[]` |

## 2. Prices & business information

| Check | Result |
|---|---|
| Landing Page shows `PKR 3,000` everywhere | PASS (home cards, pricing page, services page, contact dropdown, WhatsApp message, stored record) — plus the PKR 500 registration fee |
| One-Page Website shows `PKR 4,000` | PASS |
| Multi-Page Website shows `PKR 10,000` | PASS |
| No crossed-out prices, discounts, countdowns or subscriptions | PASS (none present in code) |
| Server validates against the same price list as the front-end | PASS (`shared/business.json`) |
| Email links use `mailto:webentstudio@gmail.com` | PASS |
| WhatsApp links use `https://wa.me/923703427722?text=…` | PASS |
| No invented address, socials, stats, testimonials or client work | PASS |

## 2b. Offer, registration fee and countdown

| Check | Result | Detail |
|---|---|---|
| Offer price shown on all three cards | PASS | PKR 3,000 / 4,000 / 10,000 (`effectivePrice`) |
| Standard price struck through while the offer is live | PASS | PKR 15,000 / 20,000 / 50,000, `<s>` with a screen-reader "Standard price" prefix |
| Countdown is live, not a static badge | PASS | read twice — 23:54:00 then 23:43:49 |
| Countdown respects the configured end date | PASS | driven by `offer.endsAt` in `shared/business.json`; `isOfferLive()` flips the price back to `wasPrice` when it passes |
| Registration fee shown per card | PASS | + PKR 500 / 1,000 / 3,000, marked non-refundable |
| Total to start calculated | PASS | PKR 3,500 / 5,000 / 13,000 |
| Card heights and price rows align across the grid | PASS | all three 616 px, price rows on one line |
| Contact dropdown quotes the price charged today | PASS | "Landing Page — PKR 3,000" |
| WhatsApp message quotes price + fee | PASS | "…Landing Page at PKR 3,000 plus the PKR 500 registration fee…" |
| Inquiry stores the price the visitor saw | PASS | API + SQLite row `service_price = 3000`; server uses the same helper as the browser |
| Offer can be switched off in one place | PASS | `offer.enabled: false` removes badge, strike-through and countdown |

## 3c. Interactive layout demos

| Check | Result | Detail |
|---|---|---|
| Hero, chapter 01, all three gallery rows, "why" block, chapter 05 and every service section use `LayoutDemo` | PASS | 0 `BrowserMockup` references left |
| Desktop ⇄ Phone toggle reflows the same page | PASS | screen width morphs to a 300 px frame, cards and split stack to one column |
| Hover/focus labels identify each block | PASS | zone outline + label chip (Headline, Supporting line, Buttons, Media, Sections) |
| Multi-page demo navigation switches panels | PASS | Home / Services / Contact panels |
| Keyboard: toggle buttons and demo nav reachable, `aria-pressed` / `aria-current` set | PASS | tab order verified |
| Demo is not mistaken for client work | PASS | caption bar on every demo states it is a layout preview |
| No layout shift when toggling | PASS | 0 px horizontal overflow at 390 / 820 / 1440 while toggling |

## 2c. Rolling 80% offer and the free domain / hosting wording

| Check | Result |
| --- | --- |
| Offer is always live | **PASS** — `mode: "rolling"` in `shared/business.json`; `isOfferLive()` returns true for any date (checked 2026-11-05, 2026-11-06 and 2030-01-01) |
| Countdown restarts by itself | **PASS** — remaining time is derived from the clock as `cycleMs - ((now - anchor) mod cycleMs)`; sampled 23:59:59 → 00:00:01 → 00:00:00 → 24:00:00 wrap without any stored state, and the badge keeps ticking (`Ends in 16:34:19` observed in the browser) |
| Prices never change with the clock | **PASS** — cards show 3,000 / 4,000 / 10,000 at every point of the cycle; `wasPrice` stays struck through |
| Server agrees with the browser | **PASS** — `server/index.js` `offerLive()` uses the same rolling rule, so API validation, admin rows and the WhatsApp message all quote the discounted price |
| Free domain + free hosting wording | **PASS** — one source (`shared/business.json` → `includes`), rendered on Home (pricing strip, reason block, FAQ), Pricing (cards + strip + FAQ), Services and Contact |
| "No paid hosting / paid domain" boundary | **PASS** — stated in the strip sentence, the FAQ answer and the old contradictory line removed |
| Wording is a claim supplied by the owner | **NOTE** — free domain and free hosting are the owner's stated terms; no provider, plan or renewal detail is claimed anywhere on the site |

## 3. Contact form (functional)

| Check | Result | Detail |
|---|---|---|
| Service dropdown lists the three services with exact prices | PASS | `Landing Page — PKR 3,000` … |
| Pricing "Select" pre-selects the service in the form | PASS | `/pricing` card 2 → `#serviceId = one-page-website` |
| Required-field validation blocks empty submit | PASS | 4 field errors, focus moved to first invalid field |
| Email format validation | PASS | "Enter a valid email address, e.g. you@example.com." |
| Phone validation | PASS | min 7 digits, allows `+`, spaces, dashes |
| Requirements minimum length | PASS | 20 chars, counter shown |
| Loading state while submitting | PASS | spinner + "Sending…", button disabled |
| Success only after the endpoint confirms | PASS | success panel shows stored reference `WB-…` and server timestamp |
| Inquiry actually stored | PASS | row present in SQLite, visible in `/admin` |
| Duplicate submission guard | PASS | second identical POST → `409`, message quotes existing reference |
| Rate limiting | PASS | 7th accepted submission in 15 min → `429` with WhatsApp fallback message |
| Honeypot filled → silently ignored | PASS | `202` with `reference: null`, nothing stored |
| Bot-speed submission rejected | PASS | `< 1200 ms` → `400` with "That was submitted a little too quickly. Please press send once more." |
| Server-side validation is authoritative | PASS | invalid payload → `422` with per-field errors |
| Failure messages are specific (409/422/429/5xx/network) | PASS | distinct copy per case |
| No public endpoint exposes inquiries | PASS | `/api/admin/inquiries` → `401` without session |

## 3b. Motion & interaction (rewritten animation layer)

| Check | Result | Detail |
|---|---|---|
| Hero headline rises word by word from masks | PASS | 7 masked words, 58 ms stagger, `translateY(118%) → 0` with 4° rotation; `docs/motion-preview.gif` |
| Eyebrow tracking settles in | PASS | `letter-spacing .5em → .24em`, 1.2 s |
| Browser mockup lifts in 3D on load | PASS | `rotateX(16°) scale(.94) → 0/1`, 1.5 s, then slow 9 s float |
| Ambient glow orbs drift | PASS | two blurred radial layers, 26 s / 32 s loops |
| Scroll-linked parallax on the hero stage | PASS | `--p` (-1…1) written per frame by one rAF loop; measured transform changes while scrolling |
| Section headlines reveal on scroll | PASS | same mask system, triggered by `IntersectionObserver` |
| Cards reveal with stagger | PASS | `--reveal-delay` × 80 ms |
| Figures wipe in and settle from a 5 % zoom | PASS | clip-path on the child, transform on the mockup |
| Hairline rules draw under section labels | PASS | `scaleX(0 → 1)`, 1 s, 280 ms delay |
| Chapter rail tracks 01–05 | PASS | active item changed 01 → 02 → 03 → 04 → 05 while scrolling; hidden below 1180 px / 660 px height |
| Reading-progress line | PASS | `scaleX` 0 → 1, matches scroll position |
| Pointer tilt + spotlight on cards | PASS | measured `--rx 2.4°`, `--ry 2.6°` at the card's top-right; disabled on touch and reduced motion |
| Button fill sweep + arrow nudge | PASS | CSS only |
| Price figures count up when visible | PASS | 3,000 / 4,000 / 10,000 final values; screen readers get the final number immediately |
| FAQ answer text settles | PASS | opacity + 8 px rise on open |
| No horizontal overflow introduced | PASS | 0 px at 390 / 820 / 1440 |
| No console or page errors on any route | PASS | `[]` |
| Reduced motion: nothing hidden or clipped | PASS | 0 hidden words, 0 clipped mockups, 0 invisible reveals; all animations `none` |
| Mobile: parallax/tilt/rail disabled | PASS | rail `display:none`, hero parallax off ≤860 px, phone mockup hidden ≤640 px |
| Animations never block input | PASS | form submit, links, accordion and menu all operated during the animation run |

Note: the first implementation clipped the figure itself with `clip-path`, which makes Chrome report an
empty intersection rect — the reveal observer never fired and the figures stayed invisible. The clip
now sits on the mockup inside the observed element.

## 3d. Typography, scrolling, footer and illustration (latest pass)

| Check | Result |
| --- | --- |
| Self-hosted fonts load with no network | **PASS** — Geist + Geist Mono woff2 served from `/fonts/`, no Google Fonts or CDN request; `document.fonts` reports both families loaded |
| Display type uses the new stack | **PASS** — 1440 px hero measures `Geist` at 600 weight, uppercase; labels and captions measure `Geist Mono` |
| Lenis inertial scroll | **PASS (desktop pointers only)** — `html.lenis` classes appear; disabled for `(hover: none)`, `(pointer: coarse)` and reduced motion; anchor + route scrolling routed through `lenis.scrollTo` |
| Pinned statement | **PASS** — `.pin` is 210 vh, stage sticks at `top: 0`; characters switch from `opacity .16` to `1` progressively (sampled 0 %, 40 %, 72 % scroll progress), caption fades, block dissolves after 62 % |
| Arrow dividers | **PASS** — `stroke-dashoffset` of line and arrowhead driven by scroll progress; fully drawn once the divider is a third up the viewport |
| Marquee scroll velocity | **PASS** — `--boost` var rises on fast scroll and decays, animation-duration 38 s → 12 s |
| Drafting elevation | **PASS** — inline SVG, no image request; line work draws on scroll; trees fade in after 35 % progress; lime accents and dimension strings render; compact crop under 700 px hides micro-annotation |
| Footer wordmark fill | **PASS** — `--fill` reaches 1 at page bottom; outline-to-solid clip advances with scroll |
| Floating WhatsApp clearance | **PASS** — pill gets `.is-hidden` while a `.price-card__actions` block is >45 % visible (measured at 390 px on `/pricing`); returns afterwards |
| Price count-up settles | **PASS** — 3,000 / 4,000 / 10,000 exactly after 780 ms; `<span class="sr-only">` carries the true price throughout |
| Reduced motion | **PASS** — `.pin` collapses to auto height with all characters visible, footer fill forced to 1, Lenis never initialises, cursor companion hidden, marquee static |
| Horizontal overflow at 1440 / 820 / 390 | **PASS** — 0 px on `/`, `/services`, `/pricing`, `/contact` at all three widths |
| Console / page errors after the change | **PASS** — none on any route, any width |
| Contact form after the scroll/typography change | **PASS** — real `POST /api/inquiries` → 201, reference returned by the server, row stored, success state only after confirmation |
| Build | **PASS** — `tsc --noEmit` clean; `vite build` 273 kB JS (82 kB gzip), 76 kB CSS (16 kB gzip) |

## 3e. Display type and the arrow behaviours (latest pass)

| Check | Result |
| --- | --- |
| Display face is not the default grotesk | **PASS** — every `.display` / `.h2` measures `Syne` at 800, `-0.028em` tracking, on all four routes and all three widths |
| Accent word uses a real condensed cut | **PASS** — `.accent` renders the same variable family at `wdth 82`; no synthetic oblique anywhere (checked computed `font-style` = normal, `font-stretch` = 82%) |
| Fonts self-hosted | **PASS** — three woff2 files in `public/fonts/`, no Google Fonts or CDN request; all three preloaded |
| Paper + phone rendering | **PASS** — 0 px overflow at 1440 / 820 / 390 on `/`, `/services`, `/pricing`, `/contact` |
| Sketch-draw arrows | **PASS** — on hover `stroke-dashoffset` animates 1 → 0 (sampled 0.12 after 90 ms, resting at 0); `pathLength="1"` present on all arrow paths |
| Magnetic compass | **PASS** — arrow transform follows the pointer, e.g. `matrix(0.9397, -0.3419, …, -4.3, -0.68)` (≈ −20° lean) when approached from the top-left, `none` at rest |
| Iron-filing arrow field | **PASS** — 55 arrows; per-arrow transforms update with the pointer (`rotate(-19.18) scale(1.072)` near the cursor vs `scale(1.02)` far away), rAF paused when the band is off-screen |
| Cursor trail | **PASS** — 5 echo arrows tracked moving; they fade out 700 ms after the pointer stops |
| Click burst | **PASS** — 6 nodes created on button press, 0 left behind after 800 ms |
| Reduced motion | **PASS** — no trail, no burst, arrow field static, pinned statement collapsed, Lenis off |
| Console / page errors | **PASS** — none on any route or width |
| Build | **PASS** — `tsc --noEmit` clean; `vite build` 281 kB JS (85 kB gzip) |

## 4. Email notifications

| Check | Result | Detail |
|---|---|---|
| Inquiry storage works without SMTP | PASS | 3 test rows stored with `email_status = not_configured` |
| Email alert function | **NOT CONFIGURED** | no SMTP credentials in this environment; `server/mailer.js` only runs when `SMTP_*` + `MAIL_TO` are set |
| No claim of delivery when unconfigured | PASS | API reports `emailNotification: "not_configured"`; success message never mentions email sent |

## 5. Admin panel

| Check | Result | Detail |
|---|---|---|
| Sign-in form appears when a password is configured | PASS | `configured: true` |
| Wrong password rejected | PASS | `401` "Incorrect password." |
| Correct password creates session and lists inquiries | PASS | 3 stored test inquiries rendered |
| Session cookie is `HttpOnly` | PASS | `document.cookie` empty in the page |
| Cookie flags in production | PASS | `HttpOnly; Secure; SameSite=Lax; Max-Age=28800` |
| Unauthenticated API access blocked | PASS | `401` |
| Login attempt rate limiting | PASS | 8 attempts / 15 min / IP |
| Panel disabled when `ADMIN_PASSWORD` is empty | PASS (by code path) | returns `503 ADMIN_NOT_CONFIGURED`, page explains |
| Owner config editing from the panel | NOT IMPLEMENTED | prices are edited in `shared/business.json` |

## 6. Responsive

| Viewport | Result |
|---|---|
| 1440 × 1000 desktop | PASS, no horizontal overflow |
| 820 × 1080 tablet | PASS, overflow 0 px, single-column service/pricing grids |
| 390 × 844 mobile | PASS, overflow 0 px, full-screen menu, stacked cards, touch-sized buttons (≥46 px) |
| Mobile contact form usable | PASS (`16-mobile-contact.png`) |
| Layout adapts rather than shrinks (hero phone hidden, chapters unstick, grids collapse) | PASS |

## 7. Technical quality

| Check | Result |
|---|---|
| `tsc --noEmit` clean | PASS |
| Production build | PASS — 291.8 kB JS (89.0 kB gzip), 62 kB CSS (12 kB gzip) |
| `NODE_ENV=production npm start` serves SPA + deep links | PASS (`/pricing → 200`, `index.html`) |
| `sitemap.xml` / `robots.txt` use `SITE_URL` | PASS |
| No credentials or API keys in front-end code | PASS (only `.env` on the server; git-ignored) |
| MongoDB-style secrets exposure | N/A — SQLite file outside `dist/` |
| Reduced motion | PASS (`prefers-reduced-motion` disables reveals, marquee, parallax, float) |
| Content visible without JS/observer | PASS (reveal classes are opt-in via `html.has-reveal`) |

## 8. Still required before publication

1. Confirm the business name spelling (privacy policy page removed by request; the form keeps its inline data-use sentence).
2. Replace the demo `ADMIN_PASSWORD` in `.env` with your own strong value.
3. Add SMTP settings if you want email alerts on new inquiries.
4. Set `SITE_URL` to the real domain at deploy time (affects canonical URLs + sitemap).
5. Send a vector logo file if one exists.

## 9. Pass 7 — typography, title strip, rooms and the film

| Check | Result |
|---|---|
| Display face replaced (Bricolage Grotesque removed, **Syne** variable self-hosted, preloaded) | PASS |
| Title strip renders on all four routes, numbered cells, lime WhatsApp cell, active rule | PASS (`screenshots/pass7/01`, `20`, `21`, `22`) |
| Strip compresses 76 → 60 px on scroll, stays legible over paper sections (97 % ink) | PASS |
| Full-screen menu: clip-path reveal, Escape to close, focus trap, close control (X) always on top, floating pill hidden while open | PASS (`screenshots/pass7/32-mobile-menu.png`) |
| Arrival room (hero) rebuilt: film backdrop, service index with live prices, scroll cue | PASS |
| Film room: 10 scenes advance with scroll (progress measured on the 460 vh section, sticky 100 svh canvas) | PASS (`screenshots/pass7/02`–`08`, `docs/film-preview.gif`) |
| Film scenes read as distinct images (grid, extrusion, columns, wave, dot-drawn WEBENT wordmark, arrow, route, three tiers, single dot) | PASS |
| Film text scenes sample canvas glyph edges only — letters legible as lines of dots | PASS (`05-film-scene-06.png`) |
| Chapter rail steps aside while the film room is on screen | PASS |
| Inner pages carry a giant outlined room numeral + `ROOM 0N — …` label | PASS (`20`, `21`, `22`) |
| Anchor jumps clear the fixed strip (`scroll-margin-top: 88px`) | PASS |
| No console/page errors on `/`, `/services`, `/pricing`, `/contact` | PASS (`errors []`) |
| Horizontal overflow at 1440 × 950, 1280 × 800, 1366 × 768, 390 × 844 | PASS (0 px) |
| Reduced motion still collapses the film room to a static frame | PASS |
| `tsc --noEmit` + production build | PASS |

## 10. Pass 8 — breathing room, FAQ, phone strip

| Check | Result |
|---|---|
| Section padding raised to `clamp(104px, 15vw, 208px)`, head clearance to `clamp(56px, 8vw, 112px)` | PASS (`40`–`46`) |
| Section titles scaled to `clamp(2.1rem, 5vw, 4.35rem)` — readable as room titles | PASS |
| Duplicated layout mock-up removed from "First impressions" (room rebuilt as title + numbered statements) | PASS (`41-ch01.png`) |
| Filler copy removed: pricing strapline, "Why" lead, "Nothing starts automatically", "Short answers, no small print", film intro paragraph shortened, CTA WhatsApp note shortened, services/contact leads trimmed | PASS |
| Lime room: ink-on-lime steps, outlined accent word, legible at 390 px | PASS (`42-lime.png`, `52-mobile-lime.png`) |
| FAQ redesigned: numbered rows, Syne questions, lime rail on the open row, "A" answer mark, hover shift | PASS (`45-faq.png`, `46-faq-open.png`, `53-mobile-faq.png`) |
| Faq behaviour unchanged: one open at a time, `aria-expanded`, `aria-controls`, keyboard operable | PASS |
| Phone strip shows the current room (`• ROOM TWO · …`) and updates while scrolling | PASS (`51-mobile-strip.png`) |
| Phone menu: X control on top, floating pill hidden while open | PASS |
| Horizontal overflow at 390 × 844, 768 × 1024, 1440 × 950 across all four routes | PASS (0 px everywhere) |
| No page errors on any route at any of the three widths | PASS (`errors []`) |
| Prices still render 3,000 / 4,000 / 10,000 (+500 / 1,000 / 3,000 registration; totals 3,500 / 5,000 / 13,000) after the copy pass | PASS |
| `tsc --noEmit` + production build | PASS — 292.4 kB JS (89.1 kB gzip), 96.6 kB CSS (19.4 kB gzip) |

## 11. Pass 9 — air, scale, FAQ room, tour ticks

| Check | Result |
|---|---|
| Section padding `clamp(122px, 17vw, 252px)`, head clearance `clamp(64px, 9vw, 132px)` | PASS (`01`–`08`) |
| Section titles `clamp(2.35rem, 5.7vw, 5.05rem)`, measure `min(100%, 47rem)` — two/three lines, readable as room titles | PASS (`03`, `04`) |
| Further filler removed: hero lede, "Hover a block…", "the prices are one chapter down", pricing lead, film intro, CTA note | PASS |
| FAQ is now a room: sticky left column, answer count, "ask something else" link, numbered rows, lime rail, hover tint | PASS (`07`, `08`, `12`) |
| FAQ behaviour: one open at a time, `aria-expanded` / `aria-controls`, keyboard operable | PASS |
| Phone strip tells the tour: room name + station ticks (past dimmed, current lime and wide) | PASS (`11-mobile-strip.png`) |
| Phone hero bottom bar no longer collides with the chat pill; free domain / hosting line stays visible | PASS (`10-mobile-arrival.png`) |
| Horizontal overflow at 390 × 844, 768 × 1024, 1440 × 950 on all four routes | PASS (0 px) |
| No page errors on any route at any width | PASS (`errors []`) |
| Prices still 3,000 / 4,000 / 10,000 (+500 / 1,000 / 3,000 registration) | PASS |
| `tsc --noEmit` + production build | PASS |

## 12. Pass 10 — the drawing, and less on a phone

| Check | Result |
|---|---|
| `LayoutDemo` redrawn: board, registration marks, `FIG.` specimen line, paper sheet, hatched plate, lime action band, specular sweep | PASS (`01`–`05`) |
| Zone labels appear only on hover/focus — the drawing rests quiet | PASS (`02-drawing-zone-label.png`) |
| `Wide / Narrow` toggle re-sizes the sheet (`max-width: 15.5em` in narrow) | PASS (`03-drawing-narrow.png`) |
| Multi-page variant still switches pages from the demo navigation | PASS |
| Restored furniture that a bad CSS slice had removed: offer badge, price block, reading line, chapter rail | PASS (`06-price-cards.png`) |
| Price cards align on a common floor across the row | PASS |
| Chapter rail is fixed to the viewport again — `.page-enter` now uses `animation-fill-mode: backwards`, so `<main>` no longer keeps a transform (that transform had made the rail position against `<main>` at y≈6800) | PASS (`07-chapter-rail.png`) |
| Rail re-inks itself over paper rooms (`is-on-paper`) | PASS |
| Phone: drawing trims, rail hidden, elevation notes hidden, tick row hidden, marquee quieter, footer money cells hidden | PASS (`10`–`13`) |
| Horizontal overflow, 390 / 768 / 1440 on all four routes | PASS (0 px) |
| No page errors, desktop and phone, all four routes | PASS (`errors []`) |
| `tsc --noEmit` + production build | PASS |

## 13. Pass 11 — ten things that define a business, drawn in space

| Check | Result |
|---|---|
| Film subjects replaced with ten things a business actually owns: `STOREFRONT · SIGN · COUNTER · LIST · PARCEL · PRICE · PIN · HOURS · BELL · NAME` | PASS (`film-01`–`film-10`) |
| Each frame is legible on its own at 1440 and 390 | PASS (`film-*`, `phone-film-01/05/10`) |
| Objects have real bodies — `volume()` adds a back face and connecting edges, depth per scene (0.1 tag → 0.9 counter) | PASS |
| A floor grid recedes behind the object (`floorLines()`), depth-faded; point size and brightness scale with depth | PASS |
| Ten-line index down the right edge names the sequence and lights the current line; count/caption/note bottom-left; lime progress hairline | PASS (`film-05`, `film-10`) |
| Each object holds ~58% of its slice, then dissolves; the finale wordmark cross-fades in as a 900-point dot matrix | PASS |
| Final scene is fully formed before the room exits (`scaled = progress × total`, not `× (total − 1)`) | PASS (`film-10`) |
| `sampleText()` reads luminance, not alpha — the old edge test treated the opaque black canvas as ink and produced two stray rows | PASS (wordmark reads `WEBENT`) |
| Dead space removed: room 460 vh → 320 vh (220 vh on a phone), object scale up, caption/index rebalanced | PASS |
| **Root cause of the "useless space" and the blank frames: `<body>` had `overflow-x: hidden`, which made body a scroll container and silently disabled `position: sticky` for the film and the pinned statement.** Overflow moved to `html` only (`overflow-x: clip`); the film now pins at `top: 0` through its whole room | PASS |
| Pinned statement keeps the words on screen until the glow finishes: light-up 0 → 44%, hold 44% → 80%, exit after 80% (was fading at 58%) | PASS (`statement-1`, `statement-2`) |
| `.split`/`.words` children can shrink (`min-width: 0`) and the split headline is capped on phones — a single long word was widening the page by 72 px | PASS (0 px overflow) |
| Horizontal overflow: 0 px, all four routes at 390 / 768 / 1440; `canScrollX` 0 | PASS |
| No page errors on any route at any width | PASS (`errors []`) |
| `tsc --noEmit` + production build | PASS |

## 14. Pass 12 — the hero service list removed

| Check | Result |
|---|---|
| The numbered `Landing Page / One-Page / Multi-Page` price list in the arrival room is gone (`arrival__index` markup and its 50 lines of CSS deleted) | PASS (`/tmp/hero-d.png`) |
| Hero copy now runs the full measure (`max-width: min(100%, 64rem)`) instead of sharing a two-column grid with an empty column | PASS |
| Home still shows prices exactly once, in the `#pricing` chapter | PASS |
| Horizontal overflow 0 px at 390 / 768 / 1440; arrival height still 100svh | PASS |
| No page errors | PASS (`errors []`) |
| `tsc --noEmit` + production build | PASS |

'use strict';
/**
 * Webent — API + static host.
 *
 *   GET  /api/health                  runtime capabilities (db / email / admin)
 *   POST /api/inquiries               store an inquiry (validated server-side)
 *   POST /api/admin/login             owner sign-in (server-enforced session cookie)
 *   GET  /api/admin/session           current admin session state
 *   GET  /api/admin/inquiries         list stored inquiries (auth required)
 *   POST /api/admin/logout            destroy session
 *
 * Customer records are never exposed by any public route.
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

/* ------------------------------------------------------------------ */
/* environment                                                         */
/* ------------------------------------------------------------------ */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(__dirname, '..', '.env'));

const db = require('./db');
const mailer = require('./mailer');

const PORT = Number(process.env.PORT || 8787);
const isProd = process.env.NODE_ENV === 'production';
const SITE_URL = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD ? bcrypt.hashSync(ADMIN_PASSWORD, 10) : null;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE_NAME = 'webent_admin';

// Canonical service list — the single source shared with the frontend build.
const business = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'shared', 'business.json'), 'utf8')
);
const SERVICES = new Map(business.services.map((s) => [s.id, s]));

/**
 * Mirrors src/config/site.ts.
 * `mode: "rolling"` keeps the discounted price permanently live: the countdown
 * is a repeating cycle, so it can never expire. `mode: "fixed"` falls back to
 * the single `endsAt` date.
 */
function offerLive(now = Date.now()) {
  const offer = business.offer;
  if (!offer || offer.enabled === false) return false;
  if (offer.mode === 'fixed') {
    const ends = Date.parse(offer.endsAt);
    return Number.isFinite(ends) ? ends > now : false;
  }
  const cycleMs = Math.max(1, offer.cycleHours || 24) * 3600000;
  const anchor = Date.parse(offer.cycleAnchor || offer.endsAt);
  if (!Number.isFinite(anchor)) return true;
  return now - anchor > -cycleMs;
}
function effectivePrice(service) {
  return offerLive() ? service.price : service.wasPrice ?? service.price;
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // No X-Frame-Options / frame-ancestors on purpose: the preview environment embeds the app in an iframe.
  next();
});

db.destroyExpiredSessions();

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const ipOf = (req) => req.ip || req.socket?.remoteAddress || 'unknown';
const hashIp = (ip) => crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[\d][\d\s().-]{5,24}$/;

function validateInquiry(body) {
  const errors = {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const serviceId = String(body.serviceId ?? '').trim();
  const requirements = String(body.requirements ?? '').trim();

  if (name.length < 2 || name.length > 80) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(email) || email.length > 200)
    errors.email = 'Please enter a valid email address.';
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 7)
    errors.phone = 'Please enter a valid phone or WhatsApp number.';
  if (!SERVICES.has(serviceId)) errors.serviceId = 'Please choose one of the three services.';
  if (requirements.length < 20)
    errors.requirements = 'Please describe your requirements in at least 20 characters.';
  if (requirements.length > 4000)
    errors.requirements = 'Please keep your requirements under 4,000 characters.';

  return {
    errors,
    value: { name, email, phone, serviceId, requirements },
  };
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    storage: 'sqlite',
    inquiriesStored: db.countInquiries(),
    emailNotifications: mailer.isConfigured() ? 'configured' : 'not_configured',
    adminPanel: ADMIN_PASSWORD ? 'configured' : 'not_configured',
  });
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const body = req.body ?? {};

    // 1. Honeypot — real visitors never fill a hidden field.
    if (String(body.company ?? '').trim() !== '') {
      return res.status(202).json({ ok: true, reference: null, note: 'ignored' });
    }

    // 2. Minimum fill time (bots submit instantly).
    const elapsed = Number(body.elapsedMs);
    if (!Number.isFinite(elapsed) || elapsed < 1200) {
      return res.status(400).json({
        ok: false,
        message: 'That was submitted a little too quickly. Please press send once more.',
      });
    }

    // 3. Server-side validation (client validation is a convenience, not the guard).
    const { errors, value } = validateInquiry(body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        ok: false,
        message: 'Please check the highlighted fields.',
        errors,
      });
    }

    // 4. Sliding-window rate limit: 6 accepted-shape submissions per IP per 15 minutes.
    //    Only counted after validation so a rejected payload cannot lock out an honest visitor.
    const hits = db.rateHit(`inquiry:${hashIp(ipOf(req))}`, 15 * 60 * 1000);
    if (hits >= 6) {
      return res.status(429).json({
        ok: false,
        message:
          'Too many submissions from this connection in a short time. Please try again later, or message us on WhatsApp.',
      });
    }

    // 5. Duplicate guard — same email + service within 2 minutes.
    const duplicate = db.findRecentDuplicate(value.email.toLowerCase(), value.serviceId, 120_000);
    if (duplicate) {
      return res.status(409).json({
        ok: false,
        message: `This inquiry was already received (reference ${duplicate.reference}). We'll be in touch.`,
        reference: duplicate.reference,
      });
    }

    const service = SERVICES.get(value.serviceId);
    const stored = db.createInquiry({
      ...value,
      email: value.email.toLowerCase(),
      serviceName: service.name,
      servicePrice: effectivePrice(service),
      currency: business.currency.code,
      ipHash: hashIp(ipOf(req)),
      userAgent: String(req.get('user-agent') || '').slice(0, 200),
    });

    // 6. Optional e-mail notification (only when SMTP is configured).
    const mail = await mailer.sendInquiryNotification({
      ...value,
      ...stored,
      serviceName: service.name,
      servicePrice: effectivePrice(service),
      currency: business.currency.code,
    });
    db.setEmailStatus(
      stored.id,
      mail.sent ? 'sent' : mail.reason === 'not_configured' ? 'not_configured' : 'failed'
    );

    return res.status(201).json({
      ok: true,
      reference: stored.reference,
      receivedAt: stored.submittedAt,
      emailNotification: mail.sent ? 'sent' : 'not_configured',
      message: 'Inquiry received and stored.',
    });
  } catch (error) {
    console.error('[api] inquiry failed:', error);
    return res.status(500).json({
      ok: false,
      message: 'Something went wrong on our side. Please try WhatsApp or email instead.',
    });
  }
});

/* ------------------------------------------------------------------ */
/* admin                                                               */
/* ------------------------------------------------------------------ */
const requireAdmin = (req, res, next) => {
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(503).json({
      ok: false,
      code: 'ADMIN_NOT_CONFIGURED',
      message: 'The admin panel is not configured on this deployment.',
    });
  }
  const session = db.getSession(req.cookies?.[COOKIE_NAME]);
  if (!session) return res.status(401).json({ ok: false, message: 'Not signed in.' });
  req.adminSession = session;
  next();
};

app.get('/api/admin/session', (req, res) => {
  const configured = Boolean(ADMIN_PASSWORD_HASH);
  const session = configured ? db.getSession(req.cookies?.[COOKIE_NAME]) : null;
  res.json({ ok: true, configured, signedIn: Boolean(session) });
});

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(503).json({
      ok: false,
      code: 'ADMIN_NOT_CONFIGURED',
      message:
        'No admin password is set on the server. Add ADMIN_PASSWORD to the environment to enable the panel.',
    });
  }

  const hits = db.rateHit(`login:${hashIp(ipOf(req))}`, 15 * 60 * 1000);
  if (hits >= 8) {
    return res.status(429).json({ ok: false, message: 'Too many attempts. Try again in 15 minutes.' });
  }

  const password = String(req.body?.password ?? '');
  if (!password || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ ok: false, message: 'Incorrect password.' });
  }

  db.destroyExpiredSessions();
  const { token } = db.createSession(SESSION_TTL_MS);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
  return res.json({ ok: true, signedIn: true });
});

app.post('/api/admin/logout', (req, res) => {
  db.destroySession(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true, signedIn: false });
});

app.get('/api/admin/inquiries', requireAdmin, (req, res) => {
  res.json({ ok: true, inquiries: db.listInquiries(500) });
});

/* ------------------------------------------------------------------ */
/* SEO files                                                           */
/* ------------------------------------------------------------------ */
const PAGES = ['', '/services', '/pricing', '/contact'];

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map(
    (p) =>
      `  <url><loc>${SITE_URL}${p || '/'}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${
        p === '' ? '1.0' : '0.8'
      }</priority></url>`
  ).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
});

app.use('/api', (req, res) => res.status(404).json({ ok: false, message: 'Unknown endpoint.' }));

/* ------------------------------------------------------------------ */
/* static hosting (production build)                                   */
/* ------------------------------------------------------------------ */
const DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      setHeaders(res, filePath) {
        if (/\.(woff2|png|jpg|svg|webp)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[webent] API listening on http://0.0.0.0:${PORT}`);
  console.log(`[webent] storage: sqlite (${process.env.DATA_DIR || './data'}/webent.db)`);
  console.log(`[webent] email notifications: ${mailer.isConfigured() ? 'configured' : 'NOT configured'}`);
  console.log(`[webent] admin panel: ${ADMIN_PASSWORD ? 'configured' : 'NOT configured (no ADMIN_PASSWORD)'}`);
});

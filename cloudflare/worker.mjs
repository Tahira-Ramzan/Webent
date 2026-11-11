import business from '../shared/business.json' with { type: 'json' };

const services = new Map(business.services.map(({ id, name }) => [id, name]));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[\d][\d\s().-]{5,24}$/;
const json = (value, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname !== '/api/inquiries') return json({ ok: false, message: 'Not found.' }, 404);
    if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed.' }, 405);
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ ok: false, message: 'Invalid request origin.' }, 403);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return json({ ok: false, message: 'Invalid request.' }, 415);
    }
    if (Number(request.headers.get('content-length') || 0) > 16384) return json({ ok: false, message: 'Request too large.' }, 413);
    let body;
    try {
      // Bound the payload even when Content-Length is absent.
      const text = await request.text();
      if (new TextEncoder().encode(text).length > 16384) return json({ ok: false, message: 'Request too large.' }, 413);
      body = JSON.parse(text);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
    } catch {
      return json({ ok: false, message: 'Invalid request.' }, 400);
    }
    // Never report success for a submission that was discarded.
    if (String(body.company ?? '').trim()) return json({ ok: false, message: 'Please contact us directly.' }, 400);
    if (!Number.isFinite(Number(body.elapsedMs)) || Number(body.elapsedMs) < 1200) {
      return json({ ok: false, message: 'That was submitted a little too quickly. Please press send once more.' }, 400);
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const serviceId = typeof body.serviceId === 'string' ? body.serviceId.trim() : '';
    const requirements = typeof body.requirements === 'string' ? body.requirements.trim() : '';
    const errors = {};
    if (name.length < 2 || name.length > 80) errors.name = 'Please enter your full name (up to 80 characters).';
    if (email.length > 200 || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
    if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a valid phone or WhatsApp number.';
    if (!services.has(serviceId)) errors.serviceId = 'Please choose a service.';
    if (requirements.length < 20 || requirements.length > 4000) errors.requirements = 'Please describe your requirements in 20 to 4,000 characters.';
    if (Object.keys(errors).length) return json({ ok: false, message: 'Please check the highlighted fields.', errors }, 422);
    if (!env.WEB3FORMS_ACCESS_KEY) {
      console.error('WEB3FORMS_ACCESS_KEY is not configured');
      return json({ ok: false, message: 'The form is temporarily unavailable. Please contact us by email or WhatsApp.' }, 503);
    }

    const reference = `WB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const receivedAt = new Date().toISOString();
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: env.WEB3FORMS_ACCESS_KEY,
          subject: `New Webent inquiry ${reference}`,
          from_name: 'Webent Website',
          name, email, phone,
          service: services.get(serviceId),
          message: requirements,
          reference,
          submitted_at: receivedAt,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        console.error('Email service rejected inquiry:', response.status);
        return json({ ok: false, message: 'The inquiry could not be sent. Please contact us by email or WhatsApp.' }, 502);
      }
      // Provider acceptance is not a guarantee of inbox delivery. No local database is used.
      return json({ ok: true, reference, receivedAt }, 201);
    } catch (error) {
      console.error('Email service request failed:', error?.name || 'error');
      return json({ ok: false, message: 'The email service could not be reached. Please contact us by email or WhatsApp.' }, 502);
    }
  },
};

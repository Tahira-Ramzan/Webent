import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';

const valid = { name: 'Test Client', email: 'client@example.com', phone: '+92 300 1234567', serviceId: 'landing-page', requirements: 'I need a simple website for my business.', elapsedMs: 2000, company: '' };
const request = (data = valid, opts = {}) => new Request('https://example.com/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.com', ...opts.headers }, body: JSON.stringify(data) });
const env = { WEB3FORMS_ACCESS_KEY: 'test-key', ASSETS: { fetch: () => new Response('asset') } };
test('asset routing and API method handling', async () => {
  assert.equal(await (await worker.fetch(new Request('https://example.com/contact'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://example.com/api/inquiries'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://example.com/api/other'), env)).status, 404);
});
test('validates, rejects missing configuration, and blocks other origins', async () => {
  assert.equal((await worker.fetch(request({ ...valid, email: 'bad' }), env)).status, 422);
  assert.equal((await worker.fetch(request(), { ...env, WEB3FORMS_ACCESS_KEY: '' })).status, 503);
  assert.equal((await worker.fetch(request(valid, { headers: { Origin: 'https://evil.example' } }), env)).status, 403);
  assert.equal((await worker.fetch(request({ ...valid, company: 'spam' }), env)).status, 400);
});
test('forwards contact details and only reports success on provider acceptance', async () => {
  const original = globalThis.fetch;
  try {
    let sent;
    globalThis.fetch = async (url, options) => { assert.equal(url, 'https://api.web3forms.com/submit'); sent = JSON.parse(options.body); return Response.json({ success: true }); };
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 201); assert.equal((await response.json()).ok, true);
    assert.equal(sent.email, valid.email); assert.equal(sent.phone, valid.phone);
    assert.equal(sent.message, valid.requirements); assert.equal(sent.service, 'Landing Page');
    globalThis.fetch = async () => Response.json({ success: false }, { status: 400 });
    assert.equal((await worker.fetch(request(), env)).status, 502);
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal((await worker.fetch(request(), env)).status, 502);
  } finally { globalThis.fetch = original; }
});

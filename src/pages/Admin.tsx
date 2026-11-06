import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatPrice } from '../config/site';
import { ArrowUpRight } from '../components/Icons';

type Session = { configured: boolean; signedIn: boolean };

type Inquiry = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  service_name: string;
  service_price: number;
  currency: string;
  requirements: string;
  submitted_at: string;
  email_status: string;
};

export function Admin() {
  usePageMeta('Owner area', 'Private area for reviewing submitted website inquiries.', '/admin', true);

  const [session, setSession] = useState<Session | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSession = useCallback(async () => {
    const response = await fetch('/api/admin/session');
    const data = (await response.json()) as { configured: boolean; signedIn: boolean };
    setSession({ configured: data.configured, signedIn: data.signedIn });
    return data;
  }, []);

  const loadInquiries = useCallback(async () => {
    const response = await fetch('/api/admin/inquiries');
    if (!response.ok) return;
    const data = (await response.json()) as { inquiries: Inquiry[] };
    setInquiries(data.inquiries ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      const data = await loadSession();
      if (data.signedIn) await loadInquiries();
    })();
  }, [loadSession, loadInquiries]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Sign-in failed.');
        return;
      }
      setPassword('');
      await loadSession();
      await loadInquiries();
    } catch {
      setError('The server could not be reached.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setInquiries([]);
    await loadSession();
  };

  return (
    <div className="admin-wrap">
      <div className="shell">
        {session === null ? (
          <p className="body-copy">Checking session…</p>
        ) : !session.configured ? (
          <div className="admin-login">
            <p className="eyebrow">Owner area</p>
            <h1 className="h2" style={{ margin: '14px 0 16px' }}>
              Admin panel not <span className="accent">configured.</span>
            </h1>
            <p className="body-copy">
              No admin password exists on this server, so sign-in is disabled. Set{' '}
              <code style={{ color: 'var(--lime)' }}>ADMIN_PASSWORD</code> in the server environment
              (see <code>.env.example</code>) and restart the server to enable this area. Submitted
              inquiries are still being stored in the database in the meantime.
            </p>
          </div>
        ) : !session.signedIn ? (
          <form className="form-card admin-login" onSubmit={signIn}>
            <p className="eyebrow">Owner area</p>
            <h1 className="h2" style={{ margin: '14px 0 20px', fontSize: '1.7rem' }}>
              Sign in
            </h1>
            {error ? (
              <div className="form-status form-status--error" role="alert">
                <span className="form-status__icon" aria-hidden="true">!</span>
                <div>{error}</div>
              </div>
            ) : null}
            <div className="field">
              <label className="field__label" htmlFor="admin-password">
                Admin password <span className="field__req" aria-hidden="true">*</span>
              </label>
              <input
                className="field__input"
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button className="btn btn--lime btn--block" type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <>
            <div className="section-head" style={{ marginBottom: 22 }}>
              <div>
                <p className="eyebrow">Owner area</p>
                <h1 className="h2" style={{ marginTop: 12 }}>
                  Inquiries <span className="accent">({inquiries.length})</span>
                </h1>
              </div>
              <button className="btn btn--ghost btn--sm" type="button" onClick={signOut}>
                Sign out
              </button>
            </div>

            {inquiries.length === 0 ? (
              <p className="body-copy">No inquiries stored yet.</p>
            ) : (
              <div className="admin-list">
                {inquiries.map((inquiry) => (
                  <article className="admin-item" key={inquiry.reference}>
                    <div className="admin-item__head">
                      <span className="admin-item__ref">{inquiry.reference}</span>
                      <span className="admin-item__meta">
                        {new Date(inquiry.submitted_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <div className="admin-item__meta">
                      <span>
                        <strong style={{ color: 'var(--on-dark)' }}>{inquiry.name}</strong>
                      </span>
                      <a href={`mailto:${inquiry.email}`} style={{ color: 'var(--lime)' }}>
                        {inquiry.email}
                      </a>
                      <a
                        href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {inquiry.phone}
                      </a>
                      <span>
                        {inquiry.service_name} — {formatPrice(inquiry.service_price)}
                      </span>
                    </div>
                    <p className="admin-item__req">{inquiry.requirements}</p>
                    <span className="admin-item__mail">Email notification: {inquiry.email_status}</span>
                  </article>
                ))}
              </div>
            )}

            <p className="process-note" style={{ marginTop: 26, display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowUpRight /> This data is only returned to a signed-in session and is never exposed by
              a public route.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { effectivePrice, formatPrice, getService, site } from '../config/site';
import { ArrowUpRight, CheckIcon } from './Icons';

type FieldName = 'name' | 'email' | 'phone' | 'serviceId' | 'requirements';
type FieldErrors = Partial<Record<FieldName, string>>;

type Status =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; reference: string; receivedAt: string; email: string }
  | { state: 'error'; message: string; fieldErrors?: FieldErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[\d][\d\s().-]{5,24}$/;

const initialValues = { name: '', email: '', phone: '', serviceId: '', requirements: '' };

function validate(values: typeof initialValues): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address, e.g. you@example.com.';
  if (!PHONE_RE.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7)
    errors.phone = 'Enter a valid phone or WhatsApp number, including country code if needed.';
  if (!getService(values.serviceId)) errors.serviceId = 'Choose the service you are interested in.';
  if (values.requirements.trim().length < 20)
    errors.requirements = 'Please describe your requirements in at least 20 characters.';
  if (values.requirements.trim().length > 4000)
    errors.requirements = 'Please keep your requirements under 4,000 characters.';
  return errors;
}

export function ContactForm() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('service') ?? '';
  const [values, setValues] = useState({ ...initialValues, serviceId: getService(preselected)?.id ?? '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [honeypot, setHoneypot] = useState('');
  const startedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  // Keep the dropdown in sync when the visitor arrives from a pricing card.
  useEffect(() => {
    const service = getService(preselected);
    if (service) {
      setValues((current) => ({ ...current, serviceId: service.id }));
      setStatus({ state: 'idle' });
    }
  }, [preselected]);

  const update = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.state === 'loading') return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      setStatus({ state: 'idle' });
      return;
    }

    setStatus({ state: 'loading' });

    try {
      const response = await fetch(site.inquiryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          company: honeypot,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; reference?: string; receivedAt?: string; message?: string; errors?: FieldErrors }
        | null;

      if (!response.ok || !payload?.ok) {
        setStatus({
          state: 'error',
          message:
            payload?.message ??
            'The inquiry could not be submitted. Please try again, or contact us on WhatsApp.',
          fieldErrors: payload?.errors,
        });
        if (payload?.errors) setErrors(payload.errors);
        return;
      }

      setStatus({
        state: 'success',
        reference: payload.reference ?? '—',
        receivedAt: payload.receivedAt ?? new Date().toISOString(),
        email: values.email.trim(),
      });
      setValues({ ...initialValues });
      startedAt.current = Date.now();
    } catch {
      setStatus({
        state: 'error',
        message:
          'We could not reach the server. Check your connection and try again — or message us on WhatsApp.',
      });
    }
  };

  if (status.state === 'success') {
    const received = new Date(status.receivedAt);
    return (
      <div className="form-card">
        <div className="form-status form-status--success" role="status">
          <span className="form-status__icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <div>
            <strong>Inquiry received and stored.</strong>
            <p>
              Reference <code>{status.reference}</code> — logged{' '}
              {received.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              . If anything needs clarifying, reply to the address you gave ({status.email}) or send
              a WhatsApp message.
            </p>
          </div>
        </div>
        <p className="field__hint" style={{ marginBottom: 18 }}>
          Submitting an inquiry does not confirm an order. The details still need to be discussed
          before anything starts.
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setStatus({ state: 'idle' });
            setErrors({});
            startedAt.current = Date.now();
          }}
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  const disabled = status.state === 'loading';

  return (
    <form className="form-card" onSubmit={handleSubmit} ref={formRef} noValidate>
      {status.state === 'error' ? (
        <div className="form-status form-status--error" role="alert">
          <span className="form-status__icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Your inquiry was not submitted.</strong>
            <p>{status.message}</p>
          </div>
        </div>
      ) : null}

      <div className="form-row">
        <div className={`field ${errors.name ? 'field--invalid' : ''}`}>
          <label className="field__label" htmlFor="name">
            Full name <span className="field__req" aria-hidden="true">*</span>
          </label>
          <input
            className="field__input"
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            disabled={disabled}
          />
          {errors.name ? (
            <p className="field__error" id="name-error" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className={`field ${errors.email ? 'field--invalid' : ''}`}>
          <label className="field__label" htmlFor="email">
            Email address <span className="field__req" aria-hidden="true">*</span>
          </label>
          <input
            className="field__input"
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            disabled={disabled}
          />
          {errors.email ? (
            <p className="field__error" id="email-error" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="form-row">
        <div className={`field ${errors.phone ? 'field--invalid' : ''}`}>
          <label className="field__label" htmlFor="phone">
            Phone / WhatsApp <span className="field__req" aria-hidden="true">*</span>
          </label>
          <input
            className="field__input"
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+92 300 1234567"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            disabled={disabled}
          />
          {errors.phone ? (
            <p className="field__error" id="phone-error" role="alert">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className={`field ${errors.serviceId ? 'field--invalid' : ''}`}>
          <label className="field__label" htmlFor="serviceId">
            Service <span className="field__req" aria-hidden="true">*</span>
          </label>
          <select
            className="field__select"
            id="serviceId"
            name="serviceId"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.serviceId)}
            aria-describedby={errors.serviceId ? 'service-error' : undefined}
            value={values.serviceId}
            onChange={(event) => update('serviceId', event.target.value)}
            disabled={disabled}
          >
            <option value="">Choose a service…</option>
            {site.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatPrice(effectivePrice(service))}
              </option>
            ))}
          </select>
          {errors.serviceId ? (
            <p className="field__error" id="service-error" role="alert">
              {errors.serviceId}
            </p>
          ) : null}
        </div>
      </div>

      <div className={`field ${errors.requirements ? 'field--invalid' : ''}`}>
        <label className="field__label" htmlFor="requirements">
          Project requirements <span className="field__req" aria-hidden="true">*</span>
        </label>
        <textarea
          className="field__textarea"
          id="requirements"
          name="requirements"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.requirements)}
          aria-describedby={errors.requirements ? 'requirements-error' : 'requirements-hint'}
          placeholder="What is the website for? What should a visitor be able to do? Any pages, content or examples you already have?"
          value={values.requirements}
          onChange={(event) => update('requirements', event.target.value)}
          disabled={disabled}
          maxLength={4000}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {errors.requirements ? (
            <p className="field__error" id="requirements-error" role="alert">
              {errors.requirements}
            </p>
          ) : (
            <p className="field__hint" id="requirements-hint">
              A few sentences are enough to start. Minimum 20 characters.
            </p>
          )}
          <p className="field__counter" aria-hidden="true">
            {values.requirements.length}/4000
          </p>
        </div>
      </div>

      {/* Honeypot: hidden from real visitors and assistive technology. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="btn btn--lime" type="submit" disabled={disabled}>
          {disabled ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              Submit inquiry
              <ArrowUpRight className="btn__arrow" />
            </>
          )}
        </button>
        <p className="field__hint" style={{ maxWidth: '34ch' }}>
          Your details are stored so the inquiry can be answered — nothing else.
        </p>
      </div>

      <p aria-live="polite" className="sr-only">
        {status.state === 'loading' ? 'Sending your inquiry.' : ''}
      </p>
    </form>
  );
}

import { Link, useSearchParams } from 'react-router-dom';
import { formatPrice, getService, site, whatsappLink } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReveal } from '../hooks/useReveal';
import { ContactForm } from '../components/ContactForm';
import { Included } from '../components/Included';
import { Reveal } from '../components/Reveal';
import { MailIcon, WhatsAppIcon } from '../components/Icons';
import { SplitWords } from '../components/SplitWords';

export function Contact() {
  usePageMeta(
    'Contact — send your website requirements',
    'Send your website requirements to Webent: choose a service, describe the project and include your email or WhatsApp number. Or message directly on WhatsApp.',
    '/contact'
  );
  useReveal();

  const [searchParams] = useSearchParams();
  const selected = getService(searchParams.get('service'));

  return (
    <>
      <section className="page-head">
        <div className="page-head__bg" aria-hidden="true" />
        <span className="page-head__room" aria-hidden="true">04</span>
        <span className="page-head__room-label mono-label" aria-hidden="true">Room 04 — contact</span>
        <div className="shell">
          <div className="page-head__inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Contact</span>
            </nav>
            <SplitWords
              as="h1"
              className="display display--sm"
              delay={120}
              segments={[{ text: 'Say what the page' }, { text: 'has to do.', accent: true }]}
            />
            <p className="lead">Prefer to talk? Email or WhatsApp works just as well.</p>
            {selected ? (
              <p className="mono-label" style={{ color: 'var(--lime)' }}>
                Selected service — {selected.name} · {formatPrice(selected.price)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section--flush-top" id="form">
        <div className="shell">
          <Included className="included--section" compact />

          <div className="contact-grid">
            <Reveal>
              <ContactForm />
            </Reveal>

            <Reveal className="contact-aside" delay={1}>
              <div className="contact-card">
                <h2 className="contact-card__title">Direct contact</h2>

                <a className="contact-line" href={`mailto:${site.email}`}>
                  <span className="contact-line__icon" aria-hidden="true">
                    <MailIcon />
                  </span>
                  <span>
                    {site.email}
                    <span className="contact-line__meta" style={{ display: 'block' }}>
                      Opens your email app
                    </span>
                  </span>
                </a>

                <a
                  className="contact-line"
                  href={whatsappLink(selected?.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contact-line__icon" aria-hidden="true">
                    <WhatsAppIcon />
                  </span>
                  <span>
                    WhatsApp {site.whatsapp.display}
                    <span className="contact-line__meta" style={{ display: 'block' }}>
                      Opens a message you can edit before sending
                    </span>
                  </span>
                </a>
              </div>

              <div className="contact-card">
                <h2 className="contact-card__title">What happens next</h2>
                <ol style={{ display: 'grid', gap: 14 }}>
                  {[
                    'Your inquiry is stored with the time it was submitted.',
                    'It is read, along with the requirements you described.',
                    'You are contacted at the email or number you gave, to discuss the details.',
                  ].map((item, index) => (
                    <li key={item} style={{ display: 'flex', gap: 12, fontSize: '0.9rem', lineHeight: 1.6 }}>
                      <span className="mono-label" style={{ color: 'var(--lime)', flex: 'none' }}>
                        0{index + 1}
                      </span>
                      <span style={{ color: 'var(--on-dark-mute)' }}>{item}</span>
                    </li>
                  ))}
                </ol>
                <p className="process-note">
                  Sending the form does not confirm an order and no work starts automatically. Details
                  are agreed between us first.
                </p>
              </div>

              <div className="contact-card">
                <h2 className="contact-card__title">Services</h2>
                <ul style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
                  {site.services.map((service) => (
                    <li
                      key={service.id}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--on-dark-mute)' }}
                    >
                      <span>{service.name}</span>
                      <span style={{ color: 'var(--on-dark)' }}>{formatPrice(service.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

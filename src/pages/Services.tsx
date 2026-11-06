import { Link } from 'react-router-dom';
import { effectivePrice, formatPrice, inquiryPath, site, whatsappLink } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReveal } from '../hooks/useReveal';
import { LayoutDemo } from '../components/LayoutDemo';
import { Included } from '../components/Included';
import { Reveal } from '../components/Reveal';
import { ArrowUpRight, ArrowRight, WhatsAppIcon } from '../components/Icons';
import { SplitWords } from '../components/SplitWords';

const details: Record<string, string[]> = {
  'landing-page': [
    'One page built around a single offer, announcement or action.',
    'Written to be read top to bottom without detours.',
    'A clear way for a visitor to reply or get in touch.',
  ],
  'one-page-website': [
    'One scrolling page split into sections such as introduction, services and contact.',
    'Navigation that moves within the same page.',
    'A complete overview without extra pages to maintain.',
  ],
  'multi-page-website': [
    'Separate pages for separate subjects, connected by one navigation.',
    'Room for content that keeps growing.',
    'A structure that stays readable as pages are added.',
  ],
};

export function Services() {
  usePageMeta(
    'Services — landing pages, one-page and multi-page websites',
    'What each Webent service is for: a focused landing page, a single-scroll one-page website, or a multi-page website with its own navigation.',
    '/services'
  );
  useReveal();

  return (
    <>
      <section className="page-head">
        <div className="page-head__bg" aria-hidden="true" />
        <span className="page-head__room" aria-hidden="true">02</span>
        <span className="page-head__room-label mono-label" aria-hidden="true">Room 02 — services</span>
        <div className="shell">
          <div className="page-head__inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Services</span>
            </nav>
            <SplitWords
              as="h1"
              className="display display--sm"
              delay={120}
              segments={[
                { text: 'Three services.' },
                { text: 'One decision.', accent: true },
              ]}
            />
            <p className="lead">A different amount of room for the same goal. Prices are listed with each one.</p>
          </div>
        </div>
      </section>

      <section className="section section--flush-top">
        <div className="shell">
          <Reveal>
            <Included className="included--section" compact />
          </Reveal>

          {site.services.map((service, index) => (
            <div
              className={`service-block ${index % 2 === 1 ? 'service-block--flip' : ''}`}
              key={service.id}
              id={service.id}
            >
              <Reveal className="service-block__media" variant="scale">
                <LayoutDemo
                  variant={service.visual}
                  caption={{ em: service.name, text: 'Interactive layout demo' }}
                />
              </Reveal>

              <Reveal className="service-block__body" delay={1}>
                <p className="chapter__index">
                  <b>{service.index}</b> — Service
                </p>
                <h2 className="h2">{service.name}</h2>
                <p className="body-copy" style={{ maxWidth: '44ch' }}>
                  {service.description}
                </p>

                <ul className="spec-list">
                  {(details[service.id] ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="service-block__price">
                  <span className="price__currency">{site.currency}</span>
                  <span className="price__amount">
                    {new Intl.NumberFormat('en-US').format(effectivePrice(service))}
                  </span>
                </div>

                <div className="service-block__actions">
                  <Link className="btn btn--lime" to={inquiryPath(service.id)}>
                    Select {service.name}
                    <ArrowUpRight className="btn__arrow" />
                  </Link>
                  <a
                    className="btn btn--ghost"
                    href={whatsappLink(service.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon />
                    Ask on WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--paper section--tight">
        <div className="shell">
          <Reveal>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="section-head__main">
                <p className="eyebrow">Still deciding</p>
                <SplitWords
                  as="h2"
                  className="h2"
                  onScroll
                  style={{ marginTop: 14 }}
                  segments={[{ text: 'Describe the situation, not the' }, { text: 'package.', ink: true }]}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link className="btn btn--ink" to="/contact">
                  Open the form
                  <ArrowRight className="btn__arrow" />
                </Link>
                <Link className="btn btn--outline-ink" to="/pricing">
                  Compare prices
                  <ArrowUpRight className="btn__arrow" />
                </Link>
              </div>
            </div>
            <p className="body-copy" style={{ marginTop: 20, maxWidth: '56ch' }}>
              Write what the business does and what a visitor should be able to do. The right service
              is usually obvious from that description — and if it is not, we can work it out together.
              Prices start at {site.services.length > 0 ? formatPrice(effectivePrice(site.services[0])) : ''}.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

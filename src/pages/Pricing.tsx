import { Link } from 'react-router-dom';
import { formatPrice, site, whatsappLink } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReveal } from '../hooks/useReveal';
import { Reveal } from '../components/Reveal';
import { PricingCarousel } from '../components/PricingCarousel';
import { Included } from '../components/Included';
import { Faq, type FaqEntry } from '../components/Faq';
import { ArrowUpRight, WhatsAppIcon } from '../components/Icons';
import { SplitWords } from '../components/SplitWords';

const [landing, onePage, multiPage] = site.services;

const faqs: FaqEntry[] = [
  {
    question: 'Are these one-time prices?',
    answer: (
      <>
        Each price is the published price for that service, shown in {site.currency}. The site does
        not advertise a subscription, an instalment plan or any recurring charge. If something about
        the arrangement needs clarifying, ask before you commit.
      </>
    ),
  },
  {
    question: 'Why is the multi-page website more expensive?',
    answer: (
      <>
        It covers more pages and a shared navigation between them, so there is more structure to
        design and build than a single page. The price reflects the scope of the service, not a
        ranking of quality.
      </>
    ),
  },
  {
    question: 'Is anything not included in the price?',
    answer: (
      <>
        The published prices cover the service listed, and a free domain plus free hosting are part
        of every package. What is not included: paid hosting plans, paid domains, extra pages or
        content beyond the chosen service — anything like that is discussed and agreed separately
        before work begins, so nothing arrives as a surprise later.
      </>
    ),
  },
  {
    question: 'How do I pick a package?',
    answer: (
      <>
        Use the select button on any card: it takes you to the contact form with that service already
        chosen. You can change it in the dropdown before submitting.
      </>
    ),
  },
];

export function Pricing() {
  usePageMeta(
    'Pricing — Landing Page PKR 3,000 · One-Page PKR 4,000 · Multi-Page PKR 10,000',
    'Webent pricing: Landing Page PKR 3,000, One-Page Website PKR 4,000, Multi-Page Website PKR 10,000. Select a package to open the inquiry form.',
    '/pricing'
  );
  useReveal();

  return (
    <>
      <section className="page-head">
        <div className="page-head__bg" aria-hidden="true" />
        <span className="page-head__room" aria-hidden="true">03</span>
        <span className="page-head__room-label mono-label" aria-hidden="true">Room 03 — pricing</span>
        <div className="shell">
          <div className="page-head__inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Pricing</span>
            </nav>
            <SplitWords
              as="h1"
              className="display display--sm"
              delay={120}
              segments={[{ text: 'Prices, in full' }, { text: 'view.', accent: true }]}
            />
            <p className="lead">
              The registration fee and the total to start, in plain sight.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--flush-top">
        <div className="shell">
          <PricingCarousel />

          <Included className="included--section" />

          <Reveal delay={2}>
            <div className="pricing-note">
              <span>
                {landing.name} {formatPrice(landing.price)} · {onePage.name} {formatPrice(onePage.price)}{' '}
                · {multiPage.name} {formatPrice(multiPage.price)}
              </span>
              <span>Submitting an inquiry does not confirm an order.</span>
              <span>Details are agreed with you before any work starts.</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--paper section--tight">
        <div className="shell">
          <div className="section-head">
            <Reveal className="section-head__main">
              <p className="eyebrow">Comparing</p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'Not sure which one' }, { text: 'fits?', ink: true }]}
              />
            </Reveal>
            <Reveal delay={1}>
              <p className="body-copy" style={{ maxWidth: '34ch' }}>
                Answering these two questions usually settles it: how much do you need to say, and
                does it need more than one page?
              </p>
            </Reveal>
          </div>

          <Reveal>
            <Faq items={faqs} paper idPrefix="pricing" />
          </Reveal>

          <Reveal delay={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 34 }}>
              <Link className="btn btn--ink" to="/contact">
                Ask a question
                <ArrowUpRight className="btn__arrow" />
              </Link>
              <a
                className="btn btn--outline-ink"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                WhatsApp {site.whatsapp.display}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

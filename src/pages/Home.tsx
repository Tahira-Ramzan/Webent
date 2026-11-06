import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { effectivePrice, formatPrice, site, whatsappLink } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReveal } from '../hooks/useReveal';
import { useParallaxLayers } from '../hooks/useMotion';
import { SplitWords } from '../components/SplitWords';
import { ChapterRail, type RailItem } from '../components/ChapterRail';
import { LayoutDemo } from '../components/LayoutDemo';
import { ArrowDivider } from '../components/ArrowDivider';
import { Marquee } from '../components/Marquee';
import { Reveal } from '../components/Reveal';
import { ServiceIndex } from '../components/ServiceIndex';
import { PricingCarousel } from '../components/PricingCarousel';
import { DraftElevation } from '../components/DraftElevation';
import { PinnedStatement } from '../components/PinnedStatement';
import { Included } from '../components/Included';
import { SwapLabel } from '../components/SwapLabel';
import { ArrowField } from '../components/ArrowField';
import { Film } from '../components/Film';
import { Faq, type FaqEntry } from '../components/Faq';
import { ArrowUpRight, ArrowRight, CheckIcon, WhatsAppIcon } from '../components/Icons';

const faqs: FaqEntry[] = [
  {
    question: 'What is the difference between the three services?',
    answer: (
      <>
        A <strong>Landing Page</strong> is a single, focused page built around one offer or one
        action. A <strong>One-Page Website</strong> is still one page, but it carries several
        sections — an introduction, services, pricing, contact — on one continuous scroll. A{' '}
        <strong>Multi-Page Website</strong> splits that content across separate pages connected by
        a shared navigation.
      </>
    ),
  },
  {
    question: 'How do I choose which one suits me?',
    answer: (
      <>
        Start from how much you need to say. If you have one thing to promote and one next step, a
        landing page is usually enough. If the whole business needs explaining on one scroll, look at
        the one-page website. If different parts of the business each need their own place — or the
        content will keep growing — the multi-page option fits best. If you are unsure, describe your
        situation in the form and we can talk it through before you commit.
      </>
    ),
  },
  {
    question: 'How do I submit my website requirements?',
    answer: (
      <>
        Use the form on the <Link to="/contact">contact page</Link>: your name, email, phone or
        WhatsApp number, the service you are interested in, and a description of what you need. You
        can also send the same details on WhatsApp — whichever is easier. The form stores your inquiry
        so it can be read and answered.
      </>
    ),
  },
  {
    question: 'Do you provide the domain and hosting?',
    answer: (
      <>
        Yes — a <strong>free domain and free hosting</strong> come with every package, at no extra
        charge. What we do not do is buy or set up <strong>paid</strong> hosting plans or{' '}
        <strong>paid</strong> domains: if you want a paid plan or an already-purchased domain
        connected, that is a separate arrangement we would have to agree first.
      </>
    ),
  },
  {
    question: 'How is the pricing displayed?',
    answer: (
      <>
        Every price is shown openly and exactly as listed:{' '}
        {site.services.map((service, index) => (
          <span key={service.id}>
            {index > 0 ? (index === site.services.length - 1 ? ' and ' : ', ') : ''}
            {service.name} {formatPrice(effectivePrice(service))}
          </span>
        ))}
        , plus the registration fee shown on each package. A free domain and free hosting are part
        of every package; paid hosting plans and paid domains are not provided or set up.
      </>
    ),
  },
  {
    question: 'What is the 80% offer?',
    answer: (
      <>
        The three packages are currently shown at 80% below their standard price — that is why the
        discounted figure appears with the old price struck through next to it. The offer window runs
        in a repeating 24-hour cycle, which is what the “Ends in” clock on each card counts down; when
        it reaches zero the window starts again, so the discounted price stays available. The
        registration fee ({site.services
          .map((service) => `${service.name} ${formatPrice(service.registrationFee)}`)
          .join(', ')}) is charged on top and is non-refundable.
      </>
    ),
  },
  {
    question: 'Does submitting the form confirm an order?',
    answer: (
      <>
        No. The form starts a conversation. Submitting it stores your requirements and lets us reply;
        the project begins only after the details have been discussed and confirmed between you and
        {' '}
        {site.name}.
      </>
    ),
  },
  {
    question: 'How do I contact the business?',
    answer: (
      <>
        Email <a href={`mailto:${site.email}`} style={{ color: 'var(--lime)' }}>{site.email}</a> or message{' '}
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lime)' }}>
          WhatsApp {site.whatsapp.display}
        </a>
        . The WhatsApp button at the top and bottom of every page opens a message you can review
        before sending — nothing is sent automatically.
      </>
    ),
  },
];

const reasons = [
  {
    title: 'One page is often enough',
    text: 'Not every business needs a large site. A focused page that answers the obvious questions can do the job better than a bigger site nobody reads.',
  },
  {
    title: 'Structure that follows your content',
    text: 'The service you choose is the one that matches how much you actually need to say — not the largest package available.',
  },
  {
    title: 'Readable on a phone first',
    text: 'Most visitors arrive on a small screen. Layouts are built so text, buttons and forms stay usable at that size.',
  },
  {
    title: 'Free domain and hosting included',
    text: 'A free domain and free hosting come with the build. Paid hosting plans and paid domains are not provided or set up.',
  },
  {
    title: 'Small, clear next steps',
    text: 'Pick a service, describe what you need, discuss the details. No account to create and no hidden form fields.',
  },
];

const chapters: RailItem[] = [
  { id: 'first-impressions', index: '01', label: 'First impressions' },
  { id: 'services', index: '02', label: 'Choose your website' },
  { id: 'possibilities', index: '03', label: 'Website possibilities' },
  { id: 'pricing', index: '04', label: 'Clear pricing' },
  { id: 'conversation', index: '05', label: 'Start a conversation' },
];

export function Home() {
  usePageMeta(
    'Webent — Landing pages, one-page and multi-page websites',
    'Webent designs and builds landing pages, one-page websites and multi-page websites. Prices stated up front: PKR 3,000, PKR 4,000 and PKR 10,000.',
    '/'
  );
  useReveal();
  useParallaxLayers();

  const heroRef = useRef<HTMLElement | null>(null);
  const [heroEntered, setHeroEntered] = useState(false);

  // The hero entrance replays whenever the top of the page comes back into
  // view — a visitor who landed once would otherwise never see it again.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setHeroEntered(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setHeroEntered(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ------------------------------------------------------ ROOM 00 · ARRIVAL */}
      <section className={`arrival ${heroEntered ? 'is-entered' : ''}`} ref={heroRef}>
        <Film mode="hero" className="arrival__film" />

        <div className="arrival__inner">
          <div className="arrival__top">
            <span className="mono-label arrival__label">Room 00 — arrival</span>
            <span className="mono-label arrival__top-mid">Webent · website studio</span>
            <span className="mono-label">PKR 3,000 → 10,000</span>
          </div>

          <div className="arrival__main">
            <div className="arrival__type">
              <SplitWords
                as="h1"
                className="display arrival__title"
                delay={280}
                segments={[
                  { text: 'Your website' },
                  { text: 'is the first' },
                  { text: 'impression.', accent: true },
                ]}
              />
              <p className="arrival__lede">
                Landing pages, one-page and multi-page websites for small businesses.
              </p>
              <div className="arrival__actions">
                <Link className="btn btn--lime" to="/pricing">
                  <SwapLabel text="See the prices" />
                  <ArrowUpRight className="btn__arrow" />
                </Link>
                <Link className="btn btn--ghost" to="/contact">
                  <SwapLabel text="Start a conversation" />
                  <ArrowRight className="btn__arrow" />
                </Link>
              </div>
            </div>

          </div>

          <div className="arrival__foot">
            <span className="mono-label">Scroll — the page is a tour</span>
            <span className="arrival__cue" aria-hidden="true">
              <span />
            </span>
            <span className="mono-label">Free domain · free hosting</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- THE SHEET (PAPER) */}
      <section className="sheet" aria-label="A website drawn as an elevation">
        <div className="sheet__frame">
          <div className="sheet__head">
            <p className="mono-label">Fig. 01 — elevation</p>
            <p className="sheet__note">
              A website is built like a building: structure first, then the finishes.
            </p>
          </div>
          <DraftElevation />
          <div className="sheet__foot">
            <span className="mono-label">Drawn to scale</span>
            <span className="mono-label">webent / {new Date().getFullYear()}</span>
          </div>
        </div>
      </section>

      <ChapterRail items={chapters} />

      <Marquee />

      {/* ------------------------------------------------------- CH01 · DARK */}
      <section className="section" id="first-impressions">
        <div className="shell">
          <div className="chapter chapter--single">
            <Reveal className="chapter__aside">
              <p className="chapter__index">
                <b>01</b> — Room one · First impressions
              </p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                segments={[{ text: 'A visitor decides' }, { text: 'quickly.', accent: true }]}
              />
              <p className="body-copy" style={{ maxWidth: '32ch' }}>
                The first screen decides whether someone stays. A clear headline and one obvious next
                step do most of that work.
              </p>
              <Link className="link-arrow" to="/services">
                Explore the services
                <ArrowUpRight />
              </Link>
            </Reveal>

            <div className="chapter__body">
              <Reveal delay={1}>
                <div className="statement">
                  <div className="statement__item">
                    <span className="statement__num">01</span>
                    <h3 className="statement__title">One clear idea</h3>
                    <p className="statement__text">One purpose per page.</p>
                  </div>
                  <div className="statement__item">
                    <span className="statement__num">02</span>
                    <h3 className="statement__title">Text that is read</h3>
                    <p className="statement__text">Sentences people actually finish.</p>
                  </div>
                  <div className="statement__item">
                    <span className="statement__num">03</span>
                    <h3 className="statement__title">A next step</h3>
                    <p className="statement__text">A button where the interest is.</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <ArrowDivider label="Chapter 02" />

      {/* ------------------------------------------- CH02 · SERVICES (PAPER) */}
      <section className="section section--paper" id="services">
        <div className="shell">
          <div className="section-head">
            <Reveal className="section-head__main">
              <p className="chapter__index">
                <b>02</b> — Room two · Choose your website
              </p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'Three ways to' }, { text: 'begin.', ink: true }]}
              />
            </Reveal>
            <Reveal delay={1}>
              <p className="body-copy" style={{ maxWidth: '30ch' }}>
                Pick the shape that fits.
              </p>
            </Reveal>
          </div>

          <ServiceIndex />


        </div>
      </section>

      {/* ------------------------------------------------ CH03 · POSSIBILITIES */}
      <section className="section" id="possibilities">
        <div className="shell">
          <div className="section-head">
            <Reveal className="section-head__main">
              <p className="chapter__index">
                <b>03</b> — Website possibilities
              </p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'What the page can' }, { text: 'hold.', accent: true }]}
              />
            </Reveal>
            <Reveal delay={1}>
              <p className="body-copy" style={{ maxWidth: '30ch' }}>
                Three layouts.
              </p>
            </Reveal>
          </div>

          <div className="gallery">
            <Reveal variant="scale" className="gallery__row">
              <div className="gallery__figure" data-reveal="wipe">
                <LayoutDemo
                  variant="landing"
                  caption={{ em: 'One purpose, one action', text: 'Landing page' }}
                />
              </div>
              <div>
                <h3 className="h3">Everything points one way</h3>
                <p className="body-copy">One message, one button, no side roads.</p>
              </div>
            </Reveal>

            <Reveal variant="scale" className="gallery__row gallery__row--flip">
              <div className="gallery__figure" data-reveal="wipe">
                <LayoutDemo
                  variant="one-page"
                  caption={{ em: 'A full story, one scroll', text: 'One-page website' }}
                />
              </div>
              <div>
                <h3 className="h3">Several sections, no page changes</h3>
                <p className="body-copy">Services, pricing and contact, stacked in one scroll.</p>
              </div>
            </Reveal>

            <Reveal variant="scale" className="gallery__row">
              <div className="gallery__figure" data-reveal="wipe">
                <LayoutDemo
                  variant="multi-page"
                  caption={{ em: 'Room for every part', text: 'Multi-page website' }}
                />
              </div>
              <div>
                <h3 className="h3">A place for each subject</h3>
                <p className="body-copy">Separate pages, one shared navigation.</p>
              </div>
            </Reveal>
          </div>


        </div>
      </section>

      {/* -------------------------------------------------------- ROOM · THE FILM */}
      <section className="film-room" aria-label="Film — the same page from ten angles">
        <Film mode="scroll" />
      </section>

      <ArrowDivider label="How it works" flip />

      {/* ------------------------------------------- HOW IT WORKS (PAPER) */}
      <section className="section section--lime" id="how-it-works">
        <div className="shell">
          <div className="section-head">
            <Reveal className="section-head__main">
              <p className="eyebrow">How it works</p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'Three steps, then a' }, { text: 'conversation.', ink: true }]}
              />
            </Reveal>
          </div>

          <div className="steps">
            {[
              {
                title: 'Select a service',
                text: 'Pick the landing page, one-page site or multi-page site.',
              },
              {
                title: 'Share your requirements',
                text: 'Send your details and a few sentences about the website.',
              },
              {
                title: 'Discuss and confirm',
                text: 'Talk it through and confirm before anything starts.',
              },
            ].map((step, index) => (
              <Reveal as="article" className="step" delay={index} key={step.title}>
                <span className="step__num" aria-hidden="true">
                  0{index + 1}
                </span>
                <span className="mono-label">Step {index + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PinnedStatement
        lines={['Built like', 'it matters.']}
        caption="Scroll — then read the price"
      />

      {/* -------------------------------------------- CH04 · PRICING (LIME EDGE) */}
      <section className="section" id="pricing">
        <div className="shell">
          <div className="section-head">
            <Reveal className="section-head__main">
              <p className="chapter__index">
                <b>04</b> — Room four · Clear pricing
              </p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'The price is the' }, { text: 'price.', accent: true }]}
              />
            </Reveal>
          </div>

          <PricingCarousel />

          <Included className="included--section" />


        </div>
      </section>

      {/* ---------------------------------------------------- WHY (PAPER) */}
      <section className="section section--paper" id="why">
        <div className="shell">
          <div className="split">
            <Reveal className="split__content">
              <p className="eyebrow">Why a page at all</p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ margin: '14px 0 22px' }}
                segments={[{ text: 'Somewhere to send' }, { text: 'people.', ink: true }]}
              />

              <div className="reason-list">
                {reasons.map((reason, index) => (
                  <Reveal className="reason" delay={index} key={reason.title}>
                    <span className="reason__bullet" aria-hidden="true">
                      <CheckIcon />
                    </span>
                    <div>
                      <h3 className="reason__title">{reason.title}</h3>
                      <p className="reason__text">{reason.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal className="split__media demo--paper" variant="scale" delay={1}>
              <LayoutDemo
                variant="multi-page"
                caption={{ em: 'Click the navigation', text: 'Multi-page layout' }}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section className="section" id="faq">
        <div className="shell">
          <div className="faq-room">
            <Reveal className="faq-room__aside">
              <p className="eyebrow">Questions</p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                style={{ marginTop: 14 }}
                segments={[{ text: 'Before you' }, { text: 'choose.', accent: true }]}
              />
              <p className="faq-room__count mono-label">
                {String(faqs.length).padStart(2, '0')} answers
              </p>
              <a
                className="faq-room__link"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask something else
                <ArrowUpRight />
              </a>
            </Reveal>

            <Reveal className="faq-room__list" delay={1}>
              <Faq items={faqs} idPrefix="home" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- CH05 · CONVERSATION */}
      <section className="section section--ink-2" id="conversation">
        <div className="shell">
          <div className="chapter chapter--reverse">
            <div className="chapter__body">
              <Reveal variant="scale">
                <LayoutDemo
                  variant="one-page"
                  caption={{ em: 'The form on the contact page', text: 'Stores your inquiry' }}
                />
              </Reveal>
            </div>

            <Reveal className="chapter__aside">
              <p className="chapter__index">
                <b>05</b> — Start a conversation
              </p>
              <SplitWords
                as="h2"
                className="h2"
                onScroll
                segments={[{ text: 'Tell us what the page has to' }, { text: 'do.', accent: true }]}
              />
              <p className="body-copy" style={{ maxWidth: '32ch' }}>
                A few sentences about the business and what a visitor should be able to do.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link className="btn btn--lime" to="/contact">
                  Open the form
                  <ArrowUpRight className="btn__arrow" />
                </Link>
                <a
                  className="btn btn--ghost"
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- FINAL CTA */}
      <section className="cta-band">
        <ArrowField className="cta-band__arrows" />
        <div className="shell" style={{ paddingBlock: 'clamp(56px, 8vw, 104px)', position: 'relative', zIndex: 1 }}>
          <div className="cta-band__inner">
            <Reveal>
              <p className="eyebrow eyebrow--plain" style={{ color: 'rgba(16,24,32,0.6)' }}>
                Ready when you are
              </p>
              <SplitWords
                as="h2"
                className="display display--sm"
                onScroll
                style={{ marginTop: 16 }}
                segments={[{ text: 'Start with the' }, { text: 'price.', accent: true }]}
              />
            </Reveal>
            <Reveal className="cta-band__actions" delay={1}>
              <Link className="btn btn--ink" to="/pricing">
                <SwapLabel text="View pricing" />
                <ArrowUpRight className="btn__arrow" />
              </Link>
              <Link className="btn btn--outline-ink" to="/contact">
                Contact
                <ArrowRight className="btn__arrow" />
              </Link>
              <a
                className="btn btn--outline-ink"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </Reveal>
            <p className="cta-band__note">Opens a message you can edit before sending.</p>
          </div>
        </div>
      </section>
    </>
  );
}

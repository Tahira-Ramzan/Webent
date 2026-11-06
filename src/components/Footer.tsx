import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, site, whatsappLink } from '../config/site';
import { ArrowUpRight, MailIcon, WhatsAppIcon } from './Icons';
import { prefersReducedMotion } from '../hooks/useMotion';
import { scrollToPosition } from '../hooks/useSmoothScroll';

/** Hairline table footer — drawn like a title block on a technical sheet. */
export function Footer() {
  const year = new Date().getFullYear();
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty('--fill', '1');
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.9)));
      el.style.setProperty('--fill', p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <footer className="sheet-footer" data-fab-clear>
      <div className="sheet-footer__frame">
        {/* ---- row 1: statement + directory + mark ---- */}
        <div className="sheet-footer__statement">
          <p className="mono-label">webent — websites, built properly</p>
          <p className="sheet-footer__claim">
            A small studio for
            <br />
            landing pages, one-page
            <br />
            and multi-page sites.
          </p>
        </div>

        <nav className="sheet-footer__col" aria-label="Pages">
          <p className="mono-label">Pages</p>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/pricing">Pricing</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>

        <nav className="sheet-footer__col" aria-label="Packages">
          <p className="mono-label">Packages</p>
          <ul>
            {site.services.map((service) => (
              <li key={service.id}>
                <Link to={`/contact?service=${service.id}`}>{service.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sheet-footer__mark">
          <img src={site.logo} alt={`${site.name} logo`} width={666} height={195} loading="lazy" decoding="async" />
        </div>

        {/* ---- row 2: contact cells ---- */}
        <a className="sheet-footer__cell" href={`mailto:${site.email}`}>
          <span className="mono-label">Email</span>
          <span className="sheet-footer__value">
            {site.email}
            <MailIcon className="sheet-footer__arrow" />
          </span>
        </a>

        <a
          className="sheet-footer__cell"
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mono-label">WhatsApp</span>
          <span className="sheet-footer__value">
            {site.whatsapp.display}
            <WhatsAppIcon className="sheet-footer__arrow" />
          </span>
        </a>

        <div className="sheet-footer__cell">
          <span className="mono-label">Starting at</span>
          <span className="sheet-footer__value">
            {formatPrice(site.services[0].price)}{' '}
            <em>registration {formatPrice(site.services[0].registrationFee)}</em>
          </span>
        </div>

        <button
          type="button"
          className="sheet-footer__cell sheet-footer__cell--top"
          onClick={() => scrollToPosition(0, false)}
        >
          <span className="mono-label">Back to top</span>
          <span className="sheet-footer__value">
            Top of page
            <ArrowUpRight className="sheet-footer__arrow" />
          </span>
        </button>
      </div>

      {/* ---- drafting wordmark ---- */}
      <div className="sheet-footer__word" ref={markRef} aria-hidden="true">
        <span className="sheet-footer__word-outline">webent</span>
        <span className="sheet-footer__word-fill">webent</span>
        <span className="sheet-footer__ruler" />
      </div>

      <div className="sheet-footer__bar">
        <p>
          © {year} {site.name}. All rights reserved.
        </p>
        <p className="sheet-footer__bar-mid">Designed &amp; built by webent</p>
        <nav aria-label="Footer utility">
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Owner login</Link>
        </nav>
      </div>
    </footer>
  );
}

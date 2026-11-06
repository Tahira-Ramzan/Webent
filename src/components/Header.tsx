import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { navLinks, site, whatsappLink } from '../config/site';
import { useScrolled } from '../hooks/useReveal';
import { WhatsAppIcon, ArrowUpRight } from './Icons';
import { scrollToPosition } from '../hooks/useSmoothScroll';

const drawerLinks = [...navLinks];

/**
 * Header as a hairline title strip: the wordmark sits in its own cell, every
 * destination is a numbered cell with a rule between them, and the contact cell
 * is the only filled one on the page. On scroll the strip compresses and the
 * cells slide closer together.
 */
export function Header() {
  const scrolled = useScrolled(20);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState('');
  const [station, setStation] = useState({ index: 0, total: 0 });

  /* The phone strip has no room for four links, so it carries the name of the
     room the visitor is standing in instead — it changes as the tour moves. */
  useEffect(() => {
    let last = '';
    let lastStation = '';
    let raf = 0;
    const read = () => {
      raf = 0;
      const marks = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.arrival__label, .eyebrow, .chapter__index, .page-head__room-label',
        ),
      );
      let next = '';
      let active = 0;
      marks.forEach((mark, i) => {
        const rect = mark.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.42) {
          // "02 — Room two · Choose your website" keeps only the room name
          next = (mark.textContent ?? '').split('·')[0].trim();
          active = i;
        }
      });
      if (next !== last) {
        last = next;
        setRoom(next);
      }
      const stamp = `${active}:${marks.length}`;
      if (stamp !== lastStation) {
        lastStation = stamp;
        setStation({ index: active, total: marks.length });
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    body.classList.add('menu-open');

    const first = drawerRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a, button'),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
      body.classList.remove('menu-open');
    };
  }, [open]);

  return (
    <>
      <header className={`strip ${scrolled ? 'strip--compact' : ''} ${open ? 'strip--open' : ''}`}>
        <div className="strip__inner">
          <Link className="strip__brand" to="/" aria-label={`${site.name} — home`}>
            <img
              className="strip__logo"
              src={site.logo}
              alt={site.name}
              width={666}
              height={195}
              decoding="async"
            />
          </Link>

          <span className="strip__divider" aria-hidden="true" />

          <p className="strip__room" aria-hidden="true">
            <span className="strip__room-dot" />
            <span className="strip__room-text">{room || 'Room 00 — arrival'}</span>
          </p>

          {station.total > 1 ? (
            <span className="strip__stations" aria-hidden="true">
              {Array.from({ length: Math.min(station.total, 7) }).map((_, i) => (
                <span
                  key={i}
                  className={`strip__tick ${i <= station.index ? 'is-past' : ''} ${
                    i === station.index ? 'is-now' : ''
                  }`}
                />
              ))}
            </span>
          ) : null}

          <nav className="strip__nav" aria-label="Primary" onMouseLeave={() => setHovered(null)}>
            {navLinks.map((link, index) => (
              <NavLink
                key={link.to}
                className="strip__link"
                to={link.to}
                end={link.to === '/'}
                onMouseEnter={() => setHovered(link.to)}
              >
                <span className="strip__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="strip__label">{link.label}</span>
                <span className={`strip__rule ${hovered === link.to ? 'is-on' : ''}`} aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <span className="strip__spacer" aria-hidden="true" />

          <a
            className="strip__contact"
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="strip__contact-icon" />
            <span>WhatsApp</span>
            <ArrowUpRight className="strip__contact-arrow" />
          </a>

          <button
            ref={burgerRef}
            type="button"
            className="strip__burger"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="strip__burger-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>

        <span className="strip__progress" aria-hidden="true">
          <span className="strip__progress-fill" />
        </span>
      </header>

      <div
        className="menu"
        id="site-menu"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        ref={drawerRef}
        aria-hidden={!open}
      >
        <div className="menu__inner">
          <nav className="menu__nav" aria-label="Menu">
            {drawerLinks.map((link, index) => (
              <NavLink
                key={link.to}
                className="menu__link"
                to={link.to}
                end={link.to === '/'}
                style={{ '--i': index } as CSSProperties}
              >
                <span className="menu__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="menu__word">{link.label}</span>
                <ArrowUpRight className="menu__arrow" />
              </NavLink>
            ))}
          </nav>

          <div className="menu__foot">
            <a className="menu__cta" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
            <div className="menu__meta">
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                {site.whatsapp.display}
              </a>
              <button type="button" className="menu__top" onClick={() => scrollToPosition(0, false)}>
                Back to top <ArrowUpRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

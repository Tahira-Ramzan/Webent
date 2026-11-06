import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

export type RailItem = { id: string; index: string; label: string };

/**
 * Editorial chapter rail: fixed dots on the right that track which chapter is
 * in the middle of the viewport. Desktop only — it is decoration for pointer
 * users and never competes with the page content on small screens.
 */
export function ChapterRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');
  const [onPaper, setOnPaper] = useState(false);
  const [shown, setShown] = useState(false);

  const [hidden, setHidden] = useState(false);

  // the film room owns the whole screen — the chapter rail steps aside there
  useEffect(() => {
    const room = document.querySelector('.film-room');
    if (!room || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setHidden(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(room);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            // the rail sits on whatever room is in the middle of the screen —
            // it has to re-ink itself when that room is paper
            setOnPaper(entry.target.classList.contains('section--paper'));
          }
        }
      },
      { rootMargin: '-46% 0px -46% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`rail ${shown ? 'is-shown' : ''} ${hidden ? 'is-hidden' : ''} ${
        onPaper ? 'is-on-paper' : ''
      }`}
      aria-label="Chapters"
    >
      <ol className="rail__list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={`rail__link ${active === item.id ? 'is-active' : ''}`}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              onClick={(event) => {
                const target = document.getElementById(item.id);
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({
                  behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                  block: 'start',
                });
                history.replaceState(null, '', `#${item.id}`);
              }}
            >
              <span className="rail__label">
                {item.index} — {item.label}
              </span>
              <span className="rail__dot" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

const ITEMS = [
  'Landing pages',
  'One-page websites',
  'Multi-page websites',
  'Clear pricing',
  'Built for small businesses',
  'Start on WhatsApp',
];

/** Decorative scrolling strip. Duplicated once so the loop is seamless; paused for reduced motion. */
export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Scroll velocity feeds the strip: it races while the page moves, then settles.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let last = window.scrollY;
    let frame = 0;
    let boost = 0;

    const tick = () => {
      frame = 0;
      const now = window.scrollY;
      const delta = Math.abs(now - last);
      last = now;
      boost += (Math.min(1, delta / 90) - boost) * 0.16;
      track.style.setProperty('--boost', boost.toFixed(3));
      if (boost > 0.002) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const group = (
    <div className="marquee__group" aria-hidden="true">
      {ITEMS.map((item) => (
        <span className="marquee__item" key={item}>
          {item}
          <svg
            className="marquee__arrow"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      <p className="sr-only">Services: landing pages, one-page websites, multi-page websites.</p>
      <div className="marquee__track" ref={trackRef}>
        {group}
        {group}
      </div>
    </div>
  );
}

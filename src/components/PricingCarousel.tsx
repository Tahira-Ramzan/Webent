import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { PricingCard } from './PricingCard';
import { ArrowRight, ArrowUpLeft } from './Icons';
import { prefersReducedMotion } from '../hooks/useMotion';

/**
 * Pricing list.
 *
 * Desktop: the three cards sit in a static grid.
 * Phone/tablet: the same cards become a swipeable, snap-scrolling track with
 * arrow buttons, dots and a 01 / 03 counter, so the cards never squeeze into
 * an unreadable stack.
 */
export function PricingCarousel({ paper = false }: { paper?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = site.services.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const card = track.querySelector<HTMLElement>('.price-card');
      if (!card) return;
      const step = card.offsetWidth + 16;
      setIndex(Math.min(count - 1, Math.max(0, Math.round(track.scrollLeft / step))));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count]);

  const step = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.price-card');
    const width = card ? card.offsetWidth + 16 : track.clientWidth;
    track.scrollBy({
      left: direction * width,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.price-card');
    const width = card ? card.offsetWidth + 16 : track.clientWidth;
    track.scrollTo({ left: next * width, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="pricing-carousel">
      <div className={`pricing-grid ${paper ? 'pricing-grid--paper' : ''}`} ref={trackRef}>
        {site.services.map((service, i) => (
          <PricingCard key={service.id} service={service} index={i} paper={paper} />
        ))}
      </div>

      <div className="pricing-nav">
        <div className="pricing-nav__arrows">
          <button
            type="button"
            className="pricing-nav__btn"
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label="Previous package"
          >
            <ArrowUpLeft />
          </button>
          <button
            type="button"
            className="pricing-nav__btn"
            onClick={() => step(1)}
            disabled={index === count - 1}
            aria-label="Next package"
          >
            <ArrowRight />
          </button>
        </div>

        <div className="pricing-nav__dots" role="tablist" aria-label="Packages">
          {site.services.map((service, i) => (
            <button
              key={service.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={service.name}
              className={`pricing-nav__dot ${i === index ? 'is-on' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <span className="pricing-nav__count" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} <i>/</i> {String(count).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

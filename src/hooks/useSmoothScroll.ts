import { useEffect } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion } from './useMotion';

type LenisLike = { scrollTo: (target: number | string | HTMLElement, opts?: Record<string, unknown>) => void; destroy: () => void };

declare global {
  interface Window {
    __lenis?: LenisLike;
  }
}

/**
 * Site-wide inertial scrolling, the way the reference does it: wheel input is
 * interpolated instead of jumping. Only switched on for precise pointers that
 * are not asking for reduced motion — touch devices keep their native scroll,
 * which is smoother and cheaper than anything scripted.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1,
      syncTouch: false,
    });

    window.__lenis = lenis as unknown as LenisLike;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
}

/** Scroll to an absolute position, through Lenis when it is running. */
export function scrollToPosition(top: number, immediate = true) {
  if (window.__lenis) {
    window.__lenis.scrollTo(top, { immediate });
    return;
  }
  window.scrollTo({ top, left: 0, behavior: 'auto' });
}

/** Scroll to an element (used for in-page anchors). */
export function scrollToElement(el: HTMLElement) {
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { immediate: true, offset: -84 });
    return;
  }
  el.scrollIntoView({ behavior: 'auto', block: 'start' });
}

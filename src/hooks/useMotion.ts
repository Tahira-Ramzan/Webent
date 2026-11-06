import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Scroll-reveal driver.
 * Elements opt in with `data-reveal` (optionally `data-reveal="left|right|scale|fade|words|wipe"`).
 * A single IntersectionObserver serves the whole page — no animation library, no scroll jank.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (nodes.length === 0) return;

    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.1 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Scroll-linked parallax. Every `[data-parallax]` element receives `--p` (-1 … 1)
 * from its position in the viewport; CSS turns that into a transform.
 * One rAF loop for all layers, disabled for reduced motion and small screens.
 */
export function useParallaxLayers(deps: unknown[] = []) {
  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia('(max-width: 860px)').matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    if (nodes.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of nodes) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const centre = rect.top + rect.height / 2;
        const p = Math.max(-1, Math.min(1, (centre - vh / 2) / (vh / 2)));
        el.style.setProperty('--p', p.toFixed(3));
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** True once the window has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Pointer-follow tilt + spotlight for cards.
 * Desktop pointers only; returns a ref that also exposes --mx/--my as percentages.
 */
export function useTilt<T extends HTMLElement>(maxDegrees = 5) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || isCoarsePointer()) return;

    let frame = 0;
    let rx = 0;
    let ry = 0;
    let mx = 50;
    let my = 50;

    const apply = () => {
      frame = 0;
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--mx', `${mx.toFixed(1)}%`);
      el.style.setProperty('--my', `${my.toFixed(1)}%`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      ry = (px - 0.5) * maxDegrees * 2;
      rx = -(py - 0.5) * maxDegrees * 2;
      mx = px * 100;
      my = py * 100;
      el.classList.add('is-tilting');
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const onLeave = () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [maxDegrees]);

  return ref;
}

/** Reads the page scroll progress 0…1 and drives the top progress bar. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/**
 * Counts a number up when it scrolls into view.
 * The final value is always what assistive technology reads.
 */
export function useCountUp(target: number, duration = 1100) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setValue(target);
      return;
    }

    let frame = 0;
    let started = false;
    const animate = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            setValue(0);
            animate();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return { ref, value };
}

/** Adds a class to <html> once the first paint is done (used for staged entrances). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/** Convenience: run a callback once when an element first becomes visible. */
export function useInViewOnce(onEnter: () => void) {
  const ref = useRef<HTMLElement>(null);
  const callback = useCallback(onEnter, [onEnter]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      callback();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback]);

  return ref;
}

/**
 * Magnetic arrow.
 *
 * While the pointer is over a button, the arrow inside it leans towards the
 * cursor: a few pixels of travel plus a clamped rotation, so it feels like it is
 * tracking the person rather than spinning wildly. Precise pointers only, and
 * completely inert for reduced motion.
 */
export function useArrowCompass() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let current: SVGElement | null = null;
    let host: HTMLElement | null = null;

    const reset = (el: SVGElement | null) => {
      if (!el) return;
      el.style.setProperty('--ax', '0px');
      el.style.setProperty('--ay', '0px');
      el.style.setProperty('--rot', '0deg');
    };

    const apply = (event: PointerEvent) => {
      frame = 0;
      const target = event.target as HTMLElement | null;
      const nextHost = target?.closest<HTMLElement>('.btn, .link-arrow, .sheet-footer__cell') ?? null;
      const nextArrow = nextHost?.querySelector<SVGElement>('.btn__arrow, svg') ?? null;

      if (nextHost !== host) {
        reset(current);
        host = nextHost;
        current = nextArrow;
      }
      if (!nextArrow) return;

      const box = nextArrow.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy) || 1;
      const pull = Math.min(5, distance / 22);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // the arrow glyph already points to the upper right (-45deg), so aim from there
      const rotation = Math.max(-20, Math.min(20, angle + 45));

      nextArrow.style.setProperty('--ax', `${((dx / distance) * pull).toFixed(2)}px`);
      nextArrow.style.setProperty('--ay', `${((dy / distance) * pull).toFixed(2)}px`);
      nextArrow.style.setProperty('--rot', `${rotation.toFixed(1)}deg`);
    };

    const onMove = (event: PointerEvent) => {
      if (!frame) frame = requestAnimationFrame(() => apply(event));
    };
    const onLeave = () => {
      reset(current);
      current = null;
      host = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (frame) cancelAnimationFrame(frame);
      reset(current);
    };
  }, []);
}

/**
 * Click burst: pressing a button releases a handful of arrows that fly out and
 * fade. Six elements, half a second, cleaned up on animation end.
 */
export function useArrowBurst() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.btn, .index-row__link, .pricing-nav__btn')) return;

      for (let i = 0; i < 6; i += 1) {
        const node = document.createElement('div');
        node.className = 'arrow-burst';
        node.innerHTML =
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg>';
        node.style.left = `${event.clientX}px`;
        node.style.top = `${event.clientY}px`;
        document.body.appendChild(node);

        const angle = (Math.PI * 2 * i) / 6 + 0.4;
        const distance = 34 + Math.random() * 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        const animation = node.animate(
          [
            { transform: 'translate3d(0,0,0) rotate(0deg) scale(0.6)', opacity: 1 },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${(dx * 2).toFixed(1)}deg) scale(1)`,
              opacity: 0,
            },
          ],
          { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        );
        animation.onfinish = () => node.remove();
        animation.oncancel = () => node.remove();
      }
    };

    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
}

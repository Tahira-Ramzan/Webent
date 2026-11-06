import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

/**
 * Signature cursor companion: a lime arrow that trails behind the pointer,
 * with a live X/Y pixel readout — the same "instrument panel" feel as the
 * reference site, built from scratch.
 *
 * The native cursor is never hidden, so nothing about clicking, selecting or
 * typing changes. Desktop pointers only; nothing renders for touch or reduced
 * motion.
 */
export function CursorCompanion() {
  const arrowRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const arrow = arrowRef.current;
    const read = readRef.current;
    const tail = tailRef.current;
    if (!arrow || !read) return;

    // five echo arrows, each one a little lazier than the last
    const echoes = tail ? Array.from(tail.querySelectorAll<HTMLElement>('.cursor-tail')) : [];
    const echoState = echoes.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    const echoLag = [0.12, 0.09, 0.07, 0.05, 0.035];

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let frame = 0;
    let started = false;
    let idleTimer = 0;

    const render = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      arrow.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      echoes.forEach((el, i) => {
        const state = echoState[i];
        state.x += (x - state.x) * echoLag[i];
        state.y += (y - state.y) * echoLag[i];
        el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${(i % 2 === 0 ? 1 : -1) * (i + 1) * 9}deg) scale(${(1 - i * 0.11).toFixed(2)})`;
        el.style.opacity = String(Math.max(0.05, 0.34 - i * 0.06));
      });
      read.style.transform = `translate3d(${(targetX + 26).toFixed(1)}px, ${(targetY + 24).toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      read.textContent = `X ${Math.round(targetX)} PX   Y ${Math.round(targetY)} PX`;
      if (!started) {
        started = true;
        arrow.classList.add('is-on');
        read.classList.add('is-on');
        frame = requestAnimationFrame(render);
      }
      arrow.classList.remove('is-idle');
      echoes.forEach((el) => el.classList.add('is-on'));
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        arrow.classList.add('is-idle');
        echoes.forEach((el) => el.classList.remove('is-on'));
      }, 700);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('a, button, [data-cursor="grow"]');
      arrow.classList.toggle('is-active', Boolean(interactive));
    };

    const onLeave = () => {
      arrow.classList.remove('is-on');
      read.classList.remove('is-on');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerleave', onLeave);
      window.clearTimeout(idleTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cursor-companion" aria-hidden="true">
      <div className="cursor-tail-wrap" ref={tailRef}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="cursor-tail" key={i}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M8.5 7H17v8.5" />
            </svg>
          </div>
        ))}
      </div>
      <div className="cursor-arrow" ref={arrowRef}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M8.5 7H17v8.5" />
        </svg>
      </div>
      <div className="cursor-readout" ref={readRef} />
    </div>
  );
}

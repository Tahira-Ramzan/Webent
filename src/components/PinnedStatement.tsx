import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

type Props = {
  /** Lines are stacked; each character lights up in order as the section scrolls. */
  lines: string[];
  /** Small mono caption under the statement. */
  caption?: string;
  id?: string;
};

/**
 * Pinned scroll statement.
 *
 * The section is two viewports tall and the text inside sticks to the middle,
 * so the words stay put while the scroll drives them: characters fill in one by
 * one, then the whole line drifts up and dissolves. Everything is computed from
 * one scroll progress value, so there is no timeline library involved.
 */
export function PinnedStatement({ lines, caption, id }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const chars = Array.from(stage.querySelectorAll<HTMLElement>('.pin-char'));
    const captionEl = stage.parentElement?.querySelector<HTMLElement>('.pin__caption') ?? null;

    if (prefersReducedMotion()) {
      chars.forEach((c) => c.classList.add('is-lit'));
      stage.style.setProperty('--pin', '1');
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = wrap.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));

      // 0 → LIT fills the characters, LIT → HOLD lets the last glow land,
      // only after that does the block lift away. The words never leave the
      // screen while they are still lighting up.
      const LIT = 0.44;
      const HOLD = 0.8;
      const fill = Math.min(1, progress / LIT);
      const lit = Math.floor(fill * chars.length + 0.0001);
      chars.forEach((char, i) => {
        const on = i < lit;
        if (char.classList.contains('is-lit') !== on) char.classList.toggle('is-lit', on);
      });

      const out = progress <= HOLD ? 0 : (progress - HOLD) / (1 - HOLD);
      stage.style.setProperty('--pin', progress.toFixed(4));
      stage.style.transform = `translate3d(0, ${(-out * 14).toFixed(2)}vh, 0)`;
      stage.style.opacity = `${1 - out * out}`;
      if (captionEl) {
        captionEl.style.opacity = `${progress < 0.36 ? 1 : Math.max(0, 1 - (progress - 0.36) / 0.22)}`;
      }
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

  let charIndex = 0;

  return (
    <div className="pin" ref={wrapRef} id={id}>
      <div className="pin__stage" ref={stageRef}>
        <div className="pin__inner">
          <h2 className="pin__text" aria-label={lines.join(' ')}>
            {lines.map((line) => (
              <span className="pin__line" key={line} aria-hidden="true">
                {Array.from(line).map((char, i) => (
                  <span
                    className={`pin-char${char === ' ' ? ' is-space' : ''}`}
                    key={`${line}-${i}`}
                    data-i={charIndex++}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          {caption ? <p className="pin__caption mono-label">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}

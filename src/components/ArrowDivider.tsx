import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

type Props = {
  label?: string;
  /** Mirror the arrow so consecutive dividers point opposite ways. */
  flip?: boolean;
  className?: string;
};

/**
 * A hand-drawn arrow that draws itself as the section scrolls past, then the
 * arrowhead arrives last. Built as an inline SVG path whose dash offset is
 * driven by scroll progress — no library, no images.
 */
export function ArrowDivider({ label, flip = false, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const line = lineRef.current;
    const head = headRef.current;
    if (!wrap || !line || !head) return;

    const lineLength = line.getTotalLength();
    const headLength = head.getTotalLength();
    line.style.strokeDasharray = `${lineLength}`;
    line.style.strokeDashoffset = `${lineLength}`;
    head.style.strokeDasharray = `${headLength}`;
    head.style.strokeDashoffset = `${headLength}`;

    if (prefersReducedMotion()) {
      line.style.strokeDashoffset = '0';
      head.style.strokeDashoffset = '0';
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the divider is a viewport below, 1 once it is a third up the screen
      const raw = (vh - rect.top) / (vh * 0.85);
      const progress = Math.min(1, Math.max(0, raw));
      const lineProgress = Math.min(1, progress / 0.78);
      const headProgress = Math.max(0, (progress - 0.72) / 0.28);
      line.style.strokeDashoffset = `${lineLength * (1 - lineProgress)}`;
      head.style.strokeDashoffset = `${headLength * (1 - headProgress)}`;
      wrap.style.setProperty('--draw', progress.toFixed(3));
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
    <div
      className={`arrow-divider ${flip ? 'arrow-divider--flip' : ''} ${className}`.trim()}
      ref={wrapRef}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none" focusable="false">
        <path
          ref={lineRef}
          className="arrow-divider__line"
          d="M2 74 C 210 22, 430 16, 640 44 S 950 84, 1122 40"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={headRef}
          className="arrow-divider__head"
          d="M1082 20 L1132 39 L1086 66"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {label ? <span className="arrow-divider__label">{label}</span> : null}
    </div>
  );
}

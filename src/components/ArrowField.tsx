import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

type Props = {
  cols?: number;
  rows?: number;
  className?: string;
};

/**
 * A field of arrows that behaves like iron filings: every arrow swings to point
 * at the pointer, the ones nearest to it grow and brighten, and the whole field
 * settles back into a slow idle drift when the pointer leaves. No images, one
 * SVG, transform-only updates.
 */
export function ArrowField({ cols = 11, rows = 5, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const groups = Array.from(wrap.querySelectorAll<SVGGElement>('g[data-arrow]'));
    if (!groups.length) return;

    const still = prefersReducedMotion();
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const count = groups.length;
    const angles = new Float32Array(count).fill(-45);
    const scales = new Float32Array(count).fill(1);

    let pointer: { x: number; y: number } | null = null;
    let visible = false;
    let frame = 0;
    let time = 0;

    const step = () => {
      time += 0.016;
      const box = wrap.getBoundingClientRect();
      const width = box.width || 1;
      const height = box.height || 1;

      for (let i = 0; i < count; i += 1) {
        const g = groups[i];
        const bx = Number(g.dataset.x);
        const by = Number(g.dataset.y);
        const px = (bx / 100) * width;
        const py = (by / 100) * height;

        let targetAngle: number;
        let targetScale = 1;

        if (pointer) {
          const dx = pointer.x - px;
          const dy = pointer.y - py;
          const distance = Math.hypot(dx, dy);
          targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 45;
          targetScale = Math.max(0.55, Math.min(1.9, 1.9 - distance / (width / 3)));
        } else {
          targetAngle = -45 + Math.sin(time * 1.1 + i * 0.42) * 26;
          targetScale = 1 + Math.sin(time * 1.4 + i * 0.3) * 0.08;
        }

        angles[i] += (targetAngle - angles[i]) * 0.14;
        scales[i] += (targetScale - scales[i]) * 0.12;
        g.setAttribute(
          'transform',
          `translate(${((bx / 100) * width).toFixed(1)} ${((by / 100) * height).toFixed(1)}) rotate(${angles[i].toFixed(2)}) scale(${scales[i].toFixed(3)})`,
        );
        g.style.opacity = String(Math.min(0.85, 0.22 + (scales[i] - 0.55) * 0.55));
      }

      frame = requestAnimationFrame(step);
    };

    const onMove = (event: PointerEvent) => {
      const box = wrap.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const onLeave = () => {
      pointer = null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const nowVisible = entry.isIntersecting;
          if (nowVisible && !visible && !still) {
            frame = requestAnimationFrame(step);
          }
          if (!nowVisible && visible && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
          visible = nowVisible;
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(wrap);

    if (still) {
      groups.forEach((g) => {
        const bx = Number(g.dataset.x);
        const by = Number(g.dataset.y);
        const box = wrap.getBoundingClientRect();
        g.setAttribute(
          'transform',
          `translate(${((bx / 100) * box.width).toFixed(1)} ${((by / 100) * box.height).toFixed(1)}) rotate(-45)`,
        );
      });
      return () => observer.disconnect();
    }

    if (fine) {
      wrap.addEventListener('pointermove', onMove, { passive: true });
      wrap.addEventListener('pointerleave', onLeave);
    }

    return () => {
      observer.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const arrows = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = ((c + 0.5) / cols) * 100;
      const y = ((r + 0.5) / rows) * 100;
      arrows.push(
        <g key={`${r}-${c}`} data-arrow data-x={x.toFixed(2)} data-y={y.toFixed(2)} transform="translate(0 0) rotate(-45)">
          <path
            d="M-7 7 L7 -7 M7 -7 H0.5 M7 -7 V-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>,
      );
    }
  }

  return (
    <div className={`arrow-field ${className}`.trim()} ref={wrapRef} aria-hidden="true">
      <svg focusable="false" width="100%" height="100%">
        {arrows}
      </svg>
    </div>
  );
}

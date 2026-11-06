import { useEffect, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion';

/* ------------------------------------------------------------------
   Deterministic pseudo-random, so the drawing is identical on every
   render and in every screenshot.
   ------------------------------------------------------------------ */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

type Branch = { d: string; w: number };

/** Bare winter tree built from recursive strokes — no image, no leaf blobs. */
function buildTree(baseX: number, baseY: number, height: number, seed: number): Branch[] {
  const rand = seeded(seed);
  const branches: Branch[] = [];

  const grow = (x: number, y: number, angle: number, length: number, depth: number) => {
    const endX = x + Math.cos(angle) * length;
    const endY = y - Math.sin(angle) * length;
    const bend = (rand() - 0.5) * length * 0.28;
    const midX = (x + endX) / 2 + bend;
    const midY = (y + endY) / 2 - bend * 0.35;
    branches.push({
      d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      w: Math.max(0.45, 1.55 - depth * 0.32),
    });
    if (depth >= 6 || length < 7) return;
    const spread = 0.34 + rand() * 0.3;
    const count = depth < 2 ? 3 : 2;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread + (rand() - 0.5) * 0.24;
      grow(endX, endY, angle + offset, length * (0.62 + rand() * 0.16), depth + 1);
    }
  };

  grow(baseX, baseY, Math.PI / 2 + (rand() - 0.5) * 0.08, height * 0.42, 0);
  return branches;
}

type Props = {
  /** Draw the line work on scroll progress instead of showing it at once. */
  drawOnScroll?: boolean;
  className?: string;
};

/**
 * "Elevation" — a browser window drawn the way an architect would draw a
 * building: hairline elevations, stipple shading, dimension strings, corner
 * registration marks and a single lime accent square.
 */
export function DraftElevation({ drawOnScroll = true, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Phones get a tighter crop: the drawing fills the width and the fine
  // annotation text is dropped instead of shrinking to nothing.
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const leftTree = useMemo(() => buildTree(196, 558, 300, 4711), []);
  const rightTree = useMemo(() => buildTree(986, 558, 268, 9133), []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const drawables = Array.from(wrap.querySelectorAll<SVGGeometryElement>('[data-draw]'));
    const treeGroup = wrap.querySelector<SVGGElement>('[data-fade="trees"]');

    drawables.forEach((el) => {
      const length = el.getTotalLength ? el.getTotalLength() : 0;
      if (!length) return;
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
    });

    if (!drawOnScroll || prefersReducedMotion()) {
      drawables.forEach((el) => {
        el.style.strokeDashoffset = '0';
      });
      if (treeGroup) treeGroup.style.opacity = '1';
      const stipple = wrap.querySelectorAll<SVGElement>('[data-stipple]');
      stipple.forEach((el) => {
        el.style.opacity = '1';
      });
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh * 0.92 - rect.top) / (vh * 0.72);
      const p = Math.min(1, Math.max(0, raw));
      drawables.forEach((el, i) => {
        const stagger = 0.5 * (i / Math.max(1, drawables.length));
        const local = Math.min(1, Math.max(0, (p - stagger) / (1 - stagger)));
        const length = el.style.strokeDasharray ? parseFloat(el.style.strokeDasharray) : 0;
        el.style.strokeDashoffset = `${length * (1 - local)}`;
      });
      if (treeGroup) {
        treeGroup.style.opacity = `${Math.min(1, Math.max(0, (p - 0.35) / 0.5))}`;
      }
      wrap.querySelectorAll<SVGElement>('[data-stipple]').forEach((el) => {
        el.style.opacity = `${Math.min(1, Math.max(0, (p - 0.45) / 0.45))}`;
      });
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
  }, [drawOnScroll]);

  const mullionsX = [452, 500, 548, 596, 644];
  const railY = [252, 300];

  return (
    <div className={`draft ${compact ? 'draft--compact' : ''} ${className}`.trim()} ref={wrapRef}>
      <svg
        viewBox={compact ? '150 108 880 520' : '0 0 1200 640'}
        role="img"
        aria-label="Technical elevation drawing of a website, drawn as a building facade"
      >
        <defs>
          <pattern id="draft-stipple" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.62" fill="currentColor" />
            <circle cx="4.7" cy="4.4" r="0.5" fill="currentColor" />
          </pattern>
          <pattern id="draft-halftone" width="4.4" height="4.4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.85" fill="currentColor" />
          </pattern>
          <linearGradient id="draft-shadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <mask id="draft-shadow-mask">
            <rect x="0" y="0" width="1200" height="640" fill="white" />
            <rect x="0" y="0" width="1200" height="640" fill="url(#draft-shadow)" />
          </mask>
        </defs>

        {/* ---------- registration marks ---------- */}
        <g className="draft__marks" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" data-fade>
          {[
            [34, 34],
            [1166, 34],
            [34, 606],
            [1166, 606],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <path d={`M${x - 7} ${y} H${x + 7} M${x} ${y - 7} V${y + 7}`} />
            </g>
          ))}
        </g>

        {/* ---------- ground line ---------- */}
        <path
          d="M42 560 H1158"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          data-draw
        />

        {/* ---------- cast shadow ---------- */}
        <polygon
          points="930,470 1150,560 930,560"
          fill="url(#draft-stipple)"
          opacity="0.35"
          data-stipple
          className="draft__shadow"
        />

        {/* ---------- trees ---------- */}
        <g data-fade="trees" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0">
          {[...leftTree, ...rightTree].map((branch, i) => (
            <path key={i} d={branch.d} strokeWidth={branch.w} opacity={i % 3 === 0 ? 0.9 : 0.62} />
          ))}
        </g>

        {/* ---------- stairs ---------- */}
        <g stroke="currentColor" strokeWidth="1" fill="none">
          {Array.from({ length: 7 }).map((_, i) => {
            const x = 242 + i * 11.5;
            const y = 558 - i * 12;
            return <path key={i} d={`M${x.toFixed(1)} ${(y + 12).toFixed(1)} V${y.toFixed(1)} H${(x + 11.5).toFixed(1)}`} data-draw />;
          })}
        </g>

        {/* ---------- facade mass ---------- */}
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="320" y="140" width="570" height="420" data-draw />
          {/* title bar */}
          <path d="M320 182 H890" data-draw />
          <circle cx="344" cy="161" r="4.4" fill="var(--lime)" stroke="none" className="draft__live-dot" />
          <circle cx="362" cy="161" r="4" data-draw />
          <circle cx="380" cy="161" r="4" data-draw />
          <rect x="404" y="151" width="250" height="20" rx="10" data-draw />
          <path d="M418 161 H470" strokeWidth="1" opacity="0.45" data-draw />

          {/* left rail */}
          <path d="M388 182 V560" data-draw />
          {[224, 266, 308, 350, 392, 434, 476, 518].map((y) => (
            <path key={y} d={`M320 ${y} H388`} strokeWidth="0.8" opacity="0.55" data-draw />
          ))}

          {/* hero bay */}
          <rect x="404" y="200" width="296" height="148" data-draw />
          <rect x="410" y="206" width="284" height="136" strokeWidth="0.7" opacity="0.75" data-draw />
          {mullionsX.map((x) => (
            <path key={x} d={`M${x} 200 V348`} strokeWidth="0.85" data-draw />
          ))}
          {railY.map((y) => (
            <path key={y} d={`M404 ${y} H700`} strokeWidth="0.85" data-draw />
          ))}

          {/* hero text block, drawn as a window pane */}
          <path d="M420 226 H520 M420 242 H478" strokeWidth="3.4" opacity="0.85" data-draw />

          {/* right stack of cards */}
          {[200, 252, 304].map((y) => (
            <g key={y}>
              <rect x="716" y={y} width="156" height="40" data-draw />
              <path d={`M730 ${y + 14} H812`} strokeWidth="2.6" opacity="0.7" data-draw />
              <path d={`M730 ${y + 26} H846`} strokeWidth="1" opacity="0.42" data-draw />
            </g>
          ))}

          {/* content grid */}
          <path d="M404 362 H872" data-draw />
          {[0, 1, 2, 3].map((col) =>
            [0, 1].map((row) => (
              <rect
                key={`${col}-${row}`}
                x={404 + col * 119}
                y={376 + row * 52}
                width={103}
                height={40}
                strokeWidth="0.85"
                opacity="0.72"
                data-draw
              />
            )),
          )}
          {/* halftone blocks inside two panes */}
          <rect x="523" y="376" width="103" height="40" fill="url(#draft-halftone)" opacity="0.22" stroke="none" data-stipple />
          <rect x="642" y="428" width="103" height="40" fill="url(#draft-halftone)" opacity="0.22" stroke="none" data-stipple />

          {/* CTA strip */}
          <rect x="404" y="486" width="150" height="34" fill="var(--lime)" stroke="none" opacity="0.9" data-stipple />
          <rect x="568" y="486" width="120" height="34" data-draw />
          <path d="M582 503 H664" strokeWidth="3" opacity="0.5" data-draw />

          {/* plinth */}
          <path d="M320 520 H890" strokeWidth="1.2" data-draw />
          <path d="M890 430 V560 H930 V470" data-draw />
          {[440, 470, 500, 530].map((y) => (
            <path key={y} d={`M890 ${y} H930`} strokeWidth="0.7" opacity="0.5" data-draw />
          ))}
        </g>

        {/* ---------- accent squares ---------- */}
        <g fill="var(--lime)" data-stipple>
          <rect x="404" y="352" width="7" height="7" />
          <rect x="864" y="300" width="7" height="7" />
        </g>

        {/* ---------- dimension strings ---------- */}
        <g stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.65" className="draft__dims">
          <path d="M320 600 H890" data-draw />
          <path d="M320 592 V608 M890 592 V608" data-draw />
          <path d="M320 592 l6 4 l-6 4 M890 592 l-6 4 l6 4" strokeWidth="0.8" data-draw />
          <path d="M320 148 V556" strokeWidth="0.6" opacity="0.5" data-draw />
          <path d="M1160 140 V560" strokeWidth="0.6" opacity="0.5" data-draw />
          <path d="M1154 140 H1166 M1154 560 H1166" data-draw />
        </g>

        {/* ---------- annotations ---------- */}
        <g className="draft__notes" fill="currentColor" fontSize="10.5" letterSpacing="1.6" fontFamily="var(--mono)">
          <text x="606" y="596" textAnchor="middle">1 4 4 0 &nbsp; P X</text>
          <text x="1170" y="352" transform="rotate(90 1170 352)" textAnchor="middle" opacity="0.75">F U L L &nbsp; B L E E D</text>
          <text x="62" y="596" opacity="0.75">0 1 &nbsp; H E R O</text>
          <text x="62" y="614" opacity="0.55">0 2 &nbsp; G R I D</text>
          <text x="1000" y="596" opacity="0.75">0 3 &nbsp; C T A</text>
        </g>
      </svg>
    </div>
  );
}

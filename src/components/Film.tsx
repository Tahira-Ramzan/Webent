import { useEffect, useRef, useState } from 'react';
import { buildScenes, floorLines, project, smooth, type Scene } from '../lib/film';
import { prefersReducedMotion } from '../hooks/useMotion';

const INK = '#101820';
const PAPER = '#f1f4ee';
const LIME = '#b0ea48';

type Props = {
  /** `scroll` pins the canvas and plays the ten scenes across the scroll. */
  mode?: 'scroll' | 'hero';
  className?: string;
};

/**
 * FILM — the same 240 points, ten times, from ten different angles.
 * Scroll mode pins a full-screen canvas and walks through the scenes; hero mode
 * runs a slow two-scene loop as a backdrop. Everything is drawn from points and
 * lines in the site's own palette.
 */
export function Film({ mode = 'scroll', className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef<HTMLOListElement>(null);
  const [scenes, setScenes] = useState<Scene[] | null>(null);

  useEffect(() => {
    setScenes(buildScenes());
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || !scenes) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const still = prefersReducedMotion();
    const floor = floorLines();
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let progress = 0;
    // the sticky canvas is only one viewport tall — the section around it is the
    // thing that actually scrolls, so progress is measured on the parent.
    const measure = (wrap.closest('.film-room') as HTMLElement | null) ?? wrap;
    const readProgress = () => {
      if (mode === 'hero') return 0;
      const rect = measure.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));
      return progress;
    };

    let frame = 0;
    let time = 0;

    const draw = () => {
      frame = 0;
      time += 0.016;

      const total = scenes.length;
      const p = mode === 'hero' ? (time * 0.06) % 1 : readProgress();
      // each scene gets an equal slice of the scroll, and the last one holds
      // all the way to the end instead of only finishing as the room exits
      const scaled = p * total;
      const index = Math.min(total - 2, Math.floor(scaled));
      const local = Math.min(1, scaled - index);
      const a = scenes[mode === 'hero' ? 0 : index];
      const b = scenes[mode === 'hero' ? 1 : index + 1];
      // each object holds still for most of its slice, then hands over to the
      // next one as a dissolve: the shapes are far too different to be dragged
      // point-for-point without turning into a tangle
      const blend = mode === 'hero'
        ? smooth((Math.sin(time * 0.35) + 1) / 2)
        : smooth(Math.max(0, (local - 0.58) / 0.42));

      const yawA = a.yaw;
      const yawB = b.yaw;
      const pitchA = a.pitch;
      const pitchB = b.pitch;
      const spin = a.spin ?? 1;
      const yaw = yawA + (yawB - yawA) * blend + (mode === 'hero' ? Math.sin(time * 0.18) * 0.35 : local * 0.55 * spin);
      const pitch = pitchA + (pitchB - pitchA) * blend;
      const zoom = a.zoom + (b.zoom - a.zoom) * blend;

      const cx = width / 2;
      // a touch above centre: the caption owns the bottom of the frame
      const cy = height * (mode === 'hero' ? 0.5 : 0.46);
      // phones get a smaller body so the drawing never leaves the frame
      const fit = width < 620 ? 0.272 : 0.315;
      const base = Math.min(width, height) * (mode === 'hero' ? 0.34 : fit) * zoom;

      ctx.clearRect(0, 0, width, height);

      // soft aura behind the object
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 2);
      glow.addColorStop(0, 'rgba(176, 234, 72, 0.12)');
      glow.addColorStop(0.55, 'rgba(176, 234, 72, 0.03)');
      glow.addColorStop(1, 'rgba(176, 234, 72, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // the room: a floor that recedes to the horizon, so the object has a place
      ctx.lineWidth = 1;
      for (const [from, to] of floor) {
        const p1 = project(from, yaw, pitch, base, width, height);
        const p2 = project(to, yaw, pitch, base, width, height);
        if (!Number.isFinite(p1.x) || !Number.isFinite(p2.x)) continue;
        const near = (p1.d + p2.d) / 2;
        const alpha = Math.max(0, Math.min(0.22, (near - 0.42) * 0.36));
        if (alpha <= 0.004) continue;
        ctx.strokeStyle = `rgba(176, 234, 72, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // one routine draws a whole object: its wireframe, then its points.
      // `settle` (1 → 0) shrinks a cloud slightly as it dissolves away, so the
      // hand-over feels like a camera move rather than a cross-fade.
      const drawCloud = (scene: Scene, alpha: number, settle = 1) => {
        if (alpha <= 0.01) return;
        const cloudBase = base * (0.9 + settle * 0.1);
        const projected = scene.points.map((pt) =>
          project(pt, yaw, pitch, cloudBase, width, height),
        );

        ctx.lineWidth = 1;
        for (const [i, j] of scene.edges) {
          const p1 = projected[i];
          const p2 = projected[j];
          if (!p1 || !p2) continue;
          const a0 = 0.04 + Math.min(0.34, Math.max(0, p1.d - 0.45) * 0.55);
          ctx.strokeStyle = `rgba(176, 234, 72, ${(a0 * alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        for (let i = 0; i < projected.length; i += 1) {
          const pt = projected[i];
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;
          const size = 1.1 + pt.d * 1.9;
          const bright = Math.min(1, Math.max(0.14, (pt.d - 0.42) * 1.5)) * alpha;
          ctx.fillStyle = i % 17 === 0 ? PAPER : `rgba(176, 234, 72, ${bright.toFixed(3)})`;
          ctx.fillRect(pt.x - size / 2, pt.y - size / 2, size, size);
        }
      };

      // the outgoing object dissolves as the incoming one arrives; nothing ever
      // stretches between two shapes
      const outgoing = 1 - blend;
      if (outgoing > 0.01) drawCloud(a, outgoing, outgoing);
      if (blend > 0.01 && b !== a) drawCloud(b, blend, 1 - blend * 0.14);

      // captions
      const active = blend > 0.5 ? b : a;
      if (captionRef.current && captionRef.current.textContent !== active.caption) {
        captionRef.current.textContent = active.caption;
        if (noteRef.current) noteRef.current.textContent = active.note;
        const n = scenes.indexOf(active);
        if (countRef.current) {
          countRef.current.textContent = `${String(n + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        }
        const lines = indexRef.current?.children;
        if (lines) {
          for (let i = 0; i < lines.length; i += 1) {
            lines[i].classList.toggle('is-on', i === n);
          }
        }
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${(mode === 'hero' ? 0 : p).toFixed(4)})`;

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    if (still) {
      // one composed frame, no loop
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scenes, mode]);

  return (
    <div className={`film film--${mode} ${className}`.trim()} ref={wrapRef}>
      <div className="film__canvas-wrap">
        <canvas ref={canvasRef} aria-hidden="true" />
        {mode === 'scroll' ? (
          <div className="film__intro">
            <span className="mono-label">Room 05 — the film</span>
            <p className="film__intro-line">Ten things every business already has — then the page that carries them.</p>
          </div>
        ) : null}
        {mode === 'scroll' ? (
          <ol className="film__index" ref={indexRef} aria-hidden="true">
            {scenes?.map((scene, i) => (
              <li key={scene.caption}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {scene.caption}
              </li>
            ))}
          </ol>
        ) : null}
        <div className="film__hud">
          <span className="film__count mono-label" ref={countRef}>
            01 / 10
          </span>
          <span className="film__caption" ref={captionRef}>
            PIXELS
          </span>
          <span className="film__note mono-label" ref={noteRef}>
            every site starts as a grid
          </span>
          <span className="film__bar" aria-hidden="true">
            <span className="film__bar-fill" ref={barRef} />
          </span>
        </div>
      </div>
    </div>
  );
}

export { INK, PAPER, LIME };

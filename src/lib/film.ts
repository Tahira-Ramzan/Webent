/**
 * FILM — ten things that define a business, drawn from one cloud of points.
 *
 * Every scene is a line drawing built out of the same number of points, so the
 * film can morph from a shopfront into a price tag without cutting. The ten
 * objects are the ten things a small business already owns — a front, a sign, a
 * counter, a list, a parcel, a price, a place, its hours, a bell — and the last
 * frame is the page that carries all of them.
 *
 * Everything here is dependency-free: strokes are resampled to a fixed point
 * count, projected with a tiny perspective camera, and drawn on a canvas.
 */

export type Vec3 = { x: number; y: number; z: number };

export type Scene = {
  points: Vec3[];
  edges: [number, number][];
  caption: string;
  note: string;
  yaw: number;
  pitch: number;
  zoom: number;
  /** how much the cloud keeps turning while the scene is held */
  spin?: number;
};

export const POINTS = 420;

/* ------------------------------------------------------------------ helpers */

const v = (x: number, y: number, z = 0): Vec3 => ({ x, y, z });

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** A point a fraction `t` along a multi-segment stroke. */
function along(stroke: Vec3[], t: number): Vec3 {
  if (stroke.length === 1) return { ...stroke[0] };
  const segs: { a: Vec3; b: Vec3; len: number }[] = [];
  let total = 0;
  for (let i = 1; i < stroke.length; i += 1) {
    const len = dist(stroke[i - 1], stroke[i]);
    segs.push({ a: stroke[i - 1], b: stroke[i], len });
    total += len;
  }
  if (total === 0) return { ...stroke[0] };
  let target = t * total;
  for (const seg of segs) {
    if (target <= seg.len) {
      const k = seg.len === 0 ? 0 : target / seg.len;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * k,
        y: seg.a.y + (seg.b.y - seg.a.y) * k,
        z: seg.a.z + (seg.b.z - seg.a.z) * k,
      };
    }
    target -= seg.len;
  }
  return { ...stroke[stroke.length - 1] };
}

/** Give a flat line drawing a body: front face, back face, and the edges between them. */
function volume(strokes: Vec3[][], depth: number): Vec3[][] {
  if (depth <= 0) return strokes;
  const near = depth / 2;
  const front = strokes.map((s) => s.map((p) => v(p.x, p.y, p.z - near)));
  const back = strokes.map((s) => s.map((p) => v(p.x, p.y, p.z + near)));
  const links: Vec3[][] = [];
  strokes.forEach((_stroke, i) => {
    const a = front[i];
    const b = back[i];
    links.push([a[0], b[0]]);
    links.push([a[a.length - 1], b[b.length - 1]]);
  });
  return [...front, ...back, ...links];
}

/** Resample a set of strokes into exactly POINTS points and the edges between them. */
function draw(strokes: Vec3[][], depth = 0): { points: Vec3[]; edges: [number, number][] } {
  strokes = volume(strokes, depth);
  const lengths = strokes.map((s) =>
    s.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(s[i - 1], p)), 0),
  );
  const totalLength = lengths.reduce((a, b) => a + b, 0) || 1;
  const points: Vec3[] = [];
  const edges: [number, number][] = [];

  strokes.forEach((stroke, si) => {
    const count = Math.max(2, Math.round((POINTS * lengths[si]) / totalLength));
    let previous = -1;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1);
      points.push(along(stroke, t));
      const index = points.length - 1;
      if (previous >= 0) edges.push([previous, index]);
      previous = index;
    }
  });

  while (points.length < POINTS) points.push({ ...(points[points.length - 1] ?? v(0, 0)) });
  if (points.length > POINTS) points.length = POINTS;

  return { points, edges: edges.filter(([a, b]) => a < points.length && b < points.length) };
}

const line = (x1: number, y1: number, x2: number, y2: number, z = 0): Vec3[] => [
  v(x1, y1, z),
  v(x2, y2, z),
];

function rect(cx: number, cy: number, w: number, h: number, z = 0): Vec3[] {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  return [v(x0, y0, z), v(x1, y0, z), v(x1, y1, z), v(x0, y1, z), v(x0, y0, z)];
}

function circle(cx: number, cy: number, r: number, segments = 28, z = 0): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(v(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
  }
  return pts;
}

function arc(cx: number, cy: number, r: number, from: number, to: number, z = 0): Vec3[] {
  const pts: Vec3[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    pts.push(v(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
  }
  return pts;
}

/** Renders text to an offscreen canvas and keeps only edge pixels. */
function sampleText(text: string, weight = 800): Vec3[] {
  const w = 560;
  const h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} 104px Arial, Helvetica, sans-serif`;
  ctx.fillText(text, w / 2, h / 2 + 4);

  const data = ctx.getImageData(0, 0, w, h).data;
  // luminance, not alpha: the canvas background is opaque black, so the alpha
  // channel is 255 everywhere and would call every pixel "ink".
  const ink = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? false : data[(y * w + x) * 4] > 140;

  const hits: Vec3[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!ink(x, y)) continue;
      const edge = !ink(x - 2, y) || !ink(x + 2, y) || !ink(x, y - 2) || !ink(x, y + 2);
      if (!edge) continue;
      hits.push(v((x - w / 2) / 190, -(y - h / 2) / 190, 0));
    }
  }
  return hits;
}

/* ------------------------------------------------------------------- scenes */

/** A receding floor grid: the room the objects stand in. */
export function floorLines(): [Vec3, Vec3][] {
  const y = -1.42;
  const span = 4.4;
  const depth = 4.2;
  const step = 0.55;
  const lines: [Vec3, Vec3][] = [];
  const n = Math.round(span / step);
  for (let i = -n; i <= n; i += 1) {
    const x = i * step;
    lines.push([v(x, y, -depth), v(x, y, depth)]);
  }
  const rows = 10;
  for (let i = 0; i <= rows; i += 1) {
    const z = -depth + (i * depth * 2) / rows;
    lines.push([v(-span, y, z), v(span, y, z)]);
  }
  return lines;
}

export function buildScenes(): Scene[] {
  const scenes: Scene[] = [];

  /* 01 · STOREFRONT — the front of the business */
  {
    const awning: Vec3[] = [];
    const teeth = 7;
    for (let i = 0; i <= teeth * 2; i += 1) {
      const x = -1.35 + (2.7 * i) / (teeth * 2);
      awning.push(v(x, i % 2 === 0 ? 0.62 : 0.34, 0));
    }
    const strokes: Vec3[][] = [
      rect(0, 0, 2.6, 1.7), // facade
      line(-1.42, 0.66, 1.42, 0.66), // awning rail
      awning, // saw-tooth awning
      rect(0.72, -0.42, 0.5, 0.96), // door
      line(0.72, -0.9, 0.72, -0.44), // door split (bottom half)
      rect(-0.66, -0.12, 0.86, 0.6), // window
      line(-0.66, -0.42, -0.66, 0.18), // mullion
      line(-1.09, -0.12, -0.23, -0.12),
      line(-1.5, -0.92, 1.5, -0.92), // pavement
    ];
    const { points, edges } = draw(strokes, 0.62);
    scenes.push({
      points,
      edges,
      caption: 'STOREFRONT',
      note: 'every business has a front · yours can be a screen',
      yaw: -0.22,
      pitch: 0.05,
      zoom: 1.02,
      spin: 0.35,
    });
  }

  /* 02 · SIGN — the name, hanging above the door */
  {
    const strokes: Vec3[][] = [
      line(-1.5, 1.02, 1.5, 1.02), // the bar it all hangs from
      line(-0.75, 1.02, -0.75, 0.7), // chain
      line(0.55, 1.02, 0.55, 0.7),
      rect(-0.1, 0.28, 1.9, 0.84), // board
      line(-0.86, 0.46, 0.66, 0.46), // the name, as type
      line(-0.86, 0.28, 0.34, 0.28),
      line(-0.86, 0.1, 0.52, 0.1),
      line(-1.5, -0.62, 1.5, -0.62), // the wall it is fixed to
    ];
    const { points, edges } = draw(strokes, 0.22);
    scenes.push({
      points,
      edges,
      caption: 'SIGN',
      note: 'a name above the door, set in the right type',
      yaw: -0.24,
      pitch: 0.06,
      zoom: 1.02,
      spin: 0.4,
    });
  }

  /* 03 · COUNTER — where the work turns into the sale */
  {
    const strokes: Vec3[][] = [
      rect(0, 0.42, 2.7, 0.2), // counter top
      rect(0, -0.3, 2.7, 1.24), // the front panel
      line(-0.9, 0.32, -0.9, -0.9), // panel joints
      line(0.9, 0.32, 0.9, -0.9),
      rect(0.62, 0.78, 0.62, 0.5), // the till
      line(0.62, 0.9, 1.16, 0.9), // its drawer line
      rect(-0.68, 0.74, 0.5, 0.36), // a card reader
      line(-2, -0.94, 2, -0.94), // floor
    ];
    const { points, edges } = draw(strokes, 0.44);
    scenes.push({
      points,
      edges,
      caption: 'COUNTER',
      note: 'where the work turns into the sale',
      yaw: -0.3,
      pitch: 0.1,
      zoom: 1.0,
      spin: 0.35,
    });
  }

  /* 04 · LIST — what you sell, said plainly */
  {
    const strokes: Vec3[][] = [
      rect(0, 0, 1.9, 1.9), // board
      line(-0.68, 0.66, 0.68, 0.66), // heading
      line(-0.68, 0.54, 0.2, 0.54),
    ];
    for (let i = 0; i < 4; i += 1) {
      const y = 0.22 - i * 0.28;
      strokes.push(line(-0.68, y, 0.24, y)); // item
      strokes.push(line(0.44, y, 0.68, y)); // price
    }
    const { points, edges } = draw(strokes, 0.16);
    scenes.push({
      points,
      edges,
      caption: 'LIST',
      note: 'what you sell, said in one plain line each',
      yaw: 0.1,
      pitch: 0.04,
      zoom: 1.05,
      spin: 0.18,
    });
  }

  /* 05 · PARCEL — what leaves after the click */
  {
    const strokes: Vec3[][] = [
      // cube
      [v(-0.7, -0.7, 0.6), v(-0.7, 0.55, 0.6), v(0.7, 0.55, 0.6), v(0.7, -0.7, 0.6), v(-0.7, -0.7, 0.6)],
      [v(-0.7, 0.55, 0.6), v(-0.3, 0.9, 0.15), v(1.1, 0.9, 0.15), v(1.1, -0.35, 0.15), v(0.7, -0.7, 0.6)],
      [v(1.1, 0.9, 0.15), v(0.7, 0.55, 0.6)],
      // tape seams
      line(0, -0.7, 0, 0.55, 0.61),
      line(-0.7, -0.07, 0.7, -0.07, 0.61),
    ];
    const { points, edges } = draw(strokes, 0.86);
    scenes.push({
      points,
      edges,
      caption: 'PARCEL',
      note: 'what leaves the shop after the click',
      yaw: 0.62,
      pitch: 0.22,
      zoom: 1.0,
      spin: 0.5,
    });
  }

  /* 06 · PRICE — one number, written down */
  {
    const strokes: Vec3[][] = [
      // tag body, rotated 45° into a diamond-ish plate
      [
        v(-0.75, 0.5, 0),
        v(0.45, 0.5, 0),
        v(0.95, 0, 0),
        v(0.45, -0.5, 0),
        v(-0.75, -0.5, 0),
        v(-0.75, 0.5, 0),
      ],
      circle(-0.52, 0, 0.11, 16), // eyelet
      // string
      [
        v(-0.52, 0.13, 0),
        v(-0.9, 0.42, 0),
        v(-1.2, 0.3, 0),
        v(-1.32, -0.02, 0),
      ],
      line(-0.2, 0.14, 0.45, 0.14), // the number
      line(-0.2, -0.14, 0.2, -0.14),
    ];
    const { points, edges } = draw(strokes, 0.14);
    scenes.push({
      points,
      edges,
      caption: 'PRICE',
      note: 'one number, written where anyone can read it',
      yaw: -0.14,
      pitch: 0.08,
      zoom: 1.1,
      spin: 0.22,
    });
  }

  /* 07 · PIN — where they find you, and how they get there */
  {
    const ring: Vec3[] = [];
    for (let i = 0; i <= 30; i += 1) {
      const a = (i / 30) * Math.PI * 2;
      ring.push(v(Math.cos(a) * 0.62, -1.36, Math.sin(a) * 0.62));
    }
    const route: Vec3[] = [
      v(-2.3, -1.36, 0.2),
      v(-1.5, -1.36, -0.3),
      v(-0.9, -1.36, 0.35),
      v(-0.62, -1.36, 0),
    ];
    const strokes: Vec3[][] = [
      circle(0, 0.34, 0.46, 30), // the head of the pin
      circle(0, 0.34, 0.17, 16), // its hole
      line(-0.34, 0.08, -0.03, -0.72), // the two sides down to the point
      line(0.34, 0.08, 0.03, -0.72),
      ring, // the spot it marks
      route, // and the road that gets you there
    ];
    const { points, edges } = draw(strokes, 0.3);
    scenes.push({
      points,
      edges,
      caption: 'PIN',
      note: 'where they find you, and how they get there',
      yaw: -0.4,
      pitch: 0.16,
      zoom: 1.02,
      spin: 0.3,
    });
  }

  /* 08 · HOURS — when the door is open */
  {
    const strokes: Vec3[][] = [
      circle(0, 0, 0.95, 36),
      line(0, 0, 0, 0.6), // minute hand
      line(0, 0, 0.42, -0.18), // hour hand
      circle(0, 0, 0.07, 10),
      line(0, 0.88, 0, 0.72),
      line(0, -0.88, 0, -0.72),
      line(-0.88, 0, -0.72, 0),
      line(0.88, 0, 0.72, 0),
    ];
    const { points, edges } = draw(strokes, 0.42);
    scenes.push({
      points,
      edges,
      caption: 'HOURS',
      note: 'the page never closes, even when the shop does',
      yaw: 0.12,
      pitch: 0.1,
      zoom: 1.02,
      spin: 0.25,
    });
  }

  /* 09 · BELL — the sound of someone arriving */
  {
    const strokes: Vec3[][] = [
      line(-0.3, 0.96, 0.3, 0.96), // the little bar it hangs from
      line(0, 0.96, 0, 0.82),
      arc(0, 0.1, 0.66, 0, Math.PI), // the dome
      line(-0.66, 0.1, -0.9, -0.62), // skirt
      line(0.66, 0.1, 0.9, -0.62),
      line(-1.02, -0.62, 1.02, -0.62), // the lip
      line(-0.94, -0.46, 0.94, -0.46),
      circle(0, -0.74, 0.13, 14), // clapper
      arc(-1.42, 0.2, 0.3, -0.62, 0.62), // sound
      arc(1.42, 0.2, 0.3, Math.PI - 0.62, Math.PI + 0.62),
    ];
    const { points, edges } = draw(strokes, 0.26);
    scenes.push({
      points,
      edges,
      caption: 'BELL',
      note: 'the sound of someone arriving',
      yaw: -0.3,
      pitch: 0.1,
      zoom: 1.05,
      spin: 0.3,
    });
  }

  /* 10 · NAME — and one page that carries all of it.
     The wordmark is sampled as a dot matrix rather than a point cloud: it does
     not morph into anything, it is cross-faded in by the player, so it can
     afford far more points than the other nine scenes. */
  {
    const hits = sampleText('WEBENT');
    const bands = 44;
    const top = -0.56;
    const bottom = 0.56;
    const COUNT = 900;
    const perBand = Math.max(6, Math.ceil(COUNT / bands));
    const points: Vec3[] = [];
    const edges: [number, number][] = [];

    for (let b = 0; b < bands; b += 1) {
      const y0 = top + ((bottom - top) * b) / bands;
      const y1 = top + ((bottom - top) * (b + 1)) / bands;
      const row = hits.filter((p) => p.y >= y0 && p.y < y1).sort((p, q) => p.x - q.x);
      if (!row.length) continue;
      const step = Math.max(1, Math.round(row.length / perBand));
      let previous = -1;
      for (let i = 0; i < row.length; i += step) {
        const pt = { ...row[i] };
        points.push(pt);
        const index = points.length - 1;
        // only join neighbours inside the same stroke; a letter gap stays a gap
        if (previous >= 0 && Math.hypot(pt.x - points[previous].x, pt.y - points[previous].y) < 0.055) {
          edges.push([previous, index]);
        }
        previous = index;
      }
    }

    scenes.push({
      points,
      edges,
      caption: 'NAME',
      note: 'ten things · one page · one name',
      yaw: 0,
      pitch: 0.04,
      zoom: 1.32,
      spin: 0.04,
    });
  }

  return scenes;
}

/* --------------------------------------------------------------- projection */

export function project(p: Vec3, yaw: number, pitch: number, base: number, width: number, height: number) {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;
  const y1 = p.y * cosP - z1 * sinP;
  const z2 = p.y * sinP + z1 * cosP;

  const perspective = 3.1;
  const scale = (base * perspective) / (perspective + z2);

  return {
    x: width / 2 + x1 * scale,
    y: height / 2 - y1 * scale,
    /** depth-corrected size factor, ~1 at the origin */
    d: Math.min(1.6, Math.max(0.5, perspective / (perspective + z2))),
    z: z2,
  };
}

export function smooth(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

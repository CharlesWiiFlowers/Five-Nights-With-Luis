import { arcLength, roundTo, solveUpperLimit, straightDistance } from './arcLength.js';
import { exactLength } from './challenges.js';
import { fuelCost } from '../game/fuel.js';

export const UNIT_PX = 48; // 1 navigation unit = 48 px on screen

// Builds a curved route from world point `start` to `end` that follows y = f(x), x ∈ [a, b].
// The curve is placed rigidly (rotation + optional reflection, fixed scale UNIT_PX), so the
// on-screen path length is exactly UNIT_PX · L and fuel = k · L.
export function buildRoute({ challenge, start, end, mirror = false, unit = UNIT_PX, samples = 240, a = challenge.a, b: forcedB }) {
  const { f } = challenge;
  const chordUnits = Math.hypot(end.x - start.x, end.y - start.y) / unit;
  const b = forcedB ?? roundTo(solveUpperLimit(f, a, chordUnits), 2);
  const L = arcLength(challenge.df, a, b, 1024);
  const exact = exactLength(challenge, a, b);
  const straight = straightDistance(f, a, b);

  const cx = b - a;
  const cy = f(b) - f(a);
  const cLen = Math.hypot(cx, cy);
  const ux = cx / cLen;
  const uy = cy / cLen;
  const wx = (end.x - start.x) / (chordUnits * unit);
  const wy = (end.y - start.y) / (chordUnits * unit);
  const nx = -wy;
  const ny = wx;
  const sign = mirror ? -1 : 1;

  const points = [];
  let cumulative = 0;
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples;
    const px = x - a;
    const py = f(x) - f(a);
    const along = px * ux + py * uy;
    const perp = (-px * uy + py * ux) * sign;
    const p = {
      x: start.x + unit * (along * wx + perp * nx),
      y: start.y + unit * (along * wy + perp * ny),
    };
    if (i > 0) {
      const prev = points[i - 1];
      cumulative += Math.hypot(p.x - prev.x, p.y - prev.y);
    }
    p.s = cumulative;
    points.push(p);
  }

  return {
    challenge,
    a,
    b,
    L,
    exact,
    straight,
    cost: fuelCost(L),
    mirror,
    points,
    pixelLength: cumulative,
    unit,
  };
}

// Position and heading at distance s (pixels) along the sampled route.
export function pointAt(route, s) {
  const pts = route.points;
  if (s <= 0) return { x: pts[0].x, y: pts[0].y, angle: angleOf(pts[0], pts[1]) };
  const last = pts[pts.length - 1];
  if (s >= last.s) return { x: last.x, y: last.y, angle: angleOf(pts[pts.length - 2], last) };
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].s < s) lo = mid;
    else hi = mid;
  }
  const p0 = pts[lo];
  const p1 = pts[hi];
  const t = (s - p0.s) / (p1.s - p0.s || 1);
  return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t, angle: angleOf(p0, p1) };
}

function angleOf(p0, p1) {
  return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

// Minimum distance between the route and a point (used for danger checks).
export function minDistanceTo(route, cx, cy) {
  let best = Infinity;
  for (const p of route.points) best = Math.min(best, Math.hypot(p.x - cx, p.y - cy));
  return best;
}

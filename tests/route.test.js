import { describe, expect, it } from 'vitest';
import { buildRoute, pointAt, UNIT_PX } from '../src/math/route.js';
import { getChallenge } from '../src/math/challenges.js';
import { arcLength } from '../src/math/arcLength.js';

describe('route geometry', () => {
  const start = { x: 400, y: 500 };
  const end = { x: 640, y: 180 };
  for (const id of ['A', 'I', 'H', 'F', 'Cu', 'J', 'S']) {
    for (const mirror of [false, true]) {
      it(`${id} mirror=${mirror}: on-screen length equals UNIT·L and fuel equals L`, () => {
        const c = getChallenge(id);
        const r = buildRoute({ challenge: c, start, end, mirror });
        expect(r.L).toBeCloseTo(arcLength(c.df, c.a, r.b, 4096), 6);
        expect(r.pixelLength / UNIT_PX).toBeCloseTo(r.L, 2);
        expect(r.cost).toBeCloseTo(r.L, 12);
        expect(r.L).toBeGreaterThan(r.straight);
        const last = r.points[r.points.length - 1];
        expect(Math.hypot(last.x - end.x, last.y - end.y)).toBeLessThan(2.5);
        expect(r.points[0].x).toBeCloseTo(start.x, 9);
      });
    }
  }

  for (const [id, a] of [['H', -2], ['F', -1], ['Cu', 0.45], ['J', 0.55], ['S', 0]]) {
    it(`${id} with a=${a} builds a strongly curved detour whose length matches the integral`, () => {
      const c = getChallenge(id);
      const r = buildRoute({ challenge: c, start, end, a });
      expect(r.a).toBe(a);
      expect(r.pixelLength / UNIT_PX).toBeCloseTo(r.L, 2);
      expect(r.L / r.straight).toBeGreaterThan(1.1);
    });
  }

  it('the curve is visibly curved (deviates from the chord)', () => {
    const r = buildRoute({ challenge: getChallenge('A'), start, end });
    const mid = pointAt(r, r.pixelLength / 2);
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    expect(Math.hypot(mid.x - cx, mid.y - cy)).toBeGreaterThan(8);
  });
});

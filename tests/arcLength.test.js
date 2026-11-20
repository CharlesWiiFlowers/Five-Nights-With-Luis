import { describe, expect, it } from 'vitest';
import { arcLength, polylineLength, simpson, solveUpperLimit, straightDistance } from '../src/math/arcLength.js';

describe('arc length numerics', () => {
  it('integrates polynomials exactly with Simpson', () => {
    expect(simpson((x) => x ** 3, 0, 2)).toBeCloseTo(4, 10);
  });

  it('f(x) = x on [0, 2] has length 2√2', () => {
    expect(arcLength(() => 1, 0, 2)).toBeCloseTo(2 * Math.SQRT2, 10);
  });

  it('reference trajectory (2/3)x^(3/2) on [0, 3] has length 14/3', () => {
    expect(arcLength((x) => Math.sqrt(x), 0, 3, 2048)).toBeCloseTo(14 / 3, 4);
  });

  it('polyline sums approach the integral from below as segments shrink', () => {
    const f = (x) => (2 / 3) * x ** 1.5;
    const L = 14 / 3;
    let prev = 0;
    for (const n of [1, 2, 4, 8, 16, 64]) {
      const s = polylineLength(f, 0, 3, n);
      expect(s).toBeLessThanOrEqual(L + 1e-12);
      expect(s).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = s;
    }
    expect(L - prev).toBeLessThan(1e-3);
    expect(polylineLength(f, 0, 3, 1)).toBeCloseTo(straightDistance(f, 0, 3), 12);
  });

  it('solves the upper limit for a target chord', () => {
    const f = (x) => x * x;
    const b = solveUpperLimit(f, 0, 5);
    expect(straightDistance(f, 0, b)).toBeCloseTo(5, 8);
  });
});

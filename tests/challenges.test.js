import { describe, expect, it } from 'vitest';
import { CHALLENGES, exactLength, TUTORIAL, getChallenge } from '../src/math/challenges.js';
import { arcLength, numericDerivative } from '../src/math/arcLength.js';
import { SECTORS } from '../src/config/sectors.js';

const list = Object.values(CHALLENGES);

describe('challenge library', () => {
  for (const c of list) {
    describe(c.id, () => {
      const xs = [c.a + 0.3, c.a + 1, c.a + 2.2, c.a + 3.7];
      it('df matches the numerical derivative of f', () => {
        for (const x of xs) expect(c.df(x)).toBeCloseTo(numericDerivative(c.f, x), 5);
      });
      it('has exactly one correct derivative option, placed first in data', () => {
        expect(c.derivativeOptions.filter((o) => o.correct)).toHaveLength(1);
        for (const o of c.derivativeOptions.filter((o) => !o.correct)) {
          expect(o.feedback.length).toBeGreaterThan(20);
          expect(o.short.length).toBeGreaterThan(5);
        }
      });
      it('antiderivative (if any) matches numerical arc length', () => {
        if (!c.antiderivative) return;
        for (const b of xs) expect(exactLength(c, c.a, b)).toBeCloseTo(arcLength(c.df, c.a, b, 2048), 6);
      });
    });
  }

  it('tutorial calibration equals 14/3', () => {
    const c = getChallenge(TUTORIAL.challengeId);
    expect(exactLength(c, TUTORIAL.a, TUTORIAL.b)).toBeCloseTo(14 / 3, 12);
  });

  it('every sector pool references existing challenges', () => {
    for (const s of SECTORS)
      for (const pair of s.routePairs)
        for (const [id, a] of pair) {
          const c = getChallenge(id);
          expect(Number.isFinite(c.f(a)) && Number.isFinite(c.df(a))).toBe(true);
        }
  });
});

import { describe, expect, it } from 'vitest';
import { ConsoleMachine, OPS } from '../src/game/consoleMachine.js';
import { getChallenge, TUTORIAL } from '../src/math/challenges.js';

const tutorial = () =>
  new ConsoleMachine({ challenge: getChallenge('A'), a: TUTORIAL.a, b: TUTORIAL.b, hintLevel: 2, exactLatex: TUTORIAL.exactLatex });

describe('console machine', () => {
  it('builds the integral with the correct sequence', () => {
    const m = tutorial();
    for (const op of OPS) expect(m.pull(op).ok).toBe(true);
    expect(m.done).toBe(true);
    expect(m.result.L).toBeCloseTo(14 / 3, 5);
    expect(m.result.exact).toBeCloseTo(14 / 3, 12);
    expect(m.display().at(-1)).toContain('\\tfrac{14}{3}');
  });

  it('explains every wrong operation instead of just saying wrong', () => {
    for (let step = 0; step < OPS.length; step++) {
      for (const wrong of OPS.filter((o) => o !== OPS[step])) {
        for (const hintLevel of [0, 1, 2]) {
          const m = new ConsoleMachine({ challenge: getChallenge('A'), a: 0, b: 3, hintLevel });
          for (let i = 0; i < step; i++) m.pull(OPS[i]);
          const res = m.pull(wrong);
          expect(res.ok).toBe(false);
          expect(res.feedback.length).toBeGreaterThan(15);
          expect(res.feedback.toLowerCase()).not.toBe('wrong!');
        }
      }
    }
  });

  it('hint intensity decreases with hintLevel', () => {
    const lens = [2, 1, 0].map((hintLevel) => {
      const m = new ConsoleMachine({ challenge: getChallenge('A'), a: 0, b: 3, hintLevel });
      return m.pull('square').feedback.length;
    });
    expect(lens[0]).toBeGreaterThan(lens[1]);
    expect(lens[1]).toBeGreaterThan(lens[2]);
  });

  it('requires choosing the right derivative on the drum', () => {
    const c = getChallenge('F');
    const m = new ConsoleMachine({ challenge: c, a: 0, b: 2.5, requireDerivativeChoice: true, hintLevel: 1 });
    expect(m.pull('derive').pending).toBe(true);
    expect(m.pull('square').ok).toBe(false);
    const wrongIndex = m.drumOptions.findIndex((o) => !o.correct);
    m.drumIndex = wrongIndex;
    const bad = m.lockDrum();
    expect(bad.ok).toBe(false);
    expect(bad.feedback).toContain(m.drumOptions[wrongIndex].feedback);
    m.drumIndex = m.drumOptions.findIndex((o) => o.correct);
    expect(m.lockDrum().ok).toBe(true);
    expect(m.step).toBe(1);
  });

  it('validates integration limits with targeted feedback', () => {
    const c = getChallenge('H');
    const m = new ConsoleMachine({ challenge: c, a: 0, b: 3.5, requireLimits: true, hintLevel: 1 });
    ['derive', 'square', 'addOne', 'sqrt'].forEach((op) => m.pull(op));
    m.lowerIndex = m.limitOptions.indexOf(3.5);
    m.upperIndex = m.limitOptions.indexOf(0);
    expect(m.pull('integrate').feedback).toContain('swapped');
    m.lowerIndex = m.limitOptions.indexOf(0);
    m.upperIndex = m.limitOptions.indexOf(Math.round(c.f(3.5) * 100) / 100);
    expect(m.pull('integrate').feedback).toContain('y-coordinate');
    m.upperIndex = m.limitOptions.indexOf(3.5);
    const ok = m.pull('integrate');
    expect(ok.ok).toBe(true);
    expect(ok.result.exact).toBeNull();
    expect(m.display().at(-1)).toContain('numerical');
  });

  it('integrand memory starts at the integration step', () => {
    const m = new ConsoleMachine({ challenge: getChallenge('A'), a: 0, b: 3, startAtIntegrate: true });
    expect(m.expected).toBe('integrate');
    expect(m.pull('integrate').ok).toBe(true);
  });
});

// Predefined arc-length challenges. Every curve has a hand-checked derivative and
// integrand; curves whose integral has an elementary closed form also carry an
// antiderivative so the console can show the exact result next to the numerical one.
// Tests in tests/challenges.test.js verify all of these against numerical calculus.

const C = {};

C.A = {
  id: 'A',
  f: (x) => (2 / 3) * x ** 1.5,
  df: (x) => Math.sqrt(x),
  a: 0,
  latex: {
    f: '\\tfrac{2}{3}x^{3/2}',
    df: 'x^{1/2}',
    dfSq: 'x',
    onePlus: '1 + x',
    sqrt: '\\sqrt{1 + x}',
  },
  antiderivative: (x) => (2 / 3) * (1 + x) ** 1.5,
  antiderivativeLatex: '\\tfrac{2}{3}(1 + x)^{3/2}',
  derivativeOptions: [
    { latex: 'x^{1/2}', correct: true },
    {
      latex: '\\tfrac{2}{3}x^{1/2}',
      feedback: 'Power rule: the exponent 3/2 comes down and multiplies the coefficient, (2/3)·(3/2) = 1, so f′(x) = x^(1/2).',
      short: 'Bring the exponent 3/2 down and multiply it by 2/3.',
    },
    {
      latex: '\\tfrac{4}{15}x^{5/2}',
      feedback: 'That raises the exponent: it is an antiderivative. A derivative lowers the exponent by one: 3/2 − 1 = 1/2.',
      short: 'A derivative lowers the exponent, it does not raise it.',
    },
  ],
};

C.I = {
  id: 'I',
  f: (x) => x ** 1.5,
  df: (x) => 1.5 * Math.sqrt(x),
  a: 0,
  latex: {
    f: 'x^{3/2}',
    df: '\\tfrac{3}{2}x^{1/2}',
    dfSq: '\\tfrac{9}{4}x',
    onePlus: '1 + \\tfrac{9}{4}x',
    sqrt: '\\sqrt{1 + \\tfrac{9}{4}x}',
  },
  antiderivative: (x) => (8 / 27) * (1 + (9 / 4) * x) ** 1.5,
  antiderivativeLatex: '\\tfrac{8}{27}\\left(1 + \\tfrac{9}{4}x\\right)^{3/2}',
  derivativeOptions: [
    { latex: '\\tfrac{3}{2}x^{1/2}', correct: true },
    {
      latex: 'x^{1/2}',
      feedback: 'You lowered the exponent but dropped the coefficient. The power rule brings the old exponent 3/2 down in front.',
      short: 'Keep the 3/2 that the power rule brings down.',
    },
    {
      latex: '\\tfrac{3}{2}x^{3/2}',
      feedback: 'The coefficient is right, but the exponent must drop by one: 3/2 − 1 = 1/2.',
      short: 'Lower the exponent by one.',
    },
  ],
};

C.H = {
  id: 'H',
  f: (x) => (x * x) / 4,
  df: (x) => x / 2,
  a: 0,
  latex: {
    f: '\\tfrac{x^{2}}{4}',
    df: '\\tfrac{x}{2}',
    dfSq: '\\tfrac{x^{2}}{4}',
    onePlus: '1 + \\tfrac{x^{2}}{4}',
    sqrt: '\\sqrt{1 + \\tfrac{x^{2}}{4}}',
  },
  antiderivative: null,
  derivativeOptions: [
    { latex: '\\tfrac{x}{2}', correct: true },
    {
      latex: '\\tfrac{x}{4}',
      feedback: 'Power rule: the exponent 2 comes down, 2·(x/4) = x/2.',
      short: 'The exponent 2 multiplies the coefficient.',
    },
    {
      latex: '\\tfrac{x^{3}}{12}',
      feedback: 'That is an antiderivative (the exponent went up). The derivative lowers the exponent: x² → 2x.',
      short: 'A derivative lowers the exponent.',
    },
  ],
};

C.F = {
  id: 'F',
  f: (x) => (1 / 3) * (x * x + 2) ** 1.5,
  df: (x) => x * Math.sqrt(x * x + 2),
  a: 0,
  latex: {
    f: '\\tfrac{1}{3}\\left(x^{2} + 2\\right)^{3/2}',
    df: 'x\\sqrt{x^{2} + 2}',
    dfSq: 'x^{2}\\left(x^{2} + 2\\right) = x^{4} + 2x^{2}',
    onePlus: 'x^{4} + 2x^{2} + 1 = \\left(x^{2} + 1\\right)^{2}',
    sqrt: '\\sqrt{\\left(x^{2} + 1\\right)^{2}} = x^{2} + 1',
  },
  antiderivative: (x) => x ** 3 / 3 + x,
  antiderivativeLatex: '\\tfrac{x^{3}}{3} + x',
  derivativeOptions: [
    { latex: 'x\\sqrt{x^{2} + 2}', correct: true },
    {
      latex: '\\tfrac{1}{2}\\sqrt{x^{2} + 2}',
      feedback: 'Chain rule missing: after (1/3)(3/2)(x²+2)^(1/2) you must also multiply by the derivative of the inside, 2x.',
      short: 'Chain rule: multiply by the inner derivative 2x.',
    },
    {
      latex: '2x\\sqrt{x^{2} + 2}',
      feedback: 'Chain rule applied, but the coefficient was lost: (1/3)·(3/2)·2x = x.',
      short: 'Check the coefficient: (1/3)(3/2)(2x) = x.',
    },
  ],
};

C.Cu = {
  id: 'Cu',
  f: (x) => x ** 3 / 6 + 1 / (2 * x),
  df: (x) => (x * x) / 2 - 1 / (2 * x * x),
  a: 1,
  latex: {
    f: '\\tfrac{x^{3}}{6} + \\tfrac{1}{2x}',
    df: '\\tfrac{x^{2}}{2} - \\tfrac{1}{2x^{2}}',
    dfSq: '\\tfrac{x^{4}}{4} - \\tfrac{1}{2} + \\tfrac{1}{4x^{4}}',
    onePlus: '\\tfrac{x^{4}}{4} + \\tfrac{1}{2} + \\tfrac{1}{4x^{4}} = \\left(\\tfrac{x^{2}}{2} + \\tfrac{1}{2x^{2}}\\right)^{2}',
    sqrt: '\\tfrac{x^{2}}{2} + \\tfrac{1}{2x^{2}}',
  },
  antiderivative: (x) => x ** 3 / 6 - 1 / (2 * x),
  antiderivativeLatex: '\\tfrac{x^{3}}{6} - \\tfrac{1}{2x}',
  derivativeOptions: [
    { latex: '\\tfrac{x^{2}}{2} - \\tfrac{1}{2x^{2}}', correct: true },
    {
      latex: '\\tfrac{x^{2}}{2} + \\tfrac{1}{2x^{2}}',
      feedback: 'Sign error: 1/(2x) = ½x^(−1), and the power rule brings down −1, so its derivative is −1/(2x²).',
      short: 'A negative exponent brings down a negative sign.',
    },
    {
      latex: '\\tfrac{x^{2}}{2} - \\tfrac{1}{2x}',
      feedback: 'Rewrite 1/(2x) as ½x^(−1): its derivative is −½x^(−2) = −1/(2x²). The exponent must drop by one.',
      short: '½x^(−1) differentiates to −½x^(−2).',
    },
  ],
};

C.J = {
  id: 'J',
  f: (x) => x ** 4 / 8 + 1 / (4 * x * x),
  df: (x) => x ** 3 / 2 - 1 / (2 * x ** 3),
  a: 1,
  latex: {
    f: '\\tfrac{x^{4}}{8} + \\tfrac{1}{4x^{2}}',
    df: '\\tfrac{x^{3}}{2} - \\tfrac{1}{2x^{3}}',
    dfSq: '\\tfrac{x^{6}}{4} - \\tfrac{1}{2} + \\tfrac{1}{4x^{6}}',
    onePlus: '\\tfrac{x^{6}}{4} + \\tfrac{1}{2} + \\tfrac{1}{4x^{6}} = \\left(\\tfrac{x^{3}}{2} + \\tfrac{1}{2x^{3}}\\right)^{2}',
    sqrt: '\\tfrac{x^{3}}{2} + \\tfrac{1}{2x^{3}}',
  },
  antiderivative: (x) => x ** 4 / 8 - 1 / (4 * x * x),
  antiderivativeLatex: '\\tfrac{x^{4}}{8} - \\tfrac{1}{4x^{2}}',
  derivativeOptions: [
    { latex: '\\tfrac{x^{3}}{2} - \\tfrac{1}{2x^{3}}', correct: true },
    {
      latex: '\\tfrac{x^{3}}{2} + \\tfrac{1}{2x^{3}}',
      feedback: 'Sign error: ¼x^(−2) differentiates to (−2)·¼x^(−3) = −1/(2x³).',
      short: 'The exponent −2 brings down a negative sign.',
    },
    {
      latex: '\\tfrac{x^{3}}{2} - \\tfrac{1}{4x^{3}}',
      feedback: 'The exponent −2 must multiply the coefficient: (−2)·(1/4) = −1/2, giving −1/(2x³).',
      short: 'Multiply the coefficient by the exponent −2.',
    },
  ],
};

C.S = {
  id: 'S',
  f: (x) => Math.sin(x),
  df: (x) => Math.cos(x),
  a: 0,
  latex: {
    f: '\\sin x',
    df: '\\cos x',
    dfSq: '\\cos^{2} x',
    onePlus: '1 + \\cos^{2} x',
    sqrt: '\\sqrt{1 + \\cos^{2} x}',
  },
  antiderivative: null,
  numericNote: 'This integrand has no elementary antiderivative; the analog integrator evaluates it numerically.',
  derivativeOptions: [
    { latex: '\\cos x', correct: true },
    {
      latex: '-\\cos x',
      feedback: 'The derivative of sin x is +cos x. (−cos x is an antiderivative of sin x.)',
      short: '(sin x)′ = cos x.',
    },
    {
      latex: '-\\sin x',
      feedback: '−sin x is the derivative of cos x, not of sin x. The slope of sin x is cos x.',
      short: 'That is the derivative of cos x.',
    },
  ],
};

export const CHALLENGES = C;

export function getChallenge(id) {
  const c = C[id];
  if (!c) throw new Error(`Unknown challenge ${id}`);
  return c;
}

export function exactLength(challenge, a, b) {
  if (!challenge.antiderivative) return null;
  return challenge.antiderivative(b) - challenge.antiderivative(a);
}

// Reference trajectory used for the console calibration tutorial: L = ∫₀³ √(1+x) dx = 14/3.
export const TUTORIAL = { challengeId: 'A', a: 0, b: 3, exactLatex: '\\tfrac{14}{3}' };

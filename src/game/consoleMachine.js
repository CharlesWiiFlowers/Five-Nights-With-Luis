// Pure state machine behind the lever console. The UI only forwards lever pulls,
// drum/dial changes and renders `display()`; all validation and feedback lives here.
import { arcLength, roundTo } from '../math/arcLength.js';
import { exactLength } from '../math/challenges.js';

export const OPS = ['derive', 'square', 'addOne', 'sqrt', 'integrate'];

export const OP_LABEL = {
  derive: 'DERIVE  d/dx',
  square: 'SQUARE  (·)²',
  addOne: 'ADD 1  1+(·)',
  sqrt: 'ROOT  √(·)',
  integrate: 'INTEGRATE  ∫',
};

const NEXT_HINT = {
  derive: 'Pull the DERIVE lever.',
  square: 'Pull the SQUARE lever.',
  addOne: 'Pull the ADD 1 lever.',
  sqrt: 'Pull the ROOT lever.',
  integrate: 'Set the limits and pull the INTEGRATE lever.',
};

// FEEDBACK[expected][pulled] = [full explanation, short explanation]
const FEEDBACK = {
  derive: {
    square: [
      'Squaring f(x) squares the height of the trajectory, but length depends on how steep the curve is. The derivative represents the local slope of the trajectory: start by calculating how the curve changes.',
      'Length depends on slope, not height. Find the slope first.',
    ],
    addOne: [
      'There is no slope to add 1 to yet. The 1 stands for the horizontal step Δx; first compute the slope f′(x).',
      'Nothing to add 1 to yet: compute the slope first.',
    ],
    sqrt: [
      'The square root combines horizontal and vertical movement into a segment length, but you have no vertical rate yet. Start with the derivative.',
      'The root comes later. Start from the slope.',
    ],
    integrate: [
      '∫ f(x) dx is the area under the curve, not its length. The integral must add up tiny segment lengths √(1+[f′(x)]²) dx, so build that integrand first, starting with the derivative.',
      '∫ f(x) dx is area, not length.',
    ],
  },
  square: {
    derive: [
      'You already have the slope f′(x). Deriving again gives f″(x), which length does not need. Next, square the slope.',
      'Deriving twice gives f″. Length needs (f′)².',
    ],
    addOne: [
      'The slope must be squared before adding 1: Δs² = Δx² + Δy² = Δx²(1 + [f′(x)]²). The vertical part enters squared (Pythagoras).',
      'Square the slope before adding 1.',
    ],
    sqrt: [
      'Taking √f′ skips Pythagoras. The vertical step Δy ≈ f′(x)Δx enters the segment length squared, so square the slope first.',
      'Pythagoras squares the vertical step first.',
    ],
    integrate: [
      '∫ f′(x) dx only gives f(b) − f(a), the vertical displacement, not the path length. Keep building: square the slope.',
      '∫ f′ dx is only the vertical displacement.',
    ],
  },
  addOne: {
    derive: [
      'No more derivatives. The missing piece is the horizontal movement: add 1 (it is Δx² after factoring Δx² out of Δx² + Δy²).',
      'Add the horizontal part (the 1), do not derive again.',
    ],
    square: [
      'The slope is already squared. Squaring again gives [f′]⁴, which has no geometric meaning here. Add 1 for the horizontal movement.',
      'Already squared. Add 1 next.',
    ],
    sqrt: [
      '√([f′]²) = |f′| only measures vertical change per step. Add 1 first so the horizontal movement is included: Δs ≈ √(1 + [f′]²)Δx.',
      'Include the horizontal part (add 1) before the root.',
    ],
    integrate: [
      'You would be summing [f′]² dx, which is not a length. Add 1 and take the square root first so each piece is a real segment length.',
      'The integrand is incomplete: add 1, then take the root.',
    ],
  },
  sqrt: {
    derive: [
      'No more derivatives are needed. 1 + [f′(x)]² equals (Δs/Δx)²; take the square root to get the segment length per unit of Δx.',
      '1 + [f′]² is (Δs/Δx)². Take the root.',
    ],
    square: [
      'Squaring again overshoots: 1 + [f′]² is already a squared length ratio. Take the square root.',
      'Already squared. Take the root.',
    ],
    addOne: [
      '1 has already been added. Adding it twice counts the horizontal movement twice. Apply the square root.',
      'The 1 is already there. Take the root.',
    ],
    integrate: [
      'Not yet: 1 + [f′]² is a squared length. The square root combines horizontal and vertical movement into a small segment length; apply it before summing.',
      'Take the root before summing.',
    ],
  },
};

const INTEGRAND_DONE = [
  'The integrand √(1 + [f′(x)]²) is complete: it is the length of a tiny segment per unit of Δx. Changing it breaks the formula. Now integrate between the limits to add up all the segments.',
  'The integrand is complete. Integrate.',
];

export class ConsoleMachine {
  constructor({
    challenge,
    a,
    b,
    hintLevel = 2,
    requireDerivativeChoice = false,
    requireLimits = false,
    startAtIntegrate = false,
    exactLatex = null,
  }) {
    this.challenge = challenge;
    this.a = a;
    this.b = b;
    this.hintLevel = hintLevel;
    this.requireDerivativeChoice = requireDerivativeChoice;
    this.requireLimits = requireLimits;
    this.exactLatex = exactLatex;
    this.mistakes = 0;
    this.limitOptions = buildLimitOptions(challenge, a, b);
    this.lowerIndex = requireLimits ? 0 : this.limitOptions.indexOf(a);
    this.upperIndex = requireLimits ? 0 : this.limitOptions.indexOf(b);
    if (requireLimits && this.limitOptions[this.upperIndex] === b) this.upperIndex = 1;
    this.drumIndex = 0;
    this.drumOptions = shuffleDeterministic(challenge.derivativeOptions, challenge.id + a + b);
    this.startAtIntegrate = startAtIntegrate;
    this.reset();
    if (startAtIntegrate) this.step = 4;
  }

  reset() {
    this.step = 0; // index into OPS of the next expected operation
    this.choosingDerivative = false;
    this.result = null;
    if (this.startAtIntegrate) this.step = 4;
  }

  get expected() {
    return OPS[this.step];
  }

  get done() {
    return this.result !== null;
  }

  get lowerLimit() {
    return this.limitOptions[this.lowerIndex];
  }

  get upperLimit() {
    return this.limitOptions[this.upperIndex];
  }

  nextHint() {
    if (this.done) return '';
    if (this.choosingDerivative) return 'Turn the derivative drum to the correct f′(x) and press LOCK.';
    return NEXT_HINT[this.expected];
  }

  explain(pair) {
    const [full, short] = pair;
    if (this.hintLevel >= 2) return `${full} ${NEXT_HINT[this.expected] ?? ''}`.trim();
    if (this.hintLevel === 1) return full;
    return short;
  }

  fail(message) {
    this.mistakes += 1;
    return { ok: false, feedback: message };
  }

  pull(op) {
    if (this.done) return { ok: false, feedback: 'Route already computed. Transfer it to navigation.' };
    if (this.choosingDerivative) {
      return this.fail(
        this.hintLevel >= 1
          ? 'The derivative drum is still unlocked. Choose the expression for f′(x) and press LOCK before operating other levers.'
          : 'Lock the derivative drum first.',
      );
    }
    const expected = this.expected;
    if (op !== expected) {
      if (expected === 'integrate') return this.fail(this.explain(INTEGRAND_DONE));
      return this.fail(this.explain(FEEDBACK[expected][op]));
    }
    if (op === 'derive' && this.requireDerivativeChoice) {
      this.choosingDerivative = true;
      return { ok: true, feedback: 'Derivative drum unlocked. Select f′(x) and press LOCK.', pending: true };
    }
    if (op === 'integrate') return this.integrate();
    this.step += 1;
    return { ok: true, feedback: STEP_OK[op] };
  }

  turnDrum(delta) {
    const n = this.drumOptions.length;
    this.drumIndex = (this.drumIndex + delta + n) % n;
  }

  lockDrum() {
    if (!this.choosingDerivative) return { ok: false, feedback: 'The drum is idle. Pull DERIVE to engage it.' };
    const option = this.drumOptions[this.drumIndex];
    if (option.correct) {
      this.choosingDerivative = false;
      this.step = 1;
      return { ok: true, feedback: STEP_OK.derive };
    }
    const text = this.hintLevel >= 1 ? option.feedback : option.short;
    return this.fail(`Incorrect derivative. ${text}`);
  }

  turnLimit(which, delta) {
    const n = this.limitOptions.length;
    if (which === 'lower') this.lowerIndex = (this.lowerIndex + delta + n) % n;
    else this.upperIndex = (this.upperIndex + delta + n) % n;
  }

  integrate() {
    const lo = this.lowerLimit;
    const hi = this.upperLimit;
    if (lo !== this.a || hi !== this.b) {
      const fb = roundTo(this.challenge.f(this.b), 2);
      let msg;
      if (lo === this.b && hi === this.a) {
        msg = 'The limits are swapped: integrating from the end back to the start gives a negative length. Lower limit = where the route starts.';
      } else if (hi === fb && fb !== this.b) {
        msg = `${fmt(fb)} is the y-coordinate of the destination. The integral runs over x, so the limits must be x-values.`;
      } else {
        msg = 'The integration limits define the portion of the trajectory you need to measure.';
      }
      if (this.hintLevel >= 1) msg += ` This route covers ${fmt(this.a)} ≤ x ≤ ${fmt(this.b)} (see the information panel).`;
      return this.fail(msg);
    }
    const L = arcLength(this.challenge.df, this.a, this.b, 1024);
    const exact = exactLength(this.challenge, this.a, this.b);
    this.step = 5;
    this.result = { L, exact };
    return { ok: true, feedback: 'Integration complete. Route length computed.', result: this.result };
  }

  // Lines of LaTeX for the central display.
  display() {
    const lx = this.challenge.latex;
    const lines = [`f(x) = ${lx.f}`];
    if (this.step >= 1) lines.push(`f'(x) = ${lx.df}`);
    if (this.step >= 2) lines.push(`\\left[f'(x)\\right]^{2} = ${lx.dfSq}`);
    if (this.step >= 3) lines.push(`1 + \\left[f'(x)\\right]^{2} = ${lx.onePlus}`);
    if (this.step >= 4) lines.push(`\\sqrt{1 + \\left[f'(x)\\right]^{2}} = ${lx.sqrt}`);
    if (this.step >= 5) lines.push(this.resultLatex());
    return lines;
  }

  integrandLatex() {
    return integrandOf(this.challenge);
  }

  resultLatex() {
    const { L, exact } = this.result;
    const integral = `L = \\int_{${fmt(this.a)}}^{${fmt(this.b)}} ${integrandOf(this.challenge)}\\,dx`;
    if (exact !== null) {
      const closed = this.exactLatex
        ? ` = ${this.exactLatex}`
        : ` = \\left[${this.challenge.antiderivativeLatex}\\right]_{${fmt(this.a)}}^{${fmt(this.b)}}`;
      return `${integral}${closed} \\approx ${L.toFixed(3)}`;
    }
    return `${integral} \\approx ${L.toFixed(3)}\\;\\text{(numerical)}`;
  }
}

const STEP_OK = {
  derive: 'Slope f′(x) obtained: the local steepness of the trajectory.',
  square: 'Slope squared: the vertical part of Pythagoras, (Δy/Δx)².',
  addOne: 'Horizontal part added: 1 + [f′]² = (Δs/Δx)².',
  sqrt: 'Segment length per unit Δx obtained. Ready to integrate.',
};

export function integrandOf(challenge) {
  const s = challenge.latex.sqrt;
  // Use the simplified right-hand side when the integrand simplifies (e.g. "√(...) = x²+1").
  const parts = s.split(' = ');
  const expr = parts[parts.length - 1];
  return expr.startsWith('\\sqrt') ? expr : `\\left(${expr}\\right)`;
}

export function fmt(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function buildLimitOptions(challenge, a, b) {
  const fb = roundTo(challenge.f(b), 2);
  const set = new Set([a, b, fb, roundTo(b / 2, 2), a === 0 ? 1 : 0, roundTo(b + 1, 2)]);
  return [...set].filter((v) => Number.isFinite(v)).sort((p, q) => p - q);
}

function shuffleDeterministic(arr, seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Numerical tools for the arc length L = ∫_a^b sqrt(1 + f'(x)^2) dx.

export function simpson(g, a, b, n = 512) {
  if (n % 2 === 1) n += 1;
  const h = (b - a) / n;
  let sum = g(a) + g(b);
  for (let i = 1; i < n; i++) sum += g(a + i * h) * (i % 2 === 0 ? 2 : 4);
  return (sum * h) / 3;
}

export function arcLengthIntegrand(df) {
  return (x) => Math.sqrt(1 + df(x) ** 2);
}

export function arcLength(df, a, b, n = 512) {
  return simpson(arcLengthIntegrand(df), a, b, n);
}

export function straightDistance(f, a, b) {
  return Math.hypot(b - a, f(b) - f(a));
}

// Sum of n straight chords: Σ sqrt(Δx² + Δy²). Approaches the arc length as n → ∞.
export function polylineLength(f, a, b, n) {
  const dx = (b - a) / n;
  let total = 0;
  let prevY = f(a);
  for (let i = 1; i <= n; i++) {
    const y = f(a + i * dx);
    total += Math.hypot(dx, y - prevY);
    prevY = y;
  }
  return total;
}

export function numericDerivative(f, x, h = 1e-5) {
  return (f(x + h) - f(x - h)) / (2 * h);
}

// Smallest b > a with straightDistance(f, a, b) = target (chord is monotonic for our curves).
export function solveUpperLimit(f, a, target, maxB = a + 50) {
  let lo = a;
  let hi = a + 1e-3;
  while (straightDistance(f, a, hi) < target && hi < maxB) hi = a + (hi - a) * 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (straightDistance(f, a, mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function roundTo(value, decimals = 2) {
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

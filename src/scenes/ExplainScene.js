import Phaser from 'phaser';
import { button, domBox, tex, text } from '../ui/ui.js';
import { getChallenge, TUTORIAL } from '../math/challenges.js';
import { polylineLength } from '../math/arcLength.js';

const ORIGIN = { x: 120, y: 640 };
const SCALE = 140; // px per unit
const SEGMENTS = [1, 2, 4, 8, 16, 32, 64];

const STEPS = [
  {
    title: '1. Chop the curve into straight pieces',
    body: 'Zoom into a tiny piece of the trajectory: it is almost a straight segment. Pythagoras gives its length:',
    latex: '\\Delta s \\approx \\sqrt{(\\Delta x)^{2} + (\\Delta y)^{2}}',
  },
  {
    title: '2. The slope links Δy to Δx',
    body: 'Over a short step the curve rises by about slope × run:',
    latex: '\\Delta y \\approx f\'(x)\\,\\Delta x',
  },
  {
    title: '3. Substitute and factor out Δx',
    body: 'Each tiny piece then measures:',
    latex: '\\Delta s \\approx \\sqrt{(\\Delta x)^{2} + (f\'(x)\\Delta x)^{2}} = \\sqrt{1 + [f\'(x)]^{2}}\\,\\Delta x',
  },
  {
    title: '4. Add infinitely many tiny pieces',
    body: 'As the pieces shrink (n → ∞) the sum becomes an integral: the accumulated length of the curve.',
    latex: 'L = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} \\sqrt{1 + [f\'(x_i)]^{2}}\\,\\Delta x = \\int_a^b \\sqrt{1 + [f\'(x)]^{2}}\\,dx',
  },
];

export class ExplainScene extends Phaser.Scene {
  constructor() {
    super('Explain');
  }

  init(data) {
    this.sector = data.sector;
    this.allowSkip = data.allowSkip;
    this.segIndex = 0;
    this.stepIndex = 0;
    this.maxSeg = 0;
  }

  create() {
    this.challenge = getChallenge(TUTORIAL.challengeId);
    this.L = 14 / 3;
    const g = this.add.graphics();
    g.fillStyle(0x03060f, 0.96).fillRect(0, 0, 1280, 720);
    g.lineStyle(2, 0x2c3d63).strokeRoundedRect(30, 30, 1220, 660, 12);
    text(this, 60, 46, 'WHY THE INTEGRAL MEASURES LENGTH', 22, '#5ef2ff', { fontStyle: 'bold' });
    text(this, 60, 78, 'Without the computer you must know how route length is built. Reference trajectory:', 14, '#8fa0c4');
    this.fLabel = domBox(this, 760, 66, 460, 40, 'od-text', tex('f(x) = \\tfrac{2}{3}x^{3/2},\\quad 0 \\le x \\le 3'));

    this.plot = this.add.graphics();
    this.plotLabels = this.add.container();
    this.stats = text(this, 120, 116, '', 16, '#ffffff', { lineSpacing: 6 });

    button(this, 200, 676, '◀  fewer pieces', () => this.changeSeg(-1), { width: 180, height: 34, size: 14 });
    button(this, 400, 676, 'more pieces  ▶', () => this.changeSeg(1), { width: 180, height: 34, size: 14 });
    this.input.keyboard.on('keydown-LEFT', () => this.changeSeg(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.changeSeg(1));

    this.panel = domBox(this, 660, 120, 560, 0, 'od-panel', '');
    this.nextBtn = button(this, 800, 660, 'NEXT STEP', () => this.nextStep(), { width: 200, height: 40 });
    this.contBtn = button(this, 1080, 660, 'CONTINUE', () => this.finish(), { width: 200, height: 40, color: 0x1f5a3a });
    this.contBtn.setAlpha(0.35);
    if (this.allowSkip) button(this, 1150, 50, 'SKIP (seen)', () => this.finish(true), { width: 140, height: 30, size: 13 });
    this.renderPanel();
    this.drawPlot();
  }

  changeSeg(d) {
    this.segIndex = Phaser.Math.Clamp(this.segIndex + d, 0, SEGMENTS.length - 1);
    this.maxSeg = Math.max(this.maxSeg, this.segIndex);
    this.game.sfx.play('click');
    this.drawPlot();
    this.renderPanel();
  }

  nextStep() {
    if (this.stepIndex < STEPS.length - 1) {
      this.stepIndex += 1;
      this.game.sfx.play('click');
      this.renderPanel();
    }
  }

  canContinue() {
    return this.stepIndex === STEPS.length - 1 && SEGMENTS[this.maxSeg] >= 16;
  }

  renderPanel() {
    const html = STEPS.slice(0, this.stepIndex + 1)
      .map((s, i) => `<div style="margin-bottom:14px;opacity:${i === this.stepIndex ? 1 : 0.6}"><h3 style="color:#ffb347">${s.title}</h3><div class="muted" style="font-size:13px;margin-bottom:6px">${s.body}</div><div>${tex(s.latex, true)}</div></div>`)
      .join('');
    const need = [];
    if (this.stepIndex < STEPS.length - 1) need.push('read all steps (NEXT STEP)');
    if (SEGMENTS[this.maxSeg] < 16) need.push('split the curve into at least 16 pieces');
    this.panel.node.innerHTML = `${html}<div class="muted">${need.length ? `To continue: ${need.join(' and ')}.` : '<span class="ok">Ready. Next: rebuild this integral on the lever console.</span>'}</div>`;
    this.contBtn.setAlpha(this.canContinue() ? 1 : 0.35);
    this.nextBtn.setVisible(this.stepIndex < STEPS.length - 1);
  }

  toScreen(x, y) {
    return { x: ORIGIN.x + x * SCALE, y: ORIGIN.y - y * SCALE };
  }

  drawPlot() {
    const f = this.challenge.f;
    const g = this.plot.clear();
    this.plotLabels.removeAll(true);
    // Axes
    g.lineStyle(1, 0x44506e, 1);
    g.lineBetween(ORIGIN.x, ORIGIN.y, ORIGIN.x + 3.3 * SCALE, ORIGIN.y);
    g.lineBetween(ORIGIN.x, ORIGIN.y, ORIGIN.x, ORIGIN.y - 3.6 * SCALE);
    for (let i = 1; i <= 3; i++) {
      const p = this.toScreen(i, 0);
      g.lineBetween(p.x, p.y - 4, p.x, p.y + 4);
      this.plotLabels.add(text(this, p.x, p.y + 8, String(i), 12, '#8fa0c4').setOrigin(0.5, 0));
      const q = this.toScreen(0, i);
      g.lineBetween(q.x - 4, q.y, q.x + 4, q.y);
      this.plotLabels.add(text(this, q.x - 8, q.y, String(i), 12, '#8fa0c4').setOrigin(1, 0.5));
    }
    // True curve
    const pts = [];
    for (let i = 0; i <= 200; i++) pts.push(this.toScreen((3 * i) / 200, f((3 * i) / 200)));
    g.lineStyle(5, 0x5ef2ff, 0.35).strokePoints(pts);
    // Segments
    const n = SEGMENTS[this.segIndex];
    const dx = 3 / n;
    g.lineStyle(2.5, 0xffb347, 1);
    for (let i = 0; i < n; i++) {
      const p0 = this.toScreen(i * dx, f(i * dx));
      const p1 = this.toScreen((i + 1) * dx, f((i + 1) * dx));
      g.lineBetween(p0.x, p0.y, p1.x, p1.y);
      if (n <= 16) g.fillStyle(0xffb347, 1).fillCircle(p0.x, p0.y, 3);
    }
    // Highlight one segment as a right triangle
    const k = Math.floor(n * 0.6);
    const x0 = k * dx;
    const a = this.toScreen(x0, f(x0));
    const b = this.toScreen(x0 + dx, f(x0 + dx));
    g.lineStyle(2, 0xffffff, 0.9);
    g.lineBetween(a.x, a.y, b.x, a.y);
    g.lineBetween(b.x, a.y, b.x, b.y);
    g.lineStyle(4, 0xff4f5e, 1).lineBetween(a.x, a.y, b.x, b.y);
    if (b.x - a.x > 30) {
      this.plotLabels.add(text(this, (a.x + b.x) / 2, a.y + 6, 'Δx', 14, '#ffffff').setOrigin(0.5, 0));
      this.plotLabels.add(text(this, b.x + 6, (a.y + b.y) / 2, 'Δy', 14, '#ffffff').setOrigin(0, 0.5));
      this.plotLabels.add(text(this, (a.x + b.x) / 2 - 10, (a.y + b.y) / 2 - 10, 'Δs', 14, '#ff4f5e').setOrigin(1, 1));
    }
    const sum = polylineLength(f, 0, 3, n);
    this.stats.setText([
      `pieces n = ${n}`,
      `Σ Δs (straight pieces) = ${sum.toFixed(4)}`,
      `exact curve length L   = 14/3 ≈ ${this.L.toFixed(4)}`,
      `difference             = ${(this.L - sum).toFixed(4)}`,
    ]);
  }

  finish(skip = false) {
    if (!skip && !this.canContinue()) {
      this.game.sfx.play('denied');
      this.renderPanel();
      return;
    }
    this.scene.stop();
    this.sector.afterExplanation();
  }
}

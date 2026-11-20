import Phaser from 'phaser';
import { COLORS, domBox, tex, text } from '../ui/ui.js';
import { fmt, integrandOf } from '../game/consoleMachine.js';
import { pointAt } from '../math/route.js';

const NAMES = ['α', 'β'];

export class PlannerScene extends Phaser.Scene {
  constructor() {
    super('Planner');
  }

  init(data) {
    this.sector = data.sector;
    this.from = data.from;
    this.to = data.to;
    this.options = data.options;
    this.hover = -1;
    this.t = 0;
  }

  create() {
    this.add.rectangle(0, 60, 1280, 660, 0x000000, 0.35).setOrigin(0);
    this.g = this.add.graphics();
    this.labels = this.options.map((_, i) => text(this, 0, 0, '', 14, i ? '#ffb347' : '#5ef2ff', { backgroundColor: '#050914cc', padding: { x: 4, y: 2 } }).setOrigin(0.5));
    this.dLabel = text(this, 0, 0, '', 13, '#ffffff', { backgroundColor: '#050914cc', padding: { x: 4, y: 2 } }).setOrigin(0.5);
    this.panel = domBox(this, 880, 70, 390, 0, 'od-panel', '');
    this.renderPanel();
    this.input.keyboard.on('keydown-ESC', () => this.cancel());
    this.input.on('pointerdown', (p) => p.rightButtonDown() && this.cancel());
  }

  renderPanel() {
    const s = this.sector;
    const fuel = s.fuel.amount;
    const cards = this.options.map((r, i) => this.cardHtml(r, i, fuel)).join('');
    const navLine = s.navOnline
      ? `<div class="muted ok">NAV-COMPUTER ONLINE: it evaluates ${tex(`L = \\int_a^b \\sqrt{1 + [f'(x)]^2}\\,dx`)} for you.</div>`
      : `<div class="warn">NAV-COMPUTER OFFLINE: route lengths are unknown until you build each integral on the lever console.</div>`;
    this.panel.node.innerHTML = `
      <h2>ROUTE PLANNER  P${this.from.i + 1} → P${this.to.i + 1}</h2>
      ${navLine}
      <div class="muted" style="margin:6px 0 8px">The ship cannot fly straight: it must follow one of these curves. Fuel burned = k·L with k = 1.</div>
      ${cards}
      <div class="row"><span>Fuel on board</span><span class="val">${fuel.toFixed(2)} u</span></div>
      <button class="od-btn" data-act="cancel">CANCEL (ESC)</button>`;
    this.panel.node.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.game.sfx.play('click');
        const i = Number(b.dataset.i);
        if (b.dataset.act === 'cancel') this.cancel();
        else if (b.dataset.act === 'go') this.confirm(this.options[i]);
        else if (b.dataset.act === 'console') this.openConsole(this.options[i]);
      });
    });
    this.panel.node.querySelectorAll('.od-card').forEach((c) => {
      c.addEventListener('mouseenter', () => (this.hover = Number(c.dataset.i)));
      c.addEventListener('mouseleave', () => (this.hover = -1));
    });
  }

  cardHtml(r, i, fuel) {
    const side = r.opt === 0 ? 'inner arc, closer to the boss' : 'outer arc, farther from the boss';
    const curve = tex(`f(x) = ${r.challenge.latex.f},\\quad ${fmt(r.a)} \\le x \\le ${fmt(r.b)}`);
    const known = r.known;
    const extra = known ? ((r.L / r.straight - 1) * 100).toFixed(1) : null;
    const lengthRow = known
      ? `<div class="row"><span>Curve length L</span><span class="val">${r.L.toFixed(3)} u</span></div>
         <div class="muted">${tex(`L = \\int_{${fmt(r.a)}}^{${fmt(r.b)}} ${integrandOf(r.challenge)}\\,dx`)} — ${extra}% longer than the straight line</div>
         <div class="row"><span>Fuel cost</span><span class="val">${r.cost.toFixed(3)} u → ${(fuel - r.cost).toFixed(2)} left</span></div>`
      : `<div class="row"><span>Curve length L</span><span class="val" style="color:#ff4f5e">? (unknown)</span></div>
         <div class="row"><span>Fuel cost</span><span class="val" style="color:#ff4f5e">?</span></div>`;
    const warn = [
      r.coreHit ? '<div class="warn">⚠ Passes through the boss core: collision damage.</div>' : '',
      r.hazardHit ? '<div class="warn">⚠ Crosses an active danger zone right now.</div>' : '',
    ].join('');
    const affordable = known && this.sector.fuel.canAfford(r.cost);
    const btn = known
      ? `<button class="od-btn primary" data-act="go" data-i="${i}" ${affordable ? '' : 'disabled'}>${affordable ? 'CONFIRM ROUTE' : 'NOT ENOUGH FUEL'}</button>`
      : `<button class="od-btn console" data-act="console" data-i="${i}">BUILD INTEGRAL ON CONSOLE</button>`;
    return `<div class="od-card ${i ? 'beta' : 'alpha'}" data-i="${i}">
      <h3>ROUTE ${NAMES[i]} <span class="muted">(${side})</span></h3>
      <div>${curve}</div>
      <div class="row"><span>Straight-line distance d</span><span class="val">${r.straight.toFixed(3)} u</span></div>
      ${lengthRow}${warn}${btn}</div>`;
  }

  update(time, delta) {
    this.t += delta / 1000;
    const g = this.g.clear();
    // Straight-line displacement (dashed)
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const len = Math.hypot(dx, dy);
    g.lineStyle(2, 0xffffff, 0.7);
    for (let s = 0; s < len; s += 14) {
      const e = Math.min(len, s + 7);
      g.lineBetween(this.from.x + (dx * s) / len, this.from.y + (dy * s) / len, this.from.x + (dx * e) / len, this.from.y + (dy * e) / len);
    }
    this.dLabel.setPosition(this.from.x + dx / 2, this.from.y + dy / 2).setText(`d = ${this.options[0].straight.toFixed(2)} u`);

    this.options.forEach((r, i) => {
      const color = COLORS.route[i];
      const hl = this.hover === i;
      g.lineStyle(hl ? 7 : 4, color, hl ? 1 : 0.85);
      g.strokePoints(r.points, false);
      // Moving marker shows direction of travel
      const p = pointAt(r, ((this.t * 160) % r.pixelLength));
      g.fillStyle(color, 1).fillCircle(p.x, p.y, 5);
      const far = this.farthestPoint(r);
      const len2 = Math.hypot(far.ox, far.oy) || 1;
      this.labels[i].setPosition(far.x + (far.ox / len2) * 26, far.y + (far.oy / len2) * 26).setText(`${NAMES[i]}: L = ${r.known ? r.L.toFixed(2) : '?'} u`);
    });
    g.lineStyle(3, COLORS.node, 1).strokeCircle(this.to.x, this.to.y, 26);
    g.lineStyle(3, 0xffffff, 0.8).strokeCircle(this.from.x, this.from.y, 26);
  }

  farthestPoint(r) {
    const mx = (this.from.x + this.to.x) / 2;
    const my = (this.from.y + this.to.y) / 2;
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const L = Math.hypot(dx, dy);
    let best = { x: mx, y: my, ox: -dy / L, oy: dx / L, d: -1 };
    for (const p of r.points) {
      const d = Math.abs(dx * (p.y - this.from.y) - dy * (p.x - this.from.x)) / L;
      if (d > best.d) best = { x: p.x, y: p.y, d };
    }
    const sgn = Math.sign(dx * (best.y - this.from.y) - dy * (best.x - this.from.x)) || 1;
    best.ox = (-dy / L) * sgn;
    best.oy = (dx / L) * sgn;
    return best;
  }

  openConsole(route) {
    this.panel.setVisible(false);
    this.scene.launch('Console', { sector: this.sector, planner: this, route });
    this.scene.pause();
  }

  // Called by ConsoleScene.
  onConsoleClosed(route, solved) {
    if (solved) {
      this.sector.markRouteKnown(route);
      route.known = true;
    }
    this.panel.setVisible(true);
    this.renderPanel();
    this.scene.resume();
  }

  confirm(route) {
    this.scene.stop();
    this.scene.resume('Sector');
    this.sector.startTravel(route);
  }

  cancel() {
    this.scene.stop();
    this.scene.resume('Sector');
  }
}

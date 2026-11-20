import Phaser from 'phaser';
import { button, domBox, tex, text } from '../ui/ui.js';
import { ConsoleMachine, OPS, fmt } from '../game/consoleMachine.js';
import { getChallenge, TUTORIAL } from '../math/challenges.js';

const LEVER_LABELS = {
  derive: ['DERIVE', "f → f'"],
  square: ['SQUARE', '(·)²'],
  addOne: ['ADD 1', '1 + (·)'],
  sqrt: ['ROOT', '√(·)'],
  integrate: ['INTEGRATE', '∫ (·) dx'],
};
const KNOB_COLORS = [0xd94b3d, 0xe0a030, 0x4fae5a, 0x3d8bd9, 0x9b59d0];
const SLOT_TOP = 455;
const SLOT_LEN = 120;

export class ConsoleScene extends Phaser.Scene {
  constructor() {
    super('Console');
  }

  init(data) {
    this.sector = data.sector;
    this.planner = data.planner;
    this.route = data.route;
    this.tutorial = !!data.tutorial;
    this.closing = false;
  }

  create() {
    const s = this.sector.sector;
    if (this.tutorial) {
      this.machine = new ConsoleMachine({ challenge: getChallenge(TUTORIAL.challengeId), a: TUTORIAL.a, b: TUTORIAL.b, hintLevel: 2, exactLatex: TUTORIAL.exactLatex });
    } else {
      this.machine = new ConsoleMachine({
        challenge: this.route.challenge,
        a: this.route.a,
        b: this.route.b,
        hintLevel: s.hintLevel,
        requireDerivativeChoice: s.requireDerivativeChoice,
        requireLimits: s.requireLimits,
        startAtIntegrate: this.sector.integrandMemory.has(this.route.challenge.id),
      });
    }
    this.drawMachine();
    this.display = domBox(this, 70, 92, 760, 250, 'od-crt', '');
    this.info = domBox(this, 860, 92, 350, 250, 'od-info', '');
    this.feedback = domBox(this, 70, 352, 1140, 64, 'od-feedback', '');
    this.createLamps();
    this.createLevers();
    this.createDrumAndDials();
    this.createButtons();
    this.input.keyboard.on('keydown', (e) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < OPS.length) this.pull(idx);
      if (e.key === 'r' || e.key === 'R') this.resetMachine();
      if (e.key === 'Escape' && !this.tutorial) this.close(false);
    });
    this.setFeedback(this.introText(), 'info');
    this.refresh();
    this.cameras.main.fadeIn(250);
    this.game.sfx.play('lever');
  }

  introText() {
    if (this.tutorial) return 'CALIBRATION: rebuild the arc-length integral of the reference trajectory. The levers transform the expression step by step. Start with the slope: pull DERIVE (or press 1).';
    if (this.machine.startAtIntegrate) return 'Integrand recovered from memory for this curve. Set the integration limits for this route and integrate.';
    const lvl = this.sector.sector.hintLevel;
    if (lvl >= 1) return 'Build L = ∫ √(1 + [f′(x)]²) dx for this route. Operate the levers in the right order; the drum selects f′(x) and the dials set the limits.';
    return 'Construct the arc-length integral for this route.';
  }

  drawMachine() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.7).fillRect(0, 0, 1280, 720);
    g.fillGradientStyle(0x4a515c, 0x4a515c, 0x23272e, 0x23272e, 1).fillRoundedRect(36, 40, 1208, 650, 18);
    g.lineStyle(4, 0x6b7380, 1).strokeRoundedRect(36, 40, 1208, 650, 18);
    g.fillStyle(0x1a1d22, 1).fillRoundedRect(56, 430, 770, 245, 10);
    g.fillStyle(0x1a1d22, 1).fillRoundedRect(846, 430, 378, 245, 10);
    for (const [x, y] of [[50, 54], [1230, 54], [50, 676], [1230, 676]]) {
      g.fillStyle(0x8a929e, 1).fillCircle(x, y, 6);
      g.fillStyle(0x30343b, 1).fillCircle(x, y, 2);
    }
    const mode = this.tutorial ? 'CALIBRATION — GUIDED' : ['MINIMAL ASSIST', 'ASSISTED', 'GUIDED'][this.sector.sector.hintLevel];
    text(this, 70, 52, 'MANUAL ARC-LENGTH CONSOLE  MK-II', 18, '#ffd28a', { fontStyle: 'bold' });
    text(this, 1210, 56, mode, 13, '#9aa3b0').setOrigin(1, 0);
  }

  createLamps() {
    this.lamps = OPS.map((op, i) => {
      const x = 120 + i * 140;
      return this.add.circle(x, 442, 7, 0x333333).setStrokeStyle(2, 0x111111);
    });
  }

  createLevers() {
    this.levers = OPS.map((op, i) => {
      const x = 120 + i * 140;
      const slot = this.add.rectangle(x, SLOT_TOP + SLOT_LEN / 2 + 10, 18, SLOT_LEN + 30, 0x0a0b0d).setStrokeStyle(2, 0x555c66);
      const glow = this.add.circle(x, SLOT_TOP + 10, 30, 0xffd23f, 0).setDepth(1);
      const rod = this.add.rectangle(x, SLOT_TOP + 10, 8, 8, 0xb8bec8).setOrigin(0.5, 0);
      const knob = this.add.circle(x, SLOT_TOP + 10, 20, KNOB_COLORS[i]).setStrokeStyle(3, 0x111111).setDepth(2);
      const shine = this.add.circle(x - 6, SLOT_TOP + 4, 6, 0xffffff, 0.35).setDepth(3);
      this.add.rectangle(x, 640, 122, 44, 0x2b3038).setStrokeStyle(2, 0x6b7380);
      text(this, x, 630, `${i + 1}  ${LEVER_LABELS[op][0]}`, 13, '#ffe9b0', { fontStyle: 'bold' }).setOrigin(0.5);
      text(this, x, 650, LEVER_LABELS[op][1], 13, '#c9d1dc').setOrigin(0.5);
      knob.setInteractive({ useHandCursor: true, draggable: true });
      const lever = { op, i, x, knob, shine, rod, glow, slot, busy: false };
      knob.on('drag', (p, dx, dy) => {
        if (lever.busy) return;
        const y = Phaser.Math.Clamp(dy, SLOT_TOP + 10, SLOT_TOP + 10 + SLOT_LEN);
        this.setKnob(lever, y);
      });
      knob.on('dragend', () => {
        if (lever.busy) return;
        if (knob.y > SLOT_TOP + 10 + SLOT_LEN * 0.7) this.pull(i, true);
        else this.springBack(lever);
      });
      knob.on('pointerup', (p) => {
        if (!lever.busy && p.getDistance() < 6) this.pull(i);
      });
      return lever;
    });
  }

  setKnob(lever, y) {
    lever.knob.y = y;
    lever.shine.y = y - 6;
    lever.rod.height = y - (SLOT_TOP + 10);
  }

  springBack(lever) {
    const obj = { y: lever.knob.y };
    this.tweens.add({ targets: obj, y: SLOT_TOP + 10, duration: 260, ease: 'Back.out', onUpdate: () => this.setKnob(lever, obj.y), onComplete: () => (lever.busy = false) });
  }

  pull(i, alreadyDown = false) {
    const lever = this.levers[i];
    if (lever.busy) return;
    lever.busy = true;
    const finish = () => {
      this.game.sfx.play('lever');
      this.cameras.main.shake(80, 0.002);
      this.applyOp(lever.op, i);
      this.time.delayedCall(120, () => this.springBack(lever));
    };
    if (alreadyDown) {
      this.setKnob(lever, SLOT_TOP + 10 + SLOT_LEN);
      finish();
    } else {
      const obj = { y: lever.knob.y };
      this.tweens.add({ targets: obj, y: SLOT_TOP + 10 + SLOT_LEN, duration: 160, ease: 'Quad.in', onUpdate: () => this.setKnob(lever, obj.y), onComplete: finish });
    }
  }

  applyOp(op, i) {
    const res = this.machine.pull(op);
    this.react(res, i);
  }

  react(res, lampIndex) {
    if (res.ok) {
      this.game.sfx.play(res.result ? 'success' : 'click');
      this.setFeedback(res.feedback, 'good');
      this.display.node.classList.remove('flicker');
      void this.display.node.offsetWidth;
      this.display.node.classList.add('flicker');
    } else {
      this.game.sfx.play('error');
      this.cameras.main.shake(160, 0.005);
      this.setFeedback(res.feedback, 'bad');
      if (lampIndex !== undefined) {
        const lamp = this.lamps[lampIndex];
        lamp.setFillStyle(0xff3030);
        this.time.delayedCall(450, () => this.refresh());
      }
    }
    this.refresh();
  }

  createDrumAndDials() {
    const m = this.machine;
    text(this, 866, 440, "DERIVATIVE DRUM  f'(x)", 13, '#ffd28a');
    if (m.requireDerivativeChoice) {
      this.drum = domBox(this, 866, 462, 250, 54, 'od-drum', '');
      button(this, 1146, 474, '▲', () => this.turnDrum(-1), { width: 44, height: 26, size: 14 });
      button(this, 1146, 504, '▼', () => this.turnDrum(1), { width: 44, height: 26, size: 14 });
      this.lockBtn = button(this, 1196, 489, 'LOCK', () => this.react(this.machine.lockDrum()), { width: 46, height: 56, size: 12, color: 0x5a2a12 });
    } else {
      text(this, 866, 470, 'AUTOMATIC (guided mode):\nthe drum computes f′(x) for you.', 13, '#8fa0c4');
    }
    text(this, 866, 535, 'INTEGRATION LIMIT DIALS', 13, '#ffd28a');
    if (m.requireLimits) {
      this.dials = ['lower', 'upper'].map((which, k) => {
        const x = 930 + k * 170;
        const y = 610;
        const body = this.add.circle(x, y, 34, 0x30343b).setStrokeStyle(4, 0x8a929e);
        const pointer = this.add.rectangle(x, y, 4, 30, 0xffd23f).setOrigin(0.5, 1);
        const value = text(this, x, y - 52, '', 15, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5);
        text(this, x, y + 46, which === 'lower' ? 'LOWER  a' : 'UPPER  b', 12, '#c9d1dc').setOrigin(0.5);
        button(this, x - 56, y, '◀', () => this.turnLimit(which, -1), { width: 26, height: 30, size: 13 });
        button(this, x + 56, y, '▶', () => this.turnLimit(which, 1), { width: 26, height: 30, size: 13 });
        body.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.turnLimit(which, 1));
        return { which, pointer, value };
      });
    } else {
      text(this, 866, 560, `AUTO-SET: a = ${fmt(m.a)}, b = ${fmt(m.b)}\n(the limits come from the route's x-range)`, 13, '#8fa0c4');
    }
  }

  turnDrum(d) {
    if (!this.machine.choosingDerivative) {
      this.game.sfx.play('denied');
      this.setFeedback(this.machine.hintLevel >= 1 ? 'The drum only engages after you pull DERIVE.' : 'Drum idle.', 'bad');
      return;
    }
    this.machine.turnDrum(d);
    this.game.sfx.play('click');
    this.refresh();
  }

  turnLimit(which, d) {
    this.machine.turnLimit(which, d);
    this.game.sfx.play('click');
    this.refresh();
  }

  createButtons() {
    this.resetBtn = button(this, 790, 640, 'RESET', () => this.resetMachine(), { width: 64, height: 44, size: 13, color: 0x5a1212 });
    if (!this.tutorial) this.abortBtn = button(this, 1135, 66, 'ABORT (ESC)', () => this.close(false), { width: 150, height: 30, size: 13 });
    this.doneBtn = button(this, 640, 384, this.tutorial ? 'CALIBRATION COMPLETE — RESUME COMBAT' : 'TRANSFER ROUTE TO NAVIGATION', () => this.close(true), { width: 460, height: 50, size: 16, color: 0x1f5a3a });
    this.doneBtn.setVisible(false).setDepth(10);
  }

  resetMachine() {
    this.machine.reset();
    this.game.sfx.play('lever');
    this.setFeedback('Console reset. The expression is back to f(x).', 'info');
    this.refresh();
  }

  setFeedback(msg, kind) {
    this.feedback.node.className = `od-feedback ${kind === 'good' ? 'good' : kind === 'bad' ? 'bad' : ''}`;
    const label = kind === 'bad' ? 'DIAGNOSTIC' : kind === 'good' ? 'OK' : 'CONSOLE';
    this.feedback.node.innerHTML = `<b>${label}:</b> ${msg}`;
  }

  refresh() {
    const m = this.machine;
    const lines = m.display();
    this.display.node.innerHTML = lines.map((l, i) => `<div class="line ${i === lines.length - 1 ? 'latest' : ''}">${tex(l)}</div>`).join('');
    // Info panel
    const lvl = m.hintLevel;
    let html = `<div class="title">${this.tutorial ? 'REFERENCE TRAJECTORY' : 'ROUTE DATA'}</div>`;
    html += `<div>${tex(`f(x) = ${m.challenge.latex.f}`)}</div>`;
    html += `<div style="margin:6px 0">${tex(`${fmt(m.a)} \\le x \\le ${fmt(m.b)}`)}</div>`;
    if (lvl >= 2) html += `<div class="muted" style="margin-top:6px">Target: ${tex('L = \\int_a^b \\sqrt{1 + [f\'(x)]^{2}}\\,dx')}</div>`;
    if (lvl >= 1 && !m.done) html += `<div style="margin-top:8px;color:#ffd28a">Next: ${m.nextHint()}</div>`;
    if (m.done) {
      const r = m.result;
      html += `<div style="margin-top:8px;color:#7dff9b">L ≈ ${r.L.toFixed(3)} u → fuel ${r.L.toFixed(3)} u</div>`;
      if (r.exact === null) html += `<div class="muted">${m.challenge.numericNote ?? 'No elementary closed form at this level: the value is computed numerically (Simpson rule).'}</div>`;
    }
    if (m.mistakes) html += `<div class="muted" style="margin-top:6px">Diagnostics logged: ${m.mistakes}</div>`;
    this.info.node.innerHTML = html;
    // Lamps
    this.lamps.forEach((lamp, i) => {
      if (i < m.step) lamp.setFillStyle(0x3dff7a);
      else if (i === m.step && lvl >= 2 && !m.done) lamp.setFillStyle(0xffb347);
      else lamp.setFillStyle(0x333333);
    });
    // Guided lever highlight
    this.tweens.killTweensOf(this.levers.map((l) => l.glow));
    this.levers.forEach((l) => l.glow.setAlpha(0));
    if (lvl >= 2 && !m.done && !m.choosingDerivative) {
      const glow = this.levers[m.step].glow;
      glow.setAlpha(0.35);
      this.tweens.add({ targets: glow, alpha: 0.05, duration: 500, yoyo: true, repeat: -1 });
    }
    // Drum
    if (this.drum) {
      if (m.choosingDerivative) {
        this.drum.node.className = 'od-drum';
        this.drum.node.innerHTML = tex(`f'(x) = ${m.drumOptions[m.drumIndex].latex}`);
      } else if (m.step >= 1) {
        this.drum.node.className = 'od-drum idle';
        this.drum.node.innerHTML = 'LOCKED ✓';
      } else {
        this.drum.node.className = 'od-drum idle';
        this.drum.node.innerHTML = '— DRUM IDLE —';
      }
    }
    if (this.dials) {
      const n = m.limitOptions.length;
      this.dials.forEach((d) => {
        const idx = d.which === 'lower' ? m.lowerIndex : m.upperIndex;
        d.pointer.rotation = -2.3 + (4.6 * idx) / Math.max(1, n - 1);
        d.value.setText(fmt(m.limitOptions[idx]));
      });
    }
    this.doneBtn.setVisible(m.done);
    this.feedback.setVisible(!m.done);
  }

  close(solved) {
    if (this.closing) return;
    if (solved && !this.machine.done) return;
    this.closing = true;
    this.scene.stop();
    if (this.tutorial) this.sector.afterTutorial();
    else this.planner.onConsoleClosed(this.route, solved);
  }
}


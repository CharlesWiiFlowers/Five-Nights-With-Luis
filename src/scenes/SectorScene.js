import Phaser from 'phaser';
import { Boss } from '../bosses/Boss.js';
import { Hud } from '../ui/Hud.js';
import { COLORS, domBox, text } from '../ui/ui.js';
import { FuelTank } from '../game/fuel.js';
import { FUEL_CAPACITY } from '../game/expedition.js';
import { buildRoute, minDistanceTo, pointAt } from '../math/route.js';
import { getChallenge } from '../math/challenges.js';

const CENTER = { x: 640, y: 392 };
const TETHER = 48;
const SHIP_R = 16;
const TRAVEL_SPEED = 150;
const MAX_HP = 5;

export class SectorScene extends Phaser.Scene {
  constructor() {
    super('Sector');
  }

  create() {
    this.expedition = this.game.expedition;
    this.sector = this.expedition.sector;
    this.fuel = new FuelTank(this.expedition.restartFuel(), FUEL_CAPACITY);
    this.hp = MAX_HP;
    this.navOnline = this.sector.navStartsOnline;
    this.failureDone = !this.sector.navStartsOnline;
    this.knownRoutes = new Map(); // routeKey -> true once computed on the console
    this.integrandMemory = new Set(); // challenge ids whose integrand was built this sector
    this.hazards = [];
    this.pickups = [];
    this.bolts = [];
    this.state = 'intro'; // intro | docked | traveling | free | dead | cutscene
    this.invuln = 0;
    this.fireCooldown = 0;
    this.pickupTimer = this.sector.pickupEverySec;
    this.cycleTimer = this.sector.nodes.cycleSec;
    this.message = '';
    this.paused = false;
    this.portal = null;
    this.trailG = null;
    this.travel = null;
    this.debugGod = false;

    this.drawBackground();
    this.createNodes();
    this.boss = new Boss(this, CENTER.x, CENTER.y, this.sector.boss);
    this.boss.attacking = false;
    this.createPlayer();
    this.hud = new Hud(this, this.sector, this.sector.boss.name);
    this.toast = text(this, 640, 690, '', 15, '#ffffff', { align: 'center', backgroundColor: '#0a0f1ecc', padding: { x: 10, y: 5 } })
      .setOrigin(0.5).setDepth(1001).setAlpha(0);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,M');
    this.keys.ESC.on('down', () => this.openPause());
    this.keys.M.on('down', () => {
      this.game.sound.mute = !this.game.sound.mute;
      this.flash(this.game.sound.mute ? 'Music muted (M)' : 'Music on (M)');
    });
    this.input.on('pointerdown', (p) => this.onPointer(p));
    if (new URLSearchParams(location.search).has('debug')) this.setupDebug();

    this.events.on('resume', () => (this.paused = false));
    this.events.on('pause', () => (this.paused = true));
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.game.music.play('exploration', this.sector.id);
    this.introBanner();
  }

  // ---------- setup ----------
  drawBackground() {
    const bg = this.sector.background;
    this.add.rectangle(0, 0, 1280, 720, bg.tint).setOrigin(0);
    this.add.image(0, 0, 'stars').setOrigin(0).setAlpha(0.9);
    if (bg.planet === 'planet-level1') this.add.sprite(1130, 610, 'planet1-1').setScale(bg.planetScale).play('planet1-spin').setAlpha(0.9);
    else this.add.image(1130, 610, bg.planet).setScale(bg.planetScale).setAlpha(0.9);
    bg.decor.forEach((k, i) => this.add.image(110 + i * 70, 640 - i * 470, k).setScale(1.2 + i * 0.4).setAlpha(0.8));
    this.arenaG = this.add.graphics().setDepth(1);
    this.arenaG.lineStyle(1, 0x2c3d63, 0.6).strokeCircle(CENTER.x, CENTER.y, this.sector.nodes.radius);
    this.arenaG.lineStyle(1, 0xff5533, 0.25).strokeCircle(CENTER.x, CENTER.y, this.sector.boss.contactRadius);
  }

  createNodes() {
    const { count, radius } = this.sector.nodes;
    this.nodes = Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / count;
      return {
        i,
        x: CENTER.x + Math.cos(a) * radius,
        y: CENTER.y + Math.sin(a) * radius,
        charges: this.sector.chargesPerNode,
        rechargeAt: 0,
        active: true,
      };
    });
    this.nodeG = this.add.graphics().setDepth(5);
    this.nodeLabels = this.nodes.map((n) => text(this, n.x, n.y + 30, `P${n.i + 1}`, 12, '#7dff9b').setOrigin(0.5).setDepth(6));
    this.applyNodeCycle(true);
  }

  applyNodeCycle(initial = false) {
    const { count, activeCount, startIndex } = this.sector.nodes;
    if (activeCount >= count) return;
    const current = this.dockedNode?.i ?? startIndex;
    const ids = Phaser.Utils.Array.Shuffle([...Array(count).keys()].filter((i) => (initial ? i !== current : true)));
    const active = new Set(initial ? [current, ...ids.slice(0, activeCount - 1)] : ids.slice(0, activeCount));
    this.nodes.forEach((n) => (n.active = active.has(n.i)));
    if (!initial) {
      this.flash('Firing positions shifted!', '#b066ff');
      this.cameras.main.shake(200, 0.004);
    }
  }

  createPlayer() {
    const n = this.nodes[this.sector.nodes.startIndex];
    this.dockedNode = n;
    this.offset = new Phaser.Math.Vector2(0, 0);
    this.thrust = this.add.sprite(0, 0, 'thrust-1').setScale(0.45).play('thrust').setDepth(19).setVisible(false);
    this.ship = this.add.sprite(n.x, n.y, 'ship-1').setScale(0.36).play('ship-idle').setDepth(20);
    this.ship.rotation = Math.atan2(CENTER.y - n.y, CENTER.x - n.x);
  }

  introBanner() {
    this.state = 'cutscene';
    const t1 = text(this, 640, 300, `SECTOR ${this.sector.number}`, 26, '#8fa0c4').setOrigin(0.5).setDepth(1100).setAlpha(0);
    const t2 = text(this, 640, 340, this.sector.name, 54, '#5ef2ff', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(1100).setAlpha(0);
    const t3 = text(this, 640, 395, this.sector.subtitle, 18, '#ffb347').setOrigin(0.5).setDepth(1100).setAlpha(0);
    this.tweens.add({ targets: [t1, t2, t3], alpha: 1, duration: 600, hold: 1400, yoyo: true, onComplete: () => {
      [t1, t2, t3].forEach((t) => t.destroy());
      this.state = 'docked';
      this.boss.attacking = true;
      this.game.music.play(this.sector.music, this.sector.id);
      this.flash(this.navOnline ? 'Navigation computer online. Click a glowing firing position to plan a route.' : 'Navigation computer offline. Every route must be built on the lever console.');
      this.onDock(this.dockedNode, true);
    } });
  }

  // ---------- helpers used by bosses / overlays ----------
  playerPos() {
    return { x: this.ship.x, y: this.ship.y };
  }

  addHazard(h) {
    this.hazards.push(h);
  }

  flash(msg, color = '#ffffff', ms = 3200) {
    this.toast.setText(msg).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: ms, duration: 500 });
  }

  objective() {
    if (this.state === 'free') return 'Boss defeated! Fly into the portal with WASD.';
    if (this.state === 'traveling') return 'Auto-pilot following the curve...';
    const n = this.dockedNode;
    if (!n) return '';
    if (!n.active) return 'This position collapsed. Relocate to a glowing position.';
    if (n.charges <= 0) return 'Position spent (recharging). Relocate, or dodge (WASD) until it recharges.';
    return `Fire! [SPACE / click boss] — ${n.charges} shots left here. Click a node to relocate.`;
  }

  routeKey(from, to, opt) {
    return `${from.i}-${to.i}-${opt}`;
  }

  // Two route options per destination: a gentle curve hugging the chord on the boss side,
  // and a strongly curved (longer, costlier) detour bulging away from the boss.
  routeOptions(from, to) {
    const pairs = this.sector.routePairs;
    const pair = pairs[(Math.min(from.i, to.i) * 7 + Math.max(from.i, to.i) * 13) % pairs.length];
    return pair.map(([id, a], opt) => {
      const challenge = getChallenge(id);
      const r0 = buildRoute({ challenge, start: from, end: to, a, mirror: false });
      const outward = this.bulgesOutward(r0, from, to);
      const route = outward === (opt === 1) ? r0 : buildRoute({ challenge, start: from, end: to, a, mirror: true });
      route.key = this.routeKey(from, to, opt);
      route.to = to;
      route.opt = opt;
      route.known = this.navOnline || this.knownRoutes.has(route.key);
      route.coreHit = minDistanceTo(route, CENTER.x, CENTER.y) < this.boss.radius + SHIP_R;
      route.hazardHit = this.hazards.some((hz) => hz.dangerAt && route.points.some((p, i) => i % 6 === 0 && hz.dangerAt(p.x, p.y, SHIP_R)));
      return route;
    });
  }

  chordThroughCore(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.abs(dx * (CENTER.y - a.y) - dy * (CENTER.x - a.x)) / Math.hypot(dx, dy);
    return dist < this.boss.radius * 0.6;
  }

  // Signed side of the curve's farthest point relative to the chord, compared with the boss side.
  bulgesOutward(route, from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const side = (p) => dx * (p.y - from.y) - dy * (p.x - from.x);
    let far = route.points[0];
    for (const p of route.points) if (Math.abs(side(p)) > Math.abs(side(far))) far = p;
    const bossSide = side(CENTER);
    if (Math.abs(bossSide) < 1) return side(far) < 0; // chord through the center: pick a consistent side
    return Math.sign(side(far)) !== Math.sign(bossSide);
  }

  // ---------- input ----------
  onPointer(p) {
    if (this.paused) return;
    if (this.state !== 'docked') return;
    const node = this.nodes.find((n) => Math.hypot(n.x - p.worldX, n.y - p.worldY) < 30);
    if (node && node !== this.dockedNode) {
      if (!node.active) {
        this.game.sfx.play('denied');
        this.flash('That position is collapsed right now.', '#ff8a8a');
        return;
      }
      if (this.chordThroughCore(this.dockedNode, node)) {
        this.game.sfx.play('denied');
        this.flash('No safe curve: that position lies straight across the boss core. Hop through a neighbouring position.', '#ff8a8a', 3500);
        return;
      }
      this.openPlanner(node);
      return;
    }
    if (Math.hypot(p.worldX - CENTER.x, p.worldY - CENTER.y) < this.boss.radius + 40) this.tryFire();
  }

  openPlanner(target) {
    const options = this.routeOptions(this.dockedNode, target);
    this.scene.launch('Planner', { sector: this, from: this.dockedNode, to: target, options });
    this.scene.pause();
  }

  openPause() {
    if (this.state === 'dead' || this.paused) return;
    this.scene.launch('Pause', { sector: this });
    this.scene.pause();
  }

  // Called by PlannerScene.
  markRouteKnown(route) {
    this.knownRoutes.set(route.key, true);
    this.integrandMemory.add(route.challenge.id);
  }

  startTravel(route) {
    if (!this.fuel.canAfford(route.cost)) return;
    this.state = 'traveling';
    this.travel = { route, s: 0, fuelStart: this.fuel.amount };
    this.dockedNode = null;
    this.thrust.setVisible(true);
    this.trailG = this.trailG ?? this.add.graphics().setDepth(4);
    this.trailG.clear();
    this.trailG.lineStyle(2, COLORS.route[route.opt], 0.35);
    this.trailG.strokePoints(route.points, false);
  }

  onDock(node, initial = false) {
    this.state = 'docked';
    this.dockedNode = node;
    this.offset.set(0, 0);
    this.thrust.setVisible(false);
    this.trailG?.clear();
    if (initial) return;
    // Soft-lock guard: if no route from here is affordable, eject an emergency canister.
    const cheapest = Math.min(...this.nodes.filter((n) => n !== node && !this.chordThroughCore(node, n)).flatMap((n) => this.routeOptions(node, n).map((r) => r.cost)));
    if (!this.fuel.canAfford(cheapest)) {
      this.spawnPickup(14, true);
      this.flash('Fuel critical: emergency reserve canister ejected nearby. Collect it with WASD.', '#ffd23f', 4500);
    }
  }

  tryFire() {
    const n = this.dockedNode;
    if (this.state !== 'docked' || !n || this.fireCooldown > 0) return;
    if (!n.active || n.charges <= 0) {
      this.game.sfx.play('denied');
      this.flash(n.active ? 'This position is spent. Relocate, or wait for it to recharge.' : 'Position collapsed. Relocate.', '#ff8a8a', 1500);
      this.fireCooldown = 0.4;
      return;
    }
    n.charges -= 1;
    if (n.charges === 0) n.rechargeAt = this.time.now + this.sector.rechargeSec * 1000;
    this.fireCooldown = this.sector.fireRate;
    const a = Math.atan2(CENTER.y - this.ship.y, CENTER.x - this.ship.x);
    this.ship.rotation = a;
    const bolt = this.add.image(this.ship.x, this.ship.y, 'bolt').setDepth(25);
    bolt.vx = Math.cos(a) * 520;
    bolt.vy = Math.sin(a) * 520;
    this.bolts.push(bolt);
    this.game.sfx.play('shoot');
  }

  spawnPickup(amount = 8, emergency = false) {
    const base = this.dockedNode ?? this.playerPos();
    const a = Math.random() * Math.PI * 2;
    const obj = this.add.image(base.x + Math.cos(a) * (TETHER - 8), base.y + Math.sin(a) * (TETHER - 8), 'canister').setDepth(15);
    this.tweens.add({ targets: obj, scale: 1.25, duration: 500, yoyo: true, repeat: -1 });
    this.pickups.push({ obj, amount, emergency });
  }

  damagePlayer(amount = 1) {
    if (this.invuln > 0 || this.state === 'dead' || this.state === 'free' || this.debugGod) return;
    this.hp -= amount;
    this.invuln = 1.1;
    this.game.sfx.play('playerHit');
    this.cameras.main.shake(180, 0.008);
    this.tweens.add({ targets: this.ship, alpha: 0.2, duration: 90, yoyo: true, repeat: 5, onComplete: () => this.ship.setAlpha(1) });
    if (this.hp === 2) this.game.music.play('tension', this.sector.id);
    if (this.hp <= 0) this.die();
  }

  // ---------- update ----------
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.invuln = Math.max(0, this.invuln - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.boss.update(dt);

    if (this.state === 'docked') this.updateDocked(dt, time);
    else if (this.state === 'traveling') this.updateTravel(dt);
    else if (this.state === 'free') this.updateFree(dt);

    if (this.state === 'docked' || this.state === 'traveling') {
      if (this.cycleTimer > 0 && this.sector.nodes.cycleSec) {
        this.cycleTimer -= dt;
        if (this.cycleTimer <= 0) {
          this.cycleTimer = this.sector.nodes.cycleSec;
          this.applyNodeCycle();
        }
      }
    }

    for (const n of this.nodes) {
      if (n.charges <= 0 && n.rechargeAt && time >= n.rechargeAt) {
        n.charges = this.sector.chargesPerNode;
        n.rechargeAt = 0;
      }
    }

    this.updateBolts(dt);
    this.updateHazards(dt);
    this.updatePickups(dt);
    this.drawNodes(time);
    this.hud.update({
      hp: Math.max(0, this.hp), maxHp: MAX_HP, fuel: this.fuel.amount, capacity: this.fuel.capacity,
      bossHp: this.boss.hp, bossMax: this.boss.maxHp, navOnline: this.navOnline, objective: this.objective(),
    });
  }

  steer(dt, speed) {
    const k = this.keys;
    const v = new Phaser.Math.Vector2((k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0), (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0));
    if (v.lengthSq() > 0) v.normalize().scale(speed * dt);
    return v;
  }

  updateDocked(dt) {
    const n = this.dockedNode;
    const move = this.steer(dt, 170);
    this.offset.add(move);
    for (const hz of this.hazards) {
      if (hz.pull) {
        const toCenter = new Phaser.Math.Vector2(CENTER.x - (n.x + this.offset.x), CENTER.y - (n.y + this.offset.y)).normalize();
        this.offset.add(toCenter.scale(hz.pull() * dt));
      }
    }
    const limit = this.hazards.some((h) => h.pull) ? TETHER * 1.8 : TETHER;
    if (this.offset.length() > limit) this.offset.setLength(limit);
    this.ship.setPosition(n.x + this.offset.x, n.y + this.offset.y);
    this.ship.rotation = Phaser.Math.Angle.RotateTo(this.ship.rotation, Math.atan2(CENTER.y - this.ship.y, CENTER.x - this.ship.x), dt * 6);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.tryFire();
    if (this.keys.SPACE.isDown) this.tryFire();

    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.pickupTimer = this.sector.pickupEverySec;
      if (this.pickups.length < 2) this.spawnPickup(8);
    }
  }

  updateTravel(dt) {
    const tr = this.travel;
    tr.s += TRAVEL_SPEED * dt;
    const route = tr.route;
    const p = pointAt(route, tr.s);
    this.ship.setPosition(p.x, p.y);
    this.ship.rotation = p.angle;
    const progress = Math.min(1, tr.s / route.pixelLength);
    this.fuel.amount = tr.fuelStart - route.cost * progress;
    this.thrust.setPosition(p.x - Math.cos(p.angle) * 34, p.y - Math.sin(p.angle) * 34).setRotation(p.angle);
    if (Math.hypot(p.x - CENTER.x, p.y - CENTER.y) < this.boss.radius) this.damagePlayer(1);
    if (progress >= 1) {
      this.fuel.amount = tr.fuelStart - route.cost; // exact F = k·L
      const node = route.to;
      this.flash(`Arrived. Burned ${route.cost.toFixed(3)} u of fuel (F = k·L, k = 1).`, '#7dff9b');
      this.onDock(node);
    }
  }

  updateFree(dt) {
    const move = this.steer(dt, 220);
    if (move.lengthSq() > 0) {
      this.ship.x = Phaser.Math.Clamp(this.ship.x + move.x, 20, 1260);
      this.ship.y = Phaser.Math.Clamp(this.ship.y + move.y, 80, 700);
      this.ship.rotation = Math.atan2(move.y, move.x);
      this.thrust.setVisible(true).setPosition(this.ship.x - Math.cos(this.ship.rotation) * 34, this.ship.y - Math.sin(this.ship.rotation) * 34).setRotation(this.ship.rotation);
    } else this.thrust.setVisible(false);
    if (this.portal && Math.hypot(this.ship.x - this.portal.x, this.ship.y - this.portal.y) < 45) this.enterPortal();
  }

  updateBolts(dt) {
    this.bolts = this.bolts.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (Math.hypot(b.x - CENTER.x, b.y - CENTER.y) < this.boss.radius * 0.8 && !this.boss.dead) {
        b.destroy();
        const killed = this.boss.damage(1);
        if (this.sector.navFailureAtHp && this.navOnline && !this.failureDone && this.boss.hpFraction <= this.sector.navFailureAtHp) {
          this.navigationFailure();
        }
        if (killed) this.bossDefeated();
        return false;
      }
      if (b.x < -20 || b.x > 1300 || b.y < -20 || b.y > 740) {
        b.destroy();
        return false;
      }
      return true;
    });
  }

  updateHazards(dt) {
    this.hazards = this.hazards.filter((h) => {
      const alive = h.update(dt);
      // Each hazard can hurt the ship at most once, so attacks are readable rather than shredding.
      if (this.state !== 'dead' && !h.hasHit && this.invuln <= 0 && h.hits(this.ship.x, this.ship.y, SHIP_R)) {
        this.damagePlayer(1);
        h.hasHit = true;
        if (h.onHit?.()) {
          h.destroy();
          return false;
        }
      }
      if (!alive) h.destroy();
      return alive;
    });
  }

  updatePickups() {
    this.pickups = this.pickups.filter((pk) => {
      if (Math.hypot(pk.obj.x - this.ship.x, pk.obj.y - this.ship.y) < 26) {
        const got = this.fuel.refill(pk.amount);
        this.game.sfx.play('pickup');
        this.flash(`+${got.toFixed(1)} u fuel recovered`, '#ffd23f');
        pk.obj.destroy();
        return false;
      }
      return true;
    });
  }

  drawNodes(time) {
    const g = this.nodeG.clear();
    const pulse = 0.5 + 0.5 * Math.sin(time / 250);
    for (const n of this.nodes) {
      const isHere = n === this.dockedNode;
      const label = this.nodeLabels[n.i];
      if (!n.active) {
        g.lineStyle(2, 0x553355, 0.6).strokeCircle(n.x, n.y, 16);
        g.lineBetween(n.x - 8, n.y - 8, n.x + 8, n.y + 8).lineBetween(n.x - 8, n.y + 8, n.x + 8, n.y - 8);
        label.setColor('#553355');
        continue;
      }
      const color = n.charges > 0 ? COLORS.node : 0x888888;
      label.setColor(n.charges > 0 ? '#7dff9b' : '#888888');
      g.fillStyle(color, isHere ? 0.15 : 0.08 + 0.12 * pulse).fillCircle(n.x, n.y, isHere ? TETHER : 22);
      g.lineStyle(2, color, isHere ? 0.5 : 0.6 + 0.4 * pulse).strokeCircle(n.x, n.y, isHere ? TETHER : 22);
      for (let c = 0; c < this.sector.chargesPerNode; c++) {
        g.fillStyle(c < n.charges ? 0x5ef2ff : 0x333a4d, 1).fillRect(n.x - 20 + c * 10, n.y - 34, 7, 4);
      }
      if (n.charges <= 0 && n.rechargeAt) {
        const k = 1 - (n.rechargeAt - time) / (this.sector.rechargeSec * 1000);
        g.lineStyle(3, 0x5ef2ff, 0.8).beginPath().arc(n.x, n.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k).strokePath();
      }
    }
  }

  // ---------- story beats ----------
  navigationFailure() {
    this.failureDone = true;
    this.state = 'cutscene';
    this.boss.attacking = false;
    this.hazards.forEach((h) => h.destroy());
    this.hazards = [];
    this.boss.view.playCharge?.();
    this.flash('WARNING: massive energy build-up detected!', '#ff4f5e', 1800);
    this.game.music.play('tension', this.sector.id);
    this.time.delayedCall(1700, () => {
      this.boss.view.endCharge?.();
      this.game.sfx.play('emp');
      const ring = this.add.circle(CENTER.x, CENTER.y, 20).setStrokeStyle(10, 0x9fdcff).setDepth(900);
      this.tweens.add({ targets: ring, radius: 900, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
      this.cameras.main.flash(500, 180, 230, 255);
      this.cameras.main.shake(900, 0.015);
      this.time.delayedCall(700, () => this.failureSequence());
    });
  }

  failureSequence() {
    this.navOnline = false;
    this.game.sfx.play('alarm');
    const overlay = this.add.rectangle(0, 0, 1280, 720, 0x200000, 0.75).setOrigin(0).setDepth(1200);
    const lines = [
      '>> EMP IMPACT — HULL INTACT',
      '>> NAV-COMPUTER ............ FAULT 0x5F',
      '>> ARC INTEGRATOR .......... OFFLINE',
      '>> AUTOMATIC ROUTE LENGTHS . UNAVAILABLE',
      '',
      '>> MANUAL MATHEMATICAL CONSOLE ENGAGED',
      '>> Pilot must reconstruct L = ∫ √(1 + [f′(x)]²) dx by hand.',
    ];
    const box = domBox(this, 220, 210, 840, 0, 'od-glitch', '');
    box.setDepth(1201);
    let i = 0;
    const tick = () => {
      box.node.textContent = lines.slice(0, ++i).join('\n');
      this.cameras.main.shake(60, 0.004);
      if (i < lines.length) this.time.delayedCall(420, tick);
      else this.time.delayedCall(1600, () => {
        overlay.destroy();
        box.destroy();
        const skip = this.expedition.explanationSeen;
        this.scene.launch('Explain', { sector: this, allowSkip: skip });
        this.scene.pause();
      });
    };
    tick();
  }

  // Called by ExplainScene when the player continues.
  afterExplanation() {
    this.expedition.explanationSeen = true;
    if (this.expedition.tutorialDone) return this.resumeCombat();
    this.scene.launch('Console', { sector: this, tutorial: true });
  }

  // Called by ConsoleScene after the tutorial calibration.
  afterTutorial() {
    this.expedition.tutorialDone = true;
    this.resumeCombat();
  }

  resumeCombat() {
    this.scene.resume();
    this.state = 'docked';
    this.boss.attacking = true;
    this.boss.timer = 2.5;
    this.game.music.play(this.sector.music, this.sector.id);
    this.flash('Manual navigation active: open a route, then build its integral on the console.', '#ffb347', 4500);
  }

  bossDefeated() {
    this.boss.attacking = false;
    this.state = 'cutscene';
    this.hazards.forEach((h) => h.destroy());
    this.hazards = [];
    this.game.sfx.play('explosion');
    this.cameras.main.shake(600, 0.01);
    this.game.music.play('victory', this.sector.id);
    this.boss.die(() => {
      this.portal = this.add.image(CENTER.x, CENTER.y, 'portal').setDepth(10).setScale(0);
      this.tweens.add({ targets: this.portal, scale: 1, duration: 900, ease: 'Back.out' });
      this.tweens.add({ targets: this.portal, angle: 360, duration: 4000, repeat: -1 });
      this.state = 'free';
      this.flash('The way forward is open. Fly into the portal (WASD).', '#5ef2ff', 5000);
    });
  }

  enterPortal() {
    if (this.state !== 'free') return;
    this.state = 'cutscene';
    this.thrust.setVisible(false);
    this.game.sfx.play('warp');
    this.tweens.add({ targets: this.ship, x: this.portal.x, y: this.portal.y, scale: 0, angle: 720, duration: 900, onComplete: () => {
      this.cameras.main.fadeOut(500, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const remaining = this.fuel.amount;
        if (this.expedition.isFinalSector) {
          this.scene.start('Victory', { fuel: remaining });
          return;
        }
        const fromSector = this.sector;
        const result = this.expedition.advance(remaining);
        this.scene.start('Transition', { fromSector, toSector: this.expedition.sector, remaining, ...result });
      });
    } });
  }

  die() {
    this.state = 'dead';
    this.boss.attacking = false;
    this.thrust.setVisible(false);
    this.game.sfx.play('explosion');
    this.game.music.play('defeat', this.sector.id);
    const boom = this.add.sprite(this.ship.x, this.ship.y, 'fireball-explode').setScale(4).setDepth(50).play('fireball-explode');
    boom.once('animationcomplete', () => boom.destroy());
    this.ship.setVisible(false);
    this.expedition.recordDeath();
    const t = text(this, 640, 330, 'SIGNAL LOST', 56, '#ff4f5e', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(1200);
    const t2 = text(this, 640, 395, `Restarting Sector ${this.sector.number} with ${this.expedition.restartFuel().toFixed(2)} u of fuel...`, 18, '#dfe8ff').setOrigin(0.5).setDepth(1200);
    this.time.delayedCall(2800, () => {
      t.destroy();
      t2.destroy();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    });
  }

  setupDebug() {
    const kb = this.input.keyboard;
    kb.on('keydown-K', () => { this.boss.hp = 1; });
    kb.on('keydown-G', () => { this.debugGod = !this.debugGod; this.flash(`god mode ${this.debugGod}`); });
    kb.on('keydown-F', () => this.fuel.refill(20));
    kb.on('keydown-X', () => this.damagePlayer(5));
  }
}

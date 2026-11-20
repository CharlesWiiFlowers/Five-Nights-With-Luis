// Hazards created by boss attack patterns. Each exposes update(dt) → alive?, hits(x, y, r), destroy().
import Phaser from 'phaser';

const DEPTH = 40;

export class Projectile {
  constructor(scene, x, y, angle, speed, sprite = 'fireball') {
    this.scene = scene;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = sprite === 'fireball' ? 14 : 11;
    this.spriteKey = sprite;
    this.obj = scene.add.sprite(x, y, sprite).setDepth(DEPTH).setRotation(angle);
    if (sprite === 'fireball') this.obj.setScale(1.3).play('fireball');
    else this.obj.setScale(1.1);
  }

  update(dt) {
    this.obj.x += this.vx * dt;
    this.obj.y += this.vy * dt;
    if (this.spriteKey !== 'fireball') this.obj.rotation += dt * 6;
    const { x, y } = this.obj;
    return x > -60 && x < 1340 && y > -60 && y < 780;
  }

  hits(x, y, r) {
    return Math.hypot(this.obj.x - x, this.obj.y - y) < this.radius + r;
  }

  onHit() {
    const boom = this.scene.add.sprite(this.obj.x, this.obj.y, 'fireball-explode').setDepth(DEPTH + 1).setScale(1.6);
    if (this.spriteKey !== 'fireball') boom.setTint(this.spriteKey === 'shard' ? 0x99e6ff : 0xc49bff);
    boom.play('fireball-explode');
    boom.once('animationcomplete', () => boom.destroy());
    return true; // consumed
  }

  destroy() {
    this.obj.destroy();
  }
}

// Telegraphed circular zone: warning ring → burning area.
export class FireZone {
  constructor(scene, x, y, { radius = 70, telegraph = 1.5, burn = 2, tint = 0xff6a1a }) {
    this.scene = scene;
    Object.assign(this, { x, y, radius, telegraph, burn, tint, t: 0 });
    this.g = scene.add.graphics().setDepth(DEPTH - 5);
    this.flames = scene.add.particles(x, y, 'particle', {
      speed: { min: 10, max: 50 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 700,
      tint: [tint, 0xffd23f, 0xffffff],
      frequency: 30,
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, radius * 0.9) },
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(DEPTH - 4);
    scene.game.sfx.play('telegraph');
  }

  get burning() {
    return this.t >= this.telegraph && this.t < this.telegraph + this.burn;
  }

  update(dt) {
    this.t += dt;
    const g = this.g.clear();
    if (this.t < this.telegraph) {
      const k = this.t / this.telegraph;
      g.lineStyle(3, this.tint, 0.9).strokeCircle(this.x, this.y, this.radius);
      g.fillStyle(this.tint, 0.12 + 0.18 * Math.abs(Math.sin(this.t * 10))).fillCircle(this.x, this.y, this.radius * k);
    } else if (this.burning) {
      if (!this.flames.emitting) this.flames.start();
      g.fillStyle(this.tint, 0.45 + 0.1 * Math.sin(this.t * 25)).fillCircle(this.x, this.y, this.radius);
      g.lineStyle(2, 0xffd23f, 0.8).strokeCircle(this.x, this.y, this.radius);
    } else {
      this.flames.stop();
      return this.t < this.telegraph + this.burn + 0.7;
    }
    return true;
  }

  hits(x, y, r) {
    return this.burning && Math.hypot(this.x - x, this.y - y) < this.radius + r * 0.5;
  }

  dangerAt(x, y, r) {
    return this.t < this.telegraph + this.burn && Math.hypot(this.x - x, this.y - y) < this.radius + r;
  }

  destroy() {
    this.g.destroy();
    this.flames.destroy();
  }
}

// Beam rotating from the boss over an arc after a telegraph.
export class SweepBeam {
  constructor(scene, cx, cy, startAngle, { telegraph = 1.2, duration = 2.4, arc = 2, width = 18, length = 760 }) {
    this.scene = scene;
    const dir = Math.random() < 0.5 ? 1 : -1;
    Object.assign(this, { cx, cy, startAngle, telegraph, duration, arc: arc * dir, width, length, t: 0 });
    this.g = scene.add.graphics().setDepth(DEPTH - 3);
    scene.game.sfx.play('telegraph');
  }

  get angle() {
    const k = Phaser.Math.Clamp((this.t - this.telegraph) / this.duration, 0, 1);
    return this.startAngle + this.arc * k;
  }

  get active() {
    return this.t >= this.telegraph && this.t < this.telegraph + this.duration;
  }

  update(dt) {
    this.t += dt;
    const g = this.g.clear();
    const a = this.angle;
    const ex = this.cx + Math.cos(a) * this.length;
    const ey = this.cy + Math.sin(a) * this.length;
    if (this.t < this.telegraph) {
      g.fillStyle(0x66ccff, 0.08).slice(this.cx, this.cy, this.length, this.startAngle, this.startAngle + this.arc, this.arc < 0).fillPath();
      g.lineStyle(2, 0x66ccff, 0.5 + 0.5 * Math.abs(Math.sin(this.t * 12))).lineBetween(this.cx, this.cy, ex, ey);
    } else if (this.active) {
      g.lineStyle(this.width, 0x66ccff, 0.55).lineBetween(this.cx, this.cy, ex, ey);
      g.lineStyle(this.width * 0.35, 0xe8fbff, 1).lineBetween(this.cx, this.cy, ex, ey);
    } else return false;
    return true;
  }

  hits(x, y, r) {
    if (!this.active) return false;
    const a = this.angle;
    const dx = x - this.cx;
    const dy = y - this.cy;
    const along = dx * Math.cos(a) + dy * Math.sin(a);
    const perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
    return along > 0 && along < this.length && perp < this.width / 2 + r * 0.6;
  }

  destroy() {
    this.g.destroy();
  }
}

// Zone that drifts across the arena along a telegraphed line.
export class MovingZone {
  constructor(scene, from, to, { radius = 60, speed = 80, telegraph = 1, life = 6 }) {
    this.scene = scene;
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    Object.assign(this, { x: from.x, y: from.y, from, ang, radius, speed, telegraph, life, t: 0 });
    this.g = scene.add.graphics().setDepth(DEPTH - 5);
  }

  update(dt) {
    this.t += dt;
    if (this.t > this.telegraph) {
      this.x += Math.cos(this.ang) * this.speed * dt;
      this.y += Math.sin(this.ang) * this.speed * dt;
    }
    const g = this.g.clear();
    if (this.t < this.telegraph) {
      g.lineStyle(2, 0x66ccff, 0.4).lineBetween(this.x, this.y, this.x + Math.cos(this.ang) * 600, this.y + Math.sin(this.ang) * 600);
      g.lineStyle(3, 0x66ccff, 0.9).strokeCircle(this.x, this.y, this.radius);
    } else {
      g.fillStyle(0x3d86c6, 0.4).fillCircle(this.x, this.y, this.radius);
      g.lineStyle(3, 0xbfeaff, 0.9).strokeCircle(this.x, this.y, this.radius * (0.85 + 0.15 * Math.sin(this.t * 8)));
    }
    return this.t < this.telegraph + this.life;
  }

  hits(x, y, r) {
    return this.t > this.telegraph && Math.hypot(this.x - x, this.y - y) < this.radius + r * 0.5;
  }

  dangerAt(x, y, r) {
    return Math.hypot(this.x - x, this.y - y) < this.radius + r;
  }

  destroy() {
    this.g.destroy();
  }
}

// Expanding ring from the boss with a safe gap.
export class RingWave {
  constructor(scene, cx, cy, gapAngle, { speed = 120, gapWidth = 0.9, thickness = 16 }) {
    Object.assign(this, { scene, cx, cy, gapAngle, speed, gapWidth, thickness, r: 40 });
    this.g = scene.add.graphics().setDepth(DEPTH - 3);
  }

  update(dt) {
    this.r += this.speed * dt;
    const g = this.g.clear();
    const half = this.gapWidth / 2;
    g.lineStyle(this.thickness, 0xb066ff, 0.75);
    g.beginPath();
    g.arc(this.cx, this.cy, this.r, this.gapAngle + half, this.gapAngle - half + Math.PI * 2);
    g.strokePath();
    return this.r < 900;
  }

  hits(x, y, r) {
    const d = Math.hypot(x - this.cx, y - this.cy);
    if (Math.abs(d - this.r) > this.thickness / 2 + r * 0.5) return false;
    const a = Math.atan2(y - this.cy, x - this.cx);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(a - this.gapAngle));
    return diff > this.gapWidth / 2;
  }

  destroy() {
    this.g.destroy();
  }
}

// Gravity pulse: pulls the docked ship toward the singularity while an event horizon grows.
export class GravityPull {
  constructor(scene, cx, cy, { duration = 3, strength = 70, maxRadius = 200 }) {
    Object.assign(this, { scene, cx, cy, duration, strength, maxRadius, t: 0 });
    this.g = scene.add.graphics().setDepth(DEPTH - 6);
  }

  get radius() {
    const k = this.t / this.duration;
    return this.maxRadius * Math.sin(Math.PI * Phaser.Math.Clamp(k, 0, 1));
  }

  update(dt) {
    this.t += dt;
    const g = this.g.clear();
    g.fillStyle(0x12001f, 0.55).fillCircle(this.cx, this.cy, this.radius);
    g.lineStyle(3, 0xb066ff, 0.9).strokeCircle(this.cx, this.cy, this.radius);
    for (let i = 0; i < 6; i++) {
      const a = this.t * 2 + (i * Math.PI) / 3;
      g.lineStyle(1, 0xd7b3ff, 0.35).beginPath();
      g.arc(this.cx, this.cy, this.radius + 40 + 20 * Math.sin(this.t * 3 + i), a, a + 0.7);
      g.strokePath();
    }
    return this.t < this.duration;
  }

  pull() {
    return this.strength;
  }

  hits(x, y, r) {
    return Math.hypot(x - this.cx, y - this.cy) < this.radius + r * 0.3;
  }

  destroy() {
    this.g.destroy();
  }
}

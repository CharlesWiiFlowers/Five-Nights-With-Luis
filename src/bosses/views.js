// Visual adapters for each boss type. They share one interface so Boss.js stays generic:
// playAttack(), playHit(), playDeath(onDone), face(x), update(dt), destroy().
import Phaser from 'phaser';

class WormView {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y - 30, 'worm-idle').setScale(2.8).setDepth(30).play('worm-idle');
    this.busy = false;
  }
  face(px) { this.sprite.setFlipX(px < this.sprite.x); }
  playAttack() {
    if (this.busy) return;
    this.sprite.play('worm-attack');
    this.sprite.once('animationcomplete', () => !this.dead && this.sprite.play('worm-idle'));
  }
  playHit() {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
  }
  playCharge() {
    this.sprite.play('worm-walk');
    this.sprite.setTint(0x9fdcff);
  }
  endCharge() {
    this.sprite.clearTint();
    this.sprite.play('worm-idle');
  }
  playDeath(onDone) {
    this.dead = true;
    this.sprite.clearTint();
    this.sprite.play('worm-death');
    this.sprite.once('animationcomplete', () => this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 800, onComplete: onDone }));
  }
  update() {}
  destroy() { this.sprite.destroy(); }
}

class FracturerView {
  constructor(scene, x, y) {
    this.scene = scene;
    this.core = scene.add.image(x, y, 'fracturer-core').setDepth(30);
    this.shards = Array.from({ length: 6 }, () => scene.add.image(x, y, 'fracturer-shard').setDepth(29));
    this.t = 0;
    this.x = x;
    this.y = y;
    this.spread = 95;
  }
  face() {}
  playAttack() {
    this.scene.tweens.add({ targets: this, spread: 130, duration: 180, yoyo: true });
    this.scene.tweens.add({ targets: this.core, scale: 1.15, duration: 150, yoyo: true });
  }
  playHit() {
    this.core.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.core.clearTint());
  }
  playDeath(onDone) {
    this.dead = true;
    this.shards.forEach((s, i) => {
      const a = (i * Math.PI) / 3;
      this.scene.tweens.add({ targets: s, x: s.x + Math.cos(a) * 500, y: s.y + Math.sin(a) * 500, angle: 720, alpha: 0, duration: 1400 });
    });
    this.scene.tweens.add({ targets: this.core, scale: 0, angle: 360, alpha: 0, duration: 1400, onComplete: onDone });
  }
  update(dt) {
    if (this.dead) return;
    this.t += dt;
    this.core.rotation = Math.sin(this.t) * 0.2;
    this.shards.forEach((s, i) => {
      const a = this.t * 0.8 + (i * Math.PI) / 3;
      s.setPosition(this.x + Math.cos(a) * this.spread, this.y + Math.sin(a) * this.spread);
      s.rotation = a + Math.PI / 2;
    });
  }
  destroy() {
    this.core.destroy();
    this.shards.forEach((s) => s.destroy());
  }
}

class SingularityView {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.disk = scene.add.graphics().setDepth(28);
    this.hole = scene.add.image(x, y, 'decor-blackhole').setScale(5).setDepth(30);
    this.dust = scene.add.particles(x, y, 'particle', {
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 190), quantity: 48 },
      moveToX: x, moveToY: y, lifespan: 1600, scale: { start: 0.5, end: 0 },
      tint: [0xb066ff, 0x5ef2ff, 0xffffff], alpha: { start: 0.9, end: 0 }, frequency: 40, blendMode: 'ADD',
    }).setDepth(27);
    this.t = 0;
  }
  face() {}
  playAttack() { this.scene.tweens.add({ targets: this.hole, scale: 5.6, duration: 200, yoyo: true }); }
  playHit() {
    this.hole.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.hole.clearTint());
  }
  playDeath(onDone) {
    this.dead = true;
    this.dust.stop();
    this.scene.tweens.add({ targets: this.hole, scale: 9, duration: 500, yoyo: true, onComplete: () => {
      this.scene.tweens.add({ targets: this.hole, scale: 0, angle: 720, duration: 900, onComplete: onDone });
    } });
  }
  update(dt) {
    this.t += dt;
    if (!this.dead) this.hole.rotation += dt * 0.8;
    const g = this.disk.clear();
    if (this.dead) return;
    for (let i = 0; i < 3; i++) {
      g.lineStyle(4 - i, [0xb066ff, 0x5ef2ff, 0xffd23f][i], 0.5);
      g.strokeEllipse(this.x, this.y, 300 + i * 40 + Math.sin(this.t * 2 + i) * 10, 90 + i * 16);
    }
  }
  destroy() {
    this.disk.destroy();
    this.hole.destroy();
    this.dust.destroy();
  }
}

export function createBossView(type, scene, x, y) {
  if (type === 'worm') return new WormView(scene, x, y);
  if (type === 'fracturer') return new FracturerView(scene, x, y);
  return new SingularityView(scene, x, y);
}

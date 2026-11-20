// Generic boss: HP, weighted attack selection and an enraged phase. Visuals come from views.js,
// attacks from patterns.js, numbers from config/sectors.js.
import Phaser from 'phaser';
import { createBossView } from './views.js';
import { PATTERNS } from './patterns.js';

export class Boss {
  constructor(scene, x, y, cfg) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.view = createBossView(cfg.type, scene, x, y);
    this.timer = 2.5;
    this.attacking = true;
    this.dead = false;
  }

  get radius() {
    return this.cfg.contactRadius;
  }

  get hpFraction() {
    return this.hp / this.maxHp;
  }

  update(dt) {
    this.view.update(dt);
    if (this.dead || !this.attacking) return;
    this.view.face(this.scene.playerPos().x);
    this.timer -= dt;
    if (this.timer <= 0) {
      this.attack();
      const [lo, hi] = this.cfg.attackGap;
      const rage = this.hpFraction < 0.5 ? 0.75 : 1;
      this.timer = Phaser.Math.FloatBetween(lo, hi) * rage;
    }
  }

  attack() {
    const total = this.cfg.patterns.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    const pattern = this.cfg.patterns.find((p) => (r -= p.weight) < 0) ?? this.cfg.patterns[0];
    this.view.playAttack();
    PATTERNS[pattern.type](this.scene, this, pattern);
  }

  damage(amount = 1) {
    if (this.dead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.view.playHit();
    this.scene.game.sfx.play('bossHit');
    if (this.hp === 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  die(onDone) {
    this.view.playDeath(onDone);
  }
}

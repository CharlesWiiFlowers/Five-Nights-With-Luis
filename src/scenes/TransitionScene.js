import Phaser from 'phaser';
import { text } from '../ui/ui.js';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super('Transition');
  }

  init(data) {
    this.data_ = data;
  }

  create() {
    const d = this.data_;
    this.leaving = false;
    this.cameras.main.fadeIn(500, 255, 255, 255);
    this.game.music.play('exploration', d.toSector.id);
    this.streaks = Array.from({ length: 160 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      v: 400 + Math.random() * 1400,
      l: 20 + Math.random() * 120,
      c: Phaser.Utils.Array.GetRandom([0xffffff, 0x9fdcff, 0xb066ff]),
    }));
    this.g = this.add.graphics();
    this.speed = 0.2;
    this.tweens.add({ targets: this, speed: 1, duration: 1500, ease: 'Quad.in' });
    const thrust = this.add.sprite(560, 362, 'thrust-1').setScale(0.9).play('thrust');
    this.ship = this.add.sprite(640, 360, 'ship-1').setScale(0.7).play('ship-idle');
    this.tweens.add({ targets: [this.ship, thrust], y: '+=6', duration: 120, yoyo: true, repeat: -1 });

    const lines = [
      `PORTAL TRAVERSED — LEAVING SECTOR ${d.fromSector.number}`,
      `Fuel remaining ............ ${d.remaining.toFixed(2)} u`,
      `Boss salvage refill ....... +${d.fromSector.defeatRefill.toFixed(2)} u`,
      d.emergencyTopUp ? `Emergency reserves ........ topped up to ${d.fuel.toFixed(2)} u` : `Fuel on arrival ........... ${d.fuel.toFixed(2)} u`,
      '',
      `DESTINATION: SECTOR ${d.toSector.number} — ${d.toSector.name}`,
    ];
    const t = text(this, 640, 470, '', 18, '#dfe8ff', { align: 'center', lineSpacing: 6 }).setOrigin(0.5, 0);
    let i = 0;
    this.time.addEvent({ delay: 550, repeat: lines.length - 1, callback: () => t.setText(lines.slice(0, ++i).join('\n')) });
    const next = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Sector'));
    };
    this.time.delayedCall(5200, next);
    this.input.once('pointerdown', () => this.time.delayedCall(300, next));
  }

  update(time, delta) {
    const dt = delta / 1000;
    const g = this.g.clear();
    for (const s of this.streaks) {
      s.x -= s.v * dt * this.speed;
      if (s.x + s.l < 0) {
        s.x = 1280 + Math.random() * 200;
        s.y = Math.random() * 720;
      }
      g.lineStyle(2, s.c, 0.8).lineBetween(s.x, s.y, s.x + s.l * this.speed * 2, s.y);
    }
  }
}

import Phaser from 'phaser';
import { text } from '../ui/ui.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.fuel = data.fuel ?? 0;
  }

  create() {
    this.cameras.main.fadeIn(800, 255, 255, 255);
    this.add.image(0, 0, 'stars').setOrigin(0);
    this.add.image(640, 300, 'decor-terran').setScale(5);
    this.game.music.play('victory');
    text(this, 640, 110, 'EXPEDITION COMPLETE', 52, '#7dff9b', { fontStyle: 'bold' }).setOrigin(0.5);
    const e = this.game.expedition;
    const lines = [
      'The singularity collapsed. You navigated three sectors',
      'by measuring every curved route yourself.',
      '',
      `Fuel left in the tank: ${this.fuel.toFixed(2)} u     Ship losses: ${e.deaths}`,
      '',
      'L = ∫ √(1 + [f′(x)]²) dx  —  the length of the way home.',
    ];
    text(this, 640, 470, lines.join('\n'), 18, '#dfe8ff', { align: 'center', lineSpacing: 6 }).setOrigin(0.5, 0);
    const p = text(this, 640, 680, 'Click to return to the title screen', 16, '#ffb347').setOrigin(0.5);
    this.tweens.add({ targets: p, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.time.delayedCall(1500, () => this.input.once('pointerdown', () => this.scene.start('Title')));
  }
}

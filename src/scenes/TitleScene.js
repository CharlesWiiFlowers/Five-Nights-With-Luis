import Phaser from 'phaser';
import { FONT, text } from '../ui/ui.js';
import { Expedition } from '../game/expedition.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.starting = false;
    this.add.image(0, 0, 'stars').setOrigin(0);
    this.add.sprite(1040, 560, 'planet1-1').setScale(7).play('planet1-spin');
    this.add.image(170, 150, 'decor-lava').setScale(2.5);
    this.add.image(300, 620, 'decor-blackhole').setScale(2);

    const ship = this.add.sprite(width / 2 - 360, 330, 'ship-1').setScale(0.6).play('ship-idle');
    const thrust = this.add.sprite(ship.x - 70, 335, 'thrust-1').setScale(0.7).play('thrust');
    this.tweens.add({ targets: [ship, thrust], y: '+=10', duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    text(this, width / 2, 110, 'ORBITAL DESCENT', 64, '#5ef2ff', { fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 0, '#5ef2ff', 18);
    text(this, width / 2, 170, 'an arc-length survival expedition', 18, '#8fa0c4').setOrigin(0.5);

    const lines = [
      'Your ship cannot fly straight. Every route is a curve,',
      'and the length of that curve is the fuel you burn.',
      '',
      'Reach firing positions, hit the boss, survive three sectors.',
    ];
    text(this, width / 2 + 60, 290, lines.join('\n'), 17, '#dfe8ff', { align: 'center', lineSpacing: 6 }).setOrigin(0.5, 0);

    const controls = [
      'CONTROLS',
      'Mouse click a glowing node ..... plan a route',
      'SPACE / click the boss ......... fire (only on a firing position)',
      'WASD / Arrows .................. dodge around your position',
      'ESC ............................ pause, volume, controls',
      'M .............................. mute music',
    ];
    text(this, width / 2 - 300, 430, controls.join('\n'), 15, '#b9c6e6', { lineSpacing: 5 });

    const prompt = text(this, width / 2, 640, 'CLICK OR PRESS ENTER TO LAUNCH', 22, '#ffb347').setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    if (!this.game.music.tracks.length) {
      text(this, width / 2, 690, 'No music found: add assets/music/template.mp3 (see README).', 12, '#6b7a99', { fontFamily: FONT }).setOrigin(0.5);
    }

    const start = () => {
      if (this.starting) return;
      this.starting = true;
      this.game.sfx.play('success');
      this.game.expedition = new Expedition();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Sector'));
    };
    this.input.once('pointerdown', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.game.music.play('ambient');
  }
}

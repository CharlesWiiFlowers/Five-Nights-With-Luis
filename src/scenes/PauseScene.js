import Phaser from 'phaser';
import { button, text } from '../ui/ui.js';
import { settings } from '../game/settings.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.sector = data.sector;
  }

  create() {
    this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.75).setOrigin(0);
    text(this, 640, 110, 'PAUSED', 48, '#5ef2ff', { fontStyle: 'bold' }).setOrigin(0.5);
    const controls = [
      'Click a glowing firing position (P1..P8) .. open the route planner',
      'SPACE or click the boss ................... fire (only while docked at a charged position)',
      'WASD / Arrow keys ......................... dodge around your position / fly to the portal',
      'Console: drag or click levers, keys 1-5 ... operate levers; R resets; ESC aborts',
      'M ......................................... mute music      ESC ... pause / resume',
      '',
      'Route fuel cost = arc length L of the curve (k = 1). Positions recharge over time.',
    ];
    text(this, 640, 180, controls.join('\n'), 15, '#dfe8ff', { lineSpacing: 6 }).setOrigin(0.5, 0);
    this.vol = text(this, 640, 420, '', 16, '#ffb347').setOrigin(0.5);
    button(this, 470, 460, 'MUSIC −', () => this.adjust('music', -0.1), { width: 120, height: 36, size: 14 });
    button(this, 600, 460, 'MUSIC +', () => this.adjust('music', 0.1), { width: 120, height: 36, size: 14 });
    button(this, 730, 460, 'SFX −', () => this.adjust('sfx', -0.1), { width: 100, height: 36, size: 14 });
    button(this, 840, 460, 'SFX +', () => this.adjust('sfx', 0.1), { width: 100, height: 36, size: 14 });
    button(this, 640, 530, 'RESUME (ESC)', () => this.resume(), { width: 280 });
    button(this, 640, 585, 'RESTART SECTOR', () => this.restart(), { width: 280 });
    button(this, 640, 640, 'QUIT TO TITLE', () => this.quit(), { width: 280 });
    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.showVolume();
  }

  adjust(kind, d) {
    if (kind === 'music') this.game.music.setVolume(Math.round((settings.musicVolume + d) * 10) / 10);
    else {
      this.game.sfx.setVolume(Math.round((settings.sfxVolume + d) * 10) / 10);
      this.game.sfx.play('pickup');
    }
    this.showVolume();
  }

  showVolume() {
    this.vol.setText(`Music ${Math.round(settings.musicVolume * 100)}%    Sound effects ${Math.round(settings.sfxVolume * 100)}%`);
  }

  resume() {
    this.scene.stop();
    this.scene.resume('Sector');
  }

  restart() {
    this.scene.stop();
    this.scene.stop('Planner');
    this.scene.stop('Console');
    this.game.expedition.recordDeath();
    this.scene.get('Sector').scene.restart();
  }

  quit() {
    this.scene.stop();
    this.scene.stop('Sector');
    this.scene.start('Title');
  }
}

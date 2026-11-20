import Phaser from 'phaser';
import { ANIMATIONS, IMAGES, SPRITESHEETS, spriteUrl } from '../assets/assetManifest.js';
import { MusicManager, preloadMusic } from '../audio/MusicManager.js';
import { Sfx } from '../audio/Sfx.js';
import { Expedition } from '../game/expedition.js';
import { FONT } from '../ui/ui.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 12, 0x5ef2ff).setOrigin(0, 0.5);
    this.add.text(width / 2, height / 2 - 30, 'LOADING ORBITAL DESCENT', { fontFamily: FONT, fontSize: '16px', color: '#8fa0c4' }).setOrigin(0.5);
    this.load.on('progress', (v) => (bar.width = 400 * v));
    for (const img of IMAGES) this.load.image(img.key, spriteUrl(img.path));
    for (const s of SPRITESHEETS) this.load.spritesheet(s.key, spriteUrl(s.path), { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
    preloadMusic(this.load);
    this.load.on('loaderror', (file) => console.warn('[boot] failed to load', file.key));
  }

  create() {
    for (const key of [...IMAGES.map((i) => i.key), ...SPRITESHEETS.map((s) => s.key)]) {
      if (this.textures.exists(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    for (const a of ANIMATIONS) {
      const frames = a.sheet ? this.anims.generateFrameNumbers(a.sheet) : a.images.map((key) => ({ key }));
      this.anims.create({ key: a.key, frames, frameRate: a.frameRate, repeat: a.repeat });
    }
    this.makeTextures();
    this.game.music = new MusicManager(this.game);
    this.game.sfx = new Sfx(this.game);
    this.game.expedition = new Expedition();
    this.scene.start('Title');
  }

  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Starfield
    const rnd = new Phaser.Math.RandomDataGenerator(['orbital']);
    g.fillStyle(0x000000, 0);
    for (let i = 0; i < 420; i++) {
      const b = rnd.realInRange(0.25, 1);
      g.fillStyle(rnd.pick([0xffffff, 0xbfd8ff, 0xffe6c4]), b);
      g.fillRect(rnd.between(0, 1280), rnd.between(0, 720), rnd.frac() < 0.1 ? 2 : 1, rnd.frac() < 0.1 ? 2 : 1);
    }
    g.generateTexture('stars', 1280, 720);
    g.clear();
    // Player bolt
    g.fillStyle(0x5ef2ff, 0.35).fillCircle(10, 10, 10);
    g.fillStyle(0xd8fdff, 1).fillCircle(10, 10, 4);
    g.generateTexture('bolt', 20, 20);
    g.clear();
    // Crystal shard projectile
    g.fillStyle(0x66ccff, 1).fillTriangle(12, 0, 24, 12, 12, 24).fillTriangle(12, 0, 0, 12, 12, 24);
    g.fillStyle(0xe0f7ff, 1).fillTriangle(12, 4, 18, 12, 12, 20);
    g.generateTexture('shard', 24, 24);
    g.clear();
    // Singularity orb projectile
    g.fillStyle(0x8a3cff, 0.35).fillCircle(14, 14, 14);
    g.fillStyle(0xd7b3ff, 1).fillCircle(14, 14, 6);
    g.generateTexture('orb', 28, 28);
    g.clear();
    // Fuel canister
    g.fillStyle(0x222a33, 1).fillRoundedRect(2, 0, 20, 30, 5);
    g.fillStyle(0xffd23f, 1).fillRoundedRect(5, 4, 14, 22, 3);
    g.fillStyle(0x222a33, 1).fillRect(7, 10, 10, 2).fillRect(7, 16, 10, 2);
    g.generateTexture('canister', 24, 30);
    g.clear();
    // Soft particle
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
    g.generateTexture('particle', 12, 12);
    g.clear();
    // Fracturer crystal core and shard
    const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => new Phaser.Math.Vector2(cx + r * Math.cos((i * Math.PI) / 3 + Math.PI / 6), cy + r * Math.sin((i * Math.PI) / 3 + Math.PI / 6)));
    g.fillStyle(0x1b3f6b, 1).fillPoints(hex(70, 70, 66), true);
    g.fillStyle(0x3d86c6, 1).fillPoints(hex(70, 70, 50), true);
    g.fillStyle(0x9fe4ff, 1).fillPoints(hex(70, 70, 26), true);
    g.lineStyle(3, 0xe0f7ff, 1).strokePoints(hex(70, 70, 66), true);
    g.lineStyle(2, 0x0b1a2e, 1).lineBetween(70, 4, 70, 136).lineBetween(13, 37, 127, 103).lineBetween(13, 103, 127, 37);
    g.generateTexture('fracturer-core', 140, 140);
    g.clear();
    g.fillStyle(0x4fb0ff, 1).fillTriangle(14, 0, 28, 50, 0, 50);
    g.fillStyle(0xbfeaff, 1).fillTriangle(14, 8, 20, 44, 8, 44);
    g.generateTexture('fracturer-shard', 28, 50);
    g.clear();
    // Portal
    for (let r = 60; r > 0; r -= 4) {
      g.fillStyle(Phaser.Display.Color.GetColor(40 + (60 - r) * 3, 120 + (60 - r) * 2, 255), (60 - r) / 60);
      g.fillCircle(64, 64, r);
    }
    g.generateTexture('portal', 128, 128);
    g.destroy();
  }
}

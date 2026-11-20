import { FONT, text } from './ui.js';

export class Hud {
  constructor(scene, sector, bossName) {
    this.scene = scene;
    const d = 1000;
    this.bg = scene.add.rectangle(0, 0, 1280, 58, 0x060a16, 0.85).setOrigin(0).setDepth(d);
    scene.add.rectangle(0, 58, 1280, 2, 0x2c3d63).setOrigin(0).setDepth(d);
    this.sector = text(scene, 14, 8, `SECTOR ${sector.number} — ${sector.name}`, 15, '#5ef2ff').setDepth(d);
    this.objective = text(scene, 14, 32, '', 12, '#ffb347', { fixedWidth: 575 }).setDepth(d);
    text(scene, 600, 8, 'HULL', 12, '#8fa0c4').setDepth(d);
    this.hp = scene.add.graphics().setDepth(d);
    text(scene, 600, 32, 'FUEL', 12, '#8fa0c4').setDepth(d);
    this.fuelBar = scene.add.graphics().setDepth(d);
    this.fuelText = text(scene, 835, 30, '', 13, '#ffffff').setDepth(d);
    this.nav = text(scene, 930, 8, '', 13, '#7dff9b').setDepth(d);
    this.boss = text(scene, 930, 32, bossName, 12, '#ff8a8a').setDepth(d);
    this.bossBar = scene.add.graphics().setDepth(d);
    this.font = FONT;
  }

  update({ hp, maxHp, fuel, capacity, bossHp, bossMax, navOnline, objective, previewCost }) {
    const g = this.hp.clear();
    for (let i = 0; i < maxHp; i++) {
      g.fillStyle(i < hp ? 0x7dff9b : 0x26324f, 1).fillRect(645 + i * 26, 9, 22, 12);
    }
    const f = this.fuelBar.clear();
    f.fillStyle(0x1a2238, 1).fillRect(645, 33, 180, 12);
    f.fillStyle(fuel < 12 ? 0xff4f5e : 0xffd23f, 1).fillRect(645, 33, (180 * fuel) / capacity, 12);
    if (previewCost) {
      const after = Math.max(0, fuel - previewCost);
      f.fillStyle(0xff4f5e, 0.6).fillRect(645 + (180 * after) / capacity, 33, (180 * (fuel - after)) / capacity, 12);
    }
    this.fuelText.setText(`${fuel.toFixed(2)} u`);
    this.nav.setText(navOnline ? 'NAV-COMPUTER: ONLINE' : 'NAV-COMPUTER: OFFLINE — MANUAL CONSOLE').setColor(navOnline ? '#7dff9b' : '#ff4f5e');
    const b = this.bossBar.clear();
    b.fillStyle(0x2a1010, 1).fillRect(1060, 33, 205, 12);
    b.fillStyle(0xff4f5e, 1).fillRect(1060, 33, (205 * bossHp) / bossMax, 12);
    this.objective.setText(objective);
  }
}

import katex from 'katex';

export const FONT = "'Consolas', 'Courier New', monospace";
export const COLORS = {
  cyan: 0x5ef2ff,
  amber: 0xffb347,
  red: 0xff4f5e,
  green: 0x7dff9b,
  white: 0xffffff,
  route: [0x5ef2ff, 0xffb347],
  danger: 0xff5533,
  node: 0x7dff9b,
};

export function tex(latex, displayMode = false) {
  return katex.renderToString(latex, { throwOnError: false, displayMode });
}

// A DOM element positioned in game coordinates (top-left origin). Returns the Phaser DOMElement.
export function domBox(scene, x, y, width, height, className, html = '') {
  const el = document.createElement('div');
  el.className = className;
  el.style.width = `${width}px`;
  if (height) el.style.height = `${height}px`;
  el.innerHTML = html;
  const dom = scene.add.dom(x, y, el).setOrigin(0, 0);
  return dom;
}

export function text(scene, x, y, str, size = 16, color = '#dfe8ff', extra = {}) {
  return scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra });
}

// Canvas button used where DOM is unnecessary.
export function button(scene, x, y, label, onClick, { width = 220, height = 44, color = 0x26324f, size = 16 } = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, width, height, color).setStrokeStyle(2, 0x4a5d8a);
  const t = text(scene, 0, 0, label, size, '#e6eeff').setOrigin(0.5);
  c.add([bg, t]);
  c.setSize(width, height);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => bg.setStrokeStyle(2, COLORS.cyan));
  c.on('pointerout', () => bg.setStrokeStyle(2, 0x4a5d8a));
  c.on('pointerdown', (p, lx, ly, ev) => {
    ev?.stopPropagation?.();
    scene.game.sfx?.play('click');
    onClick();
  });
  c.label = t;
  c.bg = bg;
  return c;
}

export function services(scene) {
  return { music: scene.game.music, sfx: scene.game.sfx, expedition: scene.game.expedition };
}

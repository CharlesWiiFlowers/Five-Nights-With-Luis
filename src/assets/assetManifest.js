// Central list of every image used by the game. Original files stay untouched in /sprites;
// Vite resolves them to URLs at build time. To add a sprite, drop it under /sprites and add
// an entry below (see README "Adding sprites").

const URLS = import.meta.glob('../../sprites/**/*.png', { eager: true, query: '?url', import: 'default' });

export function spriteUrl(relativePath) {
  const url = URLS[`../../sprites/${relativePath}`];
  if (!url) console.warn(`[assets] missing sprite: sprites/${relativePath}`);
  return url;
}

const WORM = 'Fire Worm Boss One/Sprites';

// type: 'image' | 'spritesheet'. Frame sizes were measured from the files (height = frame size
// for horizontal strips): Worm strips are 90×90 per frame, fire ball strips 46×46.
export const IMAGES = [
  { key: 'ship', path: 'Player/vehicle-2.png' },
  { key: 'ship-1', path: 'Player/frames/vehicle-2-1.png' },
  { key: 'ship-2', path: 'Player/frames/vehicle-2-2.png' },
  { key: 'ship-3', path: 'Player/frames/vehicle-2-3.png' },
  { key: 'thrust-1', path: 'Player/thrust/thrust1.png' },
  { key: 'thrust-2', path: 'Player/thrust/thrust2.png' },
  { key: 'thrust-3', path: 'Player/thrust/thrust3.png' },
  { key: 'decor-lava', path: 'Cosas adicionalees del fondo/Lava.png' },
  { key: 'decor-ice', path: 'Cosas adicionalees del fondo/Ice.png' },
  { key: 'decor-baren', path: 'Cosas adicionalees del fondo/Baren.png' },
  { key: 'decor-terran', path: 'Cosas adicionalees del fondo/Terran.png' },
  { key: 'decor-blackhole', path: 'Cosas adicionalees del fondo/Black_hole.png' },
  // "Level One Planet" is a 60-frame rotation sequence stored as individual 48×48 files.
  ...Array.from({ length: 60 }, (_, i) => ({ key: `planet1-${i + 1}`, path: `Level One Planet/${i + 1}.png` })),
];

export const SPRITESHEETS = [
  { key: 'worm-idle', path: `${WORM}/Worm/Idle.png`, frameWidth: 90, frameHeight: 90 }, // 9 frames
  { key: 'worm-walk', path: `${WORM}/Worm/Walk.png`, frameWidth: 90, frameHeight: 90 }, // 9 frames
  { key: 'worm-attack', path: `${WORM}/Worm/Attack.png`, frameWidth: 90, frameHeight: 90 }, // 16 frames
  { key: 'worm-hit', path: `${WORM}/Worm/Get Hit.png`, frameWidth: 90, frameHeight: 90 }, // 3 frames
  { key: 'worm-death', path: `${WORM}/Worm/Death.png`, frameWidth: 90, frameHeight: 90 }, // 8 frames
  { key: 'fireball', path: `${WORM}/Fire Ball/Move.png`, frameWidth: 46, frameHeight: 46 }, // 6 frames
  { key: 'fireball-explode', path: `${WORM}/Fire Ball/Explosion.png`, frameWidth: 46, frameHeight: 46 }, // 7 frames
];

// Animations built in BootScene. `frames` = sheet frame range or a list of image keys.
export const ANIMATIONS = [
  { key: 'worm-idle', sheet: 'worm-idle', frameRate: 9, repeat: -1 },
  { key: 'worm-walk', sheet: 'worm-walk', frameRate: 10, repeat: -1 },
  { key: 'worm-attack', sheet: 'worm-attack', frameRate: 16, repeat: 0 },
  { key: 'worm-hit', sheet: 'worm-hit', frameRate: 10, repeat: 0 },
  { key: 'worm-death', sheet: 'worm-death', frameRate: 8, repeat: 0 },
  { key: 'fireball', sheet: 'fireball', frameRate: 12, repeat: -1 },
  { key: 'fireball-explode', sheet: 'fireball-explode', frameRate: 16, repeat: 0 },
  { key: 'ship-idle', images: ['ship-1', 'ship-2', 'ship-3'], frameRate: 8, repeat: -1 },
  { key: 'thrust', images: ['thrust-1', 'thrust-2', 'thrust-3'], frameRate: 14, repeat: -1 },
  { key: 'planet1-spin', images: Array.from({ length: 60 }, (_, i) => `planet1-${i + 1}`), frameRate: 8, repeat: -1 },
];

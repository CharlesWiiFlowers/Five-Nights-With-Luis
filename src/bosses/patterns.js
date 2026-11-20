// Attack patterns shared by all bosses. Each receives (scene, boss, cfg) and spawns hazards.
import { FireZone, GravityPull, MovingZone, Projectile, RingWave, SweepBeam } from './hazards.js';

export const PATTERNS = {
  fireball(scene, boss, cfg) {
    const target = scene.playerPos();
    const base = Math.atan2(target.y - boss.y, target.x - boss.x);
    const n = cfg.count ?? 1;
    const spread = cfg.spread ?? 0;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
      const a = base + off;
      scene.addHazard(new Projectile(scene, boss.x + Math.cos(a) * 50, boss.y + Math.sin(a) * 50, a, cfg.speed ?? 150, cfg.sprite ?? 'fireball'));
    }
  },

  fireZone(scene, boss, cfg) {
    const p = scene.playerPos();
    scene.addHazard(new FireZone(scene, p.x, p.y, cfg));
  },

  sweepBeam(scene, boss, cfg) {
    const p = scene.playerPos();
    const toPlayer = Math.atan2(p.y - boss.y, p.x - boss.x);
    const dir = Math.random() < 0.5 ? 1 : -1;
    scene.addHazard(new SweepBeam(scene, boss.x, boss.y, toPlayer - (dir * cfg.arc) / 2, cfg));
  },

  movingZone(scene, boss, cfg) {
    const p = scene.playerPos();
    const side = Math.random() * Math.PI * 2;
    const from = { x: p.x + Math.cos(side) * 420, y: p.y + Math.sin(side) * 420 };
    scene.addHazard(new MovingZone(scene, from, p, cfg));
  },

  ringWave(scene, boss, cfg) {
    // The safe gap opens near the player so it can always be reached by dodging within the tether.
    const p = scene.playerPos();
    const gap = Math.atan2(p.y - boss.y, p.x - boss.x) + (Math.random() * 2 - 1) * 0.6;
    scene.addHazard(new RingWave(scene, boss.x, boss.y, gap, cfg));
  },

  gravityPull(scene, boss, cfg) {
    scene.addHazard(new GravityPull(scene, boss.x, boss.y, { ...cfg, maxRadius: scene.sector.nodes.radius - 55 }));
  },
};

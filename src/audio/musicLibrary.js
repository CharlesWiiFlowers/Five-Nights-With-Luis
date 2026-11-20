// Pure track-selection logic for the tag-based music system (unit-tested).
import manifest from '../../assets/music/manifest.json';

export const MOODS = ['ambient', 'exploration', 'combat', 'boss', 'tension', 'victory', 'defeat'];

export function selectTrack(tracks, mood, sectorId) {
  const scored = [];
  for (const t of tracks) {
    if (!t.moods?.includes(mood)) continue;
    const sectors = t.sectors ?? ['*'];
    let score = 0;
    if (sectors.includes(sectorId)) score += 10;
    else if (!sectors.includes('*')) continue;
    if (!t.test) score += 5; // real tracks beat the template test track
    scored.push({ t, score });
  }
  if (!scored.length) return null;
  const best = Math.max(...scored.map((s) => s.score));
  const top = scored.filter((s) => s.score === best).map((s) => s.t);
  return top[Math.floor(Math.random() * top.length)];
}

export function manifestTracks() {
  return manifest.tracks ?? [];
}

import { describe, expect, it } from 'vitest';
import { manifestTracks, MOODS, selectTrack } from '../src/audio/musicLibrary.js';

const tracks = [
  { id: 'template', moods: MOODS, sectors: ['*'], test: true },
  { id: 'generic-boss', moods: ['boss'], sectors: ['*'] },
  { id: 'fracturer', moods: ['boss', 'combat'], sectors: ['s02'] },
];

describe('music selection by tags', () => {
  it('prefers sector-specific tracks, then real tracks, then the template', () => {
    expect(selectTrack(tracks, 'boss', 's02').id).toBe('fracturer');
    expect(selectTrack(tracks, 'boss', 's03').id).toBe('generic-boss');
    expect(selectTrack(tracks, 'victory', 's01').id).toBe('template');
  });

  it('returns null when nothing matches', () => {
    expect(selectTrack([{ id: 'x', moods: ['boss'], sectors: ['s02'] }], 'boss', 's01')).toBeNull();
  });

  it('manifest registers template.mp3 for every mood', () => {
    const t = manifestTracks().find((x) => x.file === 'template.mp3');
    expect(t).toBeTruthy();
    for (const m of MOODS) expect(t.moods).toContain(m);
  });
});

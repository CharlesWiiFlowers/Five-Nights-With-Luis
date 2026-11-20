// Tag-based background music with crossfades. Only one background track plays at a time.
import { manifestTracks, selectTrack } from './musicLibrary.js';
import { settings, saveSettings } from '../game/settings.js';

const FILE_URLS = import.meta.glob('../../assets/music/**/*.{mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function availableTracks() {
  return manifestTracks()
    .map((t) => ({ ...t, url: FILE_URLS[`../../assets/music/${t.file}`] }))
    .filter((t) => {
      if (!t.url) console.warn(`[music] "${t.file}" listed in assets/music/manifest.json but not found; skipped.`);
      return !!t.url;
    });
}

export function preloadMusic(loader) {
  for (const t of availableTracks()) loader.audio(`music:${t.id}`, t.url);
}

export class MusicManager {
  constructor(game) {
    this.game = game;
    this.current = null; // { id, sound, baseVolume }
    this.request = null;
    this.tracks = availableTracks();
  }

  get sound() {
    return this.game.sound;
  }

  play(mood, sectorId = null, fadeMs = 1200) {
    this.request = { mood, sectorId };
    const track = selectTrack(
      this.tracks.filter((t) => this.game.cache.audio.exists(`music:${t.id}`)),
      mood,
      sectorId,
    );
    if (!track) return;
    if (this.current?.id === track.id && this.current.sound.isPlaying) {
      this.current.mood = mood;
      return;
    }
    const old = this.current;
    const sound = this.sound.add(`music:${track.id}`, { loop: track.loop !== false, volume: 0 });
    const baseVolume = track.volume ?? 0.6;
    this.current = { id: track.id, sound, baseVolume, mood };
    sound.play();
    this.fade(sound, baseVolume * settings.musicVolume, fadeMs);
    if (old) this.fade(old.sound, 0, fadeMs, () => old.sound.destroy());
  }

  fade(sound, to, ms, onDone) {
    const from = sound.volume;
    const start = performance.now();
    const step = () => {
      if (!sound || sound.pendingRemove) return;
      const t = Math.min(1, (performance.now() - start) / ms);
      sound.setVolume(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(step);
      else onDone?.();
    };
    step();
  }

  stop(fadeMs = 800) {
    const old = this.current;
    this.current = null;
    if (old) this.fade(old.sound, 0, fadeMs, () => old.sound.destroy());
  }

  setVolume(v) {
    settings.musicVolume = Math.max(0, Math.min(1, v));
    saveSettings();
    if (this.current) this.current.sound.setVolume(this.current.baseVolume * settings.musicVolume);
  }
}

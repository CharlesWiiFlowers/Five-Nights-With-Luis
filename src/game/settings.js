const KEY = 'orbital-descent-settings';

export const settings = { musicVolume: 0.7, sfxVolume: 0.7 };

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch {
  /* ignore corrupt settings */
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

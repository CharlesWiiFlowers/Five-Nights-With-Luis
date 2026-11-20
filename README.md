# ORBITAL DESCENT

A compact 2D educational space action roguelike built with **Phaser 3 + JavaScript (Vite)**.
Your ship cannot fly straight: every route between firing positions is a curve
\(y = f(x)\), and **the arc length of that curve is the fuel you burn**:

```
L = ∫_a^b √(1 + [f'(x)]²) dx        F_consumed = k · L   (k = 1)
```

Defeat three bosses across three sectors. Halfway through the first fight an EMP destroys
the navigation computer and you must rebuild every route integral by hand on a lever console.

> Repository name: `Five-Nights-With-Luis`. Game title: ORBITAL DESCENT.

---

## Run it

Requirements: Node.js 18+ (tested with Node 24) and a desktop browser.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (math, routes, fuel, console logic, music selection)
npm run build      # production build in dist/ (npm run preview to serve it)
```

Click the title screen once: this unlocks browser audio (autoplay policy) and launches the run.

Developer shortcuts (only with `?debug` in the URL, e.g. `http://localhost:5173/?debug`):
`G` god mode, `K` boss to 1 HP, `F` +20 fuel, `X` self-destruct (tests sector restart).

## Controls

| Input | Action |
| --- | --- |
| Mouse click on a glowing firing position (P1…P8) | Open the route planner for that destination |
| `SPACE` or click on the boss | Fire (only while docked at a charged firing position) |
| `WASD` / arrow keys | Dodge around your current position (tethered); after a boss dies, fly freely to the portal |
| Console: drag a lever down or click it, keys `1`–`5` | Operate DERIVE / SQUARE / ADD 1 / ROOT / INTEGRATE |
| Console: `▲▼` + `LOCK`, `◀ ▶` dials | Select f′(x) on the derivative drum, set integration limits |
| Console: `R` / `ESC` | Reset the console / abort |
| `ESC` | Pause (controls, music and SFX volume, restart sector, quit) |
| `M` | Mute / unmute music |

Movement along a confirmed route is automatic: the ship follows the curve on its own.

## How a fight works

1. Docked at a firing position you shoot the boss. Each position has a few charges, then it must recharge.
2. Click another position: the planner shows two curved routes (α gentle and close to the boss, β a longer
   detour away from it), the dashed straight-line distance, and, when known, the curve length and fuel cost.
3. Confirm a route; the ship flies the curve automatically, burning exactly `k·L` fuel. Hazards still hit you.
4. Repeat until the boss dies, then fly into the portal. Remaining fuel carries over with a partial refill.

### Educational progression

| Stage | What happens |
| --- | --- |
| 1. Automatic navigation | Sector 01 starts with the nav computer online: it shows d (straight line), L and fuel for every route. |
| 2. Navigation failure | At 70 % boss HP the worm fires an EMP: alarm, glitch log, NAV-COMPUTER OFFLINE. |
| 3. Understanding the integral | Interactive screen: the curve is split into 1…64 straight pieces, Δs ≈ √(Δx²+Δy²), Δy ≈ f′(x)Δx, Σ → ∫. The player must split it into ≥16 pieces and read all steps to continue. |
| 4. Lever console | Calibration (guided) with f(x) = ⅔x^{3/2}, 0 ≤ x ≤ 3 → L = 14/3. From then on every unknown route must be built on the console before it can be flown. |

The console never just says "wrong": each wrong lever, wrong derivative on the drum and wrong limit
produces a specific explanation. Hint intensity drops per sector (guided → explanations → short feedback).

### Sectors

| Sector | Boss | Console assistance | Twist |
| --- | --- | --- | --- |
| 01 THE CURVATURE | Magma Worm (provided sprite): slow fireballs, telegraphed fire zones | Guided: highlighted next lever, f′(x) and limits automatic | Auto-nav, EMP failure, explanation, calibration; generous fuel |
| 02 THE FRACTURER | Crystal entity: shard bursts, sweeping beams, moving zones | Choose f′(x) on the drum, set limits on dials, full explanations on mistakes | 8 positions, chain rule / negative exponents |
| 03 THE SINGULARITY | Black hole: expanding rings with a gap, gravity pull, large zones, orb fans | Minimal (short feedback only) | Only 4 of 8 positions active, they shift every 14 s; sin x route needs numerical integration |

Death restarts only the current sector (its entry fuel, boss and console progress are reset).
Soft-lock guards: positions recharge over time, fuel canisters spawn near you, and an emergency canister is
ejected if no route is affordable; each sector has a minimum entry fuel.

## Mathematics

* Curves and their derivatives live in `src/math/challenges.js`. Each has hand-checked LaTeX for every
  console step and, when the integral has an elementary closed form, its antiderivative.
* `L` is always computed with Simpson's rule (1024 sub-intervals). If a closed form exists the console shows
  it next to the numerical value; otherwise the result is labelled `(numerical)`.
* Routes are placed rigidly on screen (rotation/reflection, 1 unit = 48 px), so the on-screen path length is
  exactly 48·L px and the fuel burned equals the displayed L. Route upper limits are solved so the curve ends at
  the destination and rounded to 2 decimals; the game uses the rounded limit everywhere.
* Unit tests check every derivative, antiderivative and route length numerically.

## Architecture

```
index.html, vite.config.js
src/
  main.js                 Phaser game config and scene list
  config/sectors.js       All per-sector data: boss, attacks, routes, hints, fuel, positions
  math/arcLength.js       Simpson integration, polyline length, chord solver
  math/challenges.js      Curve library (f, f′, LaTeX steps, antiderivatives, derivative distractors)
  math/route.js           Builds a curved route between two points, sampling and lookup
  game/consoleMachine.js  Pure state machine + feedback for the lever console
  game/expedition.js      Run progression: sector index, fuel carry-over, refills, death restarts
  game/fuel.js            Fuel tank, F = k·L
  bosses/Boss.js          Generic boss (HP, weighted pattern selection, enrage)
  bosses/patterns.js      Attack patterns shared by all bosses
  bosses/hazards.js       Projectiles, fire zones, beams, moving zones, ring waves, gravity pull
  bosses/views.js         Visual adapters: worm (spritesheets), fracturer, singularity
  audio/MusicManager.js   Tag-based music with crossfades;  audio/musicLibrary.js selection logic
  audio/Sfx.js            Procedural WebAudio sound effects (separate volume)
  assets/assetManifest.js Sprite list, frame sizes and animations
  scenes/                 Boot, Title, Sector, Planner, Console, Explain, Transition, Pause, Victory
  ui/                     HUD, KaTeX helpers, CSS
tests/                    Vitest unit tests
sprites/                  Original art (never modified)
assets/music/             Music files + manifest.json
```

All three sectors run on the same `SectorScene`, `Boss`, planner and console; they differ only by the data in
`src/config/sectors.js`.

## Assets

Original files in `sprites/` are used in place and never modified. Detected layouts:

| File(s) | Layout | Used as |
| --- | --- | --- |
| `Player/vehicle-2.png`, `Player/frames/vehicle-2-{1..3}.png` (176×125) | single frames | Player ship + idle animation |
| `Player/thrust/thrust{1..3}.png` (81×58) | single frames | Engine thrust animation |
| `Fire Worm Boss One/Sprites/Worm/*.png` (height 90) | horizontal strips of 90×90: Idle 9, Walk 9, Attack 16, Get Hit 3, Death 8 | Sector 01 boss |
| `Fire Worm Boss One/Sprites/Fire Ball/Move.png`, `Explosion.png` (height 46) | strips of 46×46: 6 and 7 frames | Projectiles and impact explosions (tinted for other bosses) |
| `Level One Planet/1..60.png` (48×48) | 60-frame rotation sequence | Rotating planet background |
| `Cosas adicionalees del fondo/*.png` (48×48) | single frames | Background planets; `Black_hole.png` is the Singularity boss body |

`vehicle-2.ase` (Aseprite source), the GIF previews and `Preview.png` are not loaded. Placeholders drawn in code:
star field, player bolt, crystal shard/orb projectiles, Fracturer body, fuel canister, portal.

### Adding sprites

1. Put the file anywhere under `sprites/` (subfolders and spaces are fine).
2. Register it in `src/assets/assetManifest.js`:
   * single image: `{ key: 'my-key', path: 'Folder/file.png' }` in `IMAGES`;
   * spritesheet: `{ key: 'my-sheet', path: 'Folder/strip.png', frameWidth: 64, frameHeight: 64 }` in `SPRITESHEETS`
     (for a horizontal strip, frame size = image height; frames = width / height);
   * animation: `{ key: 'my-anim', sheet: 'my-sheet', frameRate: 10, repeat: -1 }` or
     `{ key: 'my-anim', images: ['img-1', 'img-2'], frameRate: 8, repeat: -1 }` in `ANIMATIONS`.
3. Use the key in a scene (`this.add.sprite(x, y, 'my-sheet').play('my-anim')`). Pixel art is filtered with
   nearest-neighbour automatically. To give a boss a new look, add a view class in `src/bosses/views.js` and
   set `boss.type` in `src/config/sectors.js`.

## Music

Background music is chosen by **mood tag** and **sector**, never by hard-coded filename. Only one track plays
at a time; changes crossfade (1.2 s). Music volume and SFX volume are independent (pause menu) and saved.

Moods requested by the game: `ambient` (title), `exploration` (sector intro, warp), `combat`/`boss`
(fights: sector 01 asks for `combat`, 02–03 for `boss`), `tension` (EMP sequence, hull at 2), `victory`
(boss defeated, ending), `defeat` (ship destroyed).

### Current state

The manifest registers **`assets/music/template.mp3`** as a test track for every mood. That file was not in the
repository when this was written: drop it at `assets/music/template.mp3` and it is picked up automatically.
Without any track the game runs silently (only SFX) and logs a warning.

### Adding a song

1. Copy the file (`.mp3`, `.ogg`, `.wav` or `.m4a`) into the folder of its main mood, using lowercase
   kebab-case names:
   ```
   assets/music/
     manifest.json
     ambient/      title-nebula.mp3
     exploration/  drift-s01.mp3
     combat/       magma-worm-fight.mp3
     boss/         fracturer-theme.mp3, singularity-theme.mp3
     tension/      emp-alarm.mp3
     victory/      sector-clear.mp3
     defeat/       signal-lost.mp3
   ```
2. Add an entry to `assets/music/manifest.json`:
   ```json
   {
     "id": "fracturer-theme",
     "file": "boss/fracturer-theme.mp3",
     "moods": ["boss", "combat"],
     "sectors": ["s02"],
     "volume": 0.7,
     "loop": true
   }
   ```
   * `moods`: any of `ambient, exploration, combat, boss, tension, victory, defeat` (a track can have several).
   * `sectors`: `["*"]` for any sector, or specific ids `s01`, `s02`, `s03`. A sector-specific track wins over a
     `*` track; a real track always wins over the template (`"test": true`). Ties are picked at random.
   * `loop`: set `false` for short stingers (victory/defeat).
3. Reload the page. No code changes are needed.

Do not add copyrighted music you do not have rights to.

## Implemented features

* Phaser 3 game with title, three sectors, warp transitions and an ending; no level-select screen.
* Curved route planning with straight-line distance vs curve length, fuel preview, danger warnings
  (boss core, active hazards), and automatic flight along the curve.
* Fuel = arc length, persistent between sectors, boss refill, pickups, emergency canisters, minimum entry fuel.
* Automatic navigation → EMP failure sequence → interactive segment-approximation explanation → guided calibration.
* Physical lever console: draggable levers with spring-back, lamps, CRT display that transforms the expression
  step by step, derivative drum, limit dials, reset, specific feedback, decreasing hints.
* Reusable boss system with three configurations and seven hazard types; enrage below 50 % HP.
* Death restarts the current sector only.
* HUD (hull, fuel with route-cost preview, boss HP, sector, objective, nav status), pause menu with controls.
* Tag-based music manager with crossfades; procedural sound effects.
* 60+ unit tests for the math and game logic.

## Known limitations

* No music file is bundled (see *Music*); the game is silent apart from synthesized SFX until one is added.
* Only the Fire Worm has real sprites; the Fracturer and the Singularity body (scaled `Black_hole.png`) and
  some projectiles are simple code-drawn placeholders.
* Fixed 1280×720 layout scaled to the window; desktop only (no touch controls).
* The console's derivative drum offers predefined candidate derivatives for each curve; it does not parse
  free-form input. Upper limits are rounded to 2 decimals.
* Balance (HP, fuel, attack timing) was tuned briefly; it is easy to adjust in `src/config/sectors.js`.
* No save system: closing the tab restarts the expedition.

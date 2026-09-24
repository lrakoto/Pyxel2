# GRAVITY — Fragments · agent guide

Working context for AI agents in this repository (`lrakoto/Pyxel2`). Keep it current: when a
change alters something below, update this file in the same commit.

> **Two repos, two AGENTS.md files.** This directory sits inside `~/Pyxel`, the original
> three.js prototype (EVERYBODY/NOBODY, Detective Cole, `ShooterState`, `core/battle`). Tools
> that walk up the tree also load `~/Pyxel/AGENTS.md`. **None of it applies here.** This is a
> separate git repo with a different stack, protagonist and architecture. Don't modify the
> original repo from here unless asked.

## What this is

A browser-first cyberpunk noir investigation: one complete chapter plus a follow-up case.
Three areas (Sector 07 street, Graves' studio, Memory Den), 14 evidence records, deductions on
a case board, Lyra as a traveling companion, an optional two-wave combat encounter, a
skippable 35.5 s intro, and three local save folders. No backend, accounts or telemetry.

- **Stack:** TypeScript, Canvas 2D, semantic HTML/CSS and Web Audio, built with Vite. The 2.5D
  look comes from four parallax planes over authored image plates. It isn't a 3D scene.
  **No runtime npm dependencies.** Fonts, audio and art are served locally.
- **Names:** the game is **GRAVITY**. The protagonist is **Detective Gravity** (she/her), who
  replaced Cole in September 2026. She has no gravity powers. _Everybody / Nobody_ is
  Marlon's last painting and the series idea, not the title.
- **Canon:** [docs/STORY_BIBLE.md](docs/STORY_BIBLE.md). This copy is canonical. The one in
  `~/Pyxel/docs/` lags behind it (it lacks the GRAVITY title decision), so edit this one.
- **Live preview:** https://lrakoto.github.io/Pyxel2/

## Commands

Node ≥ 22.18.

| Command                           | Does                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                     | Imports art, serves http://127.0.0.1:5174 (strict port)            |
| `npm test`                        | `node:test` over `tests/*.test.ts`, TypeScript run natively        |
| `npm run build`                   | Imports art, strict `tsc --noEmit`, Vite build (game + both labs)  |
| `npm run format` / `format:check` | Prettier over `src`, `tests`, `vite.config.ts`                     |
| `npm run preview`                 | Serves `dist` on :4174                                             |
| `npm run optimize-art`            | PNG masters → lossless WebP, verified pixel-for-pixel              |

Before calling work done, run `npm test`, `npm run format:check`, `npm run build` and
`git diff --check`. The Pages workflow runs the same checks, so any failure blocks a release.

Debug URL parameters: `?character=original` shows Gravity's source art in its original palette.
`?character=cole` restores the legacy procedural Cole.

## Branches and release

- **Development:** `feat/intro-cinematic`.
- **Release:** GitHub Pages deploys only from pushes to **`feat/case-board`**. The `github-pages`
  environment rejects every other branch. Publish by fast-forwarding `feat/case-board` to a
  validated commit. Don't change the workflow's branch filter unless asked.
- **`main`** is still the September 4 rebuild and hasn't been updated since.
- Pushing, publishing and merging are the user's call. Do them only when asked.

## Code map

All paths are in `src/` unless noted.

| Area           | Files                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestration  | `main.ts`: the `Game` class. Input, panels, area travel, cinematics, saves, and a fixed 1/60 s step (at most 6 steps per frame)                                                                                                                                                            |
| Content        | `content.ts` (areas, clues, deductions, hotspots, sign lights) · `narrative.ts` (lines, conditional insights, Lyra topics, board hints) · `notebook.ts`                                                                                                                                    |
| Case logic     | `model.ts` (`SaveData`, `parseSave`, `CaseModel` with derived objectives and graded misses, movement, collision) · `case-board.ts`                                                                                                                                                         |
| Saves          | `checkpoint.ts` · `save-archive.ts` (3 folders, history, migration) · `archive-transfer.ts` (JSON export/import) · `archive-ui.ts` (recaps, previews)                                                                                                                                     |
| Cinematics     | `cinematic.ts`: a pure keyframe timeline. The intro script is `INTRO`                                                                                                                                                                                                                     |
| Rendering      | `renderer.ts` (compositor; reports scene events through its `cue` callback) · `layers.ts` (parallax 0.10 / 0.34 / 1.00 / 1.18) · `lighting.ts`, `rim-mask.ts`, `sheen.ts`, `flare.ts` · `atmosphere.ts`, `spatial.ts`, `water.ts`, `near-weather.ts`, `interior-finish.ts`, `world-polish.ts`, `visual-details.ts`, `story-details.ts`, `traffic.ts`, `pedestrians.ts` |
| Shared timing  | `wind.ts`, `water-events.ts`: deterministic functions of game time, used by both visuals and audio                                                                                                                                                                                        |
| Characters     | Gravity: `character-candidate.ts`, `gravity-palette.ts`, `gravity-acting.ts` · Lyra: `lyra-candidate.ts`, `lyra-acting.ts`, `lyra-projection.ts`, `lyra-art.ts` · Shared: `character-motion.ts` (footfalls), `interaction-staging.ts` (approach, face, gesture), `scarf.ts` (verlet cloth), `sprites.ts` (atlas with fallback), `character-art.ts` (legacy procedural frames, enemies, pedestrians) |
| Audio          | `audio.ts`: `AudioEngine`, one persistent ambience graph plus one-shots                                                                                                                                                                                                                   |
| Combat         | `combat.ts`                                                                                                                                                                                                                                                                               |
| Labs           | `character-lab.html` / `.ts`, `lyra-lab.html` / `.ts` share pose timing and effects with the game. Keep them in step                                                                                                                                                                      |
| Styles         | `style.css` plus per-feature sheets (`notebook.css`, `examination-crt.css`, `archive.css`, `cinematic.css`, …)                                                                                                                                                                            |

Assets:
- Environment PNG masters are in `assets/environments/`, with WebP copies in `public/env/`.
- Character sources and their licenses are in `public/character-lab/`.
- Drip recordings are in `public/audio/` and fonts in `public/fonts/`.
- Optional `.aseprite` sources go in `assets/sprites/`. The compiled output is gitignored.

## Invariants

1. **Saves stay compatible.** `SAVE_KEY` stays `'everybody-nobody:fragments:v1'` with
   `version: 1`. The GRAVITY rename kept it on purpose so progress carries over. Area, clue,
   deduction and hotspot ids are save data, so don't rename them. Any change to the `SaveData`
   shape needs a migration and tests, and `parseSave` must keep accepting existing saves.
2. **Logic stays pure.** `model`, `cinematic`, `narrative`, `save-archive`, `checkpoint`,
   `archive-transfer`, `case-board`, `wind`, `water-events`, `interaction-staging` and
   `character-motion` don't touch the DOM or canvas, so Node can test them. Put new rules in
   modules like these, test them there, and wire them up in `main.ts` (already ~2,000 lines).
3. **Driven by time, not accumulated state.** Ambient motion is sampled from game time, so
   pauses, skips, restores and case switches all land on the same frame. Visual story details
   come from the active save and are never cached across case files.
4. **The renderer doesn't know audio exists.** It emits `cue(kind, strength)`, and `main.ts`
   decides what that sounds like.
5. **Reduced motion.** Every new motion effect (camera moves, gusts, scans, splashes,
   entrances) respects `prefers-reduced-motion` and the in-game toggle. Sound still plays.
6. **No spoilers.** Recaps, notebook notes, hints and failed-connection messages use only what
   the player already holds. A half-right pairing never names the missing partner.
7. **Source art stays untouched.** Character PNGs are adapted at load time through palettes
   and pose derivatives. Tests check alpha, frame geometry, sole baselines and scarf sockets.
   Record provenance and license for anything new in [docs/ART_CREDITS.md](docs/ART_CREDITS.md).
   Everything third-party so far is CC0 or OFL.
8. **Draw order is explicit.** There is no depth buffer. Check the pass order in `renderer.ts`
   before adding a layer.
9. **Combat is separate.** Exploration changes don't touch combat frame selection or its
   290 px/s speed.

## Settled decisions

These were settled through review with the user. Keep them unless the user changes them.

- **Gravity's look:** blonde hair, black outfit with charcoal highlights, white boots, no
  stockings, and a red scarf that hangs near her ankles. Her idle plays three source poses over
  2.4 s and leaves out the deep crouch. The downloaded walk, sprint and jump art is preserved.
- **Sprint speed:** 290 px/s on the street and in combat. The 330 px/s boost applies **only**
  in the studio and the Den.
- **Lyra:** MoikMellah's humanoid model with the approved navy/gunmetal cyber palette, cyan
  visor and circuit accents, and a _small_ cyan aura. Her arc is locked: she has been watching
  Gravity before they meet, and she becomes a traveling companion (see the story bible).
- **Screens:** in-world conversations use the CRT screen. The notebook (J) stays paper, in the
  olive case jacket.
- **Type:** interface text uses the bundled DejaVu Sans Mono.

## Verification and the QA record

- [docs/QA.md](docs/QA.md) gets a dated section for every pass. Keep automated checks separate
  from browser checks, and say plainly what wasn't verified. Don't claim a check you didn't run.
- For browser testing, use an isolated origin or a temporary fixture that doesn't save. Never
  change the user's live progress or settings. Those are the localStorage keys starting with
  `everybody-nobody:fragments:v1`, plus `en:preferences`. Remove temporary fixtures afterwards.
- The last **full** chapter playthrough was on September 4. Everything since has been checked in
  focused passes. Nothing has been tested on a physical iPhone.
- Tests check audio signal properties. The user judges the mix by ear.

## Commits and docs

- Write subject lines in the imperative and in sentence case. Describe the change the way a
  player or artist would see it (e.g. _Give Lyra a cybernetic palette and precise projection
  effects_). Don't use type prefixes. Use the body to explain why and what was verified.
- When behavior changes, update README.md (it has dated sections), docs/QA.md and this file.

## Legacy names

- Player-facing text says **Gravity**, but the code still says `cole` in places:
  - the player's sprite id (`resolve('cole', …)` in `sprites.ts` and `renderer.ts`)
  - the `cole.aseprite` sheet name
  - the `COLE_*` frames in `character-art.ts`
  - `tools/pack-cole-study.mjs` and `tools/blender/`
- The sheet name is part of the art-pipeline contract, so ask before renaming any of these in
  bulk.
- README sections from before September 20 describe the Cole-era prototypes. Treat them as
  history.

## Known limits and next steps

- The Meridian Clinic, the follow-up case's next lead, has no interior yet.
- Map routing assumes a street hub (`nextRouteHotspot` in `model.ts`). A bigger district needs
  graph routing.
- Imported Aseprite playback only loops tags. It has no finite repeats or one-shot callbacks.
- The street's foreground layer has a matte that is keyed out at load time. It needs a real
  alpha layer.
- `main.ts` should be split into input, panels and transitions as content grows.

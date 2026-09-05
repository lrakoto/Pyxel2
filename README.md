# EVERYBODY / NOBODY — Fragments

A new interpretation of Pyxel: a playable cyberpunk noir investigation, built in this directory without changing the original game.

One dead artist. A thousand stolen minds. Someone has to remember.

## Run

Use Node 22.18+; this build was tested with Node 25.8.2.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5174/**. Click **Begin investigation** to enable the procedural soundscape. Headphones help. The game saves automatically in this browser, using its own versioned storage key. It does not share saves with the original.

```sh
npm test               # Case progression, save validation, physics, combat, depth, routing
npm run build         # Import sprites, strict TypeScript check, production bundle
npm run preview       # Serve production build on localhost:4174
npm run format:check  # Source formatting
npm run optimize-art  # Rebuild lossless WebP from PNG masters; verify decoded pixels
```

## Play

| Input | Action |
| --- | --- |
| A / D or ← / → | Walk |
| Click the street | Walk to a point |
| Click a marker | Walk to it and examine / enter |
| E | Examine nearby object, enter, advance conversation |
| I | Highlight evidence |
| [ / ] | Walk to previous / next available marker |
| J | Case board |
| M | District map and walking destinations |
| Esc | Pause; close a panel; dismiss conversation |
| B on the street | Optional combat practice |
| Mouse aim + hold left button | Fire in combat |
| Space / W / ↑ | Jump in combat |
| Shift | Sprint in combat |
| Q | Disengage from combat |

On small screens and touch devices, movement and action buttons appear over the game. The touch fire button aims at the nearest enemy. Portrait and landscape layouts both work. Desktop keyboard and mouse remain the primary play experience. Pause settings include volume and reduced motion; system reduced-motion preferences are respected by default.

## The chapter

Explore Sector 07, examine Graves’ studio, and connect evidence in the case board. Three deductions reveal a new contact and open the Memory Den. Recover archive 001, invite Lyra to accompany Cole, then protect the memory or take her escape route. The chapter has a definite ending and allows continued exploration afterward.

This is a contained vertical slice: three areas, nine evidence records, three deductions, a persistent companion, and a two-wave combat encounter. It is not a full RPG campaign. There is no backend, account system, telemetry, multiplayer, or cloud save.

## Structure

| File | Responsibility |
| --- | --- |
| `src/content.ts` | Areas, clues, deductions, dialogue, and interaction positions |
| `src/model.ts` | Pure case progression, save validation, routing, movement, collision |
| `src/main.ts` | Browser lifecycle, inputs, panels, transitions, and game orchestration |
| `src/renderer.ts` | Canvas compositor, lighting, live reflections, weather, actors |
| `src/layers.ts` | Four parallax rates, cached middle-distance city, reflection math |
| `src/combat.ts` | Finite encounters, enemies, projectiles, damage, recovery |
| `src/audio.ts` | Procedural Web Audio ambience and effects |
| `src/sprites.ts` | Imported atlas playback with procedural fallback |
| `src/character-art.ts` | Adapted original character pixels, rendered to cached canvases |
| `assets/environments/` | Original-resolution PNG artwork masters |
| `public/env/` | Lossless WebP delivery assets |
| `assets/sprites/` | Drop `.aseprite` source files here |
| `tests/game.test.ts` | Pure logic regression tests |

The renderer uses a low-resolution canvas and four horizontal depth planes. It is a 2.5D presentation built from 2D layers, rather than a geometry-based 3D scene. Puddles mirror a capture of the live scene, including characters and combat effects, with strip distortion. Interior rooms use authored environment plates.

The production app has **no runtime npm dependencies**. Vite, TypeScript, the sprite compiler libraries, Sharp, and Prettier are development tools.

## Adding art and areas

The original Aseprite importer is preserved. Place `cole.aseprite`, `enforcer.aseprite`, `drone.aseprite`, `ped_a.aseprite`, `ped_b.aseprite`, or `lyra.aseprite` in `assets/sprites/`. Development watches that directory; builds compile it automatically. Use `idle`, `walk`, and `jump` for Cole; `walk` for enemies and pedestrians; `idle` for Lyra. Playback supports the imported frame durations and forward / reverse / ping-pong directions. Missing sheets fall back to the existing procedural frames. The current renderer loops animation tags; finite repeats and one-shot completion callbacks are not implemented.

New rooms belong in `AREAS` in `src/content.ts`, with a matching environment file and explicit doors. Current map routing assumes a street hub. A bigger district should replace that helper with graph routing. Keep clue and story identifiers stable; changing the save schema requires a version migration.

Read [the project review](docs/PROJECT_REVIEW.md) for the architectural decisions and tradeoffs, [the art notes](docs/ART_CREDITS.md) for provenance, and [the QA record](docs/QA.md) for verified behavior.

> **Current protagonist: Detective Gravity (September 2026).** She replaces the earlier
> Cole concept. Blonde hair, black outfit, authored pixel animation. See the
> [story bible](docs/STORY_BIBLE.md) and [motion study](https://lrakoto.github.io/Pyxel2/character-lab.html).
> Historical development notes below describe earlier Cole prototypes.

# GRAVITY — Fragments

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

## Investigation expansion — September 19

After the first chapter, choose **Continue · The first one**, or open the next case from Lyra’s channel or the case board. Return to the Den, revisit the studio, and speak to Mei at the noodle bar. Five new records support three deductions and a saved choice about preserving Ada Vale’s identity. Meridian Clinic is the next lead; its interior is not part of this build.

Previously examined objects now offer ten conditional observations when related evidence is found. Amber **REVISIT** markers identify unread observations, which become permanent field notes. The camera and lock also form an optional deduction that changes Lyra’s dialogue and opens a direct witness approach. Neither is required to finish the first case or earn Mei’s evidence.

Cole has dedicated exploration frames for breathing, walking, turning, examination, and conversation. Lyra has a larger, animated pixel design. See [the character study](docs/character-study.png). These are authored procedural frames; imported Aseprite sheets remain supported. Combat mechanics and combat frame selection are unchanged by this expansion.

## Visual pass

Mei now works behind the noodle-bar counter. Cole’s exploration coat has additional tailoring and face detail, and nearby lights cast a soft colour wash across Cole and Lyra. Interior easels, cables and equipment move on a foreground plane and can occlude the player. Footsteps on wet ground create short-lived splashes, rings and local street-reflection disturbances.

Six illustrated records appear beside examination dialogue and on the case board: the drawing, register, receipt, dispatch spool, archive audio and memory fragment. Examination adds a restrained camera reframing and local light; the archive reveals the bird inside its projection. Reduced motion disables camera reframing, splash animation and illustration entrance motion.

[Evidence illustrations](docs/evidence-study.png) · [Studio render](docs/visual-studio.png) · [Street render](docs/visual-street.png) · [Den render](docs/visual-den.png). Scene images were rendered directly from the Canvas renderer and exclude the HTML interface.

The illustrated-evidence treatment now covers all fourteen clues across both cases, including first-case examination close-ups. The [evidence study](docs/evidence-study.png) shows the complete set.

## Recovery and accessibility

The previous distinct checkpoint is retained locally as a fallback if the main save becomes unreadable. Interrupted object conversations restart from the relevant interaction on Continue; already collected clues and deductions remain saved. Starting a new investigation deliberately replaces both checkpoint slots. Storage failures remain visible in the checkpoint indicator.

The case board’s **Need a lead?** disclosure suggests a location or a question supported by records you already hold. Dialogue provides complete lines to assistive technology independently of the visual typewriter. Coarse-pointer controls have larger minimum targets. World rendering stops behind modal panels and resumes when they close; resizing or changing reduced motion refreshes the paused image.

### Ambient life

Rain thins beneath awnings and collects at gutter edges; the studio doorway catches warm streaks. Passing headlights wash over the street and Cole, while elevated train windows cast faint light below. Walkers occasionally shelter, Mei wipes her counter, and silhouettes pass behind upstairs glass. Studio pigment dust and receiver pulses contrast with the Den's projection scans and monitor activity. These effects respect reduced motion.

## Online preview — GitHub Pages

Play at **https://lrakoto.github.io/Pyxel2/**.

The `Publish playable preview` workflow deploys pushes to `feat/case-board`, the current development branch. It installs locked dependencies, checks formatting, runs tests, builds, and publishes `dist` through GitHub Pages. Repository Settings → Pages must use **GitHub Actions** as its source. To move releases to another branch later, update the workflow's push filter.

The workflow sets `GITHUB_PAGES=true` to build with `/Pyxel2/` as the base path. Ordinary local builds keep `/`, so a future host can use the same project without the Pages setting. Saves remain local to each browser and origin; localhost progress does not transfer to the online preview.

### Spatial depth and notebook

Doorways and windows have shallow camera-relative recesses, awnings project from the frontage, and a service passage recedes behind the street fence. Near-camera railings and fire escapes, hanging interior lamps, furniture and foreground easels create changing overlaps while walking. Shelter shade, doorway light, short wall shadows and two reflection treatments help ground Cole in the scene. These are layered Canvas effects, not a replacement 3D engine.

The interface now follows Cole's field notebook: cloth cover, paper case tabs, pasted exhibits, ink-blue theory notes, a map insert and paper observation slips. Press **J** to open the notebook; all investigation controls and saves remain compatible.

# Pyxel, reconsidered

## What I found

The original has a strong identity: the soaked street, enormous city silhouette, Cole’s red scarf, procedural audio, and Marlon’s painting make the premise tangible. Its most successful systems reinforce that identity. Parallax gives the street scale; reflections connect the character to the ground; clues turn environmental details into story. I preserved those ideas.

I inspected the original source and story material, built it, and opened its running preview before rebuilding. The reference was `Pyxel`; `Pyxel-2` was excluded. No original source files were changed.

The original is already more than a walking demo: the generic area interface, story-gated interactions, sprite import pipeline, journal, and shooter state provide useful foundations. I would keep those concepts even if continuing on its stack.

The biggest opportunities were about the play loop and ownership of state:

* **Observation needed a payoff.** Collecting enough clues closes the original scene. In this version the player must connect three pairs of evidence and support an interpretation before the next lead opens.
* **Story progress needed to survive a session.** The original journal is held in memory. This version saves validated case state, area, and position, with independent story flags for contact, companionship, and chapter completion.
* **Objectives should be derived from progress.** Order-dependent clue callbacks can overwrite a later objective. Here the current objective is calculated from the complete state, with permutation tests for deduction order.
* **The next story beat needed somewhere to happen.** The Memory Den is a playable interior, archive 001 is recoverable, and Lyra becomes a companion presence across rooms. The chapter now resolves into a meaningful encounter and ending.
* **Interaction needed a consistent language.** Markers, nearby prompts, keyboard shortcuts, focus mode, the map, and the case board use the same visual vocabulary. Clicking a marker walks and examines; map destinations continue through connected rooms.

There were also straightforward maintenance opportunities. The unwired CTB battle system remains in the original beside the active shooter implementation. Several documentation claims no longer match the source: the README still describes turn-based combat and procedural-only art, and character frame specifications have changed. Those are signs to consolidate, not reasons to discard the project.

## Why this stack

For this browser-first, side-scrolling chapter, I chose **TypeScript + Canvas 2D + semantic HTML/CSS + Web Audio**, with Vite as the development/build tool. The world’s interaction rules are two-dimensional. A layered compositor can express its depth without asking every object to participate in a 3D renderer or a full-screen post-processing chain.

The street uses four explicit camera rates:

| Plane | Camera displacement | Contents |
| --- | ---: | --- |
| Distant skyline | 0.10× | Original city plate, atmospheric veil |
| Middle distance | 0.34× | Cached buildings, rail structure, moving train |
| Interactive street | 1.00× | Architecture, Cole, walkers, clues, opponents |
| Foreground | 1.18× | Poles and near-camera street objects |

The reflection pass captures the scene after live actors and combat effects, then mirrors it through clipped, rippling strips. Thus the puddles respond to Cole, enemies, muzzle flashes, and tracers. This is a screen-space approximation: objects outside the viewport cannot appear in the reflection, and it does not calculate physically correct viewing angles.

Cached environment canvases and light textures reduce repeated construction. World coordinates are snapped for drawing, while movement uses a fixed simulation step. Hidden tabs suspend simulation/audio; elapsed time is bounded on return. This follows the general caching and layered-rendering techniques described in [MDN’s Canvas optimization guide](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).

This choice has a real tradeoff: the original Three.js scene can support actual geometry, dynamic lighting, richer camera changes, and more flexible environmental reactions. The new environments are mostly authored image plates. If those 3D capabilities become central, I would retain Three.js and simplify its state ownership and post stack instead of migrating just to shrink the bundle.

For a much larger desktop/console game with scene editing, authored animation, controller support, and native export requirements, I would evaluate Godot before growing a bespoke engine. Its browser export has its own renderer and platform constraints; it is not a free replacement for the present web delivery path. See [Godot’s web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).

## Visual direction

I moved toward petrol shadows, restrained amber interiors, weathered architecture, and vermilion interface accents. The interface borrows from a case file and a magazine issue: condensed typography, fine rules, record numbers, and generous negative space. The title establishes a chapter rather than disappearing on a timer. The game remains the central object, with the evidence board and map appearing only when needed.

The environment artwork was generated specifically for these rooms. The original character silhouettes remain, adapted into cached Canvas frames. That makes the character animation the most obvious remaining art-production opportunity: bespoke Aseprite sheets, authored to match the new environment scale and lighting, would improve cohesion more than adding another post-processing effect.

## Measurements and limits

The original production JavaScript measured **683.60 kB (180.52 kB gzip)**; its CSS measured **13.85 kB (3.59 kB gzip)**. The rebuild’s final measurements are recorded in the QA report. This is a substantial code-payload reduction, not a measured frame-rate claim.

The new art is a separate cost. Five lossless WebP delivery plates total about **8.26 MB**, compared with **10.72 MB** for their PNG masters. Initial world loading uses four of them; the complete street composition is reserved for UI imagery. Fonts are local. The source masters do not ship in the production build. The choice favors crisp visual quality over the smallest possible download; a mobile delivery tier and room-by-room streaming would be sensible next optimizations.

The tests cover state and simulation invariants. Browser playtesting covers the chapter and responsive UI, but this is not a cross-device performance certification. Canvas accessibility also has limits: the controls and text are semantic HTML, but spatial play still relies on the visual scene. A complete nonvisual navigation mode would be additional work.

## What I would do next

1. Commission or draw consistent character sheets and clean production environment layers with genuine alpha. The current extracted street layer uses a keyed neutral matte at load time.
2. Develop the first woman’s identity into the next playable investigation, including conversation choices and evidence whose interpretation changes later dialogue.
3. Add controller support and test real touch devices, Safari, Firefox, lower-end GPUs, and reduced-motion scenarios with frame-time measurements.
4. Split browser orchestration into input, panel, and transition modules as the content grows. Keep the pure model independent of rendering, and formalize save migrations before adding another chapter.
5. Stream room art and add a lower-bandwidth art tier if mobile becomes a primary target.

The result is a new playable interpretation, not a wholesale port. It preserves the setting and its strongest atmospheric ideas while completing one coherent chapter with a different rendering and interaction approach.

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

Open **http://127.0.0.1:5174/**. Click **Begin investigation** to enable the soundscape. Headphones help. The game saves automatically in this browser, with three independent folders in **Case archive**. It does not share saves with the original.

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
| Shift | Sprint |
| Q | Disengage from combat |

On small screens and touch devices, movement and action buttons appear over the game. The touch fire button aims at the nearest enemy. Portrait and landscape layouts both work. Desktop keyboard and mouse remain the primary play experience. Pause settings include volume and reduced motion; system reduced-motion preferences are respected by default.

## The chapter

Explore Sector 07, examine Graves’ studio, and connect evidence in the case board. Three deductions reveal a new contact and open the Memory Den. Recover archive 001, invite Lyra to accompany Gravity, then protect the memory or take her escape route. The chapter has a definite ending and allows continued exploration afterward.

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
| `src/audio.ts` | Web Audio ambience, procedural effects, and recorded water impacts |
| `src/sprites.ts` | Imported atlas playback with procedural fallback |
| `src/character-art.ts` | Adapted original character pixels, rendered to cached canvases |
| `src/gravity-acting.ts` | Gravity's pixel pose derivatives and reaction timing, shared by the game and character lab |
| `src/lyra-orb.ts`, `src/lyra-orb-draw.ts` | Lyra's drone: pixel design, poses, machine hops and placement, shared by the game and Lyra's lab |
| `assets/environments/` | Original-resolution PNG artwork masters |
| `public/env/` | Lossless WebP delivery assets |
| `assets/sprites/` | Drop `.aseprite` source files here |
| `tests/game.test.ts` | Pure logic regression tests |

The renderer uses a low-resolution canvas and four horizontal depth planes. It is a 2.5D presentation built from 2D layers, rather than a geometry-based 3D scene. Puddles mirror a capture of the live scene, including characters and combat effects, with strip distortion. Interior rooms use authored environment plates.

The production app has **no runtime npm dependencies**. Vite, TypeScript, the sprite compiler libraries, Sharp, and Prettier are development tools.

## Adding art and areas

The original Aseprite importer is preserved. Place `cole.aseprite`, `enforcer.aseprite`, `drone.aseprite`, `ped_a.aseprite`, `ped_b.aseprite`, or `lyra.aseprite` in `assets/sprites/`. Development watches that directory; builds compile it automatically. Use `idle`, `walk`, and `jump` for the legacy Cole sheet; `walk` for enemies and pedestrians; `idle` for Lyra. Imported atlas playback supports frame durations and forward / reverse / ping-pong directions, with procedural fallback when sheets are missing. That playback path loops animation tags; finite repeats and one-shot completion callbacks are not implemented. The current Gravity and humanoid Lyra models use separate PNG source loaders and explicit reaction timing, including held end poses for investigation gestures.

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

Each case folder retains a previous checkpoint envelope as a fallback if its latest save becomes unreadable. Interrupted object conversations restart from the relevant interaction on Continue; already collected clues and deductions remain saved. Starting a new investigation uses an empty folder and preserves existing cases. Storage failures remain visible in the checkpoint indicator.

The case board’s **Need a lead?** disclosure suggests a location or a question supported by records you already hold. Dialogue provides complete lines to assistive technology independently of the visual typewriter. Coarse-pointer controls have larger minimum targets. World rendering stops behind modal panels and resumes when they close; resizing or changing reduced motion refreshes the paused image.

### Ambient life

Rain thins beneath awnings and collects at gutter edges; the studio doorway catches warm streaks. Passing headlights wash over the street and Cole, while elevated train windows cast faint light below. Walkers occasionally shelter, Mei wipes her counter, and silhouettes pass behind upstairs glass. Studio pigment dust and receiver pulses contrast with the Den's projection scans and monitor activity. These effects respect reduced motion.

## Online preview — GitHub Pages

Play at **https://lrakoto.github.io/Pyxel2/**.

The `Publish playable preview` workflow deploys pushes to `feat/case-board`, the approved Pages release branch. It installs locked dependencies, checks formatting, runs tests, builds, and publishes `dist` through GitHub Pages. Repository Settings → Pages must use **GitHub Actions** as its source. To move releases to another branch later, update the workflow's push filter.

The workflow sets `GITHUB_PAGES=true` to build with `/Pyxel2/` as the base path. Ordinary local builds keep `/`, so a future host can use the same project without the Pages setting. Saves remain local to each browser and origin. To move localhost progress to the online preview, use **Download case**, then **Import case** into an empty folder there; progress does not transfer automatically.

### Spatial depth and notebook

Doorways and windows have shallow camera-relative recesses, awnings project from the frontage, and a service passage recedes behind the street fence. Near-camera railings and fire escapes, hanging interior lamps, furniture and foreground easels create changing overlaps while walking. Shelter shade, doorway light, short wall shadows and two reflection treatments help ground Cole in the scene. These are layered Canvas effects, not a replacement 3D engine.

The interface now follows Cole's field notebook: cloth cover, paper case tabs, pasted exhibits, ink-blue theory notes, a map insert and paper observation slips. Press **J** to open the notebook; all investigation controls and saves remain compatible.


## September 22 integration checkpoint

The active development branch is `feat/intro-cinematic`. Publish by advancing `feat/case-board` after validation; GitHub Pages environment protection allows that release branch. GRAVITY is the game title; Everybody / Nobody remains Marlon’s painting. The opening is a skippable 35.5-second scripted scene. Completing or skipping it is saved, and existing investigation saves continue without replaying it. Starting a new investigation resets the opening along with case progress.

Gravity uses Ansimuz’s **Warped City** character; Lyra uses MoikMellah’s **MV Platformer Female (32x64)**. Both source packs are CC0, and the original PNGs remain unchanged. Compare the runtime derivatives in `character-lab.html` and `lyra-lab.html`; full provenance is in [the art notes](docs/ART_CREDITS.md). Interface text uses bundled DejaVu Sans Mono. Exploration footsteps follow Gravity’s animation footfalls.

Gravity’s exploration idle now uses three complete source poses at a quiet pace, omitting the deep bouncing crouch. Pixel-authored derivatives add standing inspection, a floor-evidence crouch, terminal reach, listening at her earpiece, and an open-hand speaking gesture, with scarf anchors matched to each pose. Lyra keeps her approved cyber palette, glow, and subtle idle breath. Her new reactions add a small listening inclination, measured speaking gestures with rests, and a raised hand held for archive projection. The game and labs share these pose timings; the downloaded walking, sprinting, and jumping artwork is preserved.

## Player saves — case archive

Open **Case archive** on the title screen or from Pause. Three named folders keep independent investigations, with a location photograph, last-filed date, evidence counts, and a recap of the current lead. **New investigation** opens a free folder instead of replacing the active game. Occupied folders are preserved; there is no delete/overwrite action in this pass.

Existing browser progress migrates to file 01, retaining the original checkpoint keys. Each folder keeps its latest save, a previous-envelope fallback, and up to four earlier meaningful checkpoints. Walking updates the current position without displacing discovery/area checkpoints. **Earlier checkpoints** restores a point while keeping the current progress available to recover. Saves resume on the ground; active encounters keep their pre-encounter checkpoint, and cinematics do not save intermediate staging positions.

To move a case between browsers or devices, open an occupied folder’s recap and choose **Download case**. In an empty folder, choose **Import case**, select the downloaded JSON, review the case preview, then confirm with **File imported case**. Import validates the file and checks that the destination is still empty before writing. It keeps the current investigation open and never overwrites an occupied folder. When all three folders are occupied, downloads remain available; importing requires an empty folder in another browser or profile.

Only the latest saved checkpoint travels with a download; earlier checkpoints and browser preferences stay local. Nothing is uploaded, and there is no cloud sync or account system. If storage is unavailable/full, the game reports session-only progress. A changed file in another tab pauses writes here to protect newer notes; reload that tab to use the current archive.

Implementation: `src/save-archive.ts` owns migration/storage/recovery; `src/archive-transfer.ts` validates versioned JSON transfers; `src/archive-ui.ts` owns recaps, folder rendering, and import previews; `src/archive.css` styles the archive. Tests cover corruption, quota errors, stale tabs, slot isolation, reversible restoration, spoiler-safe recaps, transfer round trips, rejected files, and occupied-folder protection.

## September 25 — Lyra's drone and playtest fixes

**Lyra** is now an AI who lives in the city's machines. She appears as a small floating drone shell with one cyan eye, drawn in code. She keeps a post on the street once Gravity notices her, and at her terminal in the Den. After she joins, the shell travels at Gravity's shoulder in every area and docks at the terminal in the Den. She can leave the shell:
* She opens the Den from inside its lock after their first conversation.
* She steps into machine evidence (the street camera, the neural receiver, its spool, the memory column) while Gravity examines it.
* As a companion she occasionally slips into a nearby sign or screen.

The archive projection becomes a beam from her eye. Her first meeting gains two lines about how she watches. `lyra-lab.html` compares the drone with the retired humanoid model. Reduced motion keeps her still and skips the leaps.

**Fixes from the partial playtest** (see [the QA record](docs/QA.md)):
* Story-choice panels use paper ink and are readable again.
* A dismissed ambush returns after a few seconds on the street.
* A first visit starts the case immediately in folder 01.
* Near-plane easels, cabinets and street poles thin out over Gravity and Lyra.
* Arriving in the Den starts clear of the cabinet.
* One surplus E press no longer reopens what was just closed.
* Observations and Mei's lines carry their own labels.

## September 26 — Follow the shipment

A third case follows Ada's. Continue from her case's closing panel, the notebook or Lyra's channel. Lyra puts a fare on Gravity's transit card, and **Meridian Clinic** appears on the district map. It is outside Sector 07, so there is no street door: choosing it rides the night train, and the clinic's own door rides back.

Intake B holds five records: the intake ledger, the cold-storage cartridges, the donors' consent forms, the seals on the outbound crates and the sale terminal. They support three connections in notebook file 03, one of which reopens Marlon's residue from the Graves case. Lyra steps into the cold storage and the terminal while Gravity examines them. Connecting all three and naming the buyer with Lyra closes the case. There is no combat.

The clinic now has a finished pixel-art plate, with measured evidence positions, layered privacy screens, cold glass and floor-level vapour. The exact generation prompt is in [the art notes](docs/meridian-art-prompt.md). Saves gain two fields, `shipment` and `buyerNamed`, which default to closed, so existing saves load unchanged.


## September 26 · Meridian finish and integrated playthrough

Meridian now shares the studio's dense noir pixel-art treatment: deep tiled recesses, neural recliners, a cold cartridge cabinet, sealed outbound cargo and a rain-lit service entrance. Lights, evidence, glass and the open shutter align with the finished plate. Low cold mist, stitched privacy screens, worn frames and grounded wheels add depth without a room-wide haze.

Lyra's room light, reflected pool and light on Gravity follow her signal when she leaves the drone for a machine. A small cyan eye marks the occupied device. Reduced motion keeps that signal steady; the game and Lyra lab share the rendering.

The notebook now treats matches within each case separately. Carried evidence has a source-file cross-reference, so the studio residue stays checked in the Graves case while remaining usable for Meridian. Opening the notebook resets to its case tabs; reading a record still preserves the board's place.

Verified a fresh investigation through all three cases using the UI, with all 19 records and 10 deductions, the non-combat escape and night train. A real downloaded case was imported into empty folder 02 and resumed with the completed investigation intact. Browser checks include portrait/landscape layouts and reduced motion; physical iPhone behavior and the audio mix still need device review. See [QA](docs/QA.md) for exact checks and limits.


## September 26 · glass depth and companion continuity

The studio windows, the Den's archive glass and Meridian's cold cabinet now have a restrained recessed layer. Their contents shift behind fixed frames as the camera moves; edge shadows keep the aperture attached to the wall. Reduced motion removes that relative shift. Existing plates provide the pixels, with no new asset downloads.

The studio's near easels gained chipped paint and contact shadows. The Den's near racks gained worn labels, vents, small fasteners, base shadows and loose cables. These details preserve the existing fade over Gravity.

Lyra starts ambient machine visits only while Gravity is stationary. Once begun, a visit keeps its machine even if Gravity walks away, finishes its return once, and cannot resume halfway through after a dialogue, area change or clock reset. Story examinations take priority. The page's case label now follows the active investigation instead of always showing the Graves case number.


## September 26 — clearer routes and notebook feedback

Map walking now shows the destination with a Stop control. Once the Graves deductions earn
Lyra’s lead, choosing the locked Memory Den routes to her first. Completed notebook files
keep their own conclusions and margin notes as the investigation advances, and changing tabs
returns to the top. Connection results stay in view until dismissed or another selection is
made, including on narrow phone screens.

Verified with 155 automated tests, TypeScript/Vite build, formatting, and an isolated browser
playthrough of routes and notebook interactions. This checkpoint has not been published.


## September 26 — steadier arrivals and floor contact

Doorways and train journeys now finish revealing the destination before returning control.
Transitions use the game’s visible-frame clock, including reduced-motion cuts, rather than
background timers. Walking routes retain their final destination through every doorway.
Gravity faces into the arriving space with a reset movement pose; click-to-examine stops at
its exact approach point. Her authored boot baseline now meets the street floor as well as
interior floors. Combat and sprint speeds are unchanged.


## September 26 — readable actions and rooms that remember

Nearby evidence captions sit beside Gravity, while distant captions recede until focus mode,
hover or keyboard focus. Paintings use a distinct considered-study pose; investigation and
dialogue gestures retrace their authored frames over a short return to rest. Movement takes
over immediately, and reduced motion skips the return. The same action frames receive the
room's broad light tint, preventing a lighting change when examining something.

Meridian keeps small earned details: a tab on the intake ledger, a copied M.G. label at cold
storage and a retained copy on the outbound terminal. These derive from the active case and
clear when an earlier checkpoint is restored.

Marker layout skips unchanged DOM updates. For local profiling, `?profile=1` shows sampled
frame CPU time and marker writes; add `&marker-cache=0` for the uncached comparison. This
instrumentation is development-only, local, and measures JavaScript submission time rather
than GPU work. It does not collect or transmit telemetry.

### September 28 — CRT reading controls

Conversations now have a Previous key for rereading earlier lines. Reviewed text stays revealed,
and returning forward preserves the reading position. The main key says Reveal line while text
is arriving, then Continue or Close when the line is complete. A steady monitor indicator reflects
that state without adding flashing or motion. Reading history is temporary to the current
conversation; existing save files and story outcomes are unchanged.

Enter and Space now belong to the focused interface control, preventing a button activation from
also advancing dialogue through the game's keyboard handler. The E shortcut remains available.
Phone reading keys have 44 px minimum tap height and stay together within the CRT layout.

### September 28 — REPLACED study and hourly improvement plan

[Research and visual direction](docs/REPLACED_RESEARCH.md) separates developer-sourced
findings from original GRAVITY proposals. The plan keeps the current renderer, pixel
characters and story bible, prioritizing authored framing, motivated lighting, physical
interaction and environmental evidence. [Hourly passes](docs/HOURLY_PASSES.md) tracks the
bounded implementation queue, validation and end-of-day review route. Listed proposals are
not automatically implemented features.

The user renewed the hourly sessions through September 29 at 8 PM America/Los_Angeles.
Checkpoint commits stay local; no new public deployment is authorized by this schedule.


### September 28 — Studio composition

Exploration now gently shares the frame with the studio’s painting and neural receiver.
The camera eases into and out of these views without zoom, facing-direction snaps or idle
drift. Its reach scales down on narrow screens; reduced motion keeps the original framing.
Conversation shots remain authoritative, and arrivals/resuming a save use the destination’s
own composition. Other scenes retain their existing camera while the studio proves the approach.


### September 28 — Composed views across the district

The studio’s exploration framing now extends to Sector 07, the Memory Den and Meridian Clinic.
Views gently favor Mei’s window and the occupied street entrances, the Den’s paper records and
memory column, and the clinic’s intake desk and cold-storage cabinet. Ordinary tracking remains
between these landmarks. Narrow screens reduce the pull; reduced motion disables it.
Clues, route markers, reflections and floor picking continue to use the same camera.

### September 28 — Clearer light in the Memory Den

The archive keeps its bright cyan projection, with a smaller flare and less surrounding haze
so the dark machinery and glass remain visible. Condensation now sits low around its base;
the monitor wall takes a quieter supporting role. Lyra retains her existing light and machine
visits. Matched idle/examination views and phone layouts are recorded in [QA](docs/QA.md).

### September 28 — Studio light and material clarity

Graves' painting keeps its warm work light with a smaller bulb flare and a tighter pool of
bounce light. The neural receiver's glow now sits on its glass tube, with restrained haze
beneath the bench so the cage, cables and supports remain visible. Lyra's ambient visit
target follows the corrected tube position. Desktop and phone comparisons are in [QA](docs/QA.md).

### September 28 — Cold-storage glass and cartridge clarity

Meridian's cabinet now lights the room with a softer cyan spill. Removing the central flare
keeps the cartridge rows and their colors visible through the glass, while preserving the
floor reflection and Lyra's light. Street lighting was reviewed and retained. This completes
the first lighting review; physical investigation poses are next in the [hourly plan](docs/HOURLY_PASSES.md).

### September 28 — A physical reach for the clinic console

Gravity now raises her hand to the outbound terminal's wall-mounted controls, instead of
reaching below them. Her feet, torso and scarf attachment remain fixed. The low reach stays
on bench-height devices. Both variants use the existing settle/recovery timing and appear
in the character lab; reduced motion holds the finished pose. See [QA](docs/QA.md) for
before/after views and the compact-screen visibility limitation.

### September 28 — A folded screen in the foreground

The clinic privacy screen now has angled leaves, hanging fabric, small frame openings and
separate feet with contact shadows. It reads as a folding screen instead of a flat cabinet.
Its existing parallax and fade keep Gravity visible as she passes behind it. This adds no
new motion, lighting or assets. Comparisons are in [QA](docs/QA.md).


### September 28 — The studio remembers a connection

Connecting Marlon’s journal to the painting now leaves two worn comparison slips clipped
beneath its frame. Their shared pencil mark recalls the deduction without adding another
clue. They follow the active case: earlier checkpoints and fresh folders restore the room’s
previous appearance. See [QA](docs/QA.md) for save-state and phone-layout comparisons.


### September 29 — Lyra occupies the physical machine

Machine examinations now use the same authored fixture positions as Lyra's ambient visits.
Her eye/light sits inside the studio receiver tube for both receiver and spool evidence,
at the Den's memory column and on the clinic cabinet controls. Street-camera and outbound
console targets remain aligned. Clue labels and Gravity's approach/reach are unchanged.
The existing single signal still drives her eye, room light, wet rim and reflected pool;
reduced motion retains steady occupation and an instant return.


### September 29 — A human trace in the consent form

The clinic's signed consent close-up now looks handled: worn paper edges, fold relief,
a stapled backing sheet, a lifted corner and quiet ink smears. The weekly signatures lose
fluency and pressure, making Gravity's existing observation visible in the object itself.
The CRT, evidence card and notebook share this original vector illustration. Record text,
clue/deduction gates and save compatibility remain unchanged.

### September 29 — Reading controls stay within reach

The CRT now scrolls its spoken text separately from the speaker header and transport keys.
Previous, Reveal/Continue and Close remain visible when a long observation exceeds a phone
screen. The text region supports keyboard scrolling and uses the full line for its accessible
description. Each new or reviewed line starts at the top; normal letter reveal preserves the
reading position. Portrait context labels use one compact line.


### October 1 — Landscape reading leaves room for the scene

Short landscape screens now place the CRT and evidence monitor near the top of the scene.
The speaker and 44 px reading controls share a row; the observation scrolls beneath them.
This leaves Gravity's lower silhouette and floor contact visible in the checked phone views.
Long observations need more scrolling at these heights; the notebook retains the larger
evidence illustration. Portrait and desktop reading layouts keep their existing arrangement.


### October 1 — Lyra comes home when called

Starting a conversation while Lyra occupies a nearby machine now calls her back along her
existing light arc, while the dialogue begins immediately. If she is still departing, she
finishes that short leap and returns. Walking keeps the occupied machine fixed and brings
her home to the moving shell. Reduced motion and covered area changes keep their immediate
reset behavior; this transient visit is never stored in the case file.

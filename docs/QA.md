# Validation record

The passes below distinguish automated checks from browser verification. The September 8 pass covers the scene
atmosphere work and is deliberately narrower than the September 4 one: it
re-ran the automated checks and verified rendering, but did **not** repeat the
manual playthrough. Treat the September 4 playthrough as the last full
gameplay validation.

## September 19, 2026 — resume the final encounter

Continuing from `c286543` on `feat/case-board`, fixed a checkpoint gap:
starting a saved game on the street after recruiting Lyra now reopens the
unfinished ambush choice. Its objective describes the encounter instead of
asking Cole to leave the Den again. Area transitions and checkpoint resumes
use the same derived condition; no save-format migration is needed.

* `npm test`: **18 passed, 0 failed**, including a checkpoint regression that
  distinguishes an unfinished street encounter from interiors, a fresh case,
  and a completed chapter.
* `npm run build`: strict TypeScript check and production build passed.
* `git diff --check`: passed; changed TypeScript files formatted with Prettier.
* Browser verification was blocked: the in-app browser was unavailable and
  native Chrome access remained pending macOS Accessibility/Screen Recording
  permissions. No new visual or end-to-end playthrough claim is made.

## September 8, 2026 — scene atmosphere

Covers the lighting, crowd, traffic, flare and interior-air work.

### Automated checks

* `npm test`: **15 passed, 0 failed** — the same suite as below, unchanged by
  this work except for `stepBody`, which gained a trailing `ground` parameter
  with a default, so the existing floor test still exercises the old value.
* `npm run build`: strict TypeScript check and production build passed.
* `npm run format:check`: passed.

### Payload change

| Payload | September 4 | September 8 |
| --- | ---: | ---: |
| JavaScript | 70.02 kB | 96.76 kB |
| JavaScript, gzip | 24.43 kB | 33.76 kB |
| CSS | 32.92 kB | 32.92 kB |
| CSS, gzip | 8.14 kB | 8.14 kB |

Roughly 25 kB of uncompressed JavaScript for eight new modules: `lighting`,
`rim-mask`, `flare`, `scarf`, `pedestrians`, `traffic`, `sheen` and `water`.
No new art or audio assets were added — the environment plates are unchanged,
and the new sound is synthesised from the ambience graph's existing noise
buffer rather than shipped as samples.

### Render cost

Measured by calling the renderer's draw directly, 120 frames after a 30-frame
warm-up, at a 1169 px viewport:

| Area | ms/frame | Share of a 16.7 ms frame |
| --- | ---: | ---: |
| Street | 0.47 | 2.8% |
| Studio | 0.07 | 0.4% |
| Den | 0.12 | 0.7% |

The street carries the crowd, traffic, train, fog, window bloom, rain and
reflections; the interiors carry shafts, haze and dust. One-time load cost
rose by roughly 250 ms for the baked edge sheen across four plates.

### What was verified, and how

Rendering was checked by driving `Renderer.draw` directly from the browser
console and reading back frames, not by playing the game. That was forced: the
host browser window stays backgrounded in this environment, so
`requestAnimationFrame` is throttled to zero and the canvas does not paint on
its own. Specific behaviours confirmed this way:

* the train's specular holds still in the world while carriages pass through it;
* a car's specular does the same, checked against a fixed sign over a 58 px
  car displacement;
* both catches are binary, confirmed across consecutive frames — full
  brightness on one, nothing on the next;
* pedestrians are opaque, grounded, and their legs meet the coat hem;
* interior light positions land on the painted fixtures;
* rain shows through the studio doorway, droplets stay inside their panes,
  and leaks land in the puddles they are aimed at;
* interior puddles measure brighter than the floor beside them — the one
  under the studio bulb reads about 59% above the floor to its left — which
  is how their visibility was judged rather than by eye.

Audio was **not** verified by listening. The graph is built from the same
oscillator and noise primitives already in use, the new cues are wired from
renderer events, and the drip cue was confirmed to fire twice in four seconds
of studio time — but no one has heard any of it. The mix balance between the
crowd bed, traffic rumble, train pass and footsteps is unproven.

### Not re-validated

The manual browser playthrough, responsive checks, and production-preview
smoke test from September 4 were **not** repeated. Nothing in this work touches
save format, clue logic, deduction gating or routing, and the automated suite
covers those; but the chapter has not been played end to end since these
changes. Frame rate under real animation, as opposed to measured draw cost,
is also unverified for the same reason.

## September 4, 2026 — playable chapter

Validated using Node 25.8.2 and the Codex in-app browser.

### Automated checks

* `npm test`: **15 passed, 0 failed**. Covers invalid saves, clue deduplication, earned story gates, all six deduction orders, checkpoint round-tripping, valid door destinations, scene bounds, landing, no airborne re-jump, segment collision, projectile damage/cadence/expiry, invulnerability, bounded down state, two-wave completion, distinct parallax speeds, reversed reflection sampling, and routes through the street hub.
* `npm run build`: strict TypeScript check and production build passed.
* `npm run format:check`: passed.
* `npm run optimize-art`: all five generated WebP files matched their PNG masters after RGBA decoding.
* Dependency installation/audit reported **0 vulnerabilities** after updating the image conversion tool to Sharp 0.35.4. Sharp is not shipped in the browser app.
* Production HTTP check: the entry page, sprite manifest, five environment images, and eight font files all returned 200 with appropriate content types.

### Production payload

Decimal kB, as reported by Vite. Superseded by the September 8 figures above.

| Payload | Original | Pyxel2 |
| --- | ---: | ---: |
| JavaScript | 683.60 kB | 70.02 kB |
| JavaScript, gzip | 180.52 kB | 24.43 kB |
| CSS | 13.85 kB | 32.92 kB |
| CSS, gzip | 3.59 kB | 8.14 kB |

The new environment delivery assets total 8,259,322 bytes; the PNG source masters total 10,721,232 bytes. Local fonts and their license files total 551,467 bytes. These art/font costs are separate from the code sizes above. No frame-rate speedup has been measured or claimed.

### Browser playthrough

Completed using visible controls, without modifying game state through browser scripting:

1. Started on Sector 07 and opened the studio through its world/map interaction.
2. Collected the street camera clue and seven studio records.
3. Tried an unsupported evidence pair and received explanatory feedback.
4. Connected all three supported evidence pairs and unlocked Lyra’s street encounter.
5. Returned to the street, completed Lyra’s conversation, and entered the Memory Den.
6. Recovered archive 001 and completed the archive conversation.
7. Accepted the companion connection and verified Lyra’s channel across areas.
8. Left the Den and entered the story combat encounter.
9. Observed the down/recovery state, retried, used jump/firing inputs, paused, and disengaged into the chapter ending.
10. Reopened/reloaded the preview and verified saved evidence, deductions, area, and story progress.

Combat victory across both waves is covered by simulation tests; the browser playthrough exercised recovery and disengagement, rather than a full mouse-controlled victory run.

The final production build was separately opened on port 4174. Starting the chapter, keyboard focus mode, map navigation, and the studio transition were smoke-tested there. The production preview is reset to the opening for the user; the completed development checkpoint remains isolated on port 5174.

### Responsive and interaction checks

* Desktop: inspected the street, studio, Den, case board, settings, companion choice, combat, and ending.
* 390 × 844: verified title/world framing, map, evidence cards, sticky connection action, selection retention, and visible movement/action controls.
* 844 × 390: verified the title and start button fit after correcting a clipped-button issue.
* Restored the normal viewport after testing.
* Set volume to zero and enabled reduced motion, reloaded, and verified both values persisted. Restored normal effect settings afterward.
* Verified a studio-to-Den map route continues through the street automatically.
* Corrected the obsolete street Lyra marker after companion activation, focus-button state after restarting, accessible case-board naming at narrow widths, and independent touch-pointer release handling.
* The browser’s captured console contained no warnings or errors at the final development check.

### Practical limits

Real-device multitouch, controller input, Safari, Firefox, low-end hardware performance, and long-session memory profiling were not tested. Imported Aseprite content falls back cleanly when absent; no new hand-drawn sheets were authored for this rebuild. The game is a playable chapter, with further production art and campaign work explicitly outside this slice.

## September 19 — noncombat investigation expansion

- Production build and TypeScript check pass. All 25 tests pass.
- Added coverage for both second-case resolutions, optional evidence paths, old save compatibility, rejected unearned progress, all ten conditional observations, reactive Lyra topics, witness routing, and exploration pose timing.
- Inspected a contact sheet rendered directly from the actual character frame module (`character-study.png`).
- Combat implementation has no changes. Existing combat simulations still pass.
- Live browser playtesting of this expansion remains pending: the browser control surface is unavailable and native Chrome control reports pending macOS Accessibility / Screen Recording permissions. Earlier browser checks above apply to the earlier build, not this expansion.
- Manual follow-up: exercise both Mei conversation paths, select both case tabs on a narrow viewport, read amber revisit observations, resolve the second case in the Den, then reload and ask Lyra how the archive was preserved.

## September 19 — visual integration pass

- Added character cloth lighting/detail, Mei’s serving-window presence, parallax interior foregrounds, six local SVG evidence illustrations, examination framing/light, archive bird projection, and distance-driven water footsteps.
- 29 automated tests pass, including footfall consistency at 30/60/120 Hz, dry/stopped/teleport suppression, reduced motion, expiry and area resets. Production build and formatting checked.
- Rendered all three scenes directly through `Renderer.draw` using a standalone Canvas implementation and the real environment assets. Inspected the resulting images, adjusted Mei into the counter opening, moved the archive image into the projection, and refined foreground easel placement. This checks drawing execution and composition, not browser CSS or interactive input.
- Rechecked computer-use availability: no browser surface is connected. HTML close-up layout, narrow-screen overlays and interactive camera feel still need a live browser playthrough.
- No combat module or combat frame changes. New water and interior foreground effects are disabled during combat, and the cloth-light pass applies only to exploration frames and Lyra.

### Evidence presentation follow-up

All fourteen clues now have individual local vector illustrations, including the first case’s camera, lock, diary, paintings, polymer sample, receiver and wall writing. Paper records have subtle wear. Inspected the complete rendered evidence contact sheet; 29 tests and the production build pass. Directly attempting the requested in-app browser returned “Browser is not available: iab”; interactive verification remains pending.

### Record reader and character ground contact

- Added a full-size record reader from each case-board card, with earned field notes and established connections. Selection and scroll state are preserved on return; Escape and the close control return to the board. The layout stacks on narrow screens.
- Evidence thumbnails now retain the illustrations’ native aspect ratio rather than compressing them into 100px strips.
- Exploration uses a cached character silhouette projected away from the dominant light plus a soft contact shadow. Combat retains its original shadow rendering.
- Build, formatting and 29 existing tests pass. Re-rendered and inspected the studio composition. Browser-only follow-up: open a record with two clues selected, return with Escape, verify focus/scroll preservation, and test the reader at a narrow viewport.

## Recovery, investigation clarity, touch and paused rendering

- Added backup checkpoint recovery, deduplicated autosave writes, and validated interaction-resume markers. Resume replays the current interaction rather than serializing callbacks or restoring a partial sentence.
- Added state-dependent case-board hints that avoid naming unearned conclusions.
- Fixed deferred dialog-close events clearing a newly opened panel’s mode, and touch release cancelling an action still held by another finger.
- Added full-line screen-reader dialogue announcements and larger coarse-pointer targets. Paused modal scenes avoid redundant renderer calls; resize and reduced-motion changes invalidate the cached image.
- 34 tests pass, covering damaged primary recovery, backup quota failure, identical autosaves, intentional restart, invalid resume markers and hints. Build and formatting pass.
- Browser-only checks remain pending: screen-reader announcement behaviour, real-device multitouch, panel close/open focus, and reload during each conversation. No claim of live browser verification.

## September 20 — live browser visual pass

Browser access restored through the Chrome extension. Verified the current development build in the actual browser at its normal desktop viewport, 390×844 and 844×390; restored the normal viewport afterward.

- Walked from the street into the studio and examined the journal. The saved clue and interrupted examination survived a development reload.
- Corrected a broad `.record-reader svg` rule that enlarged the return-button icon. Verified the full-size record reader at desktop and phone width.
- Selected the journal, opened its reader, and returned using Escape: selection remained active and focus returned to its Inspect button.
- Removed duplicated quote punctuation in record observations.
- Hid the objective, arrival card and interaction controls during dialogue, preventing them from competing with the evidence close-up.
- Added a side-by-side dialogue/record layout for short landscape viewports after observing the close-up cover dialogue text. Verified the corrected landscape and portrait layouts.
- Replaced the foreground easel’s placeholder drawing with painted texture sampled at runtime from the existing studio artwork, retaining parallax and occlusion.
- Captured browser console contained no warnings or errors at the check. All 34 automated tests and the production build pass. These checks do not cover the complete second-case playthrough or real-device multitouch.

## Coordinated atmosphere pass

- Added shelter-aware pavement rain, awning-edge runoff and warm rain streaks across the studio doorway. Foreground rain remains visible for depth.
- Passing car lights now tint pavement, storefronts and Cole; elevated train windows cast a faint moving spill.
- Added occasional upstairs silhouettes, sheltered pauses for walkers without umbrellas, and Mei wiping the counter with a connected arm pose.
- Refined exploration-only Cole coat/face detail and Lyra's face, hood seams and cloak. Combat mechanics and Cole's original combat frames are unchanged.
- Studio pigment motes and intermittent receiver light contrast with the Den's restrained projection scans and monitor activity. Reduced motion freezes or suppresses the new movement.
- Reloaded the current build in Chrome, continued the saved investigation and walked from the studio to the street. Inspected the Den through a direct render of the actual drawing modules, not a live Den playthrough. Refreshed scene and character study images.
- Production build, formatting and all 36 tests pass, including shelter boundaries and ambient-event timing. A complete second-case playthrough remains outside this visual check.

## Spatial depth and field-notebook presentation

- Added bounded camera-relative relief to storefront doors, windows and awning fascia using crops from the authored frontage, plus a projecting sign edge. Corrected upper-window coordinates against the source plate during visual review.
- Added a service-passage view behind the street fence, with receding pavement, walls, haze and an occasional distant silhouette. It is scenery, not a new traversable area.
- Added near-plane fire escapes, dripping edges and railings; interiors now have separate hanging lamps and middle-plane furniture alongside the existing foreground easels, cables and racks. Cabinet faces reuse the room artwork.
- Added smooth shelter shading, warm studio-door light and short wall silhouettes for Cole. Street water combines a faint stretched environment reflection with the live near-scene mirror and irregular puddle boundaries. Combat mechanics and original character art remain unchanged.
- Redesigned the surrounding interface, notebook, evidence reader, dialogue, map and settings around cloth, warm paper, ink, tabs and annotations. Existing keyboard controls and record-selection behavior are retained. Phone evidence cards use a single column.
- Browser checks: entered the studio from the street, re-examined the saved journal, inspected the dialogue/evidence layout, notebook and full record at desktop and 390×844, and inspected the map. Inspected studio/Den scene captures from the actual renderer. No complete Den/story playthrough or physical-device touch/performance check in this pass.
- All 38 tests, formatting, and the GitHub Pages production build pass. New tests cover bounded relief across viewport sizes and smooth shelter-light boundaries.

## Lyra holographic avatar

Replaced Lyra's hooded exploration silhouette with an original blue-violet holographic avatar inspired by the requested Cortana direction: cropped hair, uncovered face, a structured high-collar suit, memory traces, and an open-hand listening pose. Added a faint projection footprint and a blue signal accent in her notebook dialogue. Story, voice text, clue gates, and combat remain unchanged. No Halo assets were imported.

Inspected the actual renderer's Den capture with Cole and Lyra together and regenerated the character study. All 38 tests, formatting, and the Pages production build pass. This verification used renderer captures, not a live playthrough to Lyra's gated encounter.

## Lyra light emission

Lyra now supplies a scene light only when her avatar is present outside combat. Its blue contribution reaches Cole's existing cloth/rim-light and shadow-direction calculations, nearby interior dust, and puddle highlights. Soft screen-blended wall/floor spill is captured by live reflections. The light stays steady with reduced motion and does not alter the baked sign-sheen exposure. Verified the Den renderer capture; all 38 tests, formatting, and the Pages build pass.

## Analog notebook materials

Added a stitched gutter, offset page edges, paper fibers, creases, tape, irregular handwritten annotations, circled theory numbers, crossed-out resolved questions, and filed stamps. Evidence mounts distinguish photos, tracing sheets, receipts, carbon copies, and notebook extracts. Gameplay CRT treatment is preserved.

Verified the live desktop notebook and examination dialogue, then the notebook and full record reader at a 390×844 browser viewport. Collected the lock through normal play, selected its evidence, opened the reader, and returned with Escape: selection and focus were preserved. No browser warnings or errors were captured. All 38 tests, formatting, and the GitHub Pages production build pass. This is browser viewport testing, not a physical-phone or full-case playthrough.

## Case jacket page surround

Extended the analog treatment beyond overlays into the page: woven desk background, worn stock jacket with a stitched edge and fold, stamped monogram, handwritten case label and captions, physical notebook tab, pasted control slip, dark monitor bezel, and taped title action. Kept the scene's light foreground colors explicit so the surrounding paper ink cannot leak into game labels. Adjusted title spacing for shorter desktop displays and retained dark focus outlines on paper.

Reviewed the local title at 1680×853, portrait gameplay at 390×844, and landscape gameplay at 844×390. No captured browser warnings/errors. Production Pages build and formatting pass; no game logic changed.

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

## Night case jacket

Darkened the page surround to charcoal/olive cloth and paper, with readable chalk-toned labels, muted tape, softer fold highlights, worn cover edging, and a brass notebook clip. The live scene and notebook pages retain their own palettes. Reviewed desktop title and 390×844 gameplay; production build and formatting pass. Styling only; no gameplay changes.

## Leather cover study and touch callouts

Preserved the olive design as annotated tag `checkpoint-olive-case-jacket` at `1f1dfac`. The leather study adds dark walnut stock, an authored tiled leather-grain SVG, saddle stitching, burnished edges, and a debossed monogram. Reviewed desktop and 390×844 browser layouts.

Touch-control descendants now disable selection (including WebKit selection) and iOS touch callouts; the control strip also cancels contextmenu. Existing pointer capture/release behavior stays intact, and notebook text remains selectable. Verified the browser context menu is suppressed on the movement control and computed user-select/touch-action are none. A physical iPhone long-press retest is still needed. Pages build and formatting pass.

## Fullscreen and rotation

Added an accessible fullscreen toggle in the retained top control strip. Requests document fullscreen so modal notebooks remain available; unsupported/denied requests retain an immersive viewport layout, with the same visible exit button. Escape exits the fallback when no dialog is open. Dynamic viewport height and safe-area padding adapt to orientation/browser chrome; existing ResizeObserver updates the camera and render dimensions.

Browser checked enter/exit, portrait 390×844, landscape 844×390, and notebook open/return while immersive. Pages build and formatting pass. Physical iPhone native fullscreen availability and notch/browser chrome behavior remain device checks; fallback cannot hide browser chrome.

## Olive patina and responsive notes

Added area-tinted edge spill (studio amber, Den blue, street teal), localized corner/tab wear, short notebook opening and exhibit-settling animations, and a margin inscription derived from earned case progress. The objective recedes while walking and restores on stopping, hover, keyboard focus, dialogue, or a modal. Both system and in-game reduced-motion settings suppress new transforms/transitions. Reviewed the studio surround and earned two-record margin note in the browser. Build and formatting pass; no new story gates or combat changes.

## World integration graphics pass

Added bounded fading wet footprints alongside the existing distance-based splashes, stronger grounded contact shadows, a short exploration-only settling lean for Cole, and a restrained Lyra speaking lean. Street damp grit receives small broken color highlights separately from puddle mirrors; live reflections now vary slightly by depth. Passing headlights catch authored awning/door edges at separate world positions. Low street haze and warm/cool room particles distinguish locations, while broad lighting gently emphasizes available evidence and dims after collection.

All new effects are excluded from combat; reduced motion freezes atmospheric time, suppresses character lean and clears wet prints. Reviewed live studio dialogue and actual-renderer street/Den captures; refreshed all three scene captures. All 40 tests, Pages build and formatting pass. New tests cover footprint storage/expiry/reduced-motion clearing and finite stop settling. No physical-device performance or complete case playthrough was performed in this pass.

## Foreground weather depth

Added two near-plane street vents with cached feathered vapor, world-anchored drift and independent parallax. Existing foreground railings now catch restrained wet highlights from nearby scene/headlights and shed sparse droplets. Culled offscreen vents; vapor uses a single 128×64 cached texture and bounded draws. Reduced motion retains static mist and disables falling drops. Excluded from combat.

Reviewed the actual-renderer street capture; Pages build and formatting pass. No physical-device performance run in this pass.

## Interior glass and projection finish

Added subtle frame-edge condensation and stationary beads to existing interior glass, faint tapered window slats behind studio furniture, and an 18-second localized scan inside the Den archive projection. Existing rain runners remain responsible for moving water. All additions are behind characters and excluded from combat; reduced motion retains static glass/light and suppresses the scan.

Reviewed actual-renderer studio and Den captures and refreshed both images. Pages production build and formatting pass. No live browser or physical-device review in this pass.

## Exploration cohesion pass

Matched scene markers and action slips to olive field-note stock, with explicit examine/revisit/talk/enter prompts and a persistent selected-destination outline. Edge markers align their labels inward. Touch actions dim when unavailable, use contextual accessible names, and have larger exploration targets with safe-area spacing. Cached hotspot element/content pairs replace per-frame DOM queries and repeated content searches.

Cole gains a restrained speed-dependent walking lean, suppressed during dialogue/examination and reduced motion. Contact shadows fade continuously with height; near-plane street poles become translucent when crossing Cole, preserving parallax and player readability. Offscreen Lyra projections are culled before drawing their halo/sprite.

Browser review: street to studio, evidence discovery and re-examination markers, all three required notebook deductions, return route to the street, Lyra encounter, and Den unlock. Portrait 390×844 and landscape 844×390 layouts, notebook open/return, and immersive landscape enter/exit checked. Existing local progress was continued, not reset. All 40 tests, formatting, and Pages build pass. These are browser viewport checks, not physical iPhone or device performance measurements.

Confirmed live Den arrival, lighting, Lyra presence, and return-door prompt; no captured browser warnings/errors. The walkthrough also caught stale locked-Den dialogue after the studio deductions: that state now points to the waiting woman rather than back to the completed studio.

## Sprint, gait and folded objective

Exploration now accepts either Shift key or the held touch » button for 290 px/s sprinting (walk: 145 px/s). Existing combat Shift behavior is retained. Pointer capture, release/cancel, blur and modal input clearing also cover the sprint input. Faster approach uses a velocity-aware arrival tolerance to avoid oscillation past click-to-walk destinations. Exploration footstep cadence increases when running.

Added a distinct eight-frame procedural sprint cycle with longer stride, lifted recovery foot and larger arm swing; walk frames also lift the recovery foot. Walk/run transitions preserve gait phase, with speed-driven playback and stronger sprint lean. Reduced motion preserves essential leg animation while suppressing lean. Imported sprite sheets can provide a `sprint` tag; missing sprint art falls back to `walk`.

The objective starts as a small field-note tab. Tap/click toggles the full note; outside pointer input or Escape folds it. ARIA expanded/controls state tracks the disclosure. The notebook remains available via its existing button/J key.

Reviewed native frame contact sheet (`visual-gaits.png`), browser objective expansion/folding/Escape, and 390×844 touch layout including outside-tap folding. No captured browser warnings/errors. All 42 tests, formatting and Pages build pass. New tests cover speed/release/braking/bounds and phase-preserving gait transitions with reduced motion. Physical multi-touch sprint holding has not been tested on an iPhone.

## Blender Cole motion study

Confirmed installed Blender 5.2.1 LTS and authored an editable armature/model with two-bone leg IK, articulated arms, head/spine, split coat tails and scarf. Rendered 40 frames across idle, walk, sprint and stop; packed transparent 64×96 cells. Source rig and reproducible generation/packing scripts are included. Normal game builds use committed renders and do not require Blender.

Added `/character-lab.html` as a second Vite/Pages entry: current procedural character and Blender study against the street image at comparable visible heights. Controls select motion, mirror facing, adjust speed, pause and scrub frames. Stop holds its last frame with Replay; system reduced motion starts paused. The gameplay character and combat remain unchanged.

Reviewed material correction, frame rendering, street placement/scale, walk/sprint presentation, final stop hold and mirroring in the browser. No captured browser warnings/errors. All 42 existing tests, production Pages build and formatting pass. This is a rig/blockout study: baked lighting, rigid weights and approximate viewer contact shadow remain limitations; it is not approved replacement game art.

## Gravity protagonist and palette — September 2026

Promoted the selected Warped City female pixel animation to the default protagonist,
Gravity. Renamed narrative speakers, Lyra's direct address, HUD and notebook signatures.
Updated the original story bible and included its full revised text in this repository.

Runtime palette adaptation preserves original PNGs and frame geometry, separates hair
from the shared stocking purple, and keeps skin/alpha unchanged. Added the source jump
frames so the protagonist remains visually consistent in combat; combat mechanics are
unchanged. The study now compares original colors against Gravity's palette.

44 tests pass, including all 32 source frames checked for alpha and skin preservation.
Production build and formatting pass. Browser verified the side-by-side palettes,
default Gravity on the street and Lyra's “I'm here, Gravity” dialogue. Existing local
progress loaded successfully. Investigation-specific gestures still use idle art.

## September 22 — intro integration

Reviewed the intro-cinematic branch after the title/font/footstep changes. Fixed intro completion persistence at the initial spawn, restarting during an active cinematic, duplicate time-zero cues, and the first footfall after idle/turn. Old saves infer intro completion from existing progress; the save key and version remain compatible.

Validation: 60 tests pass, TypeScript/Vite build and formatting pass. On an isolated browser origin, verified fresh intro start, skip → reload → Continue without replay, new-case replay, and restart during intro → reload retaining the fresh checkpoint. The isolated origin avoids changing existing player saves.

The Pages environment only permits `feat/case-board`. Keep that release filter and advance the approved release branch from validated development commits; the intro branch itself was rejected by the environment protection rule. The previous release did not include the other agent’s new work.

Also verified uninterrupted intro completion and the return to gameplay with a saved checkpoint.

## September 22 — player case archive

Three named local slots, migration of the legacy checkpoint into file 01, and four prior meaningful checkpoints per file. The latest position continues to autosave; position-only updates do not consume recovery history. A restored checkpoint retains the former current state so restoration can be undone. Old save keys remain intact after migration. Storage failures are surfaced and stale tabs cannot silently overwrite newer notes.

Validation: 86 tests pass, including archive migration, quota failures, damaged-file fallback, isolation, history bounds, reversible recovery, stale-write rejection, escaped file names, and earned-progress recap text. TypeScript/Vite build and formatting pass.

Browser checks on an isolated origin: legacy file appears in folder 01; create/name file 02 without changing folder 01; skip opening then reload; return recap; collect street-camera evidence; recovery list/restore; switch back to original zero-clue file; rename file; 390×844 portrait folder and recap layouts; second-tab change pauses saving in the older tab. Tests did not replace live player progress. Scene photos use existing location artwork rather than captured player screenshots.

## September 22 — middle-distance contrast

Reduced the broad cyan fog wash and lowered drifting mist toward building bases. Darkened middle-distance facade/rail masses, added shadowed side faces, and tightened warm window halos. The train now has a dark body and recessed windows, door seams, a dim pane per carriage, and a narrower, weaker metal reflection. The far skyline veil and four parallax speeds are preserved.

Validation: compared live street play with the previous release and inspected a temporary deterministic frame with all seven train carriages visible, including an enlarged pixel detail. The temporary preview was removed. All 86 tests, formatting, TypeScript/Vite production build, and diff checks pass.

## September 22 — grounded city and shared weather

All 17 middle-distance facades now extend to a shared ground line, with a continuous embankment and solid lower courses. Rail piers reach footings and rooftop tank legs connect to their roofs. Low, localized fog banks soften these foundations while retaining the darker upper floors. Train windows have sparse seated/standing silhouettes, with small bogies and couplers tying the carriages to the rail.

A deterministic street wind drives rain trajectory, scarf cloth and rising vapor together, with calm intervals covering most of each cycle. Rain uses integrated wind displacement to avoid jumping when gusts change; foundation mist remains locally anchored even after long sessions. Shelter attenuates scarf wind; interiors have no ambient gust; reduced motion disables it. Large same-area anchor jumps reset the scarf, preventing stretched cloth after loading a distant saved position.

Earned environmental details derive directly from the active save: examined studio objects receive paper tabs, recovered archive status lamps settle on, and a preserved memory changes an existing Den CRT. Restoring a checkpoint or switching cases immediately restores the corresponding visuals.

Validation: 96 tests pass, including gust continuity/integrated motion, reduced-motion behavior, scarf teleport recovery and normal walking, and story gating. Formatting and TypeScript/Vite production build pass. Browser inspection on an isolated, non-saving preview covered street centre/right foundations, a train pass, an animated gust, reduced motion, examined studio objects and the resolved Den. The temporary inspection page was removed; no live player progress was changed by those tests.

## September 22 — interior contact, field CRT and completed evidence

Corrected the imported Gravity sprite's three-pixel sole padding in interior presentation, keeping the figure, scarf and projected silhouette on the same anchor. The physics floor and wet footprints remain fixed. Tightened interior contact shadows and made Lyra's Den placement use the area's ground. Exploration sprint increases from 290 to 330 px/s in all areas; animation cadence follows the new speed. Combat retains its existing 290 px/s setting.

In-world clue examinations and their illustration now use dark CRT glass, a worn olive bezel, static scanlines and phosphor text. Conversations and notebook records retain their established appearance. Wide layouts reserve separate columns; portrait reserves separate vertical regions with a scroll fallback for long observations. The screen-reader announcement no longer inherits visible-paragraph spacing that produced false overflow.

Matched evidence displays a stamp, the paired record and conclusion. Finished cards cannot be selected again, but their reader remains available. Multiple-use records remain selectable until all available connections are made. Duplicate submissions no longer replay discovery effects. The board separates three core conclusions from the optional camera/lock connection, and its hint identifies missing records rather than repeatedly suggesting a solved match.

Validation: **106 tests pass**, including actual alpha baselines across all 20 imported idle/walk frames at both interior scales, faster interior movement and cadence, lock matching in either order, duplicate suppression, serialized matched state, multiple-use records, and the current seven-record/missing-camera scenario. Formatting, diff checks and the Pages production build pass.

Browser checks on an isolated local origin covered street-camera collection, studio entry and floor contact, lock collection, camera/lock connection, disabled matched cards and their enabled reader, and a longer lock re-examination. Inspected CRT layouts at desktop, 390×844 portrait and 844×390 landscape, plus the mobile matched card. A temporary non-saving renderer fixture verified studio/Den placement and mirrored feet against the physical floor; it was removed afterward. No captured browser warnings/errors. Existing public progress was inspected without collecting or changing its records; its optional lock partner (the street-camera record) had not been collected. This was a focused regression pass, not a complete chapter playthrough or a physical iPhone touch test.

## September 22 — recorded interior drips

Replaced the two static sine notes with three short, bundled CC0 water recordings. Impacts are filtered, faded and level-matched, with small playback-rate/gain variation. A 75 ms guard prevents nearly simultaneous leaks from doubling the sound. Samples load without delaying entry to the game; individual failures leave the others available, and a soft filtered-noise tap is the fallback. All sources still use the master volume/mute path and disconnect when finished. Existing leak timing remains synchronized with the falling droplets.

Validation: **107 tests pass**, including WAV format, duration, headroom, fade endpoints, DC offset and matched signal levels. Formatting and the Pages build pass. A temporary browser fixture using the real AudioEngine confirmed all three decodes, one playback for two simultaneous calls, completion, mute suppression, suspended-call suppression and clean resume, with no captured warnings/errors. The fixture was removed. This verifies playback and signal properties, not a listening assessment on the user's speakers; the final perceived balance needs their ears.

## September 22 — interior-only sprint correction

Following the user's clarification, restored street sprint to its original 290 px/s. The 330 px/s boost applies only to studio and Den exploration. Combat remains at 290 px/s. Updated the existing sprint checks to distinguish the restored default from the explicit interior boost; animation continues to follow actual movement speed. All 107 tests, formatting and the Pages build pass. No new browser playthrough was needed for this movement-parameter correction.

## September 22 — clear water impacts, global dialogue CRT and new Lyra

Two previous water crops contained the low room/tub rumble between real drops, amplified during level matching. Recut three actual splash onsets, removed bass rumble, preserved transient headroom and raised their mix level. Versioned asset requests replace cached clips. Water audio now uses the shared landing phase independently of visual culling and reduced motion, attenuates continuously with player distance, and remains suppressed during paused redraws and the title sequence.

The CRT glass, bezel and phosphor text now apply to every in-world conversation. Illustrated clue examinations retain their separate image screen; the notebook remains paper. Matched evidence uses a red handwritten check with an accessible matched label, while keeping its partner/conclusion and enabled reader. Field notes receive left, right and bottom padding at desktop and phone sizes.

Lyra now uses MoikMellah's CC0 MV Platformer Female base, composited from three original source layers with bob hair, a fitted suit and a cyan palette. Her authored idle pose has restrained breathing around a fixed sole pivot; six authored walk frames are available. Her light, floor projection and reflection remain. The lab compares the previous Warped Caves model with the new game model and labels the source animation accurately.

Validation: **111 tests pass**, including splash onset/bass-energy checks, water landing counts at 30/60/144 fps, pause behavior, continuous distance attenuation, and the new sprite's source alpha/palette and identical sole baseline across all seven poses. Formatting, diff checks and the Pages production build pass.

Browser checks covered ordinary CRT dialogue on desktop and 390×844 portrait, red checks, and field-note margins on both sizes. A temporary non-saving renderer preview verified the new Lyra at Den gameplay scale, floor contact, light and reflection; drip cues continued while reduced motion was enabled. A temporary fixture using the actual AudioEngine at 50% volume decoded and played all three variants, checked source/gain cleanup, mute suppression, suspended-call suppression and clean resume. No captured warnings/errors. Both fixtures were removed. These checks verify playback and signal properties, not a listening assessment on the user's speakers. Live player records were not changed by the checks.

## September 22 — Lyra cyber finish

Preserved the approved humanoid model and its animation geometry. Replaced the pale blue wash with dark navy/gunmetal panels, a dark bob and restrained cool skin. Small electric cyan visor and circuit details follow measured positions on each of the seven authored poses. The game draws Lyra at full opacity, retains her scene light and reflection, and replaces the broad mist halo with a quieter glow and segmented floor emitter. A brief, faint scan is clipped to opaque sprite pixels; it never removes the body. Reduced motion keeps the emitter static and omits the scan.

The lab compares the same humanoid model's previous pale treatment against the cyber version. Both use the same six walking frames and one idle pose, and share the new palette, emitter and scan functions with the game.

Validation: **112 tests pass**, including both palette variants' original alpha and foot baseline, preserved walking silhouettes, sparse accent coverage and visor alignment across the authored poses. Formatting, diff checks and the Pages production build pass. Browser inspection covered the actual renderer at Den and street scales, reduced motion, and the lab's idle/walk and mirrored facing. No captured browser warnings/errors. The temporary renderer preview was removed and did not access player saves.

## September 22 — a little glow restored

Raised the shared emitter's cyan aura and added a soft middle gradient stop, keeping the same radius and opaque cyber sprite. Inspected the lab comparison in the browser; the game uses the same emitter. Formatting, TypeScript/Pages build and diff checks pass. No animation, lighting-system or save changes.

## September 22 — quieter Gravity idle, character acting and portable cases

Gravity's exploration idle omits the source's deepest crouch and plays three intact poses over 2.4 seconds. New pixel-authored inspection, crouch, terminal, listening and speaking derivatives share their frame selection with the scarf, lighting and shadows. Lyra's listening, speaking and archive-projecting reactions preserve her approved cyber finish and glow. Interactions now approach a stable stance, face the subject and play a brief gesture before the CRT opens; reduced motion skips that lead and holds a settled pose. Desktop CRT panels sit above the characters so the acting remains visible. Compact phone layouts retain their existing arrangement. Combat frame selection and movement speeds are unchanged.

Case archive now exports a versioned JSON containing a single latest checkpoint. Imports validate size, format and normalized progress, show a recap, and write only to an empty folder without switching the active investigation. Existing folders, local history and preferences remain separate. Closing or navigating away invalidates pending file reads.

Validation: **131 tests pass**, including connected character silhouettes, preserved soles and scarf sockets, interaction approach/reaction selection, reduced motion, portable-save round trips, malformed and oversized imports, occupied-folder protection, quota failures and stale-tab races. Formatting, TypeScript/Pages build and diff checks pass.

Browser checks on the local preview covered invalid-file rejection, valid import preview and confirmation in an empty folder, continued play from that imported checkpoint, studio crouch/terminal examinations, map travel to the Den, Lyra conversation and archive projection, interrupted-conversation recovery, closing a staged topic panel then activating another hotspot, reduced-motion re-examination, and the 390×844 portrait CRT layout. Inspected the actual composited character contact sheets and shared character-lab playback. No captured browser warnings/errors. The in-app browser did not report a download event for the Download case click, so native file delivery remains unverified there; serialization and import round trips passed automated checks. Tests used a separate local QA folder and did not modify public player progress. This was a focused pass, not a complete chapter or physical iPhone playthrough.

## September 25 — partial chapter playthrough (paused)

Production build of `e2ddad1`, served on an isolated local origin (`127.0.0.1:4191`) with fresh storage and the soundscape at 10%. Played by driving the real interface in Chrome at 1440×647: mouse clicks on markers and panels, and E / J / M / Esc on the keyboard. To save time, some marker clicks and case-board selections were dispatched through the page. Stopped at the ambush choice at the user's request. No live player progress was touched.

Verified in the browser:

* First run: case archive → new folder → intro. The 35.5 s intro plays through (dispatch, crane, walk-in, chapter card), hands over with the area card and toast, and saves `introSeen`.
* Evidence and field notes:
  * The street camera and all seven studio records.
  * The lock's field note, which appears because the camera record is already held.
  * The "room has given up its secrets" toast after the sixth core record.
* Case board:
  * Same-kind and cold misses give their graded messages.
  * All three core connections and the optional camera/lock connection work.
  * Matched cards show red checks.
  * The objective, chapter label and notebook count update at each step.
* Map routing from the studio to the Den door through the street. The locked-door line points to the woman outside.
* Lyra's introduction uses the prepared-entry variant, and contact opens the Den.
* Archive 001 recovery. Reloading during Lyra's archive conversation brings up the resume recap ("Speak to Lyra about the first memory", 9 records / 4 connections), and Continue restarts that conversation from its first line.
* Accepting Lyra as companion shows the channel HUD, and leaving the Den opens the ambush.

Found:

1. **Story choices are nearly unreadable.** `.story-choice p` (#d6ddc7) and `.story-choice small` (#9eb194) in `src/style.css` were set for the old dark panel. On the paper panel they measure 1.29:1 and 1.27:1. Seen on Lyra's companion choice and the ambush. The Ada resolution, Mei's trust prompt and the combat-down panel use the same class.
2. **Dismissing the ambush strands the objective.** Esc or × closes the panel, but the objective still asks Gravity to face the enforcers or take the escape route. Nothing on the street offers either, and B only starts practice combat. The choice returns only after entering and leaving another area, or after a reload.
3. **First run takes three steps to start.** In a fresh browser, Begin investigation opens the empty case archive and a folder-naming form before the intro plays.
4. **Staging hides the characters.**
   * Examining the unfinished portrait puts Gravity directly behind the foreground easel, which hides her below the chest.
   * The Den spawn puts her behind the tall foreground cabinet.
   * Lyra's street position lines up with the foreground pole when the camera is at its right edge. That is the framing the map route produces, so she is almost hidden when Gravity arrives.
5. **Minor:**
   * One extra E after closing an examination re-examines the same object immediately.
   * Flavor observations are labelled "PRIVATE CHANNEL".
   * The "I need a moment" link measures 4.04:1.

Not covered:

* Combat waves and the downed/retry flow.
* The escape route and the chapter ending.
* The whole second case: Mei, the sketch, the spool, the chime, the register, three deductions and Ada's resolution.
* Reduced motion and phone layouts.
* Archive download/import and earlier checkpoints.
* Browser console output.

## September 25 — playtest fixes and Lyra's drone

Fixed the partial playthrough's findings:

* **Story-choice contrast.** Paper-ink overrides for `.story-choice` text and the danger eyebrow; panel text buttons are slightly darker. Computed against the panel paper (#cfc09a): quote 5.0:1, detail 4.9:1, danger label 5.0:1, text buttons 5.3:1.
* **Ambush dismissal.** Closing the ambush without choosing brings it back after 3 s of street play. Opening a panel or conversation pauses the countdown, and combat or leaving the street cancels it.
* **First run.** With an empty archive, Begin investigation creates folder 01 and starts the intro.
* **Occluding props.** Interior near-plane props use the street poles' distance fade (`foregroundAlpha`), and the poles now fade for Lyra too. The Den spawn moved to x 230, clear of the cabinet.
* **Minor.** A 400 ms guard after a conversation closes. "DETECTIVE’S OBSERVATION" for flavor and locked-door lines, and Mei's own labels for her lines.

Lyra is now a code-drawn drone (see the README section of the same date). The humanoid is removed from the game's sprite loading. `lyra-art.ts` was only used there and is deleted.

Validation: **141 tests pass**, including 8 new drone tests and 2 foreground-fade tests. Strict TypeScript, formatting and the production build pass. In the browser, `lyra-lab.html` loaded and its first frame showed the drone correctly.

Not verified: the Chrome window was hidden for the rest of the check. Chrome pauses rendering and defers image decoding for hidden pages, so the game never finished loading. The following still need a look:

* The drone in the game: posts, following, docking, the Den-door hop, hops during examinations, and ambient hops.
* The archive beam.
* The ambush returning.
* The first-run start.
* The panel contrast in the page itself (the ratios above are computed from the CSS values).

## September 26 — Follow the shipment (Meridian Clinic)

Automated checks:

* `npm test`: **149 passed, 0 failed**. The 8 new tests in `tests/shipment.test.ts` cover:
  * old saves loading with the case closed
  * forged saves rejected: clinic area, records, deductions and the closing flag
  * the transit card's map states
  * three orders of connection, with reloads in between
  * the residue reopening in file 03
  * spoiler-safe hints and recap
  * train routing and arrival points
  * Lyra's clinic sockets and the illustrations

  The re-examination test now opens every case, so it covers the two new clinic observations.
* Strict TypeScript, `npm run format:check`, `npm run build` and `git diff --check` pass.
* The placeholder plate's WebP decodes pixel-for-pixel equal to its PNG master.

Browser, production build on an isolated origin (`127.0.0.1:4193`) with a temporary save in the clinic. The save was removed afterwards; no live progress was touched.

* The clinic save resumes with the right location title, objective ("Search intake B…") and chapter (05 FOLLOW THE SHIPMENT). No console errors.
* **Not verified:** anything visual. The Chrome window was hidden, so the canvas never repainted after load. Nobody has yet seen the following in the running game:
  * the plate in play, and the near-plane screen and trolley
  * Lyra's hops in the clinic
  * the train ticket, and the map's fourth place on desktop and phones
  * the closing panel

## September 26 — finished Meridian and integration pass

Built on the incoming third-case work and preserved the drone Lyra direction. Replaced the clinic blockout with a finished generated plate; aligned the shutter rain mask, glass, evidence and fixture lights; confined cold mist to the cabinet base; added worn canvas, seams, tubing and feet to near-plane equipment. Lyra's resolved signal now drives her room lighting and reflection as well as her machine effect. Reduced motion holds the machine glow steady. Notebook matches are scoped to the selected case, carried records identify their source file, and a newly opened notebook resets to its tabs.

Automated verification:
- `npm test`: **151 passed**, 0 failed. New regression checks cover signal-light travel/return/reduced motion and cross-case evidence reopening only in its destination file.
- `npm run format:check`: passed.
- `npm run build`: passed (TypeScript and Vite, game and both labs).
- `git diff --check`: passed.
- `npm run optimize-art -- clinic.png`: lossless PNG/WebP pixel equality passed; runtime plate reduced from approximately 2.48 MB to 1.85 MB.

Browser verification, isolated origin `http://127.0.0.1:4197/`:
- Fresh first-run investigation, intro, camera, seven studio records, three core deductions plus camera/lock optional deduction; Lyra encounter, archive 001, companion choice, non-combat service-alley ending.
- Second case: Den audio/register, studio drawing/spool, Mei's scheduled-pickup testimony, all three deductions, sealed witness statement, completion and shipment handoff.
- Third case: fare-loaded map route, night train arrival, all five clinic records, all three deductions including the reused studio residue, Name the buyer conversation and completion.
- All four scenes observed in play. Grounding and foreground readability checked in studio, Den and clinic; new clinic plate inspected at entry, cabinet and terminal. Machine occupation checked with reduced motion on and off.
- A real Download case action produced `gravity-case-file-01-2026-09-26.json` (949 bytes, 19 records, 10 deductions, buyerNamed true). Imported that same file through the native file chooser into empty folder 02; preview, commit and resumed game retained the completed case. Folder 01 remained intact. The automation download event timed out despite the browser successfully writing the file; existence, timestamp and contents were checked directly. The native chooser was slow to return.
- Normal phone layouts checked at 390 × 844 and 844 × 390; narrow notebook, source-file cross-reference, visible case tabs and transit map reviewed. Temporary viewport override reset afterwards.
- Fullscreen toggle and exit checked. Desktop immersive rendering passed visually. With an emulated phone viewport, the browser screenshot surface scaled unexpectedly although DOM bounds matched the viewport; do not treat that as a verified mobile-native fullscreen result.
- A transient renderer error occurred during an intermediate hot reload between dependent edits; the completed renderer call supplies the signal and subsequent playthrough/build passed.

Limits: no physical iPhone test; no touch-hold selection test on hardware; no new audio-by-ear assessment; combat deliberately skipped. No live Pages saves/settings were touched. This pass is a local checkpoint, not a Pages deployment.

## September 26 — interior depth and companion continuity

Changes: recessed contents inside fixed studio windows, Den archive glazing and clinic glass; subtle frame-edge shadows; paint chips/contact shadows on studio easels; worn labels, vents, fasteners, bases and cables on the Den's foreground racks. All use existing authored plate pixels or code; no new assets. The active-case masthead follows the current save. Ambient Lyra visits lock their target until returning, start only at rest, and do not restart midway through a scheduled window after interruption or room/clock changes.

Automated: **153 tests passed**, including new ambient-visit tests for movement during a visit, paused redraws, one return per window, missed starts, interruptions, area changes and clock resets. `npm run format:check`, `npm run build` and `git diff --check` passed. Reduced motion disables the new glass offset and ambient visit scheduling.

Browser: used the existing isolated test save at `127.0.0.1:4197`, folder 02. Resumed the completed case; followed the map route from clinic via the street into the studio, then from studio via street into the Den. Reviewed studio window/easel alignment at entry and moved to the portrait; inspected Den glazing/racks at entry and at the archive. Reduced-motion Den view checked; active masthead correctly reads case 07–033 while revisiting older locations. No live saves touched.

Limits: the moving-target ambient regression is verified by automated state tests, not a frame-by-frame browser capture. No new full case playthrough or hardware phone/audio review in this pass. The prior full three-case playthrough remains the integration baseline. Local checkpoint only; not published to Pages.


## September 26 — routes and notebook feedback

Changes: temporary walking destination/Stop control; earned Den lead routes to Lyra before
contact; per-file conclusions and margin notes; case-tab scroll reset; dismissible connection
results pinned to the visible notebook bottom while preserving reading position.

Automated: **155 tests passed**, including regressions for Den lead gating, routes through the
street, destination labels, and completed-case summaries with both resolutions. TypeScript/
Vite build and formatting passed. Save format, combat, movement speeds and art are unchanged.

Browser, isolated `127.0.0.1:4197`: completed a Den → street → studio map route, checked its
walking note, then started and cancelled a return route. Verified Graves and First One tabs
retain their own conclusions. Restored test folder 01's earlier seven-connection checkpoint
through the archive UI; completed a failed pairing and the residue/cold-storage pairing at
390 × 844. Both results remained visible beside the reading position; dismissal worked and
the matched records updated. Changing tabs reset scrollTop to 0; panel scrollWidth equalled
clientWidth (341 px). Folder 02's completed test case was preserved; live Pages saves untouched.

Limits: portrait phone emulation verified, not physical hardware. The landscape screenshot
surface scaled incorrectly after changing viewport, so landscape rendering is not claimed.
The browser session/server ended during a tool interruption after these checks; a normal-size
preview was reopened. No new combat/audio/full-story retest. Local checkpoint only.

## September 26 — arrivals, approach timing and grounding

Changes: visible-frame-driven area transitions with a covered swap and a fully revealed arrival
before input resumes; reduced-motion cuts retain the readable train ticket. No background
transition timers survive a hot reload or hidden tab. Final map destinations persist through
every leg. Touch input and notebook/settings panels are guarded during travel. Gravity faces
into the arrival space and resets movement, turn, settle and footfall state; approaches stop
at the exact requested position. The existing sole-padding correction now also applies to
street exploration, shared by sprite, scarf, lighting and cast shadow. Combat is unchanged.

Automated: **159 tests passed**. New tests exercise door/train sequencing at 120/30/10 Hz,
reduced motion, invalid/paused time, delayed frames, and exactly one covered swap/completion;
room-entry animation reset; authored idle/walk sole alignment now includes street scale.
TypeScript/Vite build, formatting and `git diff --check` passed.

Browser: isolated test folder 01 at `127.0.0.1:4197`. Reviewed clinic stance, routed clinic →
street → studio, approached and re-examined the painting, then routed studio → street → Den.
Observed the same “Walking to Memory Den” status after exiting the studio. Reviewed floor
contact in all four scenes and the studio's settled inspection pose. Enabled reduced motion,
took the train back to the clinic, and activated Notebook during the covered journey: the
panel stayed closed. After the transition completed, settings opened normally. Restored
normal motion and left the preview at clinic entry. Screenshot: `/private/tmp/pyxel-arrival-pass.png`.

Limits: browser pointer activation was unreliable in this session; keyboard activation of
actual controls was used to complete the playtest. A Vite websocket warning was recorded;
reloaded the preview after the build. No physical phone, audio-by-ear, combat, or full-story
retest. Hidden-time behavior is covered by the timeline test plus the existing visibility
check in the frame loop, not a browser background/resume recording. No live saves touched.
Local checkpoint only; not published to Pages.

## September 26 — readable actions and rooms that remember

Changes: nearby evidence captions move beside Gravity, inactive captions stay quiet outside
focus mode, and unchanged marker DOM updates are skipped. Paintings use a dedicated study
pose; investigation actions retrace their authored poses over 0.3 seconds when dismissed.
Movement, combat and reduced motion cancel recovery. Action poses now receive the same broad
cloth lighting as exploration. Earned clinic records leave a manifest tab, cartridge label
and copied terminal log; these details derive from current save state. A development-only
profiler supports comparison with marker caching disabled.

Automated: **163 tests passed**, including caption placement, pose recovery/cancellation,
study-pose selection, sprite connectivity/sole alignment and earned clinic details.
TypeScript/Vite build, formatting and `git diff --check` passed. Source sprite images,
save version/IDs, combat and movement speeds are unchanged.

Browser: isolated folder 01 at `127.0.0.1:4197`. Re-examined cold storage, the studio painting
and iridescent residue; reviewed the terminal, study and crouch poses, floor contact,
directional cloth lighting and release to rest. The cold-storage caption sits beside the
figure. Viewed the cartridge label and copied terminal detail. Routed clinic → street →
studio → street through actual controls. At 390 × 844, focus mode and touch controls remained
available; the stage had equal client/scroll width (360 px), and the nearby caption stayed
inside its bounds. Restored the normal viewport. Public Pages saves/settings were untouched.

Measurement: a stationary clinic comparison reported 2,940 marker property/class update
calls per approximately one-second window with caching disabled and zero with caching on.
Sampled frame CPU medians were 0.6–0.8 ms in that comparison, within variation; no broad
frame-rate gain is claimed. A walking street sample reported median 1.2 ms, p95 1.8 ms at
60 sampled frames. The profiler measures JavaScript frame work/submission, not GPU completion,
and counts update calls rather than observed browser mutations. It is opt-in locally and
has no telemetry.

Limits: no physical iPhone, new landscape, audio-by-ear, combat or full-story playthrough.
Reduced-motion cancellation and save-derived clinic rollback are covered by automated tests,
not a new browser recording. Browser pointer activation was unreliable; keyboard activation
of actual controls completed the checks. Local checkpoint only; not published to Pages.

## September 28 — CRT reading and keyboard controls

Changes: Previous-line review, preserved reveal positions, accurate Reveal line / Continue /
Close labels, a steady reception indicator, and 44 px reading keys on narrow/touch layouts.
`DialogueReader` is pure and transient; completion remains in the existing close handler.
Native controls retain Enter/Space activation without also triggering the game shortcut;
repeated native activation is suppressed. Save schema, narrative content, art and combat
simulation are unchanged.

Automated: **167 tests passed**, including reveal-before-advance/close, backward review,
partial forward-position restoration, paused/negative time, reduced motion, reset between
conversations and native-control activation. Production build, formatting and diff checks pass.

Browser: isolated folder 01 at `127.0.0.1:4197`. Resumed the saved painting examination and
closed it with one Enter. Opened Lyra's painting topic, advanced exactly one line with Enter,
returned to the fully revealed first line with Previous, and advanced exactly one line with
Space. The second line remained open, proving no duplicate native/game activation. Opened
Pause by keyboard during dialogue without advancing it; enabled reduced motion, resumed,
and checked review state. Returned settings to normal motion afterwards.

Phone layout: 390 × 844 portrait showed both reading keys inside the CRT, each 44 px tall.
The long first line fit without vertical overflow (dialogue clientHeight and scrollHeight
both 233 px). Reviewed the same line and controls at 844 × 390 landscape, then reset the
viewport. These are browser viewport checks, not a physical iPhone test. No live Pages save
or settings were touched. No new full-story, combat or audio-by-ear playtest. Local checkpoint;
not published to Pages.

## September 28 — REPLACED research and scheduled work

Documentation/setup only. Read the current local canon and relevant rendering/staging code.
Sources: official publisher overview and screenshots, director's Xbox Wire article, direct
interviews in GamingBolt, Bonus Action and Game Developer, and the publisher-linked launch
trailer. Inspected three official stills in the browser and sampled trailer playback; not a
full REPLACED playthrough or exact animation timing study. The research brief labels original
proposals separately from documented source facts. No reference-game assets were imported.

Created and verified the app's same-chat hourly schedule through the end of September 28
America/Los_Angeles, with routine notifications muted. The durable implementation queue
requires bounded local commits, repository checks, isolated browser verification and an
honest run log. No gameplay changed in this checkpoint. Re-ran all 167 tests, formatting, production build
and diff checks successfully; no new gameplay/browser playtest is claimed for this setup.


## September 28 — P1 studio exploration framing

Implemented two stateless focal zones in `exploration-camera.ts`, anchored to the painted
subject below the work bulb and to the receiver cylinder. The smooth bias is bounded by
64 world pixels / 8% of view width and narrows with the viewport. Existing interpolation
provides movement. Reduced motion disables the added composition; dialogue and cinematic
focus retain priority. Initialization, save restore, resize and covered travel swaps resolve
the current room. Other areas and combat retain their existing framing. No new save state,
assets, dependencies, lore or movement changes.

Automated: **172 tests passed**. Five new tests cover directional attraction, monotonic
subpixel sweeps through zone boundaries/overlap at 300/390/620/960/1280 internal widths, all
studio clue approach positions from either side, bias/room limits, reduced motion, oversized
views and no previous-room state. Format, strict TypeScript/production build and diff checks
passed. Tests exercise the target composition; no new frame-rate/performance claim.

Browser: isolated `http://127.0.0.1:4197/`, existing folder 01. Resumed the stored studio
position and captured desktop before/after framing. Examined painting, residue and receiver
through semantic marker controls, including their existing re-examination CRT scenes. At
390 × 844, painting/receiver compositions kept the detective and subject in view. Toggling
reduced motion returned the receiver marker from 55.78% to the established 60.17% placement
at internal width 460. Checked reduced-motion landscape at 844 × 390. Restored normal motion
and default viewport. Routed studio → street → Den → street → studio through the map,
verified the studio entrance camera was zero (exit at 8.85% of the 960-pixel view), and
repeated the painting approach. A desktop floor click below the painting landed with the
marker at 45.10%, against a computed 45.11% target, and cleared the walking destination.
No browser console errors observed.

Evidence: [desktop before](qa/2026-09-28-p1/gravity-p1-before-desktop.png),
[desktop after](qa/2026-09-28-p1/gravity-p1-after-desktop.png),
[phone painting](qa/2026-09-28-p1/gravity-p1-phone-painting.png),
[phone receiver](qa/2026-09-28-p1/gravity-p1-phone-receiver.png),
[landscape reduced motion](qa/2026-09-28-p1/gravity-p1-landscape-reduced.png).
Before/after use the same saved actor position, but different animation/light moments.

Limits: phone pointer automation did not reliably activate the intended marker; keyboard
activation of exact controls was reliable. Physical iPhone/tap behavior remains a manual
check. No new intro, combat, audio-by-ear or complete-story playtest. Camera continuity is
covered numerically, not with a captured frame sequence. Renderer retains its existing pixel
rounding; no new transform is introduced for markers, reflections or picking. Live Pages
saves/settings were untouched. P1 remains partial: street/Den/clinic authored zones are next.
Local checkpoint only; no push or publication.


## September 28 — P1 district composition completion

Extended the existing camera helper to street landmarks (Mei’s window, Graves entrance,
Memory Den entrance), the Den’s paper archive/memory column, and clinic intake/cold storage.
The studio configuration, interpolation, draw/picking transforms, dialogue/intro priority and
combat opt-out are unchanged. Composition follows visible architecture and does not expose
clue/save state. No assets, dependencies, speeds, narrative or saved fields changed.

Automated: **175 tests passed**. Camera continuity now sweeps every area in quarter-pixel
steps at 300/390/460/620/960/1280 internal widths. Clue approach positions remain visible from
either direction; talk partners remain on-screen at the 300-pixel minimum. All seven new
landmarks attract toward the subject, bounds hold, reduced-motion targets equal the legacy
formula, quiet stretches retain tracking, and the studio’s desktop/portrait targets remain
unchanged. Format, strict TypeScript/production build and diff checks passed. Targeted camera
tests reran successfully after adding the actual browser portrait width of 460.

Browser: isolated `127.0.0.1:4197`, folder 01. Resumed the same saved street position after
reload; Graves-door marker moved from 57.34% to 53.56%. Repeated archive and cold-storage
approaches from the same side: their desktop markers moved 53.94% → 51.32% and 53.94% →
51.50%, matching the intended targets. Both examinations opened and closed through existing
CRT dialogue. Inspected all three scenes at 390 × 844, with actor and subject in view. Den
portrait archive placement was 55.87%; enabling reduced motion restored the original 60.39%.
Also inspected Den at 844 × 390 landscape. Restored normal motion and the default viewport.
Used the street studio doorway in portrait, then the map route studio → street → Den and
train from Den to clinic. A desktop floor click toward intake completed and cleared its
destination; the ledger’s marker remained registered to the counter. Examined that ledger
from the right and inspected its portrait composition. No console errors observed.

[Street before](qa/2026-09-28-p1-scenes/street-before.png) /
[after](qa/2026-09-28-p1-scenes/street-after.png) /
[phone](qa/2026-09-28-p1-scenes/street-phone.png).
[Den before](qa/2026-09-28-p1-scenes/den-before.png) /
[after](qa/2026-09-28-p1-scenes/den-after.png) /
[phone](qa/2026-09-28-p1-scenes/den-phone.png) /
[landscape reduced motion](qa/2026-09-28-p1-scenes/den-landscape-reduced.png).
[Clinic before](qa/2026-09-28-p1-scenes/clinic-before.png) /
[after](qa/2026-09-28-p1-scenes/clinic-after.png) /
[phone](qa/2026-09-28-p1-scenes/clinic-phone.png) /
[intake phone](qa/2026-09-28-p1-scenes/intake-phone.png).
These are matched-position composition comparisons, not matched animation/light/traffic frames.

Limits: no new physical iPhone/touch validation, intro replay, full-story/fresh-case run,
combat or audio listening. Phone control activation used semantic keyboard actions.
Continuity is covered numerically rather than a recorded frame sequence. No performance claim.
Live saves/settings untouched. Local checkpoint only; no push or publication. P1 complete;
P2 begins with the archive’s broad glow/mist and overlapping light passes in the Memory Den.


## September 28 — P2 Memory Den light balance

Den-only tuning: memory-column intensity 2.4 → 1.85 and flare .34 → .18; monitor wall
1.3 → 1.1. The wide breathing mist over the archive is now a steady, shallow condensation
pocket at the plinth (.055 opacity, 340 × 66). Existing shared lighting drives sheen and actor
rim, while Lyra's independent glow/hops/reflections are untouched. Source art, geometry,
clue gates, animation, movement, saves and combat unchanged. No new renderer subsystem.

Required checks passed: **175 tests**, formatting, strict TypeScript/production build and
`git diff --check`. Production game JS 233.49 kB / 78.08 kB gzip. These sizes are build output,
not a performance measurement. No tests added just to assert art-direction constants.

Browser checks on isolated `127.0.0.1:4197`, test folder 01 (19 records / 8 connections):
- Resumed the same archive approach after reload, x763, internal width 960 and archive marker
  53.94%. Reduced motion holds ambient lighting and actor poses for the matched idle/examine
  comparison. Both views retain bright projection lines with clearer dark housing and glass.
- Reopened and closed the recovered archive CRT. At normal motion its projection beam remains.
- Examined “Listen beneath the memory”: the occupied-machine state darkens Lyra's shell and
  moves her light to the column. Closing restores the lit eye and floor pool at the drone.
- Inspected portrait 390 × 844 in reduced motion and landscape 844 × 390 in normal motion.
  Restored the default viewport and normal motion before leaving the preview. No console errors.

Evidence: [idle before](qa/2026-09-28-p2-den/den-before-idle.png) /
[after](qa/2026-09-28-p2-den/den-after-idle.png);
[examine before](qa/2026-09-28-p2-den/den-before-examine.png) /
[after](qa/2026-09-28-p2-den/den-after-examine.png);
[portrait](qa/2026-09-28-p2-den/den-phone-reduced.png) /
[landscape](qa/2026-09-28-p2-den/den-landscape.png);
[normal projection](qa/2026-09-28-p2-den/den-normal-examine.png) /
[occupied machine](qa/2026-09-28-p2-den/den-occupied-machine.png) /
[returned drone](qa/2026-09-28-p2-den/den-normal-return.png).

Limits: still captures show machine occupancy/return, not the transit arc frame by frame;
CRT covers the upper machine during examination. Phone checks are emulation with semantic
keyboard activation, not physical touch testing. Existing compact HUD covers some lower
character pixels; no layout fix claimed. No new audio-by-ear, combat, intro, fresh-case or
complete-story run. Live Pages saves/settings untouched. No push/publication. P2 remains in
progress: studio light/mist overlap next, then inspect street and clinic independently.


## September 28 — P2 studio lighting and receiver alignment

Studio-only visual tuning: bulb intensity 1.7 / flare .18, receiver intensity 1.25 / flare .12;
smaller steady painting bounce (.045, 360 × 300) and low receiver haze (.04, 260 × 68). Moved
receiver fixture and ambient Lyra socket from (1251,236) to (1224,236), matching the luminous
tube on the stretched 1500 × 540 runtime plate. No source art, actor poses, movement, camera,
clue/approach coordinates, combat, save schema or narrative changes. Shared halo/sheen/rim
behavior and Lyra's independent lighting remain intact.

Automated: **175 tests passed**, format, strict TypeScript/production build and diff checks
passed. Existing Lyra travel/occupancy/reduced-motion tests reran; no new tests merely asserting
visual constants. Production game JS 233.53 kB / 78.08 kB gzip; no performance claim.

Browser: isolated `127.0.0.1:4197`, folder 01. Map route Den → street → studio, receiver resume
after reload, painting and receiver re-examinations. Reduced-motion idle comparisons use the
same approach sides and marker positions (painting 53.83%, receiver 68.75%, width 960).
The painting study shots differ slightly in framing: camera interpolation stops when reduced-
motion dialogue opens. Receiver captures share the edge clamp. Both held poses remain readable;
the corrected receiver catch sits on the tube instead of the cage beside it.

[Painting idle before](qa/2026-09-28-p2-studio/painting-before-idle.png) /
[after](qa/2026-09-28-p2-studio/painting-after-idle.png);
[study before](qa/2026-09-28-p2-studio/painting-before-study.png) /
[after](qa/2026-09-28-p2-studio/painting-after-study.png);
[receiver idle before](qa/2026-09-28-p2-studio/receiver-before-idle.png) /
[after](qa/2026-09-28-p2-studio/receiver-after-idle.png);
[receiver examination before](qa/2026-09-28-p2-studio/receiver-before-examine.png) /
[after](qa/2026-09-28-p2-studio/receiver-after-examine.png).

Inspected [painting portrait, reduced motion](qa/2026-09-28-p2-studio/painting-phone-reduced.png)
and [receiver portrait, normal motion](qa/2026-09-28-p2-studio/receiver-phone.png) at 390 × 844;
[landscape](qa/2026-09-28-p2-studio/studio-landscape.png) at 844 × 390. Normal
[receiver examination](qa/2026-09-28-p2-studio/receiver-normal-examine.png) darkens Lyra's drone
while the signal is out; closing restores eye/glow. No console errors. Normal motion/default
viewport restored. An attempted floor click activated the unfinished portrait; subsequent
travel used exact semantic controls. Only the test file gained existing portrait/testimony notes.

Limits/follow-up: physical machine examination targeting is still tied to clue markers;
the receiver signal appears below the workbench. P6 should use authored fixture targets while
preserving marker and approach positions. The adjusted ambient socket was reviewed in code,
not captured during its short timed visit. No frame-by-frame transit footage, physical phone,
fresh/full-story playthrough, audio listening, combat, intro or performance verification.
Compact HUD overlaps remain. Live saves/settings untouched. No push or publication.
Next: street/clinic P2 review, then P3 physical action contact.


## September 28 — P2 cold-storage light and street review

Clinic-only content tuning: cold-storage intensity 1.7 → 1.35; removed flare .22. The cabinet
contains many lit cartridges, so a central point flare was obscuring the shelf artwork.
The existing halo/sheen/air/rim pipeline consumes the reduced intensity; fixture coordinates,
flicker timing, cabinet glass/mist, Lyra's light, other fixtures, source assets and all game
logic are unchanged. Street/code review retained the current foundation, fog and train treatment.
Combat rendering, movement, saves and story are untouched.

Required checks passed: **175 tests**, format, strict TypeScript/production build and diff.
Game JS 233.52 kB / 78.08 kB gzip; no performance claim or new constant-mirroring test.

Isolated browser `127.0.0.1:4197`, folder 01, 19 records/8 deductions:
- Routed studio → Mei → street camera, then the map's night train to Meridian. Camera revisit
  and repeated cabinet examination completed through the CRT. No full-story progress claim.
- Reload/resume retained cabinet approach. Reduced-motion idle before/after shares marker
  position 53.94% at internal width 960. Cartridge hues stay distinct without the central flare.
  Examination captures share the held action but differ slightly in camera framing: arrival
  interpolation stops on opening reduced-motion dialogue. Idle images are the aligned pair.
- Checked 390 × 844 portrait reduced motion, normal cabinet examination/return, and 844 × 390
  landscape. Lyra's eye dims while the machine is occupied and returns with her glow afterward.
  Normal motion/default viewport restored; no console errors observed.

[Street at Mei](qa/2026-09-28-p2-clinic/street-review-mei.png) /
[central street](qa/2026-09-28-p2-clinic/street-review-central.png) /
[clinic arrival](qa/2026-09-28-p2-clinic/clinic-entry-review.png).
[Cabinet idle before](qa/2026-09-28-p2-clinic/cabinet-before-idle.png) /
[after](qa/2026-09-28-p2-clinic/cabinet-after-idle.png);
[examine before](qa/2026-09-28-p2-clinic/cabinet-before-examine.png) /
[after](qa/2026-09-28-p2-clinic/cabinet-after-examine.png);
[portrait reduced](qa/2026-09-28-p2-clinic/cabinet-phone-reduced.png) /
[normal examination](qa/2026-09-28-p2-clinic/cabinet-normal-examine.png) /
[landscape](qa/2026-09-28-p2-clinic/clinic-landscape.png).

Limits: train carriages were absent in the street stills; reviewed their drawing order/colors
in code, without a new complete pass capture. Street review sampled Mei/central views.
No physical phone/touch, audio, combat, intro, fresh/full-story or performance test. Compact
HUD overlap and Lyra's clue-coordinate examination target remain known follow-ups. Static
occupancy/return screenshots do not verify every transit frame. Only isolated test progress
changed; public saves/settings untouched. Nothing pushed or published. P2 bounded review is
complete; P3 physical action/contact audit is next.

## September 28 — P3 raised wall-console reach

The clinic outbound terminal now selects `terminal-high`: a three-frame arm derivative in
`gravity-acting.ts`, with routing in `interaction-staging.ts`. It lifts the hand to the wall
console's lower key strip while preserving the body and soles. Existing low terminal reach,
0.68 s settle, 0.55 s staging lead, recovery and reduced-motion semantics stay intact. Shared
loading automatically includes it in the character lab, rim/shadow/reflection and scarf paths.
No source art, speed, combat, camera, save or narrative changes.

Required checks: **177 tests passed**, formatting, strict TypeScript/production build and
diff check. Two new tests verify physical fingertip contact from both approach directions,
unchanged body outside the arm, action selection/reduced motion and recovery cancellation.
Existing all-pose alpha connectivity, boots, neck socket and locomotion/combat-timing checks
also cover the new action. Game JS 233.54 kB / 78.08 kB gzip; no frame-rate claim.

Isolated browser `127.0.0.1:4197`, folder 01, 19 records / 8 deductions:
- Normal console before/after from the left shares the room-edge camera clamp and held body
  position. Right-side approach mirrors the gesture onto the same key strip. Reduced motion
  selects the finished pose; closing the CRT releases it through the existing recovery.
- Character lab: new variant selected; held and middle frames inspected in both palette
  panels, with left/right presentation sampled. No source-image mutation.
- Reviewed retained clinic cabinet reach/crate crouch, studio painting/residue/receiver,
  Den archive and street camera/Mei interactions through ordinary travel. This is a
  representative action review, not a full hotspot or story replay.
- Portrait and landscape reduced-motion previews (requested 390 × 844 / 844 × 390) retain
  reading and Close controls but hide most of the actor behind the CRT/evidence cards.
  Do not interpret these images as proof of visible phone hand contact. Desktop reduced
  motion plus sprite geometry tests cover the pose itself.
- Normal motion/default viewport restored, temporary lab closed, no browser console errors.
  Public origin/save/preferences were untouched. Only the local test folder was used.

[Console before](qa/2026-09-28-p3-contact/terminal-before.png) /
[after](qa/2026-09-28-p3-contact/terminal-after.png) /
[right approach](qa/2026-09-28-p3-contact/terminal-right-approach.png) /
[desktop reduced](qa/2026-09-28-p3-contact/terminal-desktop-reduced.png).
[Lab held](qa/2026-09-28-p3-contact/lab-raised.png) /
[left middle frame](qa/2026-09-28-p3-contact/lab-middle-left.png).
[Portrait](qa/2026-09-28-p3-contact/terminal-portrait-reduced.png) /
[landscape](qa/2026-09-28-p3-contact/terminal-landscape-reduced.png).
The [hourly log](HOURLY_PASSES.md) links the retained studio, Den and street review images.

Limits: no physical touch/phone, audio listening, fresh/full-story, combat, measured
performance or frame-by-frame recovery footage. Compact dialogue obscuration and Lyra's
clue-coordinate machine target remain known follow-ups. No push/publication. Next: P4
selective foreground depth; keep the important action/evidence clear.

## September 28 — P4 clinic foreground screen

Changed only the clinic privacy-screen drawing in `visual-details.ts`. Three flat rectangles
became hinged leaves with sloped rails, suspended fabric, open frame gaps, stitched hems,
shared vertical supports and separate contact feet/shadows. The established camera multiplier
1.075 and whole-screen actor-clearance fade are unchanged; no new animation or renderer pass.
The drip stand, other rooms, sprites, gameplay, movement, combat, saves and canon are untouched.

Required checks: **177 tests passed**, format, strict TypeScript/production build and diff.
No new tests that mirror drawing coordinates. Existing foreground-clearance and arrival tests
pass alongside all logic tests. Game JS 234.10 kB / 78.27 kB gzip; not a performance measurement.

Browser on isolated `127.0.0.1:4197`, folder 01 (19 records / 8 deductions):
- Entry before/after uses the same train spawn and left camera clamp. Cabinet before/after
  shares marker 51.50%, canvas width 960. Normal-light/idle phases differ between stills.
- Reload/resume kept the cabinet approach. Ground clicks walked back through the screen;
  exit/train return and the cabinet route crossed it in the other direction. A held overlap
  shows the existing transparency keeping Gravity readable. The far crate approach checked
  the right camera clamp, with the screen's joints and feet remaining connected.
- Portrait reduced-motion preview requested at 390 × 844, internal width 460, plus a floor
  click across the near prop; landscape reduced-motion preview at 844 × 390. Existing compact
  HUD overlap remains and limits lower-body/prop visibility. No new opaque barrier added.
- Reopened cabinet/crate evidence. Returned to normal motion/default viewport; no console
  errors. User's public saves/settings untouched, only the isolated test folder used.

[Entry before](qa/2026-09-28-p4-screen/entry-before.png) /
[after](qa/2026-09-28-p4-screen/entry-after.png),
[cabinet before](qa/2026-09-28-p4-screen/cabinet-before.png) /
[after](qa/2026-09-28-p4-screen/cabinet-after.png),
[solid screen](qa/2026-09-28-p4-screen/solid-screen-after.png) /
[overlap](qa/2026-09-28-p4-screen/overlap-after.png),
[portrait](qa/2026-09-28-p4-screen/portrait-reduced.png) /
[narrow crossing](qa/2026-09-28-p4-screen/portrait-crossing.png) /
[landscape](qa/2026-09-28-p4-screen/landscape-reduced.png) /
[right camera stop](qa/2026-09-28-p4-screen/right-camera-stop.png).

Limits: no frame-by-frame traversal recording, physical touch/iPhone, audio listening,
fresh/full-story, combat or measured performance pass. Near-plane camera movement in reduced
motion follows the pre-existing behavior; the new geometry is static. Known compact-HUD and
Lyra examination-target issues remain queued. No push/publication. Next: P5 earned details
for the studio or Den, derived solely from active-save evidence.


## September 28 — P5 save-derived studio comparison

Two small paper copies now hang from the painting's lower rail after the existing `voices`
connection. Their journal marks/face study repeat already-established evidence. Derived
from the active studio save plus `diary`, `painting` and `voices`; no persistent visual state,
new records or save migration. Source art, character appearance, speeds and combat unchanged.
The original brighter paper was subdued and textured after visual review.

**179 tests passed**, format check, strict TypeScript/production build and diff check passed.
New tests cover exact gating, malformed missing-record state, other areas, serialized
restore/fresh-file switching and save immutability. Game JS 235.33 kB / 78.67 kB gzip.

A temporary storage-free page on `127.0.0.1:4197` used the production Renderer/CaseModel/
parseSave with synthetic data, no archive/preferences access. Same renderer, fixed camera
350, width960, Gravity x740 and reduced motion: fresh → collected-only → earned → earlier
restore → earned → fresh file → earned. Papers correctly clear/reappear. Width460/camera550
normal-motion sample also checked. Fixture removed after testing.

[Fresh](qa/2026-09-28-p5-memory/fresh.png) /
[collected](qa/2026-09-28-p5-memory/collected.png) /
[earned with enlarged crop](qa/2026-09-28-p5-memory/earned.png) /
[restored](qa/2026-09-28-p5-memory/restored.png) /
[switched fresh](qa/2026-09-28-p5-memory/switched-fresh.png) /
[narrow normal](qa/2026-09-28-p5-memory/narrow-normal.png).

Real-game local folder01 (19 records / 8 connections): clinic→studio route, resume, painting
approach/re-examination/close; paper detail registered with the frame and existing tab.
[Desktop normal](qa/2026-09-28-p5-memory/game-earned.png),
[portrait reduced](qa/2026-09-28-p5-memory/game-portrait-reduced.png),
[landscape reduced](qa/2026-09-28-p5-memory/game-landscape-reduced.png).
Requested preview sizes 390×844 / 844×390. Normal/default restored, no console errors,
public saves/settings untouched. The automation's pointer checkbox toggle failed; keyboard
Space worked and was verified. No new motion is introduced by this static detail.

Limits: synthetic restore exercised the actual parser/model, not archive-UI recovery; no
full story replay or physical phone/touch/audio/combat/performance test. Compact HUD still
covers lower scene elements; at landscape phone scale these papers are scenery rather than
legible records. No push/publication. Next: P6 Lyra examination targets (receiver eye currently
visits the clue marker below the physical tube). Consolidated status is in HOURLY_PASSES.md.


## September 29 — P6 physical machine examination targets and renewed schedule

Resumed the three-file P6 draft left after yesterday's interrupted run, from committed
`49cc975`. Read local guide, canon, queue, research, history and complete draft diff; no
other agent edits were present. User renewed work until 8 PM today. Updated the existing
same-chat automation (no duplicate): ACTIVE, hourly, ending September 30 03:00 UTC,
failed-run notifications only. The saved prompt explicitly stops edits at 8 PM Pacific.

Added pure `examinationSocket(area, clue)` to `lyra-orb.ts` and wired it into the existing
examination hop in `main.ts`. Six existing clues share physical ambient targets: street
camera (550,300), studio receiver/spool (1224,236), Den column (823,201), clinic storage
controls (927,412) and outbound terminal (1360,262). The receiver's label was below the
bench; cabinet evidence was over the glass. Both now occupy machinery. Ambient order and
coordinates remain unchanged. Clue labels, approaches, gestures, story gates, archive
projection beat and hop departure/return lifecycle are preserved. No new particles,
brightness, art, lore, dependencies, save fields or combat/movement changes.

**181 tests passed**, formatting and strict TypeScript/production build passed; final diff
check passed. New tests cover all six targets, wrong-area/non-machine rejection, shared
ambient positions and unchanged clue data, held/pause signal determinism, shell darkness,
return to the current shell after movement, reduced-motion return and cleared occupancy.
Game JS 235.33 kB / 78.67 kB gzip; no measured performance claim.

Browser verification used a temporary storage-free page at `127.0.0.1:4197` with the
production Renderer/CaseModel, synthetic companion/contact state and fixed sample times.
No saves/preferences read or written. The page was removed after testing.
- Matched receiver before/after: time11, width960, identical camera/player, old label
  target (1200,350) versus physical socket. The eye now fits the tube; shell is dark.
- Reviewed all six clues, including the spool sharing the receiver. Den eye is on the
  column ring; storage eye is on the cabinet base controls rather than across cartridges.
- Sampled departure10.2, hold11, return12.2 (Gravity's x shifted80), home/reset13. Normal
  return spark/light agree; held eye and returned shell do not remain lit together.
- Width460 reduced-motion hold and release checked: steady fixture eye then immediate
  return to the shell. This is a narrow renderer check, not a physical phone/UI playtest.
- Console errors: none in the working fixture. Server startup first failed to bind under
  the sandbox; an approved local-only retry restored Vite. Failed browser tabs initially
  showed connection-refused pages. No continuing preview blocker or security bypass.

Evidence: [receiver before](qa/2026-09-29-p6-sockets/receiver-before.png) /
[after](qa/2026-09-29-p6-sockets/receiver-after.png),
[departure](qa/2026-09-29-p6-sockets/departure.png) /
[return](qa/2026-09-29-p6-sockets/return.png) /
[home](qa/2026-09-29-p6-sockets/home.png) /
[reset](qa/2026-09-29-p6-sockets/reset.png),
[spool](qa/2026-09-29-p6-sockets/dispatch.png),
[Den](qa/2026-09-29-p6-sockets/den-column.png),
[storage](qa/2026-09-29-p6-sockets/storage.png),
[outbound](qa/2026-09-29-p6-sockets/outbound.png),
[camera](qa/2026-09-29-p6-sockets/street-camera.png),
[narrow reduced hold](qa/2026-09-29-p6-sockets/narrow-reduced.png) /
[return](qa/2026-09-29-p6-sockets/narrow-reduced-return.png).

Limits: fixed samples, not continuous animation/real-game CRT, action pose or scene-travel
playthrough. Reset sample passes null hop, not an area transition UI. Pause/moving-shell
behavior is covered by pure tests; live conversation/area interruption belongs to P8.
No physical iPhone/touch, audio by ear, combat, archive UI or performance claim. Public
saves/settings untouched. Local checkpoint only, nothing pushed/published. Next: P7,
improve one existing evidence close-up with a restrained canon-consistent human trace;
then P8 integration and compact-HUD review, bounded by today's 8 PM deadline.


## September 29 — P7 tactile signed consent

Started from clean `bd3a76f`, after reading local guide, canon, research, queue and history.
P6 is already complete; selected the highest unfinished item, P7. Chose an existing clue
instead of adding dialogue: the clinic consent observation already describes signatures
forgetting their own fluency. The generic three strokes previously read as waveforms.

Reworked only the `consent` drawing in `evidence-art.ts`: worn asymmetric paper, attached
backing sheet/contact shadow, small metal staple, subdued fold relief and a raised dog-ear.
The first signature now has abstract cursive loops; the second falters, the third keeps
shorter jagged marks. Ink pressure decreases, with slight indentation and handling smears.
Preserved all printed text, week labels, clinic cross and folded-veil meaning. The mark moves
left enough to avoid the lifted corner. Original code-native SVG, no external assets, filter,
animation, dependency, victim name, canon revelation, new clue or save change. Shared CRT,
board and record-reader call sites already use this illustration. Other evidence unchanged.

**181 tests passed**, format, strict TypeScript/production build and diff checks passed.
No new tests for decorative drawing coordinates; existing save/gate/reading tests pass.
Game JS 237.17 kB / 79.33 kB gzip. No FPS/performance claim.

Browser evidence on isolated `127.0.0.1:4197`:
- Temporary storage-free fixture imported production art, styles and CaseModel. Captured
  original/revised CRT, enlarged detail and notebook mount. Synthetic held → fresh clears
  the illustration, then held restores it. No save/preferences access. The first fixture
  notebook wrapper used the wrong text styles; corrected it to production record-reader
  markup before recording final evidence. Removed the fixture after verification.
- Requested 390×844 / 844×390 reduced-motion fixture views: paper and signatures remain
  legible as shapes and add no motion. The fixture explicitly uses a taller sample stage;
  those images prove component width/wrapping, not full game phone-height behavior.
- Actual game local folder01 (19 records, 8 connections): resumed, map route from studio
  through street/night train to clinic, selected donor recliners, read the existing earned
  “Where the names stop” re-examination, closed, opened notebook, inspected the consent,
  returned to board and closed. One earned field note was recorded only in this isolated
  test folder. The SVG appears correctly in both real CRT and real notebook.
- Actual normal-motion CRT at 390×844 and 844×390: text/art stay inside the screens.
  Portrait puts the bottom transport controls below the initial scroll position; landscape
  keeps Close visible but overlays most of the scene. This pre-existing constrained layout
  remains a P8 priority; the illustration introduces no layout changes.
- Default viewport/normal motion restored. No console errors in fixture or game. Resume
  initially matched both underlying/title and panel controls; scoping to #panel resolved it.
  Public saves/preferences untouched; preview left in clinic for integration work.

Evidence: [CRT before](qa/2026-09-29-p7-consent/crt-before.png) /
[after](qa/2026-09-29-p7-consent/crt-after.png),
[detail](qa/2026-09-29-p7-consent/detail-after.png),
[notebook mount](qa/2026-09-29-p7-consent/record-after.png),
[fresh fixture](qa/2026-09-29-p7-consent/fresh.png),
[fixture portrait reduced](qa/2026-09-29-p7-consent/portrait-reduced.png) /
[landscape reduced](qa/2026-09-29-p7-consent/landscape-reduced.png),
[actual CRT desktop](qa/2026-09-29-p7-consent/game-desktop.png),
[actual portrait](qa/2026-09-29-p7-consent/game-portrait.png) /
[landscape](qa/2026-09-29-p7-consent/game-landscape.png),
[actual notebook](qa/2026-09-29-p7-consent/game-notebook.png).

Limits: no full fresh-story replay, physical iPhone/touch, audio by ear, combat or measured
profile pass. Fresh ownership sample is synthetic; actual inspectRecord ownership guard
and shipment availability gates are unchanged, not a new browser progression test. Actual
reduced-motion game interruption/Previous/reveal remain in P8; this drawing has no motion
or new lines. Local checkpoint only, nothing pushed/published. Next: P8, prioritize portrait
CRT transport visibility and scene clearance, then four-area/signal integration and the
existing render probe. Stop all edits by 8 PM September 29 Pacific.

## September 29 · P8a reachable CRT transport and integration

Started from clean `6dd7edb`; P6 and P7 were complete, so selected P8's demonstrated
portrait reading issue. The original CRT scrolled as a whole, pushing Close below the first
position. Wrapped spoken text in a named keyboard-focusable region; header and transport
stay fixed. New/previous lines reset the text scroll; letter reveal preserves it. Arrow,
Page and Home/End navigation in the focused region bypass world-input prevention.
The existing full-line announcement describes the region; typed letters stay aria-hidden.
Portrait context uses one compact line. No new motion, story rules, save fields, assets,
dependencies, movement or combat changes.

**181 tests passed**, format, strict TypeScript/production build and diff checks passed.
No implementation-mirroring test added for this small DOM/CSS change; browser checks below
verify the actual behavior. Game JS 237.48 kB / 79.43 kB gzip; CSS 93.08 kB / 22.04 kB gzip.

Actual game verification used only `http://127.0.0.1:4197/?profile=1`:

- Local folder01 started with 19 records/8 connections. At 390×844 the consent reader's
  Close control stays inside the monitor and is 44 px tall. Final text viewport is 78 px
  with 97 px content. End reveals the final words without moving transport. Receiver
  ArrowUp verified scroll from 19.5 px back to zero after the input guard was added.
- Actual 844×390 landscape keeps controls visible. It still covers much of the scene;
  this pass fixes control reach, not all landscape composition.
- Paused during a clue, toggled reduced motion through settings, returned to the same
  line, checked scrolling at 390×844, then restored normal motion/default viewport.
  Two-line Lyra conversation: Continue → short Gravity line at scroll zero → Previous
  restores the completed Lyra line → Continue → Close. No duplicate advancement.
- Travelled clinic → street/train → Den → street → studio → street/Mei through normal
  map routing. Den column and studio receiver re-examinations showed original earned text
  and a dark companion shell while occupied. CRT partly covers the fixture, so these
  stills do not prove unobscured socket alignment or a continuous departure/return.
- Connected consent/seal, then intake/sale in the existing third case. Used records become
  disabled with red checks; board changes from 1/3 to 3/3 core connections and offers the
  existing buyer conversation. Reloaded: archive showed 19 records/10 connections in
  Sector07; resumed and verified matches after switching away and restoring folder01.
- Created only the visibly empty local folder03, named “Sep 29 reader QA”; skipped intro,
  collected the street camera, closed and re-read it. Count remained one; only the camera
  illustration appeared, no companion or later-case artwork. Folder02 unchanged; folder01
  restored active. No public save/preferences touched. No console errors.
- CUA/native and rich DOM snapshots represent toggle buttons differently. Initial checkbox
  selectors missed; inspected DOM roles and used the actual buttons. Duplicate archive names
  were disambiguated with observed slot attributes. No product failure or rollback.

Measured ordinary idle CPU, normal motion, default 1280×720 browser viewport and 1280×540
world canvas, existing development probe (one short rolling sample per scene):

| Scene | Median | p95 | Frames | Marker writes |
| --- | ---: | ---: | ---: | ---: |
| Clinic | 0.90 ms | 2.40 ms | 58 | 0 |
| Den | 1.90 ms | 3.90 ms | 33 | 0 |
| Studio | 1.70 ms | 3.80 ms | 37 | 0 |
| Street | 1.80 ms | 2.90 ms | 52 | 0 |

These are whole-frame JavaScript/Canvas submission costs on this Mac, not GPU time, FPS,
sustained or physical-phone results. Screenshots may show the next rolling window. Startup,
modal and resize windows were excluded. No baseline A/B or optimization claim; no cache
introduced on this evidence.

Evidence: [portrait after](qa/2026-09-29-p8-reader/portrait-after.png) /
[prior portrait](qa/2026-09-29-p7-consent/game-portrait.png),
[landscape](qa/2026-09-29-p8-reader/landscape-after.png),
[reduced scrolled portrait](qa/2026-09-29-p8-reader/portrait-reduced-scrolled.png),
[Den examination](qa/2026-09-29-p8-reader/den-machine-reader.png) /
[studio examination](qa/2026-09-29-p8-reader/studio-machine-reader.png),
[fresh camera](qa/2026-09-29-p8-reader/fresh-camera.png),
[connection result](qa/2026-09-29-p8-reader/board-connections.png) /
[restored board](qa/2026-09-29-p8-reader/board-restored.png) /
[resume summary](qa/2026-09-29-p8-reader/resume-connections.png),
[clinic CPU](qa/2026-09-29-p8-reader/profile-clinic.png) /
[Den CPU](qa/2026-09-29-p8-reader/profile-den.png) /
[studio CPU](qa/2026-09-29-p8-reader/profile-studio.png) /
[street CPU](qa/2026-09-29-p8-reader/profile-street.png).
Before/after phone views share dimensions/clue, not identical animation time.

Limits/next: P8b remains live walk/conversation interruption during a hop and continuous
return, explicit rapid Reveal/E inputs, and landscape scene clearance. Pure tests cover
signal interruption/reading logic but are not these browser checks. No full fresh story
replay, ending conversation, physical iPhone/touch, audio by ear or combat playtest.
README/AGENTS updated. Local checkpoint only; nothing pushed, merged or published.
All edits remain bounded by September 29's 8 PM Pacific cutoff.

## October 1 — Hourly schedule renewal

Clean baseline `3f0fa2a`; working development branch synchronized with origin. Recreated
the thread heartbeat `gravity-hourly-improvement-passes` and confirmed ACTIVE, hourly
through October 1 at 6 PM America/Los_Angeles (October 2, 01:00 UTC). Updated AGENTS and
HOURLY_PASSES with this finite authorization, P8b first, local checkpoints and quiet routine
runs. The last possible session must close the schedule and produce the review handoff.

Documentation/schedule only: no gameplay, art, saves or settings changed; no browser
playtest or new product test/build claimed. Diff check passed. Earlier 181-test/build
evidence remains attached to `3f0fa2a`. Today's first implementation pass should verify
live hop interruptions/return and rapid reader inputs, then landscape scene clearance.
No new push, merge or public deployment performed.


## October 1 — P8b compact landscape CRT and rapid reader transport

Product change: only `src/examination-crt.css`, plus guide/README/pass-log documentation.
Top-mounted 55% landscape screens share a speaker/44 px transport row and scroll the
spoken text beneath; location heading hides during short-landscape reading. Existing
reader logic, story/save gates, animation, movement and combat are unchanged.

Real-game isolated QA at **4198**, imported synthetic “DISPOSABLE QA Oct 1” into a visibly
empty archive folder through the UI (validated 19 records/10 links/active companion).
The existing 4197 case and public Pages were not changed. Automatic approval review
rejected the initial 4197 examination because it could persist to a non-disposable case;
resolved by the new origin and explicit disposable fixture, not by overriding that block.
Node strip-types fixture setup failed; transform-types succeeded. Import picker took
several minutes to return; no product issue or added blocking sleep.

- **844×390 consent**: old CRT y134–301, height167; revised y95–218, height123, text
  viewport36. Cabinet/art height matches left panel. Close44. End reaches final words
  (scrollTop27.5, maximum28) without moving controls; lower character/floor visible.
- **667×375 machine clue**: screens y94–209, height115. Body28, content82, End54.5.
  Buttons44 and speaker/count fit without overlap. Small art is a preview; use notebook
  for details. Only about one to two lines fit, an explicit scene-clearance tradeoff.
- **Short 667×375 reply after final CSS correction**: body client/scroll27/27, End0,
  “Then we keep looking.” stays visible. Removed the old artificial min-height.
- **390×844 conversation**: text viewport116, no overflow for this long line; Close44
  at y565–609 remains within CRT y396–626. Portrait arrangement unchanged.
- **Normal rapid input**: immediate topic click showed “He used t”, Reveal line and
  01/02. E revealed all text and changed Continue while remaining 01/02. Native Enter
  began “Th” on 02/02 with Reveal; no double advance. Previous restored completed 01/02.
  Reduced-motion E/native Enter each advanced once, and Close E dismissed.
- **Lyra**: normal cold-storage hold darkened shell and lit physical cabinet controls.
  Pause/reduced-motion/resume kept reading and occupied socket. Escape cleared socket
  and restored active shell. Normal release returned eye; ground-click walk relocated
  companion beside Gravity. Stills prove sampled states, not continuous trajectory or
  interruption during an ambient visit. Existing pure signal tests cover those timings.
- Console errors: none. Normal motion/default viewport restored; tab at 4198 retained
  for next run. All edits are local; no push/merge/publication.

A 64% trial still obstructed the head; kept 55%. No new mirror-CSS tests. `npm test`: 181
passed. Format and strict TypeScript/Vite build passed, repeated after the final CSS
correction. Final `git diff --check` passed. JS 237.48 kB / 79.43 kB gzip; CSS 93.88 kB /
22.14 kB gzip. No performance improvement claim.

Screenshots and exact follow-up are in [Pass12](HOURLY_PASSES.md#pass-12--october-1-1222-pm-pacific--p8b-landscape-crt-clearance).
The final illustrated small screenshots precede only removal of the redundant text minimum
height; their long content already exceeded that minimum, so geometry is unchanged.
No physical iPhone/coarse-pointer hardware, fullscreen, audio, fresh-story, GPU/FPS or
combat playtest claimed. Next: continuous ambient-hop interruption/return, including
conversation/area cancellation, on the disposable origin. P8 remains partial.


## October 1 — P8c consecutive live hops and conversation recall

Baseline clean `0f1327a`. Source/baseline pure reproduction showed conversation immediately
cleared the ambient signal: machine (420,345) → shell (560,300), no return phase. Fixed the
existing AmbientHopSession/renderer wiring to shorten a conversation-interrupted stay and
finish its existing return. Departing signals reach the socket first; repeated interruptions
cannot extend it. Hard disable/area/clock reset and reduced-motion clearing remain unchanged.
No new animation art, movement, combat, save data or lore.

A later test-label edit failed format check; Prettier fixed it and the final check passed.
**183 tests passed** (two new regressions), format, TypeScript/build and diff check passed.
An initial exact-phase boundary test failed from floating-point subtraction; continuity at
the socket passed. Moved only that phase assertion 1 μs after the edge. Main JS 237.48/ 79.43
kB gzip; CSS 93.88/ 22.14; shared orb 6.20/ 2.85. No performance claim.

Browser: actual named disposable file on **4198**, normal motion/default1280×720. No hidden
state or forced clock; image analysis only examined captured screenshots. Observed ordinary
ambient departure/hold/return in a 260-frame 25.44 s sample. Opened companion topics during a
visible occupied outbound terminal; topic selection started text immediately and a 9-frame
62–870 ms capture showed the return spark progressing home, then socket clearing. Another
27-frame 2.77 s capture shows leftward movement while terminal occupancy stays fixed, followed
by return to the moving shell. Map opened during occupancy, route reached Den with docked
eye; the return finished during the walk to exit, so mid-hop room-swap visual cancellation
is a pure-test result, not this browser result. No console errors.

[Idle clip](qa/2026-10-01-p8c/ambient.gif) ·
[conversation clip](qa/2026-10-01-p8c/recall.gif) ·
[walking clip](qa/2026-10-01-p8c/walking.gif) ·
[capture metadata](qa/2026-10-01-p8c/capture-timing.json). Clips are cropped, fixed-palette,
roughly 10 screenshot samples/sec and repeat once; timing is capture completion, not game
clock or full-rate video. Full-context JPEG stills/conditions are listed in
[Pass13](HOURLY_PASSES.md#pass-13--october-1-123-pm-pacific--p8c-lyra-returns-when-called).

QA setup failures were not product failures: browser runtime imports (Sharp/PNG), unavailable
DOM canvas getContext, PNG parser faced actual JPEG captures, Node fs.watch EMFILE, ambiguous
Continue locator. Resolved with installed Sharp processing screenshot files in a temporary
file-poll worker and scoped archive button; no browser automation outside CUA. Cropped GIFs
replaced overly large full-frame experiments. Temporary processing files/worker cleaned. Process-list access blocked pkill; stopped the
exact tool session with Ctrl-C (exit130), after a brief missing-temp-files log.

Normal motion/default viewport retained; disposable tab in Den for follow-up. No physical
iPhone/coarse-pointer, fullscreen, audio by ear, combat or fresh-story replay claimed. Early
departure interruption is regression-tested, not separately triggered live. P8 complete for
these bounded checks; no exhaustive all-phase hardware claim. Next P9: the existing caption
hides Lyra during the clinic left-facing stop; [actual overlap](qa/2026-10-01-p8c/caption-occlusion.jpg).
Local checkpoint only; nothing pushed, merged or published; existing/public saves untouched.

## October 1 — P9 companion-aware caption clearance

Baseline clean `e612ecc`. Fixed the demonstrated clinic caption/eye overlap in existing
`field-layout.ts`; renderer's area-filtered shell position provides the same follower lag as
its drawing. A bounded side-caption envelope chooses above-hair placement only when it
intersects Lyra. Scale comes from the existing stage resize observer; above captions align
inward at edge marker centres. Cache state includes lift. Authored marker, click target,
approach position, distant/default-below captions, motion, speeds, saves and combat unchanged.
README and local guide now describe clearance and mark P8's bounded checks complete.

Three new pure tests cover both sides, lag/vertical separation, absent companion, CSS scale,
viewport edges, unchanged distant/high placement and hair clearance at three stage scales
and all current figure sizes. Initial exact boundary assertion failed due to floating-point
subtraction; the assertion allows 1e-9 pixels, with geometry unchanged.
**186 tests passed**, format, strict TypeScript/build and diff checks passed.
Main JS **238.07 kB / 79.71 kB gzip**, CSS **94.23 / 22.20**, shared orb **6.20 / 2.85**.
No performance claim; build emits the existing empty art manifest when no Aseprite is present.

Actual browser checks were on named **DISPOSABLE QA Oct 1**, 127.0.0.1:4198, through archive
Continue, map routes, real clue/ground buttons and CRT Close. No injected state/clock or
runtime game reads. The prior P8c overlap screenshot is the baseline; after frames share the
scene and relevant facing, not exact motion time. Both clinic facings clear the eye and hair;
marker centre stayed (704.31,362.18). At 390×844, caption (172.78,344.20)–(252.20,366.70)
and right-edge caption (229.52,344.20)–(308.94,366.70) fit inside stage (12,213)–(378,643).
Clicked that portrait marker and received the correct Neural Cargo CRT, then closed normally.
844×390 retained a noncolliding side caption, as intended. A ground click hit the Revisit
prompt first; its normal CRT was closed and the ground retargeted below it. Reduced-motion
edge layout and a normal-motion docked Den terminal were reviewed. Den caption
(884.00,273.34)–(928.89,301.34) sits above the shell. No console errors.

[Right-facing](qa/2026-10-01-p9/clinic-right.jpg) ·
[left-facing](qa/2026-10-01-p9/clinic-left.jpg) ·
[portrait](qa/2026-10-01-p9/clinic-portrait.jpg) ·
[portrait edge](qa/2026-10-01-p9/clinic-portrait-edge.jpg) ·
[edge reduced motion/focus](qa/2026-10-01-p9/clinic-edge-reduced.jpg) ·
[landscape](qa/2026-10-01-p9/clinic-landscape.jpg) ·
[docked Den](qa/2026-10-01-p9/den-docked.jpg).

Limits: conservative shell envelope, not a general label/prop collision solver. Default-below
markers retain earlier geometry. Absent fallback is pure-tested, not freshly replayed in
browser; no exhaustive all-hotspot/hardware, physical iPhone, fullscreen, audio-by-ear,
GPU/FPS or combat verification. No borrowed assets or canon additions. Normal motion,
focus off and default viewport restored; disposable case remains near Lyra's Den terminal.
Other origins/saves/settings untouched. Local checkpoint only; no push/merge/publication.

Next P10: while checking the edge, a distant collected marker stayed dim under keyboard
focus. The collected 0.35-opacity selector excludes near/hover but does not exclude
focus-visible or selected destination. Confirm computed focus/selection states, then adjust
that existing CSS rule while preserving quiet unselected records. Screenshot/source evidence
and exact bounded scope are in the hourly plan. October 1 authorization still ends at 6 PM.

## October 1 — P10 collected-marker focus and destination brightness

Baseline clean `5ace34a`. Real Den collected audio marker: keyboard focus-visible and
Enter destination-selected both computed whole-button opacity 0.35, even with caption
opacity 1. Fixed one existing style.css selector by excluding those two active states from
collected dimming. Ordinary distant collected opacity remains 0.35; ticks, REVISIT hints,
marker coordinates, actor clearance and interaction inputs are unchanged.

**186 existing tests passed**, format, TypeScript/Vite build and diff checks passed. No new
CSS-mirroring unit test: live rendered state is the meaningful check here. JS **238.07 /
79.71 kB gzip**, CSS **94.28 / 22.21**, orb **6.20 / 2.85**. Documentation context mismatch
was resolved by reading exact lines; no product change was lost or overwritten.

On named DISPOSABLE QA Oct 1 at **127.0.0.1:4198**, after-state focus settled to parent/caption
1/1; blur returned 0.35/0. Native Space selected the Den marker, moving keyboard focus to
sound with ArrowUp left destination 1/1 without changing mute. Enter/Space each reached the
correct Archive Audio 01/01 reader. Same scene/view for desktop before/after, not matched
animation time. Portrait collected cabinet side and above/edge-right captions stay in stage;
focused opacity settles to 1 (one early sample records the existing fade in progress).
Reduced motion gives immediate 1/1 and keeps P9's drone clearance. Native Tab from objective
→ Donor recliners → Cold storage, then Enter, reached Neural Cargo 01/01. No console errors.

Unresolved demonstrated issue **P11**: at clinic entry, the newly legible portrait ledger
caption extends to x429.85 beyond stage right x378. Its marker centre is x273.26; current
side cutoff doesn't reserve label width. Full !/REVISIT text remains in DOM, but is visibly
clipped. Recorded this separate existing placement problem for the next focused pass.

[Before focus](qa/2026-10-01-p10/den-focus-before.jpg) ·
[after focus](qa/2026-10-01-p10/den-focus-after.jpg) ·
[before destination](qa/2026-10-01-p10/den-selected-before.jpg) ·
[after destination](qa/2026-10-01-p10/den-selected-after.jpg) ·
[portrait](qa/2026-10-01-p10/clinic-edge-focus-after.jpg) ·
[reduced raised edge](qa/2026-10-01-p10/clinic-raised-edge-reduced.jpg) ·
[native Enter](qa/2026-10-01-p10/clinic-native-enter.jpg) ·
[ledger clip](qa/2026-10-01-p10/clinic-revisit-portrait.jpg) ·
[state/geometry reads](qa/2026-10-01-p10/layout-checks.json). Baseline JSON rows transcribe
settled observations; after rows were captured via read-only DOM evaluation.

Normal motion, focus off/default viewport restored; disposable case near cabinet. Existing
and public saves/settings untouched. No physical iPhone, coarse-pointer hardware, fullscreen,
audio-by-ear, landscape recheck, fresh-story replay, performance or combat claim. Local-only
checkpoint; no push/merge/publication. P11 is next; today's finite hourly schedule still ends
6 PM Pacific. Full pass conditions in the hourly log.

## October 1 — P11 portrait caption fit and final schedule closure

Baseline clean `1ff04ba`. Existing side placement did not reserve the caption width:
clinic ledger at 390×844 ended at x429.85 beyond stage right x378. The pure field-layout
rule now reserves the existing width cap, gap and edge inset, preserves fitting sides,
and uses the existing above-hair placement when the fitting side would cover Gravity.
Companion clearance shares that width. Main caches CSS caps on resize. A focused note
now paints above passive neighbors, with selected destinations below focused notes;
the opposite-facing browser check demonstrated that overlap before this stacking fix.
Marker positions/picking, inputs, ellipsis, movement, art, canon, saves and combat are fixed.

Automated: **189 tests passed** (three new width/actor/viewport regression tests), format
check, strict TypeScript/Vite build and diff check passed. JS **238.56 / 79.91 kB gzip**,
CSS **94.32 / 22.22**, orb **6.20 / 2.85**. No FPS/CPU improvement claim.

Live: old retained tab 5 failed native and DOM reads despite rebinding; a fresh tab 6
on **127.0.0.1:4198**, in the same browser, recovered access. All checks used the existing
named **DISPOSABLE QA Oct 1** case, native controls and read-only DOM geometry. No injected
runtime or forced clock. User/public saves and preferences remain untouched.

- Portrait entrance: marker dot centre x273.26 matches the earlier anchor. Caption now
  above at (206.96,343.57)–(339.55,366.07), inside stage (12,213)–(378,643).
- Right-facing new-perspective caption: (174.06,343.57)–(306.66,366.07); parent opacity 1,
  focused stacking 2. Reduced motion preserves clearance and contrast. Full DOM/accessible
  REVISIT semantics survive; visible long text retains the existing ellipsis.
- Native Enter reaches the correct Intake ledger CRT, **The night intake**, GRAVITY 01/01
  and **An order being filled** re-examination. Only the disposable case received that note.
- Collected after reading: tick retained, caption fits at x180.02–265.06 right-facing and
  x230.73–315.78 left-facing. Marker centre returns to x273.26 at the original entrance view.
- Landscape 844×390: right caption x259.20–360.07. Desktop 1200×800: x406.43–507.30,
  stage x44.20–1155.80. Neither covers the characters. Console error capture empty.

Images: [entrance](qa/2026-10-01-p11/ledger-portrait.jpg),
[right facing](qa/2026-10-01-p11/ledger-portrait-right.jpg),
[reduced](qa/2026-10-01-p11/ledger-portrait-reduced.jpg),
[native Enter](qa/2026-10-01-p11/ledger-native-enter.jpg),
[landscape](qa/2026-10-01-p11/ledger-landscape.jpg),
[desktop](qa/2026-10-01-p11/ledger-desktop.jpg),
[collected portrait](qa/2026-10-01-p11/ledger-collected-portrait.jpg),
[collected left](qa/2026-10-01-p11/ledger-collected-left.jpg).
Geometry is transcribed from read-only DOM observations; images are not animation-synchronized.

Restored ordinary motion, focus off and default viewport; isolated tab retained for review.
No physical iPhone/coarse-pointer, fullscreen, audio-by-ear, performance, combat or full
fresh-story claim. A live LOCKED label/gate was not replayed; it remains a verification
item. Passive crowded notes may still share space, but focused annotations win draw order.
Next useful review is physical iPhone/audio plus long locked gates and a full fresh-case run.

The app confirmed `deleteStatus: deleted` for the existing hourly automation on the final
possible run. The finite October 1 session is complete, with no further automatic work
scheduled. README/AGENTS and the consolidated review in HOURLY_PASSES are current. This
P11 verified checkpoint remains local on `feat/intro-cinematic`; nothing pushed, merged
or published. All work stopped before 6 PM Pacific.

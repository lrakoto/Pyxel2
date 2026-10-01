# Hourly improvement passes — September 28–October 1, 2026

## Mission and current checkpoint

Improve GRAVITY's visual direction, animation and investigation using
[REPLACED_RESEARCH.md](REPLACED_RESEARCH.md). The user authorized autonomous implementation
sessions, with no routine design check-ins. The existing local AGENTS and canonical story
bible remain authoritative for this repository.

Baseline: `0357d4a` on `feat/intro-cinematic`; 167 passing tests and a clean production build.
Latest completed product pass: P8a reachable CRT transport; 181 passing tests.
P1–P7 bounded passes are complete. P8 has a verified integration checkpoint; the remaining
live interruption/landscape checks are listed below, not treated as complete.
The REPLACED study is complete. Only changes explicitly recorded below are implemented;
the remaining environmental-storytelling, machine-presence and evidence proposals are queued.

Schedule: hourly in this chat, renewed by the user for **October 1 through 6 PM
America/Los_Angeles** (October 2, 01:00 UTC). The September 28–29 sessions are closed;
today's finite renewal supersedes their deadlines only for this new session.
Automation ID: `gravity-hourly-improvement-passes`. Stop all edits at the deadline;
delayed runs after it must not make edits. This is finite work, not an indefinite mandate.
Local execution requires the computer to be awake and the desktop app running.

## Session protocol

1. Read this log, the research brief, local AGENTS, Git status and recent history. The working
   repo is `/Users/victoriarajaonarivony/Pyxel/Pyxel2`; do not edit its parent or Pyxel-2.
2. Pick the highest-value unfinished item that fits a roughly 40–50 minute session. A large
   item can span sessions; document the next concrete step. Never label an incomplete item done.
3. First inspect the current implementation. Several proposed-looking features already
   exist: four parallax planes, shared light/rim/reflection behavior, grounded soles, action
   recovery, story details and CRT controls. Refine them; do not duplicate them.
4. Make a focused original change. Preserve combat, speeds, source sprites, save IDs/version,
   reduced motion, the approved character designs and existing story decisions.
5. Test meaningful logic and run `npm test`, `npm run format:check`, `npm run build`, and
   `git diff --check`. Use the isolated origin `http://127.0.0.1:4197/` for browser checks;
   start Vite there if needed. Do not modify public Pages progress/settings. Don't require
   browser availability to do independent pure-logic work; keep unverified visuals explicit.
6. Review the change and save a local checkpoint commit of only this pass's work. Update
   QA and relevant project docs. Do not push, merge or publish; those still need a user request.
7. Append the run record below and update the consolidated status. Include what failed or was
   reverted. A rejected experiment with a reason is useful evidence, not a completed feature.

If another process has left edits, preserve them and avoid the same files until ownership is
clear. Do not spin on an unavailable tool. Pick independent work and record the limitation.
No broad refactor, new dependency or new rendering engine just to keep a session busy.

## Prioritized queue

Sequence is a priority order, not a promise that each item fits exactly one hour.

### P1 — Authored exploration framing · COMPLETE

- Add a pure camera-composition helper with a small number of landmark zones. Start in the
  studio (painting and receiver) to prove the design; then extend to street, Den and clinic.
- Use bounded horizontal focus bias and gentle transitions, not zoom or camera shake. Account
  for portrait view widths; keep Gravity and the subject visible. A screen-space HUD must not
  dictate world coordinates.
- Existing conversation subject framing, intro shots and combat camera stay authoritative.
  Reduced motion keeps stable framing without optional pans. Area entry must not inherit a
  previous room's bias. Keep camera clamped even when viewport width exceeds room width.
- Verify continuity across zone edges in both walking directions; no oscillation at rest;
  correct click-to-walk/marker registration; phone width; incoming doorway and map routes.
- Likely seams: new pure camera helper, the camera portion of `main.ts`; tests of boundaries.

### P2 — Light and value hierarchy · COMPLETE

- Inspect the strongest light in each room and its relation to Gravity's dark outfit, white
  boots, scarf and active clue. Improve one scene at a time; don't add a global tint wash.
- Address any duplicate halos or excessively broad haze in the current pass order. Anchor
  building bases and the train before adding low mist. Preserve source art and existing masks.
- Verify matched idle/examine screenshots and a moving light; capture the same pose at the
  same spot. A grayscale comparison can inform judgment, but isn't a substitute for viewing.
- Check reduced motion: no new stutters, flash or synchronized global pulse.

### P3 — Physical action contact · COMPLETE

- Inspect terminal, study and crouch poses in all four areas. Pick the worst actual mismatch.
  Add authored target information or a small reusable pose variant, rather than stretching
  the whole sprite to reach the object.
- Preserve original walking/sprinting art, planted boots, torso connectivity, scarf sockets
  and instant movement cancellation. Keep contact/recovery timing meaningful at low frame rates.
- Check character lab and gameplay together; extend geometry and timing tests where needed.

### P4 — Selective foreground depth · COMPLETE

- Improve one near-layer aperture, curtain or cabinet edge that makes a scene feel layered.
  Reuse existing plate pixels/code-native surfaces. Near props should bracket the actor and
  evidence; never place a dark stripe through the important pose.
- Verify anchoring in both directions and at camera limits. Preserve floor contact and mask
  bounds, especially on a narrow viewport. Prefer restrained occlusion to adding more fog.
- If real alpha asset work is needed, follow asset/skill instructions and keep the source.

### P5 — The room remembers the investigation · COMPLETE

- Extend the existing save-derived story-details system with one useful earned detail per
  under-served area. Start with a studio or Den detail; clinic marks already exist.
- Consider the research's original artist-trace, archived-imperfection or routine-paperwork
  treatments. Keep early states ambiguous and later states tied to actual recovered evidence.
- Prove fresh → earned → earlier checkpoint/case switch. No standalone visual memory that
  survives a save reset. No new lore revelation or mandatory clue without explicit design.

### P6 — Lyra's machine presence · COMPLETE

- Improve clarity of departure, occupied fixture and return using the existing shared signal
  position. The eye/light/reflection must agree; don't render a second active Lyra by accident.
- Prefer a precise machine reaction or restrained eye behavior over more particles. Verify
  interruption by walking, conversation, pause, scene travel and reduced motion.
- Do not change her identity, form, companion gates or unresolved origin.
- Observed in P2: receiver examinations send the eye/light to the clue marker at (1200,350),
  below the workbench. Ambient visits use the physical tube socket (1224,236). Resolve
  authored machine targets for examinations without moving interaction markers/approaches.
- Completed the bounded targeting pass: six existing machine clues share their physical
  ambient sockets. Shared signal timing, story gates and interruption lifecycle remain intact.
  Fixed-time renderer previews and pure signal tests verify occupancy/return; real-game
  conversation/travel interruptions remain part of P8's integration route.

### P7 — Human evidence and tactile close-ups · COMPLETE

- Add one short optional observation consistent with the bible, or improve one existing
  evidence illustration with a human trace that helps the current clue read.
- Keep the CRT and olive notebook. Avoid new mini-games, exposition dumps or collectible lists.
- Verify exact clue/deduction gating and no spoiler on a fresh save. Text must fit the mobile
  CRT and work with Previous/reveal controls; no blinking effect needed.
- Completed one original close-up: the clinic's existing signed consent. Folded/handled
  paper and declining pen fluency reinforce its existing observation; no new narrative gate.

### P8 — Measured performance and integration · PARTIAL

- Profile the most affected scenes with the existing development probe. Inspect real costs;
  don't claim FPS improvement from fewer update calls alone. Cache static work only where
  measurements or inspection justify it; don't retain visuals across save changes.
- Exercise four-area travel, first and repeated clue reads, case-board links, save/resume and
  phone layouts. Keep combat playtesting reserved for the user.
- Consolidate screenshots and a short review route with exact test conditions. Finish with a
  clean, reviewable checkpoint; use spare sessions for demonstrated regressions, not scope creep.
- P8a complete: fixed CRT transport, real portrait/landscape and reduced-motion reading,
  four-area travel/CPU samples, fresh and repeated clue, two new board links, reload and folder
  restoration. P8b remains: live walking/conversation interruption during Lyra's hop, continuous
  return observation, explicit rapid Reveal/E inputs and better landscape scene clearance.

### October 1 follow-up passes — QUEUED

Finish P8b first. After that, review the actual scenes and choose a demonstrated issue in
composition, character contact/continuity, foreground clearance, restrained lighting or
evidence readability. Add a named, bounded follow-up to this queue before implementation;
record the affected shot/player action and verification conditions. Don't add effects,
new cases or systems merely to fill the hourly schedule. Keep the approved story and art,
combat ownership and save compatibility fixed.

## End-of-day review route

Studio entrance → painting study → receiver contact → street/Mei → Memory Den archive →
clinic intake/cold storage → notebook and save/resume. Compare ordinary and reduced motion.
The final report should distinguish shipped local changes, deferred experiments, unverified
hardware behavior, and whether anything was published (currently: nothing).

## Consolidated status

- Research: complete; direct developer accounts plus official visual reference study recorded.
- Scheduling: renewed hourly for October 1 through 6 PM Pacific, in this conversation.
- P1: complete across street, studio, Den and clinic. Desktop/portrait comparisons, reduced
  motion and routes checked; screenshots and explicit hardware limits recorded below.
- P2: Den complete — clearer archive housing/glass, smaller flare, low steady condensation.
  Studio complete — localized warm bounce, restrained flares, corrected receiver light,
  mist below the bench. Clinic complete — diffuse cabinet light preserves cartridge rows.
  Street reviewed and retained; no global lighting rewrite. Verification limits remain below.
- P3: complete — reviewed representative actions across the four areas; raised the clinic
  console reach to its key strip. Body, soles, scarf socket and timing remain fixed.
- P4: complete — clinic screen now has hinged fabric leaves, open frame gaps and supported
  feet; existing parallax and actor-clearance fade retained.
- P5: complete — earned paper comparison beneath the studio painting, gated by both records
  and the voices deduction. Existing Den memory/clinic marks retained; restore behavior checked.
- P6: complete — physical examination targets share ambient sockets; receiver/spool occupy
  the tube, Den the column and clinic the cabinet controls. Labels/approaches stay fixed.
- P7: complete — original signed-consent close-up, shared by CRT/notebook, with paper wear
  and declining handwriting. Existing names, text, record ownership and deduction gates stay fixed.
- P8a: complete — long spoken text now scrolls inside a fixed CRT header/transport. Real
  portrait Close is fully visible; previous-line, pause/reduced-motion, travel, fresh clue,
  board matching, reload and folder restoration checked. Four ordinary idle CPU samples
  recorded; no speculative caching or FPS claim. P8b live hop interruptions and landscape
  clearance remain open. See the latest run record and QA for conditions.
- Public deployment: unchanged. Local checkpoint is the delivery boundary.
- The previous batch through `3f0fa2a` was subsequently pushed to the development branch
  at the user's request. Today's new passes remain local until another push request.
- Physical iPhone, audio by ear and combat feel remain user playtest items.

### September 29, 8 PM review handoff

Local changes since the research checkpoint: authored framing in four areas; restrained
Den/studio/clinic lighting; a higher clinic console reach; hinged clinic privacy screen;
earned studio comparison papers; six physical machine targets for Lyra; handled consent
paper with declining handwriting; and reachable CRT reading controls. Approved character
art, movement, combat, canon and save schema remain intact. All changes are local on
`feat/intro-cinematic`; GitHub Pages still shows the earlier deployed version.

For review, use the local preview on `127.0.0.1:4197`: studio painting/receiver → street →
Den → clinic consent/storage → notebook. Compare portrait and reduced motion. Local test
folder01 has 19 records/10 connections, awaiting the existing “Name the buyer with Lyra”
beat. Folder03, “Sep 29 reader QA,” has one fresh camera record; folder02 was preserved.
Public saves/settings are untouched. The remaining P8b checks are useful next work if the
user renews authorization; no work is assumed after tonight's 8 PM cutoff.

## Run log

### October 1, 11:20 AM Pacific — Renew the finite hourly schedule

Started from clean, synchronized `3f0fa2a` on `feat/intro-cinematic`. Recreated the deleted
thread heartbeat `gravity-hourly-improvement-passes`, confirmed ACTIVE with an hourly
recurrence ending at today's 6 PM Pacific cutoff. Start with P8b, not the already complete
P6 target pass. Updated the guide and queue so future runs have the current authorization.
Routine passes stay quiet; the final possible run closes the schedule and provides the
consolidated review. Local commits only; no new push/deployment authorization inferred.

This is a schedule/documentation checkpoint, not a new gameplay pass. No product files,
assets, saves or settings changed. Diff check passed; previous 181-test/build verification
belongs to `3f0fa2a`, not a new test run. Next: live Lyra return/interruption and rapid reader
inputs on the isolated preview, then a bounded landscape CRT clearance improvement.

### Research/setup — September 28 morning

Read the current story bible and rendering/staging code; researched publisher material and
four direct developer accounts; inspected three official stills and sampled the launch trailer.
Created the priority queue and finite hourly schedule. No gameplay changes in this research
checkpoint. Re-ran 167 tests plus build/format/diff checks successfully; this setup does not claim a
new gameplay/browser playtest. Next action: P1, the studio composition prototype.


### Pass 1 — September 28, 10:37 AM Pacific · Studio composition

Implemented a pure `exploration-camera.ts` helper, with two authored studio focal points:
the painting below the work bulb and the receiver’s glass cylinder. Smooth distance weighting
shares attention with the subject, capped at 64 world pixels / 8% of view width. Narrow views
shrink each zone’s reach. No facing-dependent snap, timer or persistent camera memory.
Existing tracking interpolation handles the movement; dialogue/intro remain authoritative.
Reduced motion disables the added bias. Other rooms and combat retain their original framing.
Constructor, resize, save restore and covered area swaps resolve the current room directly.

Validation: **172 tests passed**, format, production build and diff checks passed. New tests
sweep all zone boundaries/overlaps at five viewport widths for monotonic continuity; check
all studio clue approach positions from both directions; bound the bias and scene edges;
verify reduced motion, oversized views and independence from prior rooms. The first directional
assertion put the receiver beyond the room-edge camera clamp; corrected its sample to an
unclamped position while retaining separate edge-limit coverage. No implementation rollback.

Browser: isolated `127.0.0.1:4197`, folder 01. Compared the painting at the same saved position
before/after; inspected painting and receiver at 390 × 844, and receiver in reduced-motion
844 × 390. Opened painting/residue/receiver examinations, traversed studio → street → Den and
returned via map to the studio entrance; verified the entrance camera reset to zero and
repeated the painting approach. Normal motion and default viewport restored. A desktop floor click directly below the painting
landed with its marker at 45.10% (computed camera target: 45.11%, within pointer rounding),
and cleared the walking destination. No console errors.

Screenshots: [before](qa/2026-09-28-p1/gravity-p1-before-desktop.png),
[after](qa/2026-09-28-p1/gravity-p1-after-desktop.png),
[phone painting](qa/2026-09-28-p1/gravity-p1-phone-painting.png),
[phone receiver](qa/2026-09-28-p1/gravity-p1-phone-receiver.png),
[landscape / reduced motion](qa/2026-09-28-p1/gravity-p1-landscape-reduced.png).
These are composition comparisons, not synchronized animation frames.

Limits: camera-zone continuity is tested numerically rather than a recorded frame-by-frame
walk. Pointer activation in the phone browser was unreliable; exact semantic controls activated
by keyboard completed the examination checks. No physical iPhone, audio listening, intro
replay, combat playtest or full case playthrough. Save format/content and sprite assets unchanged;
only the isolated test folder progressed. No live saves/settings changed. Local checkpoint only.

Next: finish P1 in street/Den/clinic; author around existing visual subjects and apply the same
small-screen/route checks. P2 lighting work follows; do not inflate glow to compensate for framing.


### Pass 2 — September 28, 11:37 AM Pacific · District composition

Finished P1 by extending the same helper to seven physical landmarks: Mei’s window, the
Graves and Memory Den entrances, the Den’s paper archive and memory column, and the clinic’s
intake desk and cold-storage cabinet. No new tracking mechanism or extra motion. Ordinary
tracking survives between zones, all previous limits remain, and the studio’s targets are
unchanged. Focal points do not depend on hidden records, objectives or save progress.
Combat still takes the existing unmodified opt-out path in `Game.explorationView`; no combat
code, sprite, speed, save schema or narrative content changed.

Validation: **175 tests passed**, format, strict TypeScript/production build and diff checks
passed. Expanded continuity/bounds/approach tests to every area at six internal view widths
(300, 390, 460, 620, 960, 1280). Added checks for all seven new focal points, talk-subject
visibility at minimum width, unaffected quiet stretches and the prior studio targets.
The targeted suite passed again after adding the browser’s actual 460-pixel portrait width.

Browser: used only `127.0.0.1:4197`, folder 01. Captured matched-position desktop comparisons
of the street near Graves (door marker 57.34% → 53.56%), archive (53.94% → 51.32%), and cold
storage (53.94% → 51.50%). These shifts are deliberately small. Checked all three in 390 × 844
portrait, Den in 844 × 390 landscape, and toggled reduced motion in the Den: archive marker
55.87% → original 60.39% at internal width 460. Restored normal motion/default viewport.
Resumed the street checkpoint after reload, used the studio doorway at phone width, routed
studio → street → Den, and took the train from Den to clinic. Archive and cold-storage
examinations retained their CRT framing. A floor click back toward intake completed correctly;
then examined the ledger from the right and checked its phone composition. No console errors.

Screenshots in [the pass evidence folder](qa/2026-09-28-p1-scenes/):
[street before](qa/2026-09-28-p1-scenes/street-before.png) /
[after](qa/2026-09-28-p1-scenes/street-after.png) /
[phone](qa/2026-09-28-p1-scenes/street-phone.png);
[Den before](qa/2026-09-28-p1-scenes/den-before.png) /
[after](qa/2026-09-28-p1-scenes/den-after.png) /
[phone](qa/2026-09-28-p1-scenes/den-phone.png) /
[landscape reduced](qa/2026-09-28-p1-scenes/den-landscape-reduced.png);
[clinic before](qa/2026-09-28-p1-scenes/clinic-before.png) /
[after](qa/2026-09-28-p1-scenes/clinic-after.png) /
[phone](qa/2026-09-28-p1-scenes/clinic-phone.png) /
[intake phone](qa/2026-09-28-p1-scenes/intake-phone.png).
Motion/light/traffic phases differ between captures; they establish composition, not lighting changes.

Limits: no physical iPhone, fresh-case/full-story playthrough, intro replay, combat or audio
listening. Numerical sweeps cover all zone edges; there is no recorded frame-by-frame walk.
Phone checks use semantic keyboard activation, not a new claim of physical tap verification.
Mei’s window, Den doorway and paper-register bias have numerical coverage; the matched
browser comparison subjects were Graves, the memory column, and cold storage.
Only isolated test progress changed. No new dependency or imported asset. Nothing published.

Next: P2, a focused Den lighting pass. Inspect `renderer.ts` fixture halo/flare plus the broad
600 × 350 screen-blended mist over the archive, `drawInteriorMood`, `interiorFinish` and
`roomVeil` before changing anything. The column is already the subject; reduce competing
wash and retain glass/frame detail, Gravity’s silhouette and Lyra’s source-consistent glow.
Use matched reduced-motion captures for the still comparison and normal motion for live checks.


### Pass 3 — September 28, 12:37 PM Pacific · Memory Den light balance

Inspected the source Den plate and the existing halo, flare, edge sheen, ambient mist,
interior mood, glass finish and veil passes before editing. The source already carries strong
projection rings; runtime overlays softened the housing and created a large pale hotspot.
Kept the source art and all existing systems. Reduced memory-column intensity 2.4 → 1.85,
flare scale .34 → .18 and monitor-wall intensity 1.3 → 1.1. The shared fixture values continue
to feed halos, cached edge sheen and Gravity's rim. Replaced the breathing 600 × 350 mist wash
(alpha .125–.175) with a steady 340 × 66 condensation pocket (alpha .055) at the plinth.
Lyra's light strength, eye, projection beam, machine hops and reflection remain unchanged.
No new art, dependencies, movement, combat, save or narrative changes; no rejected experiment.

Validation: **175 tests passed**, formatting, strict TypeScript/production build and diff
checks passed. No new tests for visual constants; existing behavior coverage was rerun.
Isolated browser `127.0.0.1:4197`, folder 01: resumed after reload at the same archive position
(x763, marker 53.94% at internal width 960). Matched reduced-motion idle and held terminal
examination views show the narrower highlight and clearer housing/glass without flattening
the projection. Inspected 390 × 844 portrait reduced motion and 844 × 390 landscape normal
motion. Normal archive re-examination preserves the beam; “Listen beneath the memory” moves
Lyra's light to the machine and darkens the shell eye; closing restores the lit drone and its
floor pool. Normal motion/default viewport restored. No console errors observed.

Screenshots: [idle before](qa/2026-09-28-p2-den/den-before-idle.png) /
[after](qa/2026-09-28-p2-den/den-after-idle.png),
[examine before](qa/2026-09-28-p2-den/den-before-examine.png) /
[after](qa/2026-09-28-p2-den/den-after-examine.png),
[portrait reduced](qa/2026-09-28-p2-den/den-phone-reduced.png),
[normal examination](qa/2026-09-28-p2-den/den-normal-examine.png),
[occupied machine](qa/2026-09-28-p2-den/den-occupied-machine.png) /
[returned drone](qa/2026-09-28-p2-den/den-normal-return.png),
[landscape](qa/2026-09-28-p2-den/den-landscape.png).

Limits: moving-light screenshots establish occupied/returned states, not a frame-by-frame
recording of the short transit arc. CRT obscures the upper machine during dialogue. Mobile
screenshots use desktop viewport emulation and semantic keyboard activation; existing compact
landscape/portrait HUD still overlaps some lower character pixels. No layout changes in this
pass, physical iPhone, audio listening, combat, intro replay or fresh/full-story test. No
performance claim. Public saves/settings untouched. Local checkpoint only; nothing published.

Next: continue P2 in the studio. Compare the warm wash near the painting and the broad mist
around the receiver against their source plate, using matched reduced-motion idle/action views.
Inspect the street's building/train hierarchy and clinic afterward; preserve scenes that already
read well rather than applying the Den's values globally. P3–P8 remain queued.


### Pass 4 — September 28, 1:37 PM Pacific · Studio light balance

Reviewed the source plate and runtime halo/flare/sheen, warm wash, mist, pigment flecks,
glass finish and dust. Kept the warm painting/cold machinery contrast in the existing art.
Reduced bulb intensity 2.1 → 1.7 and flare .30 → .18; receiver intensity 1.6 → 1.25 and
flare .22 → .12. The receiver catch visibly sat beside its tube. Measured the stretched
1500 × 540 runtime plate (not an aspect-preserving crop): cyan tube peaks at x1223–1224.
Moved its fixture and Lyra's ambient socket from x1251 to x1224, retaining y236. The existing
fixture values still drive halo, sheen and actor rim. No camera, clue or approach changes.

Replaced the studio's shared breathing wash with steady local treatment: warm bounce
360 × 300 at .045 opacity below the bulb, and damp haze 260 × 68 at .04 below the receiver
bench. Preserved window light, pigment flecks, source art, existing flicker timing and
Lyra's independent signal strength. No new assets/dependencies, animation/speed changes,
combat, save schema or story changes. No implementation rollback.

Validation: **175 tests passed**, format, strict TypeScript/production build and diff checks
passed. No new assertions for art-direction constants. Browser used isolated `127.0.0.1:4197`,
folder 01, 19 records / 8 deductions. Followed Den → street → studio via the map, resumed the
receiver position after reload, repeated painting/receiver examinations, and compared idle
views in reduced motion: painting marker 53.83%, receiver 68.75% at internal width 960, before
and after. Painting study captures have a small framing difference because reduced-motion
examination freezes the camera's remaining arrival interpolation; idle comparisons are aligned.
Receiver idle and examination comparisons are aligned at the room-edge camera clamp.

Checked painting at 390 × 844 with reduced motion, receiver at 390 × 844 in normal motion,
and room at 844 × 390. Normal receiver examination dims Lyra's shell and moves its light
out; closing restores her lit eye/floor pool. New ambient socket coordinates were inspected
in code but the short ambient visit was not separately captured. No console errors. Normal
motion and default viewport restored. A return floor click selected the unfinished-portrait
marker instead; closed that examination and used exact semantic controls afterward. This
file gained the existing portrait and testimony revisit notes; no public save was touched.

Evidence: [painting idle before](qa/2026-09-28-p2-studio/painting-before-idle.png) /
[after](qa/2026-09-28-p2-studio/painting-after-idle.png),
[study before](qa/2026-09-28-p2-studio/painting-before-study.png) /
[after](qa/2026-09-28-p2-studio/painting-after-study.png),
[receiver idle before](qa/2026-09-28-p2-studio/receiver-before-idle.png) /
[after](qa/2026-09-28-p2-studio/receiver-after-idle.png),
[receiver examination before](qa/2026-09-28-p2-studio/receiver-before-examine.png) /
[after](qa/2026-09-28-p2-studio/receiver-after-examine.png),
[painting portrait](qa/2026-09-28-p2-studio/painting-phone-reduced.png),
[receiver portrait](qa/2026-09-28-p2-studio/receiver-phone.png),
[normal examination](qa/2026-09-28-p2-studio/receiver-normal-examine.png),
[landscape](qa/2026-09-28-p2-studio/studio-landscape.png).

Limits: examination machine targeting remains at the clue marker and can look detached from
the physical machine; recorded concrete P6 follow-up above. No new physical iPhone/touch,
audio listening, combat, intro, fresh-case/full-story or performance test. Phone controls
still overlap lower actor pixels in compact layouts. Static captures are not a transit-arc
recording. Local checkpoint only; nothing pushed/published. Next: finish P2 by inspecting
street/train and clinic hierarchy, changing only demonstrated problems; then P3 action contact.


### Pass 5 — September 28, 2:37 PM Pacific · Clinic light and street review

Finished the first P2 review. Inspected the street at Mei's window and the street camera,
plus its cached midground, continuous foundation/rail support, fog and train drawing order.
Dark middle buildings remain separated from the distant skyline and the warm frontage;
retained the existing street treatment. No street/combat rendering changes. Train carriages
were not present in the saved stills, so their current colors/order were reviewed in code.

The clinic source plate shows individually lit cartridge rows, but the runtime point flare
bleached the middle shelf. Removed that cold-storage flare and reduced its fixture intensity
1.7 → 1.35. Existing halo, sheen, air and actor-rim consumers inherit the same value. Kept
fixture position/color/flicker, low cabinet mist, ceiling lights, warm intake lamp, red terminal,
Lyra's signal strength and reflections. No new rendering system, asset, dependency, animation,
speed, save, story or combat changes. No rejected/reverted implementation.

Validation: **175 tests passed**, format, strict TypeScript/production build and diff checks
passed. No new test for an art-direction constant. Browser: isolated `127.0.0.1:4197`, folder
01 (19 records / 8 deductions). Traveled studio → street/Mei → street camera → clinic by map
and train; reopened camera and cold-storage examinations. Reload/resume preserved the cabinet
approach. Reduced-motion idle before/after uses the same marker position 53.94%, internal
width 960; middle-row cartridge colors now remain visible. Examination captures show the same
held action but have a small camera difference from arrival interpolation freezing when the
reduced-motion dialogue opens. Treat idle captures as the aligned lighting comparison.

Checked portrait 390 × 844 in reduced motion, normal-motion cabinet examination/return and
landscape 844 × 390. Lyra's shell eye dims during machine occupancy and relights on return;
her active glow still reads against the dimmer cabinet. Default viewport and normal motion
restored. No console errors. Only the isolated test file gained the existing camera revisit
note; public saves/settings untouched.

Evidence: [street / Mei](qa/2026-09-28-p2-clinic/street-review-mei.png),
[central street](qa/2026-09-28-p2-clinic/street-review-central.png),
[clinic arrival](qa/2026-09-28-p2-clinic/clinic-entry-review.png),
[cabinet idle before](qa/2026-09-28-p2-clinic/cabinet-before-idle.png) /
[after](qa/2026-09-28-p2-clinic/cabinet-after-idle.png),
[examine before](qa/2026-09-28-p2-clinic/cabinet-before-examine.png) /
[after](qa/2026-09-28-p2-clinic/cabinet-after-examine.png),
[portrait reduced](qa/2026-09-28-p2-clinic/cabinet-phone-reduced.png),
[normal examination](qa/2026-09-28-p2-clinic/cabinet-normal-examine.png),
[landscape](qa/2026-09-28-p2-clinic/clinic-landscape.png).

Limits: no physical iPhone/touch, audio listening, combat, intro, fresh/full-story or measured
performance pass. Mobile uses viewport emulation and semantic keyboard controls; compact HUD
still covers lower actor pixels. Screenshots show occupied/returned states, not transit-arc
motion. Street review sampled two views; no new full train-pass capture. P2 completion means
this bounded scene-lighting review is done, not that every lighting/material issue is exhausted.
Local checkpoint only; no push/publication. Next: P3. Audit physical study/terminal/crouch
contact across the four areas, beginning with the clinic's cabinet/control height and studio
receiver workbench. Keep the already-recorded Lyra fixture-target mismatch for P6.

### Pass 6 — September 28, 3:38 PM Pacific · Meet the wall console's controls

P3's first contact review is complete. Sampled clinic cold storage, outbound terminal and
crate-seal crouch; studio painting study, residue crouch and receiver bench reach; Den archive
reach; street camera inspection and Mei listening. The clearest mismatch was the clinic's
outbound console: the low reach held Gravity's hand below the wall-mounted key strip.

Added one `terminal-high` derivative to the existing pixel-pose system and selected it only
for the `sale` examination. The forearm rises through an intermediate frame, then holds near
the console's lower controls (approximately world y295). The torso, head, boots, floor pivot
and scarf socket remain fixed; no affine stretch or new sprite asset. It retains the low
terminal action's 0.68 s settle, existing 0.55 s staging lead and 0.3 s recovery. Reduced motion
uses the finished pose immediately. The shared character lab exposes “Terminal / raised
controls”; palette adaptation, light/rim, shadows and reflection still use the shared frames.
Other machines retain their low reach. No speed, input, camera, combat, save, story or Lyra
changes. No new dependency/source art, no rejected implementation.

Validation: **177 tests passed** (two new tests), format, strict TypeScript/production build
and diff checks passed. Geometry coverage includes the new frames' connectivity, sole pixels,
scarf sockets, unchanged body outside the arm, fingertips intersecting the console key region
from either side, reduced-motion selection and movement cancellation of recovery. Existing
movement/combat frame timing and all save tests still pass. Game JS 233.54 kB / 78.08 kB gzip;
this is not a performance measurement.

Browser: isolated `127.0.0.1:4197`, folder 01, 19 records / 8 deductions. Captured the console
before/after from the left in normal motion at the same room-edge camera clamp; inspected the
mirrored right approach and steady reduced-motion hold. The same held pose and middle frame
were inspected in the lab, including the source palette and left-facing silhouette. Revisited
the representative interactions above via normal map/door routes; retained their existing
poses. The studio low reach meets the bench edge; study stays contemplative, crouches keep
their boots connected, and Den/street gestures remain observations rather than forced touches
on high glass/cameras. No console errors. Normal motion/default viewport restored; temporary
lab closed. Only the isolated test file/settings were used, with public saves untouched.

Evidence: [console before](qa/2026-09-28-p3-contact/terminal-before.png) /
[after](qa/2026-09-28-p3-contact/terminal-after.png),
[right approach](qa/2026-09-28-p3-contact/terminal-right-approach.png),
[desktop reduced motion](qa/2026-09-28-p3-contact/terminal-desktop-reduced.png),
[portrait reduced](qa/2026-09-28-p3-contact/terminal-portrait-reduced.png) /
[landscape reduced](qa/2026-09-28-p3-contact/terminal-landscape-reduced.png),
[lab held pose](qa/2026-09-28-p3-contact/lab-raised.png) /
[middle frame, left](qa/2026-09-28-p3-contact/lab-middle-left.png),
[studio study](qa/2026-09-28-p3-contact/studio-study-review.png) /
[crouch](qa/2026-09-28-p3-contact/studio-crouch-review.png) /
[receiver](qa/2026-09-28-p3-contact/studio-receiver-review.png),
[Den archive](qa/2026-09-28-p3-contact/den-archive-review.png),
[street listening](qa/2026-09-28-p3-contact/street-listen-review.png) /
[inspection](qa/2026-09-28-p3-contact/street-inspect-review.png).

Limits: sampled actions, not every hotspot or every transit/recovery frame. Phone previews
(requested 390 × 844 and 844 × 390) expose a pre-existing limitation: the CRT and evidence
card obscure most of Gravity while dialogue is open. They verify reading/dismissal layout,
not visible hand contact; the desktop reduced-motion image and geometry tests establish that.
No physical iPhone/touch, audio listening, fresh/full-story, combat or performance pass.
Lyra's below-bench examination target remains the separate P6 issue. Local checkpoint only;
no push/publication. Next: P4 selective foreground depth—inspect an existing aperture/edge
before adding detail, checking both travel directions and narrow-screen actor visibility.

### Pass 7 — September 28, 4:39 PM Pacific · Folded foreground screen

P4 complete with one clinic-only scenery change. Reviewed `drawInteriorForeground`, near
architecture/furniture, glass relief and compositor ordering. The privacy screen at x790
was three coplanar solid rectangles: it read as a cabinet despite its intended fabric.
Reworked those same leaves into a shallow zigzag with shared hinge positions. Each leaf has
an angled top/bottom rail, suspended worn fabric, an open strip above and below the cloth,
stitching and attachment loops. Four shared stiles end in separate feet and contact shadows.
The dark alternate face gives depth without a new light source or haze.

Every part uses the existing `cam * 1.075` near-plane transform. Preserved the screen's
existing whole-object `foregroundAlpha` fade and approximate footprint, so crossing Gravity
stays readable. No new sway, clock, state, asset, dependency or compositing pass. Original
plates and the clinic drip stand are untouched. No actor, speed, combat, save or story changes;
no implementation rollback.

Validation: **177 tests passed**, formatting, strict TypeScript/production build and diff
checks passed. No new constant-mirroring tests for code-drawn scenery; retained clearance,
arrival, camera and character tests were rerun. Game JS 234.10 kB / 78.27 kB gzip. No measured
performance claim.

Browser: isolated `127.0.0.1:4197`, folder 01, 19 records / 8 deductions. Matched entry views
use the normal train arrival and left camera clamp; cabinet idle before/after shares marker
51.50% at internal width 960. Normal-motion light/idle phases differ; compare screen geometry,
not illumination. Resumed the cabinet checkpoint after reload. Crossed right-to-left with
floor clicks, returned by the street/train and crossed left-to-right toward cold storage;
checked a held overlap view and the right camera stop at outbound crates. Supports, fabric
and hinges stayed together; the screen fades as a unit over Gravity. Existing cabinet/crate
examinations still open normally.

Checked portrait reduced motion (requested 390 × 844, internal canvas width 460), a narrow
floor-click crossing, and landscape reduced motion (844 × 390). The existing compact HUD
covers some lower actor/foreground pixels; the open screen adds no new opaque barrier.
Normal motion/default viewport restored. No console errors. Public save/settings untouched;
only the isolated test file was used.

Evidence: [entry before](qa/2026-09-28-p4-screen/entry-before.png) /
[after](qa/2026-09-28-p4-screen/entry-after.png),
[cabinet before](qa/2026-09-28-p4-screen/cabinet-before.png) /
[after](qa/2026-09-28-p4-screen/cabinet-after.png),
[overlap](qa/2026-09-28-p4-screen/overlap-after.png),
[solid screen](qa/2026-09-28-p4-screen/solid-screen-after.png),
[portrait reduced](qa/2026-09-28-p4-screen/portrait-reduced.png) /
[narrow crossing](qa/2026-09-28-p4-screen/portrait-crossing.png) /
[landscape reduced](qa/2026-09-28-p4-screen/landscape-reduced.png),
[right camera stop](qa/2026-09-28-p4-screen/right-camera-stop.png).

Limits: static snapshots and normal navigation, not a frame-by-frame crossing recording.
No physical iPhone/touch, audio listening, fresh/full-story, combat or performance test.
Reduced motion preserves the prior near-plane camera response; this pass introduces no
independent motion. Compact HUD obscuration and P6 machine targeting remain separate follow-ups.
Local checkpoint only; nothing pushed/published. Next: P5, one earned studio/Den detail from
held records using `story-details.ts`; verify fresh, earned and restored earlier states.


### Pass 8 — September 28, 5:40 PM Pacific · P5 studio witness comparison

Starting checkpoint `8f23dba`; clean working tree. Read local guide, canon, research, queue,
existing story-details and narrative before choosing work. Den already preserves the bird
from the resolved memory; clinic already has earned marks. Extended the studio instead.

`story-details.ts` now derives `witnessComparison` from studio location, held `diary` and
`painting` records, and the existing `voices` deduction. Two small worn paper copies hang
from the painting's bottom rail: journal lines and a rough face study carry the same unlit
mark. Metal clips, folded corners, subdued paper, pencil and contact shadows attach them
to the room. This visualizes the existing connection; no new clue, dialogue, required
interaction, canonical revelation, save field, source asset, motion or light. First bright
paper experiment was darkened/textured after preview to sit within the scene's values.

**179 tests passed**, formatting, strict TypeScript/production build and diff check passed.
Two new tests cover collection-versus-deduction, missing records, other areas, serialized
restores, fresh-file switching, immutability and version 1. Existing Den/clinic tests pass.
Game JS 235.33 kB / 78.67 kB gzip; not a performance claim.

Verification used isolated `127.0.0.1:4197`:
- A temporary storage-free fixture called the production Renderer, CaseModel and parseSave.
  Fresh → both records → connected → restored before connection → earned → fresh file →
  earned all rendered correctly using one renderer, proving no stale papers across cases.
  Fixed time 12 (reduced renderer time 0), Gravity x740, camera350 at width960; a normal
  width460/camera550 view checked placement. Enlarged crop shows attachment and paper finish.
  The fixture was removed after verification; no archive or preference writes through it.
- Real game folder01 (19 records / 8 connections): clinic→studio map route, resume, painting
  approach/re-examination and close. The earned papers sit on the rail behind Gravity,
  beside the existing examined tab. Portrait and landscape reduced-motion previews requested
  at 390×844 / 844×390 keep the detail attached. Small landscape scale and compact HUD still
  constrain scene visibility. Normal motion/default viewport restored; preview left at painting.
- Browser console errors: none in fixture or game. A browser checkbox click failed to toggle;
  the native Space control worked and state was verified. No physical-phone conclusion.

Evidence: [fresh](qa/2026-09-28-p5-memory/fresh.png),
[collected only](qa/2026-09-28-p5-memory/collected.png),
[earned](qa/2026-09-28-p5-memory/earned.png),
[earlier restore](qa/2026-09-28-p5-memory/restored.png),
[fresh-file switch](qa/2026-09-28-p5-memory/switched-fresh.png),
[narrow normal](qa/2026-09-28-p5-memory/narrow-normal.png),
[game](qa/2026-09-28-p5-memory/game-earned.png),
[portrait](qa/2026-09-28-p5-memory/game-portrait-reduced.png),
[landscape](qa/2026-09-28-p5-memory/game-landscape-reduced.png).

Limits: checkpoint switching was exercised through the production parser/model in a synthetic
fixture, not the archive UI; no full fresh story replay, physical touch/iPhone, audio, combat
or measured performance pass. This detail is intentionally secondary scenery, not a readable
record at phone scale. Public saves/settings untouched. Local checkpoint only, no publication.
P5 is complete for this bounded pass: studio now has deduction-specific scenery; existing
Den/clinic changes remain sufficient. Next: P6, align Lyra's examination target with the
receiver tube socket (1224,236), preserving clue marker/approach and one shared light signal.


### Pass 9 — September 29, 4:54 PM Pacific · P6 physical machine targets

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


### Pass 10 — September 29, 5:56 PM Pacific · P7 tactile signed consent

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

### Pass 11 — September 29, 6:56 PM Pacific · P8a reachable CRT transport and integration

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

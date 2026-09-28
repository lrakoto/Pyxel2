# Hourly improvement passes — September 28, 2026

## Mission and current checkpoint

Improve GRAVITY's visual direction, animation and investigation using
[REPLACED_RESEARCH.md](REPLACED_RESEARCH.md). The user authorized autonomous implementation
sessions, with no routine design check-ins. The existing local AGENTS and canonical story
bible remain authoritative for this repository.

Baseline: `0357d4a` on `feat/intro-cinematic`; 167 passing tests and a clean production build.
Latest completed product pass: P1 composed exploration across all four areas; 175 passing tests.
The REPLACED study is complete. Only changes explicitly recorded below are implemented;
the remaining camera/material/acting proposals are still queued.

Schedule: hourly in this chat, through September 28 at 11:59 PM America/Los_Angeles.
Automation ID: `gravity-hourly-improvement-passes`. Delayed runs after that date must not
make edits. This is a finite day of work, not an indefinite background mandate.
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

### P2 — Light and value hierarchy · TODO

- Inspect the strongest light in each room and its relation to Gravity's dark outfit, white
  boots, scarf and active clue. Improve one scene at a time; don't add a global tint wash.
- Address any duplicate halos or excessively broad haze in the current pass order. Anchor
  building bases and the train before adding low mist. Preserve source art and existing masks.
- Verify matched idle/examine screenshots and a moving light; capture the same pose at the
  same spot. A grayscale comparison can inform judgment, but isn't a substitute for viewing.
- Check reduced motion: no new stutters, flash or synchronized global pulse.

### P3 — Physical action contact · TODO

- Inspect terminal, study and crouch poses in all four areas. Pick the worst actual mismatch.
  Add authored target information or a small reusable pose variant, rather than stretching
  the whole sprite to reach the object.
- Preserve original walking/sprinting art, planted boots, torso connectivity, scarf sockets
  and instant movement cancellation. Keep contact/recovery timing meaningful at low frame rates.
- Check character lab and gameplay together; extend geometry and timing tests where needed.

### P4 — Selective foreground depth · TODO

- Improve one near-layer aperture, curtain or cabinet edge that makes a scene feel layered.
  Reuse existing plate pixels/code-native surfaces. Near props should bracket the actor and
  evidence; never place a dark stripe through the important pose.
- Verify anchoring in both directions and at camera limits. Preserve floor contact and mask
  bounds, especially on a narrow viewport. Prefer restrained occlusion to adding more fog.
- If real alpha asset work is needed, follow asset/skill instructions and keep the source.

### P5 — The room remembers the investigation · TODO

- Extend the existing save-derived story-details system with one useful earned detail per
  under-served area. Start with a studio or Den detail; clinic marks already exist.
- Consider the research's original artist-trace, archived-imperfection or routine-paperwork
  treatments. Keep early states ambiguous and later states tied to actual recovered evidence.
- Prove fresh → earned → earlier checkpoint/case switch. No standalone visual memory that
  survives a save reset. No new lore revelation or mandatory clue without explicit design.

### P6 — Lyra's machine presence · TODO

- Improve clarity of departure, occupied fixture and return using the existing shared signal
  position. The eye/light/reflection must agree; don't render a second active Lyra by accident.
- Prefer a precise machine reaction or restrained eye behavior over more particles. Verify
  interruption by walking, conversation, pause, scene travel and reduced motion.
- Do not change her identity, form, companion gates or unresolved origin.

### P7 — Human evidence and tactile close-ups · TODO

- Add one short optional observation consistent with the bible, or improve one existing
  evidence illustration with a human trace that helps the current clue read.
- Keep the CRT and olive notebook. Avoid new mini-games, exposition dumps or collectible lists.
- Verify exact clue/deduction gating and no spoiler on a fresh save. Text must fit the mobile
  CRT and work with Previous/reveal controls; no blinking effect needed.

### P8 — Measured performance and integration · TODO

- Profile the most affected scenes with the existing development probe. Inspect real costs;
  don't claim FPS improvement from fewer update calls alone. Cache static work only where
  measurements or inspection justify it; don't retain visuals across save changes.
- Exercise four-area travel, first and repeated clue reads, case-board links, save/resume and
  phone layouts. Keep combat playtesting reserved for the user.
- Consolidate screenshots and a short review route with exact test conditions. Finish with a
  clean, reviewable checkpoint; use spare sessions for demonstrated regressions, not scope creep.

## End-of-day review route

Studio entrance → painting study → receiver contact → street/Mei → Memory Den archive →
clinic intake/cold storage → notebook and save/resume. Compare ordinary and reduced motion.
The final report should distinguish shipped local changes, deferred experiments, unverified
hardware behavior, and whether anything was published (currently: nothing).

## Consolidated status

- Research: complete; direct developer accounts plus official visual reference study recorded.
- Scheduling: active hourly for today; local-file automation, in this same conversation.
- P1: complete across street, studio, Den and clinic. Desktop/portrait comparisons, reduced
  motion and routes checked; screenshots and explicit hardware limits recorded below.
- P2: next, beginning with the Den’s broad archive glow and competing light layers.
- P3–P8: queued.
- Public deployment: unchanged. Local checkpoint is the delivery boundary.
- Physical iPhone, audio by ear and combat feel remain user playtest items.

## Run log

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

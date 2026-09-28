# Hourly improvement passes — September 28, 2026

## Mission and current checkpoint

Improve GRAVITY's visual direction, animation and investigation using
[REPLACED_RESEARCH.md](REPLACED_RESEARCH.md). The user authorized autonomous implementation
sessions, with no routine design check-ins. The existing local AGENTS and canonical story
bible remain authoritative for this repository.

Baseline: `0357d4a` on `feat/intro-cinematic`; 167 passing tests and a clean production build.
Latest completed product pass: CRT Previous/reveal controls and native keyboard activation.
The REPLACED study is complete. Its proposed camera/material/acting changes are **not yet
implemented** merely because they are listed here.

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

### P1 — Authored exploration framing · TODO

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
- P1–P8: queued; future sessions must update each status honestly.
- Public deployment: unchanged. Local checkpoint is the delivery boundary.
- Physical iPhone, audio by ear and combat feel remain user playtest items.

## Run log

### Research/setup — September 28 morning

Read the current story bible and rendering/staging code; researched publisher material and
four direct developer accounts; inspected three official stills and sampled the launch trailer.
Created the priority queue and finite hourly schedule. No gameplay changes in this research
checkpoint. Re-ran 167 tests plus build/format/diff checks successfully; this setup does not claim a
new gameplay/browser playtest. Next action: P1, the studio composition prototype.

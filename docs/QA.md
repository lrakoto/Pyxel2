# Validation record

Two passes are recorded below. The September 8 pass covers the scene
atmosphere work and is deliberately narrower than the September 4 one: it
re-ran the automated checks and verified rendering, but did **not** repeat the
manual playthrough. Treat the September 4 playthrough as the last full
gameplay validation.

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

# Validation record

Validated September 4, 2026, using Node 25.8.2 and the Codex in-app browser.

## Automated checks

* `npm test`: **15 passed, 0 failed**. Covers invalid saves, clue deduplication, earned story gates, all six deduction orders, checkpoint round-tripping, valid door destinations, scene bounds, landing, no airborne re-jump, segment collision, projectile damage/cadence/expiry, invulnerability, bounded down state, two-wave completion, distinct parallax speeds, reversed reflection sampling, and routes through the street hub.
* `npm run build`: strict TypeScript check and production build passed.
* `npm run format:check`: passed.
* `npm run optimize-art`: all five generated WebP files matched their PNG masters after RGBA decoding.
* Dependency installation/audit reported **0 vulnerabilities** after updating the image conversion tool to Sharp 0.35.4. Sharp is not shipped in the browser app.
* Production HTTP check: the entry page, sprite manifest, five environment images, and eight font files all returned 200 with appropriate content types.

## Production payload

Decimal kB, as reported by Vite:

| Payload | Original | Pyxel2 |
| --- | ---: | ---: |
| JavaScript | 683.60 kB | 70.02 kB |
| JavaScript, gzip | 180.52 kB | 24.43 kB |
| CSS | 13.85 kB | 32.92 kB |
| CSS, gzip | 3.59 kB | 8.14 kB |

The new environment delivery assets total 8,259,322 bytes; the PNG source masters total 10,721,232 bytes. Local fonts and their license files total 551,467 bytes. These art/font costs are separate from the code sizes above. No frame-rate speedup has been measured or claimed.

## Browser playthrough

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

## Responsive and interaction checks

* Desktop: inspected the street, studio, Den, case board, settings, companion choice, combat, and ending.
* 390 × 844: verified title/world framing, map, evidence cards, sticky connection action, selection retention, and visible movement/action controls.
* 844 × 390: verified the title and start button fit after correcting a clipped-button issue.
* Restored the normal viewport after testing.
* Set volume to zero and enabled reduced motion, reloaded, and verified both values persisted. Restored normal effect settings afterward.
* Verified a studio-to-Den map route continues through the street automatically.
* Corrected the obsolete street Lyra marker after companion activation, focus-button state after restarting, accessible case-board naming at narrow widths, and independent touch-pointer release handling.
* The browser’s captured console contained no warnings or errors at the final development check.

## Practical limits

Real-device multitouch, controller input, Safari, Firefox, low-end hardware performance, and long-session memory profiling were not tested. Imported Aseprite content falls back cleanly when absent; no new hand-drawn sheets were authored for this rebuild. The game is a playable chapter, with further production art and campaign work explicitly outside this slice.

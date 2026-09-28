# REPLACED study → GRAVITY direction

Research date: September 28, 2026. GRAVITY baseline: `0357d4a` on
`feat/intro-cinematic`. This is an implementation brief, not a change to canon.
The execution queue and run log live in [HOURLY_PASSES.md](HOURLY_PASSES.md).

## Recommendation

Keep our Canvas 2D renderer and approved pixel characters. Spend the next passes on
**composition, clear lighting, physical contact, and evidence embedded in the world**.
We already have enough atmosphere systems; indiscriminately adding bloom, particles or fog
would obscure the strongest art and revive the washed-out buildings problem.

The useful ambition is a scene in which the picture, movement and information all direct the
player toward the same thing. Gravity's distinctive version is an observant detective who
reads human meaning in an automated city. Lyra helps interpret machines. Neither needs a
new identity, combat system or engine to make this feel more cinematic.

## Evidence and limits

I read developer interviews and publisher material, inspected three full official screenshots
in the browser, and sampled the publisher-linked launch trailer during playback. This was
not a complete playthrough or an exhaustive frame-by-frame animation study. Timing values
below are proposed GRAVITY tuning targets, not measurements of REPLACED. The official gallery
contains images uploaded in 2025; treat those as composition references, not proof of final
release behavior. The publisher lists REPLACED's release as April 14, 2026. Its premise is an
AI in a human body investigating Phoenix Corporation in an alternate 1980s America.
[Publisher overview](https://thunderfulgames.com/games/replaced/).

### What the makers describe

- **Authored cinematography and stylized environments.** Director Yura Zhdanovich describes
  stylized 3D environments with 2D characters; cinematographer Jaime Delmonte describes
  deliberately authored cameras. Their discussion of lamps and sprite grounding reinforces
  the importance of local light placement. This is evidence for their process, not proof
  that we need their renderer. [Direct developer interview, Bonus Action](https://bonus-action.com/feature/replaceds-director-taught-himself-everything-from-scratch-to-make-the-most-beautiful-pixel-art-game-of-the-year-i-just-got-a-keen-eye-on-things/).
- **Animation serves physical identity.** Zhdanovich describes hand-authored frame animation,
  an emphasis on weight, and coordination between movement, lighting and camera. His account
  says experiments with 3D character animation lacked their desired cohesion. That choice
  supports our decision to improve the pixel character instead of replacing Gravity with a
  rendered 3D figure. The article concentrates on combat; we are adapting its principles to
  investigation and leaving our combat untouched. [Director's Xbox Wire article, April 14](https://news.xbox.com/en-us/2026/04/14/replaced-combat/).
- **Believable spaces and pacing.** The developers discuss grounded level construction and
  alternating exploration with action. Their influences span Flashback, Another World,
  Inside, The Last Night and other cinematic games. Human identity and the societal effects
  of technology drive the story. Our inference: borrow the discipline of believable spaces
  and shifts in attention, not their specific plot or mechanical progression.
  [Developer Q&A, GamingBolt, March 25](https://gamingbolt.com/replaced-interview-inspirations-for-art-style-ranged-and-melee-combat-exploration-and-more).
- **A tactile interface can contain scope.** In an interview about the Wingman, Zhdanovich
  explains that centralizing lore in a device avoided bespoke inspection animations for many
  item categories. He discusses tactile interaction and the difficulty of keeping text
  legible. The hand close-up uses a stylized 3D approach: their pipeline is not a blanket ban
  on 3D. Our existing CRT plus notebook can serve the same production purpose with its own
  design. [Direct interview, Game Developer, June 4](https://www.gamedeveloper.com/design/replaced-wingman).

### Three pictures, three transferable decisions

These are visual observations from the official images, followed by our own application:

| Inspected reference | Observation | GRAVITY application |
| --- | --- | --- |
| [Tower District](https://thunderfulgames.com/wp-content/uploads/2025/08/Phoenix-City-1.png) | A large warm sign sits above darker crowds; near cars frame the lower edge. A red searchlight is localized. | Give each street view a dominant light and preserve dark space around Gravity. Let foreground props frame, never hide the clue. |
| [Amber city vista](https://thunderfulgames.com/wp-content/uploads/2025/08/REPLACED_SadCatStudios_Screenshots-ThumbnailsScreenshot4NoCar-scaled.png) | Dark fencing and vegetation separate from a hazy skyline. The small figure establishes scale. | Keep the street's distant haze, but anchor mid-distance buildings with darker bases and structural continuity. |
| [Industrial fire scene](https://thunderfulgames.com/wp-content/uploads/2025/08/REPLACED_SadCatStudios_Screenshots-Thumbnails_Screenshot1.png) | Near machinery partially frames a small figure against a bright background. | Use selective occlusion and silhouette contrast in the Den and clinic, without importing the fire, camera tilt or spectacle. |

The [official launch trailer](https://www.youtube.com/watch?v=YheMqHoeHVc), linked by the
publisher, was also sampled. Around 0:28 the image uses multiple industrial levels with
localized red/white lights and a traversal lane embedded in the architecture. This supports
studying functional scene layers. It does not establish exact animation frame counts or
justify adding platforming to our detective game.

## Our visual rules

These are original design decisions for GRAVITY, not statements about REPLACED's implementation.

1. **One main visual subject per view.** Gravity and the current evidence share the strongest
   local contrast. An unrelated fixture can be brighter in raw pixels, but must not dominate
   through size, saturated color and movement simultaneously.
2. **Separate values before adding detail.** Near objects are darkest, the interactive plane
   is readable, and distance loses contrast gradually. Fog belongs in pockets, low at building
   bases or behind architecture; never a uniform pale wash over the street and train.
3. **Every visible light has a reason.** A lamp, window, screen or Lyra's eye motivates its
   pool, edge tint and reflection. Reflections share that source and time. Don't brighten
   Gravity independently until she becomes a cutout.
4. **Silence is part of animation.** A readable stance and an intentional held pose are more
   useful than constant movement. No return to hopping idle or a perpetual inspection wave.
5. **Near objects need physical roots.** Cabinets meet the floor, curtains attach to a rail,
   beams meet a wall, and scene cutouts include their support. Parallax is depth information,
   not permission for architecture to drift apart.
6. **The interface belongs to the investigation.** Preserve the olive case jacket, worn
   notebook and CRT dialogue. Use readable typography and restrained interaction feedback.
   The physical object is a frame for information, not a reason to shrink text.

## Scene-by-scene direction

| Scene | Emotional purpose and palette | Next intervention | Avoid |
| --- | --- | --- | --- |
| Sector 07 | Public indifference; blue-green night with small warm islands of human life | Author views around Mei, studio entrance and the Den; reduce competing fixture emphasis; keep a dark, grounded middle distance | More global haze, every sign flashing, opaque foreground across faces |
| Graves' studio | An interrupted life; warm work light against cold windows | Frame painting and receiver as distinct subjects; connect new detail to the artist's work and the physical extraction | Turning the whole studio cyan or filling it with explanatory labels |
| Memory Den | Fragile sanctuary; muted cyan/green with small amber practical lights | Organize the archive as a readable focal point; let Lyra's machine occupancy clarify where she is; use quiet machinery around the held memory | Constant glitching that makes the sanctuary feel like another hostile lab |
| Meridian Clinic | Bureaucratic violence; institutional green, cool cabinets, tired warm intake light | Contrast the front-desk promise with records and cold storage; ground curtains and cabinet feet; strengthen earned visual changes | New gore, a villain reveal, or atmospheric effects hiding intake evidence |

Suggested value checks: compare at normal size, small phone size, and grayscale before/after.
Reject a change if Gravity's black outfit disappears, white boots appear detached, the red
scarf loses its silhouette, or a clue marker becomes the only way to understand the scene.

## Animation direction

Keep Gravity blonde, in the approved black outfit and white boots without stockings, with
her long red scarf. Lyra remains the single-eye drone with a signal that can occupy machines.

Prioritize the **contact chain**: approach → plant feet → face subject → hand/eye attention →
hold → recover. The current study/reach/crouch derivatives and 0.3-second recovery already
provide a useful vocabulary. Improve this vocabulary before adding more actions.

- For a terminal, define a real contact point and keep the reaching hand near it. A broad
  generic reach cannot fit every screen height; author a small number of reusable height
  variants only when a visual comparison proves the existing pose inadequate.
- For floor evidence, preserve connected hips/knees, boot contact and scarf attachment on
  every frame. Favor a modest lowering of the body over dramatic squash or extra bouncing.
- For turns, preserve the planted sole and allow upper-body intent to settle. Never stall the
  player waiting for a decorative animation. Keep the current sprint speeds.
- For conversation, distinguish listening from speaking through posture and arm position;
  don't alternate the body on every letter of text. Gravity should look capable and attentive.
- For Lyra, communicate attention through the eye and the occupied machine. Follow-through
  is useful; excessive bobbing, random teleporting or multiple apparent light sources is not.
- The scarf is secondary motion. It follows the action and settles after it; it must not
  pull the body around, drag unnaturally through the floor, or obscure a held clue.

A useful proposed contact hold is roughly 150–250 ms within an existing action, adjustable
by screenshot/slow-play review. This is not an input delay. Reduced motion retains the
meaningful held pose and removes discretionary movement.

## Lore that belongs to our bible

REPLACED's human-identity theme is adjacent to ours, but its factions, protagonist, timeline
and organ economy are not GRAVITY canon. Our core is **stolen imagination, the people left
behind, and the detective who notices what the system discards**.

The current bible locks New Angeles in 2077, Gravity as a human detective, Lyra's machine
presence, the Veil's distributed exploitation, and the Broker's trade in creativity.
The shipped cases already establish Ada Vale, Meridian intake B, meal credits, courier V-17
and lot B-0419. Use those anchors. Some later plot beats and Gravity's personal wound remain
possibilities, not facts to silently canonize.

Original optional vignette directions:

- **Studio: the mark a model would discard.** A reused swatch or scratched-out line gives a
  personal context to the painting. Before the relevant clue, it is simply an artist's trace;
  after it, the same detail can be interpreted. Do not reveal Everybody as a settled answer.
- **Street: a promise beside its cost.** A creativity-archiving notice sits near a meal-credit
  notice. The city makes the transaction look routine. No new victim identity is needed.
- **Clinic: precise records, absent people.** A copied form remembers a lot number more
  carefully than a person. Tie text to the records the player has actually recovered. Never
  display the Broker's name or the prepayment conclusion ahead of its evidence.
- **Den: care expressed as maintenance.** A small repaired fitting or a preserved imperfect
  pattern suggests that someone values the archive's contents. Lyra's behavior can embody
  protection without revealing which of her unresolved facets is ultimately true.

These are candidate treatments, not new canonical events. For today's unattended work,
prefer minor scenery or conditional observations inside existing interactions. A new named
victim, fourth case, revelation about Lyra's origin or irreversible story choice belongs in
an explicitly marked proposal rather than an unreviewed story-bible amendment.

## Feature decisions and feasibility

| Candidate | Decision | Reason / implementation boundary |
| --- | --- | --- |
| Authored exploration camera zones | First priority | Replace one-size-fits-all centering with small, bounded focus biases around existing landmarks. Keep one world-to-screen transform for art, markers, picking and reflections. |
| Material-aware light/occlusion polish | High | Existing rim, shadow, sheen and water systems are the foundation. Adjust their relationships and masks rather than layering another global effect. |
| Better terminal/inspection contact | High | Extend `interaction-staging.ts` and the existing derivative frames only where needed; preserve sprite tests and source art. |
| Clue-grounded environmental changes | High | Extend `story-details.ts`; derive everything from the active save so restoring another folder restores the room. |
| Optional human observations | Medium | Short, clue-gated additions to existing narrative beats; no mandatory collectible or new quest structure today. |
| More tactile evidence close-ups | Medium | Improve our reusable `evidence-art.ts` vocabulary and comparison details while preserving the CRT/notebook split. The reading controls already landed in `0357d4a`. |
| A fresh hacking minigame | Defer | A new subsystem would interrupt investigation rhythm; improve Lyra's existing machine interactions first. |
| Platforming routes / combat overhaul | Defer | Changes the kind of game and conflicts with the user's reserved combat iteration. |
| Engine migration / full 3D rebuild | Defer | Our four plate-based scenes cannot gain true camera rotation or geometric lighting from a small migration. First prove where the present renderer actually limits a required shot. |
| New soundtrack or imported REPLACED assets | Reject for this pass | Study relationships and pacing; don't reuse the reference game's art, music, dialogue or branding. |

### What our existing stack can and cannot do

Canvas 2D can handle authored framing, layered occlusion, bounded relief, scene-specific light
compositing, per-pose sprite derivatives and region-based reflections. It cannot cheaply
reconstruct unseen geometry from a flat plate or supply true multi-angle volumetric lighting.
A major camera orbit would demand new art or a different production pipeline. None of the
next planned investigation improvements requires that investment.

Useful code seams: `main.ts` currently computes the exploration camera; `renderer.ts` owns
pass order; `layers.ts` handles the street planes; `spatial.ts` and `interior-finish.ts` already
provide recesses; `lighting.ts`, `rim-mask.ts`, `sheen.ts` and `water.ts` share scene response;
`gravity-acting.ts` and `interaction-staging.ts` own the acting vocabulary; `story-details.ts`
derives visible progress. The hourly plan targets those seams, avoiding a parallel renderer.

## Acceptance standard

A pass is valuable only if it improves a named shot or player action. Capture the same area,
position, viewport, case state and motion setting before and after. Verify fresh and progressed
saves where content is conditional. Keep the 19 existing records and deduction gates stable.
Check ordinary and reduced motion, phone portrait/landscape, and transitions at the affected
boundary. Run required repository checks. Record limitations instead of implying a physical
phone test or a measured frame-rate gain. Prefer a small finished improvement to a stack of
unfinished experiments.

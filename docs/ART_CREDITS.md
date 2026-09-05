# Art and source notes

## Original project contributions

The setting, Cole, Lyra, Marlon Graves, Sector 7, the Everybody/Nobody painting, and the investigation premise come from the original Pyxel project and its story bible.

The character pixel definitions in `src/character-art.ts` were adapted from the original `src/world/sprites.ts`. The Aseprite compiler in `tools/aseprite-import.mjs` and its manifest schemas were carried forward. The original `public/env/skyline.png` provides the far-distance skyline; its source comment describes it as a Midjourney plate. This rebuild does not establish a new license for those original project assets.

## New environment artwork

The street, studio, Memory Den, and street-front extraction were created with the image-generation tool for this rebuild. PNG masters are kept in `assets/environments/`. Lossless WebP delivery copies are in `public/env/`; `npm run optimize-art` verifies their decoded RGBA pixels against the masters. This conversion does not resize, crop, or repaint the artwork.

The requested transparency extraction returned an opaque neutral checker matte. The renderer removes the matte once at load time and darkens boundary fringes, then caches the result. A production artist should replace this with a clean alpha layer. The generated composition also shifts some architectural details slightly; interaction positions are authored to the delivered environment.

### Street prompt

A cinematic side-scrolling pixel art video game background of a rainy cyberpunk noir street in New Angeles 2077. Ultra wide panoramic 3:1 composition. Orthographic side elevation, no vanishing point down the street: all shopfronts facing camera. Densely layered industrial tenements, elevated railway and distant misty megastructures in background, exposed pipes, cables, AC units, fire escapes, stained concrete, weathered signage. Left third warm amber noodle shop and illuminated vending machines; center an artist studio shutter and narrow door underneath a small burnt orange sign 'GRAVES'; right third an underground memory den with a cyan neon sign 'MEMORY DEN'. Refined art direction: charcoal black, petrol teal shadows, muted tungsten gold, restrained vermilion red signage. Wet horizontal pavement begins at exactly 80% image height and extends to bottom; this is a walkable platform, keep it clear. Atmospheric luminous windows, wet reflections. Hand-crafted high detail pixel art with visible tiny crisp pixel clusters and controlled dithering, cinematic lighting inspired by premium indie pixel games. Wide establishing shot, enormous architecture, quiet melancholy. NO characters, NO people, NO UI, NO interface, NO frames, NO overlays, NO titles. Background environment asset only. 2304x768 landscape.

### Studio prompt

Side-scrolling cyberpunk noir pixel art game background, wide landscape 3:1. Orthographic front-facing cutaway of Marlon Graves' artist studio, an abandoned murder scene in a dystopian city. Full room visible wall to wall. Left edge doorway with amber light from rainy street; left third paint-covered workbench with open paper journal, brushes, neural wires, a green old CRT monitor. Center large haunting framed abstract painting of fragmented human faces in red amber teal, hanging on exposed brick wall, several easels and canvases beneath it. A white body chalk outline on floor at center-right without body or gore. Right third a strange neural extraction device with restrained cyan small light on an industrial table, cables down to floor, handwritten wall message 'FIND THE FIRST ONE'. Overhead steel beams, dusty hanging bare tungsten bulb, high rain-streaked windows. Deep teal charcoal shadows, dusty warm amber light illuminating evidence. Horizontal clear floor starts at exactly 80% image height, continues to bottom. Detailed sophisticated hand-crafted pixel art with sharp pixel clusters, quiet grief, rich art direction, sophisticated chiaroscuro. NO characters, NO HUD, NO interface, NO watermark. Environment asset only. 2304x768 landscape.

### Memory Den prompt

Side-scrolling cyberpunk noir pixel art game background, ultra-wide 3:1 landscape. Orthographic front-facing cutaway of an underground memory archive known as the Memory Den, full room visible wall to wall. Left edge industrial entrance with narrow amber lamp. Left third leather booth with dim amber hanging light and stacks of old physical storage cartridges. Center elegant circular holographic cyan neural-memory projection device above a low pedestal, behind it a huge translucent glass partition with cables and vertical racks of old magnetic archive tapes. Right third imposing bank of old CRT monitors and analogue servers with teal and restrained vermilion status lights, a chair and a terminal console, thousands of stolen memories. Ceiling layered cables and exposed ducts, concrete pillars, floor with subtle reflections. Floor is a clear horizontal side-scrolling walkway starts at exactly 80% of image height and continues to bottom. Rich cinematic lighting, dark petrol teal and charcoal, pale spectral cyan glow contrasted with soft tungsten amber. Premium meticulous pixel art, visible tiny pixel clusters and dithered gradients, melancholy sci-fi noir. NO characters or people, NO HUD, NO UI, NO text overlay, NO watermark. Standalone game background asset. 2304x768.

### Street layer extraction prompt

Use case: background-extraction. Edit target: the provided wide pixel art cyberpunk street background. Create a TRANSPARENT PNG foreground layer for a 2.5D parallax game. CRITICAL: preserve the exact wide composition, dimensions, pixel art, building positions, signs and colors of the input. Keep the nearest three street-level building groups (the large noodle shop building on the left, the lower GRAVES artist studio and its neighboring shutter at center, and the large MEMORY DEN building on the right), all of their attached foreground cables, pipes and signs, plus the continuous horizontal sidewalk and wet pavement. Remove ALL of the distant city skyline, atmospheric sky, elevated railway bridge, train, and their supporting structures that are visible in the open gap behind the foreground buildings, replacing those distant/background areas with GENUINE alpha transparency, not black, not a checkerboard illustration. Follow the existing roof silhouettes exactly. In particular, the large upper central gap between the tall left building and tall right building must be transparent down to the stepped roof of the low GRAVES studio. No new details, no relighting, no repositioning, no resizing buildings. Output only this foreground layer on a transparent background at the original wide 3:1 framing.

## Code-rendered elements

The middle-distance buildings and rail deck, moving train, near-camera objects, rain, mist, glints, scarf, dynamic water reflection pass, combat projectiles, and light overlays are rendered in code. Procedural sound is generated locally with Web Audio; no recorded music or third-party sound library is bundled.

## Fonts

Barlow Condensed and DM Sans are served from local font files. Their SIL Open Font License texts are included in `public/fonts/barlowcondensed-OFL.txt` and `public/fonts/dmsans-OFL.txt`. No third-party font requests are required at runtime.


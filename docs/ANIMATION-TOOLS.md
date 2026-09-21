# Character animation workflow

Current Cole art is generated in `src/character-art.ts`; exploration uses eight-frame `stride` and `sprint` sequences at 32×64. Keep the foot baseline and pivot consistent across frames. Runtime playback scales with movement speed and preserves phase across the walk/run transition. Combat uses its original frames.

Free tools worth using:

- [LibreSprite](https://github.com/LibreSprite/LibreSprite): free/open-source pixel sprite animator. A natural fit for frame editing; validate exported Aseprite files with our importer before adopting an authoring workflow.
- [Piskel](https://www.piskelapp.com/): free browser sprite editor. Useful for quick frame studies and sprite sheet exports; PNG sheets would need an import adapter for our current manifest pipeline.
- [Blender](https://www.blender.org/about/license/): free/open-source modeling, rigging and animation. A future production route is a rigged Cole rendered through an orthographic camera into sprite frames, followed by pixel cleanup. This requires creating a model/rig and a render-to-atlas workflow; it is not installed or integrated by this pass.

For an imported Cole sheet, supply `stride` and `sprint` tags, plus `breathe`, `turn`, `examine` and `listen` as appropriate. Existing `walk`/`idle` tags remain fallbacks. Drop supported `.aseprite` sources into `assets/sprites/` and run `npm run import-art` (also run by dev/build). Check duration, alpha edges and foot pivots in-game.

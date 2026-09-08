import {
  COLE_FRAMES,
  ENFORCER_FRAMES,
  DRONE_FRAMES,
  makeLyraFrame,
  makePedFrames,
  PED_HAZE,
} from './character-art.ts';
import type { SpriteManifest } from './sprite-types.ts';
import type { RimLight } from './lighting.ts';
import { buildRimMasks, paintRim, type RimMasks } from './rim-mask.ts';

/** One resolved frame of art, from either the atlas or the procedural set. */
interface Frame {
  key: string;
  src: CanvasImageSource;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  pivotX: number;
  cellH: number;
}

export class Sprites {
  private atlas: HTMLImageElement | null = null;
  private manifest: SpriteManifest | null = null;
  private lyra = makeLyraFrame();
  // Walkers read as a block away because their palette is pre-mixed toward the
  // night air, not because they are drawn see-through.
  private peds = [
    makePedFrames('coat', '#38454b', PED_HAZE),
    makePedFrames('hood', '#535044', PED_HAZE),
  ];
  private rims = new Map<string, RimMasks>();

  async load() {
    try {
      const r = await fetch('/sprites/manifest.json');
      if (!r.ok) return;
      const m = (await r.json()) as SpriteManifest;
      if (!m.atlas || !Object.keys(m.sheets).length) return;
      const im = new Image();
      im.src = '/sprites/' + m.atlas;
      await im.decode();
      this.manifest = m;
      this.atlas = im;
    } catch {
      /* Procedural character frames remain available offline. */
    }
  }

  /** Picks the frame of art for this id/tag at this time, from either source. */
  private resolve(id: string, tag: string, time: number): Frame {
    const sheet = this.manifest?.sheets[id];
    if (sheet && this.atlas) {
      const window = sheet.tags[tag] ?? sheet.tags.idle ?? { from: 0, to: 0, direction: 0 };
      let indices = Array.from({ length: window.to - window.from + 1 }, (_, i) => i + window.from);
      if (window.direction === 1 || window.direction === 3) indices.reverse();
      if (window.direction >= 2 && indices.length > 2)
        indices = [...indices, ...indices.slice(1, -1).reverse()];
      const duration = indices.reduce(
        (sum, i) => sum + Math.max(0.01, sheet.frames[i].duration),
        0,
      );
      let t = time % duration,
        index = indices[0];
      for (const i of indices) {
        index = i;
        if (t < Math.max(0.01, sheet.frames[i].duration)) break;
        t -= Math.max(0.01, sheet.frames[i].duration);
      }
      const frame = sheet.frames[index];
      return {
        key: `${id}#${index}`,
        src: this.atlas,
        sx: frame.x,
        sy: frame.y,
        sw: frame.w,
        sh: frame.h,
        pivotX: sheet.pivotX,
        cellH: sheet.cellH,
      };
    }
    let frames: HTMLCanvasElement[];
    if (id === 'cole') frames = COLE_FRAMES[tag as keyof typeof COLE_FRAMES] ?? COLE_FRAMES.idle;
    else if (id === 'lyra') frames = [this.lyra];
    else if (id === 'enforcer') frames = ENFORCER_FRAMES.walk;
    else if (id === 'drone') frames = DRONE_FRAMES.hover;
    else frames = this.peds[id === 'ped_a' ? 0 : 1];
    const index = Math.floor(time * 9) % frames.length;
    const frame = frames[index];
    return {
      key: `${id}:${tag}#${index}`,
      src: frame,
      sx: 0,
      sy: 0,
      sw: frame.width,
      sh: frame.height,
      pivotX: frame.width / 2,
      cellH: frame.height,
    };
  }

  /** Edge masks for a frame of art, built once and cached by frame key. */
  private masks(frame: Frame): RimMasks {
    let set = this.rims.get(frame.key);
    if (!set) {
      set = buildRimMasks(frame.src, frame.sx, frame.sy, frame.sw, frame.sh);
      this.rims.set(frame.key, set);
    }
    return set;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    id: string,
    tag: string,
    time: number,
    x: number,
    y: number,
    facing = 1,
    height = 70,
    rim: RimLight | null = null,
  ) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing, 1);
    const frame = this.resolve(id, tag, time);
    const scale = height / frame.cellH;
    const dx = -frame.pivotX * scale;
    const dy = -height;
    const dw = frame.sw * scale;
    const dh = frame.sh * scale;
    ctx.drawImage(frame.src, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, dh);
    if (rim && rim.strength > 0.001) paintRim(ctx, this.masks(frame), rim, dx, dy, dw, dh);
    ctx.restore();
  }
}

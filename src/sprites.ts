import {
  COLE_FRAMES,
  COLE_STORY_FRAMES,
  LYRA_STORY_FRAMES,
  ENFORCER_FRAMES,
  DRONE_FRAMES,
  makePedFrames,
  PED_HAZE,
} from './character-art.ts';
import type { SpriteManifest } from './sprite-types.ts';
import type { RimLight } from './lighting.ts';
import { buildRimMasks, paintRim, type RimMasks } from './rim-mask.ts';
import { storyFrameIndex } from './character-motion.ts';

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
  // Walkers read as a block away because their palette is pre-mixed toward the
  // night air, not because they are drawn see-through.
  private peds = [
    makePedFrames('coat', '#38454b', PED_HAZE),
    makePedFrames('hood', '#535044', PED_HAZE),
  ];
  private rims = new Map<string, RimMasks>();
  private clothLight = document.createElement('canvas');
  private shadows = new Map<string, HTMLCanvasElement>();

  async load() {
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}sprites/manifest.json`);
      if (!r.ok) return;
      const m = (await r.json()) as SpriteManifest;
      if (!m.atlas || !Object.keys(m.sheets).length) return;
      const im = new Image();
      im.src = `${import.meta.env.BASE_URL}sprites/${m.atlas}`;
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
      const fallbackTag = tag === 'stride' ? 'walk' : 'idle';
      const window = sheet.tags[tag] ?? sheet.tags[fallbackTag] ?? { from: 0, to: 0, direction: 0 };
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
    if (id === 'cole')
      frames =
        COLE_STORY_FRAMES[tag] ?? COLE_FRAMES[tag as keyof typeof COLE_FRAMES] ?? COLE_FRAMES.idle;
    else if (id === 'lyra') frames = LYRA_STORY_FRAMES[tag] ?? LYRA_STORY_FRAMES.idle;
    else if (id === 'enforcer') frames = ENFORCER_FRAMES.walk;
    else if (id === 'drone') frames = DRONE_FRAMES.hover;
    else frames = this.peds[id === 'ped_a' ? 0 : 1];
    const index =
      id === 'lyra' || (id === 'cole' && tag in COLE_STORY_FRAMES)
        ? storyFrameIndex(tag, time, frames.length)
        : Math.floor(time * 9) % frames.length;
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

  /** Cached silhouette projected away from the dominant light onto the floor. */
  drawGroundShadow(
    ctx: CanvasRenderingContext2D,
    tag: string,
    time: number,
    x: number,
    floor: number,
    facing: number,
    height: number,
    lightDirection: number,
    lift: number,
  ) {
    const frame = this.resolve('cole', tag, time);
    let silhouette = this.shadows.get(frame.key);
    if (!silhouette) {
      silhouette = document.createElement('canvas');
      silhouette.width = frame.sw;
      silhouette.height = frame.sh;
      const s = silhouette.getContext('2d')!;
      s.drawImage(frame.src, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = '#030b0e';
      s.fillRect(0, 0, frame.sw, frame.sh);
      this.shadows.set(frame.key, silhouette);
    }
    const scale = height / frame.cellH;
    ctx.save();
    ctx.translate(Math.round(x), floor + 2);
    ctx.transform(facing, 0, lightDirection * 0.28, -0.11, 0, 0);
    ctx.globalAlpha = Math.max(0.06, 0.24 - lift * 0.002);
    ctx.drawImage(silhouette, -frame.pivotX * scale, -height, frame.sw * scale, frame.sh * scale);
    ctx.restore();
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
    // Broad, low-energy light across cloth; combat keeps the established edge-only pass.
    if (rim && ((id === 'cole' && tag in COLE_STORY_FRAMES) || id === 'lyra')) {
      const wash = this.clothLight;
      if (wash.width !== frame.sw || wash.height !== frame.sh) {
        wash.width = frame.sw;
        wash.height = frame.sh;
      }
      const wc = wash.getContext('2d')!;
      wc.globalCompositeOperation = 'source-over';
      wc.clearRect(0, 0, wash.width, wash.height);
      wc.drawImage(frame.src, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
      wc.globalCompositeOperation = 'source-in';
      const color = `${Math.round(rim.r * 255)},${Math.round(rim.g * 255)},${Math.round(rim.b * 255)}`;
      const gradient = wc.createLinearGradient(
        rim.dirX < 0 ? 0 : frame.sw,
        0,
        rim.dirX < 0 ? frame.sw : 0,
        frame.sh * 0.3,
      );
      gradient.addColorStop(0, `rgba(${color},.75)`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      wc.fillStyle = gradient;
      wc.fillRect(0, 0, frame.sw, frame.sh);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(0.25, rim.strength * 0.16);
      ctx.drawImage(wash, dx, dy, dw, dh);
      ctx.restore();
    }
    if (rim && rim.strength > 0.001) paintRim(ctx, this.masks(frame), rim, dx, dy, dw, dh);
    ctx.restore();
  }
}

import { loadLyraHumanoid, LYRA_HUMAN_CROP } from './lyra-candidate.ts';
import { LYRA_REFINED_FRAMES, lyraFrameIndex } from './lyra-art.ts';
import {
  COLE_FRAMES,
  COLE_STORY_FRAMES,
  ENFORCER_FRAMES,
  DRONE_FRAMES,
  makePedFrames,
  PED_HAZE,
} from './character-art.ts';
import type { SpriteManifest } from './sprite-types.ts';
import type { RimLight } from './lighting.ts';
import { buildRimMasks, paintRim, type RimMasks } from './rim-mask.ts';
import { storyFrameIndex } from './character-motion.ts';
import {
  loadCandidate,
  candidateIndex,
  candidateFloorOffset,
  CANDIDATE_CROP,
  scarfSocket,
  type CandidateFrames,
} from './character-candidate.ts';

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
  private candidate: CandidateFrames | null = null;
  private lyraCandidate: Awaited<ReturnType<typeof loadLyraHumanoid>> | null = null;
  get candidateActive() {
    return this.candidate !== null;
  }
  /** The imported character's presentation pivot includes padding below her boots. */
  floorOffset(height: number) {
    return this.candidate ? candidateFloorOffset(height) : 0;
  }
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
      this.lyraCandidate = await loadLyraHumanoid();
    } catch {
      console.warn('Lyra asset unavailable; using procedural fallback.');
    }
    if (new URLSearchParams(location.search).get('character') !== 'cole') {
      try {
        this.candidate = await loadCandidate(
          new URLSearchParams(location.search).get('character') === 'original'
            ? 'original'
            : 'gravity',
        );
      } catch {
        console.warn('Gravity sprites unavailable; using legacy fallback.');
      }
    }
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

  neck(tag: string, time: number, height: number) {
    if (!this.candidate) return { x: (3 * height) / 73, y: (-46 * height) / 73 };
    const frame = this.resolve('cole', tag, time);
    const socket = scarfSocket(frame.src);
    return {
      x: ((socket.x - frame.pivotX) * height) / frame.cellH,
      y: -height + ((socket.y - frame.sy) * height) / frame.cellH,
    };
  }

  /** Picks the frame of art for this id/tag at this time, from either source. */
  private resolve(id: string, tag: string, time: number): Frame {
    if (this.candidate && id === 'cole') {
      const clip =
        tag === 'stride' || tag === 'walk'
          ? 'walk'
          : tag === 'sprint'
            ? 'sprint'
            : tag === 'jump'
              ? 'jump'
              : 'idle';
      const frames = this.candidate[clip];
      // CharacterMotion already scales its clock with movement speed.
      const index = candidateIndex(time, frames.length, 0.8);
      const crop = CANDIDATE_CROP;
      return {
        key: `warped:${clip}:${index}`,
        src: frames[index],
        sx: crop.x,
        sy: crop.y,
        sw: crop.width,
        sh: crop.height,
        pivotX: crop.pivotX,
        cellH: crop.cellHeight,
      };
    }
    if (id === 'lyra' && this.lyraCandidate) {
      const clip = tag === 'walk' || tag === 'stride' ? 'walk' : 'idle';
      const frames = this.lyraCandidate[clip];
      const index = candidateIndex(time, frames.length, 0.75);
      const crop = LYRA_HUMAN_CROP;
      return {
        key: `lyra-human:${clip}:${index}`,
        src: frames[index],
        sx: crop.x,
        sy: crop.y,
        sw: crop.width,
        sh: crop.height,
        pivotX: crop.pivotX,
        cellH: crop.cellHeight,
      };
    }
    const sheet = this.manifest?.sheets[id];
    if (sheet && this.atlas) {
      const fallbackTag = tag === 'stride' || tag === 'sprint' ? 'walk' : 'idle';
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
    else if (id === 'lyra') frames = LYRA_REFINED_FRAMES[tag === 'listen' ? 'listen' : 'idle'];
    else if (id === 'enforcer') frames = ENFORCER_FRAMES.walk;
    else if (id === 'drone') frames = DRONE_FRAMES.hover;
    else frames = this.peds[id === 'ped_a' ? 0 : 1];
    const index =
      id === 'lyra'
        ? lyraFrameIndex(time, tag === 'listen')
        : id === 'cole' && tag in COLE_STORY_FRAMES
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
    wall = false,
    floorOffset = 0,
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
    ctx.transform(
      facing,
      0,
      lightDirection * (wall ? 0.12 : 0.28),
      wall ? 0.83 : -0.11,
      wall ? -lightDirection * 7 : 0,
      wall ? -4 : 0,
    );
    ctx.globalAlpha = wall ? 0.16 : Math.max(0.06, 0.24 - lift * 0.002);
    ctx.drawImage(
      silhouette,
      -frame.pivotX * scale,
      -height + floorOffset,
      frame.sw * scale,
      frame.sh * scale,
    );
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
    shade = 0,
  ) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing, 1);
    if (id === 'lyra' && this.lyraCandidate && tag !== 'walk' && tag !== 'stride') {
      // A quiet breath around the soles, matching the single-pose lab preview.
      const breath = Math.sin(time * 1.7);
      ctx.transform(1, 0, breath * 0.002, 1 + breath * 0.004, 0, 0);
    }
    const frame = this.resolve(id, tag, time);
    const scale = height / frame.cellH;
    const dx = -frame.pivotX * scale;
    const dy = -height;
    const dw = frame.sw * scale;
    const dh = frame.sh * scale;
    ctx.drawImage(frame.src, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, dh);
    if (shade > 0) {
      const mask = this.clothLight;
      if (mask.width !== frame.sw || mask.height !== frame.sh) {
        mask.width = frame.sw;
        mask.height = frame.sh;
      }
      const mc = mask.getContext('2d')!;
      mc.globalCompositeOperation = 'source-over';
      mc.clearRect(0, 0, mask.width, mask.height);
      mc.drawImage(frame.src, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
      mc.globalCompositeOperation = 'source-in';
      mc.fillStyle = '#07151c';
      mc.fillRect(0, 0, mask.width, mask.height);
      ctx.save();
      ctx.globalAlpha = shade;
      ctx.drawImage(mask, dx, dy, dw, dh);
      ctx.restore();
    }
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

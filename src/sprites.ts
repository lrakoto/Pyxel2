import {
  COLE_FRAMES,
  ENFORCER_FRAMES,
  DRONE_FRAMES,
  makeLyraFrame,
  makePedFrames,
} from './character-art.ts';
import type { SpriteManifest } from './sprite-types.ts';
export class Sprites {
  private atlas: HTMLImageElement | null = null;
  private manifest: SpriteManifest | null = null;
  private lyra = makeLyraFrame();
  private peds = [makePedFrames('coat', '#38454b'), makePedFrames('hood', '#535044')];
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
  draw(
    ctx: CanvasRenderingContext2D,
    id: string,
    tag: string,
    time: number,
    x: number,
    y: number,
    facing = 1,
    height = 70,
  ) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing, 1);
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
        frame = sheet.frames[indices[0]];
      for (const i of indices) {
        frame = sheet.frames[i];
        if (t < Math.max(0.01, frame.duration)) break;
        t -= Math.max(0.01, frame.duration);
      }
      const scale = height / sheet.cellH;
      ctx.drawImage(
        this.atlas,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -sheet.pivotX * scale,
        -height,
        frame.w * scale,
        frame.h * scale,
      );
    } else {
      let frames: HTMLCanvasElement[];
      if (id === 'cole') frames = COLE_FRAMES[tag as keyof typeof COLE_FRAMES] ?? COLE_FRAMES.idle;
      else if (id === 'lyra') frames = [this.lyra];
      else if (id === 'enforcer') frames = ENFORCER_FRAMES.walk;
      else if (id === 'drone') frames = DRONE_FRAMES.hover;
      else frames = this.peds[id === 'ped_a' ? 0 : 1];
      const frame = frames[Math.floor(time * 9) % frames.length];
      const w = (height * frame.width) / frame.height;
      ctx.drawImage(frame, -w / 2, -height, w, height);
    }
    ctx.restore();
  }
}

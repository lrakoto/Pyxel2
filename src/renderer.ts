import { AREAS, type AreaId } from './content.ts';
import type { Body, CaseModel } from './model.ts';
import type { Combat } from './combat.ts';
import { Sprites } from './sprites.ts';
import { PARALLAX, layerX, reflectionSourceY, buildMidground } from './layers.ts';
export const W = 960,
  H = 540;
interface View {
  model: CaseModel;
  player: Body;
  camera: number;
  time: number;
  scan: boolean;
  reducedMotion: boolean;
  combat: Combat | null;
  aim: { x: number; y: number };
  title: boolean;
}
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private plates = new Map<AreaId, HTMLCanvasElement>();
  private sprites = new Sprites();
  private skyline: HTMLCanvasElement | null = null;
  private frontage: HTMLCanvasElement | null = null;
  private midground = buildMidground();
  private reflection = document.createElement('canvas');
  private reflectionContext = this.reflection.getContext('2d', { alpha: false })!;
  private foregroundGlow = this.radial('#65acb5', 128);
  private mist: HTMLCanvasElement;
  private light: HTMLCanvasElement;
  private rain = Array.from({ length: 170 }, (_, i) => ({
    x: (i * 137.51) % W,
    y: (i * 79.33) % H,
    s: 0.5 + (i % 5) * 0.19,
  }));
  constructor(public canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    this.mist = this.radial('#8cb8b1', 128);
    this.light = this.radial('#eabd7c', 128);
  }
  resize(width: number) {
    this.canvas.width = Math.max(300, Math.min(1280, width));
    this.ctx.imageSmoothingEnabled = false;
    this.reflection.width = this.canvas.width;
    this.reflection.height = H;
    this.reflectionContext.imageSmoothingEnabled = false;
  }
  private radial(color: string, size: number) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!,
      r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    r.addColorStop(0, color);
    r.addColorStop(1, color + '00');
    g.fillStyle = r;
    g.fillRect(0, 0, size, size);
    return c;
  }
  async load() {
    await Promise.all([
      this.sprites.load(),
      this.loadDepthLayers(),
      ...(Object.keys(AREAS) as AreaId[]).map(async (id) => {
        if (id === 'street') return;
        const image = new Image();
        image.src = `/env/${id}.webp`;
        await image.decode();
        const plate = document.createElement('canvas');
        plate.width = AREAS[id].width;
        plate.height = H;
        const c = plate.getContext('2d')!;
        c.imageSmoothingEnabled = true;
        c.fillStyle = '#101719';
        c.fillRect(0, 0, plate.width, H);
        c.drawImage(image, 0, 0, plate.width, H);
        this.plates.set(id, plate);
      }),
    ]);
  }
  draw(v: View) {
    const W = this.canvas.width;
    const c = this.ctx,
      area = v.model.save.area,
      world = AREAS[area],
      cam = Math.round(v.camera),
      t = v.reducedMotion ? 0 : v.time;
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#0c1519';
    c.fillRect(0, 0, W, H);
    c.save();
    if (v.combat && !v.reducedMotion) {
      const s = v.combat.shake;
      c.translate(Math.sin(v.time * 134) * s, Math.cos(v.time * 113) * s * 0.6);
    }
    if (area === 'street' && this.frontage && this.skyline) {
      this.drawDepth(c, cam, t);
    } else {
      const plate = this.plates.get(area);
      if (plate) c.drawImage(plate, -cam, 0);
    }
    // Lamps breathe slowly; light is a cached texture, not a per-frame blur pass.
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.08 + Math.sin(t * 0.6) * 0.018;
    if (area === 'street') {
      c.drawImage(this.light, 100 - cam, 235, 380, 280);
      c.drawImage(this.mist, 1290 - cam, 290, 330, 220);
    } else if (area === 'studio') {
      c.drawImage(this.light, 520 - cam, 30, 530, 430);
      c.drawImage(this.mist, 1050 - cam, 200, 350, 300);
    } else {
      c.globalAlpha = 0.15 + Math.sin(t * 0.8) * 0.025;
      c.drawImage(this.mist, 510 - cam, 180, 600, 350);
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    if (area === 'street') {
      // Background walkers are deliberately low-contrast and behind Cole.
      for (let i = 0; i < 5; i++) {
        const x = (((i * 397 + t * (i % 2 ? 16 : -13)) % world.width) + world.width) % world.width;
        c.globalAlpha = 0.36;
        this.sprites.draw(
          c,
          i % 2 ? 'ped_a' : 'ped_b',
          'walk',
          t + i,
          x - cam,
          424,
          i % 2 ? 1 : -1,
          49,
        );
        c.fillStyle = i % 2 ? '#253337' : '#372e29';
        c.beginPath();
        c.ellipse(x - cam, 370, 23, 11, 0, Math.PI, Math.PI * 2);
        c.fill();
        c.fillRect(x - cam, 370, 1, 35);
      }
      c.globalAlpha = 1;
    }
    if (v.model.deduced && !v.model.save.companion && area === 'street')
      this.drawLyra(c, 1280 - cam, 438, t);
    if (area === 'den') this.drawLyra(c, 1150 - cam, 438, t);
    const p = v.player,
      tag = !p.grounded ? 'jump' : Math.abs(p.vx) > 8 ? 'walk' : 'idle';
    c.globalAlpha = 0.4;
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(p.x - cam, 440, 22, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    if (!v.combat || v.combat.invulnerable <= 0 || Math.floor(t * 18) % 2 === 0) {
      // The coat's original pixel silhouette and red scarf remain recognizable.
      this.sprites.draw(c, 'cole', tag, t, p.x - cam, p.y, p.facing, 73);
      c.fillStyle = '#b34135';
      c.beginPath();
      c.moveTo(p.x - cam - 2 * p.facing, p.y - 47);
      for (let i = 1; i <= 9; i++)
        c.lineTo(
          p.x - cam - (2 + i * 3) * p.facing,
          p.y - 47 + Math.sin(t * 7 - i * 0.55) * 2 + i * 0.16,
        );
      for (let i = 9; i >= 0; i--)
        c.lineTo(
          p.x - cam - (2 + i * 3) * p.facing,
          p.y - 44 + Math.sin(t * 7 - i * 0.55) * 2 + i * 0.16,
        );
      c.fill();
    }
    if (v.combat) {
      this.drawCombat(c, v);
    }
    if (area === 'street') this.drawReflections(c, cam, t);
    if (v.scan && !v.title) {
      c.fillStyle = '#7ad2c205';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#82d1c324';
      c.lineWidth = 1;
      const sx = (t * 110) % W;
      c.beginPath();
      c.moveTo(sx, 0);
      c.lineTo(sx, H);
      c.stroke();
      c.fillStyle = '#89d5c804';
      c.fillRect(sx - 65, 0, 65, H);
    }
    if (area === 'street') this.weather(c, t, cam, v.reducedMotion);
    else {
      c.fillStyle = '#dfc69a';
      for (let i = 0; i < 26; i++) {
        c.globalAlpha = 0.08 + (i % 3) * 0.04;
        c.fillRect((i * 137 + t * (i % 2 ? 1 : -1)) % W, (i * 59 + t * 2) % 440, 1, 1);
      }
      c.globalAlpha = 1;
    }
    // Near-camera architecture moves faster than the street, making depth legible.
    if (area === 'street') {
      c.fillStyle = '#060c0ed9';
      for (const pole of [40, 1360, 2210]) {
        const x = layerX(pole, cam, PARALLAX.foreground);
        c.fillRect(x, 0, 13, H);
        c.fillRect(x - 4, 122, 21, 9);
        c.fillRect(x + 11, 216, 18, 13);
      }
      c.strokeStyle = '#080e10';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-cam * 0.18, 3);
      c.bezierCurveTo(270 - cam * 0.1, 80, 690 - cam * 0.1, 100, 1050, 2);
      c.stroke();
    }
    if (area === 'street') {
      const x = layerX(750, cam, PARALLAX.foreground);
      c.fillStyle = '#070f11';
      c.fillRect(x, 502, 110, 38);
      c.fillRect(x + 4, 496, 102, 6);
      c.fillStyle = '#13282c';
      c.fillRect(x + 6, 502, 99, 2);
      for (let i = 0; i < 7; i++) c.fillRect(x + 9 + i * 14, 506, 2, 31);
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.07;
      c.drawImage(this.foregroundGlow, x - 40, 485, 190, 55);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    const bottom = c.createLinearGradient(0, 462, 0, H);
    bottom.addColorStop(0, '#060c0e00');
    bottom.addColorStop(1, '#060c0ee0');
    c.fillStyle = bottom;
    c.fillRect(0, 462, W, 78);
    c.restore();
  }
  private async loadDepthLayers() {
    const sky = new Image(),
      front = new Image();
    sky.src = '/env/skyline.webp';
    front.src = '/env/street-front.webp';
    await Promise.all([sky.decode(), front.decode()]);
    this.skyline = document.createElement('canvas');
    this.skyline.width = 1700;
    this.skyline.height = 540;
    const skyContext = this.skyline.getContext('2d')!;
    skyContext.drawImage(sky, 0, 0, 1700, 530);
    skyContext.fillStyle = '#0e263451';
    skyContext.fillRect(0, 0, 1700, 540);
    this.frontage = document.createElement('canvas');
    this.frontage.width = 1800;
    this.frontage.height = 540;
    const fc = this.frontage.getContext('2d')!;
    fc.drawImage(front, 0, -27, 1800, 540);
    // The extraction plate uses a neutral checker matte. Key it once while loading;
    // no image reads or per-pixel processing happen in the animation loop.
    const pixels = fc.getImageData(0, 0, 1800, 540);
    for (let y = 0; y < 435; y++)
      for (let x = 460; x < 1300; x++) {
        const i = (y * 1800 + x) * 4,
          r = pixels.data[i],
          g = pixels.data[i + 1],
          b = pixels.data[i + 2];
        if (Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 26)
          pixels.data[i + 3] = 0;
      }
    // Remove pale resampling fringes where the matte meets dark architecture.
    const alpha = new Uint8Array(1800 * 540);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels.data[i * 4 + 3];
    for (let y = 1; y < 434; y++)
      for (let x = 461; x < 1299; x++) {
        const p = y * 1800 + x,
          i = p * 4;
        if (!alpha[p]) continue;
        if ([p - 1, p + 1, p - 1800, p + 1800].some((n) => !alpha[n])) {
          const r = pixels.data[i],
            g = pixels.data[i + 1],
            b = pixels.data[i + 2];
          if (Math.max(r, g, b) - Math.min(r, g, b) < 45) {
            pixels.data[i] = r * 0.3;
            pixels.data[i + 1] = g * 0.3;
            pixels.data[i + 2] = b * 0.3;
          }
        }
      }
    fc.putImageData(pixels, 0, 0);
    // Extend the dark road below the authored plate's lower edge.
    fc.fillStyle = '#101719';
    fc.fillRect(0, 513, 1800, 27);
  }
  private drawDepth(c: CanvasRenderingContext2D, cam: number, t: number) {
    c.drawImage(this.skyline!, layerX(-60, cam, PARALLAX.skyline), -25);
    // A distant fog veil separates the tiny skyline from the middle buildings.
    c.fillStyle = '#52869812';
    c.fillRect(0, 0, c.canvas.width, 438);
    c.globalAlpha = 0.77;
    c.drawImage(this.midground, layerX(-90, cam, PARALLAX.midground), 0);
    c.globalAlpha = 1;
    const trainX = ((t * 24 + 190) % 2050) - 480 - cam * PARALLAX.midground;
    for (let i = 0; i < 5; i++) {
      const x = Math.round(trainX + i * 74);
      c.fillStyle = '#263c43';
      c.fillRect(x, 177, 71, 17);
      c.fillStyle = '#738780';
      c.fillRect(x + 2, 177, 66, 1);
      c.fillStyle = '#998653';
      for (let j = 0; j < 6; j++) c.fillRect(x + 6 + j * 10, 181, 6, 5);
      c.fillStyle = '#0c2029';
      c.fillRect(x + 2, 189, 66, 4);
    }
    c.drawImage(this.frontage!, -cam, 0);
  }
  private drawReflections(c: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.reflection.width !== c.canvas.width) {
      this.reflection.width = c.canvas.width;
      this.reflection.height = H;
    }
    // Capture the completed live scene before water, rain, and foreground occluders.
    // This includes every actor, scarf, lamp, tracer, and muzzle flash.
    this.reflectionContext.drawImage(this.canvas, 0, 0);
    c.save();
    c.beginPath();
    const puddles = [
      { x: 200, w: 255, y: 472, h: 28 },
      { x: 515, w: 340, y: 483, h: 40 },
      { x: 865, w: 270, y: 472, h: 26 },
      { x: 1170, w: 365, y: 482, h: 37 },
      { x: 1580, w: 300, y: 484, h: 38 },
    ];
    for (const p of puddles) {
      const x = p.x - cam;
      c.moveTo(x + p.w / 2, p.y);
      c.ellipse(x, p.y, p.w / 2, p.h, 0, 0, Math.PI * 2);
    }
    c.clip();
    for (let depth = 0; depth < 91; depth += 2) {
      const y = 442 + depth,
        sy = reflectionSourceY(438, depth);
      const ripple =
        Math.sin(depth * 0.81 + t * 2.7) * (0.4 + depth * 0.025) +
        Math.sin(depth * 0.19 - t * 1.4) * 1.4;
      c.globalAlpha = 0.58 * (1 - depth / 120);
      c.drawImage(
        this.reflection,
        0,
        sy,
        c.canvas.width,
        3,
        Math.round(ripple),
        y,
        c.canvas.width,
        2,
      );
    }
    c.globalAlpha = 0.08;
    c.fillStyle = '#517d7e';
    c.fillRect(0, 442, c.canvas.width, 90);
    c.restore();
  }
  private drawLyra(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.13 + Math.sin(t * 2) * 0.025;
    c.drawImage(this.mist, x - 55, y - 100, 110, 120);
    c.restore();
    this.sprites.draw(c, 'lyra', 'idle', t, x, y, 1, 70);
  }
  private weather(c: CanvasRenderingContext2D, t: number, cam: number, reduced: boolean) {
    const W = this.canvas.width;
    if (!reduced) {
      c.strokeStyle = '#aad3d440';
      c.lineWidth = 0.65;
      c.beginPath();
      for (const r of this.rain) {
        const x = (((r.x - t * 48 * r.s - cam * 0.12) % W) + W) % W,
          y = (r.y + t * 330 * r.s) % H;
        c.moveTo(x, y);
        c.lineTo(x - 3 * r.s, y + 12 * r.s);
      }
      c.stroke();
    }
    c.strokeStyle = '#a5c7c036';
    c.lineWidth = 0.6;
    for (let i = 0; i < 24; i++) {
      const life = (t * (0.8 + (i % 3) * 0.1) + i * 0.21) % 1,
        x = (((i * 137 - cam * 0.35) % W) + W) % W,
        y = 441 + ((i * 7) % 45);
      c.globalAlpha = (1 - life) * 0.6;
      c.beginPath();
      c.ellipse(x, y, life * 10, life * 2, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const x = 360 + i * 280 - cam,
        cycle = (t * 0.16 + i * 0.37) % 1;
      c.globalAlpha = 0.1 * (1 - cycle);
      c.drawImage(
        this.mist,
        x - 32 + Math.sin(t + i) * 9,
        440 - cycle * 85,
        95 + cycle * 60,
        70 + cycle * 35,
      );
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  private drawCombat(c: CanvasRenderingContext2D, v: View) {
    const combat = v.combat!,
      cam = v.camera,
      p = v.player;
    for (const e of combat.enemies) {
      this.sprites.draw(
        c,
        e.kind,
        'walk',
        v.time,
        e.x - cam,
        e.kind === 'drone' ? e.y + 12 : 438,
        e.x < p.x ? -1 : 1,
        e.kind === 'drone' ? 28 : 64,
      );
      c.fillStyle = '#171d20';
      c.fillRect(e.x - cam - 18, e.y - 40, 36, 3);
      c.fillStyle = e.flash ? '#fff2ca' : '#f06248';
      c.fillRect(e.x - cam - 18, e.y - 40, (36 * e.hp) / (e.kind === 'drone' ? 36 : 60), 3);
    }
    for (const b of combat.bullets) {
      c.strokeStyle = b.hostile ? '#f86b54' : '#ffe3a7';
      c.lineWidth = b.hostile ? 3 : 1.5;
      c.beginPath();
      c.moveTo(b.x - cam, b.y);
      c.lineTo(b.x - cam - b.vx * 0.014, b.y - b.vy * 0.014);
      c.stroke();
    }
    for (const s of combat.particles) {
      c.globalAlpha = s.life / s.max;
      c.fillStyle = s.color;
      c.fillRect(s.x - cam, s.y, 2, 2);
    }
    c.globalAlpha = 1;
    c.save();
    c.translate(p.x - cam, p.y - 43);
    c.rotate(Math.atan2(v.aim.y - (p.y - 43), v.aim.x - p.x));
    c.fillStyle = '#707c7d';
    c.fillRect(7, -3, 18, 5);
    c.fillStyle = '#202a2d';
    c.fillRect(10, 2, 4, 7);
    c.restore();
    if (combat.cooldown > 0.085) {
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.5;
      c.drawImage(this.light, p.x - cam - 60, p.y - 100, 120, 120);
      c.restore();
    }
    const x = v.aim.x - cam,
      y = v.aim.y;
    c.strokeStyle = '#eee7d2';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 10, y);
    c.lineTo(x - 4, y);
    c.moveTo(x + 4, y);
    c.lineTo(x + 10, y);
    c.moveTo(x, y - 10);
    c.lineTo(x, y - 4);
    c.moveTo(x, y + 4);
    c.lineTo(x, y + 10);
    c.stroke();
  }
}

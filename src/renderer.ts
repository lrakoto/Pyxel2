import { AREAS, type AreaId, type SignLight } from './content.ts';
import type { Body, CaseModel } from './model.ts';
import type { Combat } from './combat.ts';
import { Sprites } from './sprites.ts';
import { PARALLAX, layerX, reflectionSourceY, buildMidground } from './layers.ts';
import { Scarf } from './scarf.ts';
import { Crowd } from './pedestrians.ts';
import { Traffic } from './traffic.ts';
import { rimAt, flickerOf } from './lighting.ts';
import { buildSheen } from './sheen.ts';
import { drawFlare } from './flare.ts';
import { drawOpenings, drawPanes, drawLeaks, drawPuddles } from './water.ts';
export const W = 960,
  H = 540;
/** Carriages in the elevated train, and how fast it crosses the city. */
const TRAIN_CARS = 7;
const TRAIN_SPEED = 165;
/**
 * Fixed points on the elevated line that the passing carriages reflect. These
 * are world positions on the midground plane, so they parallax with it and
 * stay put while the train runs past them.
 */
/** The warm cast on the train's catch, over the flare's own gold. */
const TRAIN_GOLD = '#ffb457';
/** Half-width of the window in which a carriage catches a mirror, in pixels. */
const TRAIN_CATCH = 12;
const TRAIN_MIRRORS = [
  { x: 250, strength: 1 },
  { x: 780, strength: 0.75 },
  { x: 1330, strength: 0.9 },
  { x: 1870, strength: 0.7 },
];
/** How many walkers the street carries. */
const CROWD = 18;
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
  /** Wall-clock seconds since the last frame, for the scarf's cloth sim. */
  dt: number;
}
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private plates = new Map<AreaId, HTMLCanvasElement>();
  private sheens = new Map<AreaId, HTMLCanvasElement>();
  private sprites = new Sprites();
  private skyline: HTMLCanvasElement | null = null;
  private frontage: HTMLCanvasElement | null = null;
  private midground = buildMidground();
  /** Warm bloom sprite reused for every lit window in the middle distance. */
  private windowGlow = this.radial('#ffcf8a', 32);
  private scarf = new Scarf();
  /**
   * Scene events worth hearing. The renderer knows when a car crosses the
   * frame or the train arrives; it should not know what a speaker is, so it
   * reports and lets the caller decide.
   */
  cue: ((kind: 'traffic' | 'train' | 'drip', strength: number) => void) | null = null;
  private trainHead = 0;
  private crowd = new Crowd(CROWD, AREAS.street.width);
  private traffic = new Traffic();
  private lastArea: AreaId | null = null;
  private reflection = document.createElement('canvas');
  private reflectionContext = this.reflection.getContext('2d', { alpha: false })!;
  private foregroundGlow = this.radial('#65acb5', 128);
  /** One soft halo texture per sign colour, built on first use. */
  private halos = new Map<string, HTMLCanvasElement>();
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
        this.sheens.set(id, buildSheen(plate, AREAS[id].lights));
      }),
    ]);
  }
  draw(v: View) {
    const W = this.canvas.width;
    const c = this.ctx,
      area = v.model.save.area,
      world = AREAS[area],
      cam = Math.round(v.camera),
      figure = world.figureScale,
      t = v.reducedMotion ? 0 : v.time;
    // The neon falling on Cole drives his wet rim and the scarf's edge glow.
    const rim = rimAt(world.lights, v.player.x, v.player.y - 40 * figure, v.player.facing, t);
    if (this.lastArea !== area) {
      this.lastArea = area;
      this.scarf.reset();
    }
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
    // The baked edge sheen breathes rather than being recomputed; it is the
    // plate's answer to the rim glow the characters get.
    const sheen = this.sheens.get(area);
    if (sheen) {
      c.globalCompositeOperation = 'lighter';
      const pulse =
        world.lights.reduce((sum, l) => sum + flickerOf(l, t) * l.intensity, 0) /
        Math.max(
          0.001,
          world.lights.reduce((sum, l) => sum + l.intensity, 0),
        );
      c.globalAlpha = (0.45 + Math.sin(t * 0.9) * 0.08) * pulse;
      c.drawImage(sheen, -cam, 0);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    // Each sign throws a halo whose brightness is the same flicker value the
    // rim glow samples, so a stuttering tube dims the street and everything
    // it is lighting on the same frame.
    c.globalCompositeOperation = 'lighter';
    for (const light of world.lights) {
      let halo = this.halos.get(light.color);
      if (!halo) this.halos.set(light.color, (halo = this.radial(light.color, 128)));
      const level = flickerOf(light, t);
      const r = 46 + light.intensity * 44;
      c.globalAlpha = Math.min(0.5, 0.19 * light.intensity * level * level);
      c.drawImage(halo, light.x - cam - r, light.y - r * 0.78, r * 2, r * 1.56);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // Only fixtures that declare a flare get one: a bare lamp aimed into the
    // room, or light behind glass. A tube facing the street is a diffuse
    // emitter and keeps its halo alone.
    for (const light of world.lights) {
      if (!light.flare) continue;
      const power = light.intensity * flickerOf(light, t);
      if (power < 0.3) continue;
      drawFlare(c, light.x - cam, light.y, light.flare, Math.min(1, power * 0.6), light.color);
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
      if (!v.reducedMotion) this.crowd.step(v.dt);
      this.crowd.draw(c, cam, t, world.ground);
    }
    if (v.model.deduced && !v.model.save.companion && area === 'street')
      this.drawLyra(c, 1280, cam, t, figure, world.lights);
    if (area === 'den') this.drawLyra(c, 1150, cam, t, figure, world.lights);
    const p = v.player,
      tag = !p.grounded ? 'jump' : Math.abs(p.vx) > 8 ? 'walk' : 'idle';
    c.globalAlpha = 0.4;
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(p.x - cam, world.ground + 2, 22 * figure, 4 * figure, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    // The scarf hangs from his neck and is simulated in world space, so it
    // keeps its momentum through a turn instead of snapping with the mirror.
    // Anchored over the coat's front edge rather than his centre line, so
    // the tail reads as hanging off the wrap instead of splitting him in two.
    this.scarf.step(
      v.reducedMotion ? 0 : v.dt,
      p.x + 3 * figure * p.facing,
      p.y - 46 * figure,
      p.vx,
      73 * figure,
    );
    if (!v.combat || v.combat.invulnerable <= 0 || Math.floor(t * 18) % 2 === 0) {
      // The coat's original pixel silhouette and red scarf remain recognizable.
      this.sprites.draw(c, 'cole', tag, t, p.x - cam, p.y, p.facing, 73 * figure, rim);
      this.scarf.draw(c, cam, rim);
    }
    if (v.combat) {
      this.drawCombat(c, v, figure, world.ground);
    }
    // Puddles come after the actors, so what is standing over them lands in
    // them. They sit below the interior floor line, so nothing they draw can
    // cover the figure casting the reflection.
    if (world.water?.puddles && area !== 'street')
      drawPuddles(c, cam, t, world.water.puddles, world.lights);
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
    else this.interiorAir(c, cam, t, world.lights);
    const water = world.water;
    if (water && area !== 'street') {
      if (water.openings) drawOpenings(c, cam, t, water.openings);
      if (water.panes) drawPanes(c, cam, t, water.panes);
      if (water.leaks) {
        const landed = drawLeaks(c, cam, t, v.reducedMotion ? 0 : v.dt, water.leaks);
        for (let i = 0; i < landed; i++) this.cue?.('drip', 1);
      }
    }
    if (area === 'street') {
      if (!v.reducedMotion)
        for (const strength of this.traffic.step(v.dt, W)) this.cue?.('traffic', strength);
      this.traffic.draw(c, cam, world.lights, t);
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
    this.sheens.set('street', buildSheen(this.frontage, AREAS.street.lights));
  }
  private drawDepth(c: CanvasRenderingContext2D, cam: number, t: number) {
    c.drawImage(this.skyline!, layerX(-60, cam, PARALLAX.skyline), -25);
    // A distant fog veil separates the tiny skyline from the middle buildings.
    c.fillStyle = '#52869812';
    c.fillRect(0, 0, c.canvas.width, 438);
    const mid = layerX(-90, cam, PARALLAX.midground);
    c.drawImage(this.midground.canvas, mid, 0);
    this.drawWindowBloom(c, mid, t);
    this.drawFog(c, cam, t);
    this.drawTrain(c, cam, t);
    c.drawImage(this.frontage!, -cam, 0);
  }
  /**
   * Bloom on the lit windows of the middle-distance city, and the flicker
   * that makes the background feel inhabited. Most windows just breathe;
   * roughly one in nine is an unstable tube that stutters and drops out on
   * its own schedule, seeded per window so the skyline never blinks at once.
   * Only the windows actually on screen are touched.
   */
  private drawWindowBloom(c: CanvasRenderingContext2D, offsetX: number, t: number) {
    const width = c.canvas.width;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const w of this.midground.windows) {
      const x = w.x + offsetX;
      if (x < -20 || x > width + 20) continue;
      // A slow, shallow breath only: the city reads as inhabited without any
      // window drawing attention to itself.
      const level = 0.72 + 0.1 * Math.sin(t * 0.5 + w.seed * 0.37);
      const r = 11 + level * 7;
      c.globalAlpha = Math.min(0.6, level * 0.4);
      c.drawImage(this.windowGlow, x - r, w.y - r, r * 2, r * 2);
    }
    c.restore();
  }

  /**
   * Aerial perspective over the middle distance: a wash that thickens toward
   * the base of the buildings where the street haze collects, plus a few slow
   * banks drifting across at the midground's own parallax. Drawn after the
   * city and before the frontage, so only the background is softened.
   */
  private drawFog(c: CanvasRenderingContext2D, cam: number, t: number) {
    const width = c.canvas.width;
    c.save();
    const wash = c.createLinearGradient(0, 60, 0, 445);
    wash.addColorStop(0, '#5c8a9c0a');
    wash.addColorStop(0.4, '#5c8a9c33');
    wash.addColorStop(0.78, '#6f9aa85e');
    wash.addColorStop(1, '#7ba3b078');
    c.fillStyle = wash;
    c.fillRect(0, 60, width, 385);

    c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const drift = ((t * (4 + i * 2.1) + i * 470) % 2900) - 800;
      const x = drift - cam * PARALLAX.midground * 0.5;
      const y = 190 + i * 32 + Math.sin(t * 0.24 + i) * 14;
      c.globalAlpha = 0.075 + 0.03 * Math.sin(t * 0.3 + i * 1.7);
      c.drawImage(this.mist, x, y, 680 + i * 80, 190 + i * 20);
    }
    c.restore();
  }

  /**
   * The elevated train.
   *
   * The specular does not travel along the carriages — it sits still, because
   * the thing casting it is standing still. Each mirror below is a fixed point
   * on the elevated line, and the highlight is drawn in screen space at that
   * point and clipped to whichever carriage happens to be crossing it. So the
   * train slides through a stationary reflection, which is what a real flank
   * of brushed metal does when it passes a light, rather than carrying its own
   * highlight along with it.
   */
  private drawTrain(c: CanvasRenderingContext2D, cam: number, t: number) {
    const width = c.canvas.width;
    const head = ((t * TRAIN_SPEED + 190) % 2900) - 700 - cam * PARALLAX.midground;
    // Sound the pass once, as the head reaches the middle of the frame.
    const middle = width / 2;
    if (this.trainHead < middle && head >= middle) this.cue?.('train', 1);
    this.trainHead = head;
    const mirrors = TRAIN_MIRRORS.map((mirror) => ({
      x: mirror.x - cam * PARALLAX.midground,
      strength: mirror.strength,
    }));

    for (let i = 0; i < TRAIN_CARS; i++) {
      const x = Math.round(head + i * 74);
      if (x < -90 || x > width + 90) continue;

      c.fillStyle = '#22363d';
      c.fillRect(x, 177, 71, 17);
      c.fillStyle = '#0c2029';
      c.fillRect(x + 2, 189, 66, 4);
      c.fillStyle = '#a8904f';
      for (let j = 0; j < 6; j++) c.fillRect(x + 6 + j * 10, 181, 6, 5);
      c.fillStyle = '#6f8a92';
      c.fillRect(x + 2, 177, 66, 1);

      for (const mirror of mirrors) {
        const reach = 74;
        const gap = Math.abs(mirror.x - (x + 35));
        if (gap > reach) continue;
        const power = (1 - gap / reach) * mirror.strength;

        // The band is positioned on the mirror, not on the carriage; filling
        // only the carriage's own rect is what clips it to the metal.
        const band = c.createLinearGradient(mirror.x - 24, 0, mirror.x + 24, 0);
        band.addColorStop(0, '#bfe2ff00');
        band.addColorStop(0.5, '#bfe2ff');
        band.addColorStop(1, '#bfe2ff00');
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = band;
        c.globalAlpha = 0.42 * power;
        c.fillRect(x, 177, 71, 11);
        c.globalAlpha = 0.9 * power;
        c.fillRect(x + 2, 177, 66, 1);

        c.restore();

        // The catch is binary. A specular is a threshold — the panel's angle
        // either lines up with the light or it does not — so the flare snaps
        // on as the carriage arrives and snaps off as it leaves, rather than
        // swelling and fading like a lamp being dimmed.
        if (gap < TRAIN_CATCH) {
          drawFlare(c, mirror.x, 178, 0.15, mirror.strength, TRAIN_GOLD);
        }
      }
    }
  }

  /**
   * The air inside a room. The street has rain and fog to give it depth;
   * without an equivalent an interior reads as a flat painting with a figure
   * standing on it, which is what these rooms had.
   *
   * Three parts: a shaft of light falling from each fixture bright enough to
   * throw one, a haze that pools toward the floor, and dust turning in the
   * light. The motes are drawn brighter where they pass near a fixture, so
   * the air itself shows where the light is.
   */
  private interiorAir(c: CanvasRenderingContext2D, cam: number, t: number, lights: SignLight[]) {
    const W = c.canvas.width;
    c.save();

    // Shafts. Wider at the floor than at the fixture, and only from the
    // strong ones — every light throwing a beam reads as fog, not lighting.
    c.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      if (light.intensity < 1.2) continue;
      const level = flickerOf(light, t);
      const x = light.x - cam;
      if (x < -260 || x > W + 260) continue;
      const drop = 470 - light.y;
      if (drop <= 0) continue;
      const shaft = c.createLinearGradient(0, light.y, 0, light.y + drop);
      shaft.addColorStop(0, `${light.color}00`);
      shaft.addColorStop(0.12, `${light.color}2e`);
      shaft.addColorStop(1, `${light.color}00`);
      c.globalAlpha = Math.min(0.5, 0.22 * light.intensity * level);
      c.fillStyle = shaft;
      c.beginPath();
      c.moveTo(x - 16, light.y);
      c.lineTo(x + 16, light.y);
      c.lineTo(x + 34 + drop * 0.34, light.y + drop);
      c.lineTo(x - 34 - drop * 0.34, light.y + drop);
      c.closePath();
      c.fill();
    }

    // Haze pooling toward the floor.
    c.globalCompositeOperation = 'source-over';
    const haze = c.createLinearGradient(0, 150, 0, 470);
    haze.addColorStop(0, '#6f8a9400');
    haze.addColorStop(0.6, '#6f8a9412');
    haze.addColorStop(1, '#7d97a02b');
    c.fillStyle = haze;
    c.fillRect(0, 150, W, 320);

    // Dust, lit by whatever it is drifting past.
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 168; i++) {
      const seed = i * 97.3;
      const x = (((i * 137.5 + Math.sin(t * 0.32 + seed) * 26 - cam * 0.6) % W) + W) % W;
      const y = ((i * 61.7 + t * (7 + (i % 5) * 3)) % 430) + 40;
      let lit = 0.05;
      let tone = '#dfc69a';
      for (const light of lights) {
        const d = Math.hypot(light.x - cam - x, light.y - y);
        if (d < 190) {
          const near = (1 - d / 190) * flickerOf(light, t) * light.intensity;
          if (near > lit) {
            lit = near;
            tone = light.color;
          }
        }
      }
      c.globalAlpha = Math.min(0.55, lit * 0.42);
      c.fillStyle = tone;
      const size = i % 7 === 0 ? 2 : 1;
      c.fillRect(Math.round(x), Math.round(y), size, size);
    }
    c.restore();
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
  private drawLyra(
    c: CanvasRenderingContext2D,
    worldX: number,
    cam: number,
    t: number,
    figure: number,
    lights: SignLight[],
  ) {
    const x = worldX - cam,
      y = 438;
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.13 + Math.sin(t * 2) * 0.025;
    c.drawImage(this.mist, x - 55 * figure, y - 100 * figure, 110 * figure, 120 * figure);
    c.restore();
    const rim = rimAt(lights, worldX, y - 40 * figure, 1, t);
    this.sprites.draw(c, 'lyra', 'idle', t, x, y, 1, 70 * figure, rim);
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
  private drawCombat(c: CanvasRenderingContext2D, v: View, figure: number, ground: number) {
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
        e.kind === 'drone' ? e.y + 12 : ground,
        e.x < p.x ? -1 : 1,
        (e.kind === 'drone' ? 28 : 64) * figure,
      );
      c.fillStyle = '#171d20';
      c.fillRect(e.x - cam - 18, e.y - 40 * figure, 36, 3);
      c.fillStyle = e.flash ? '#fff2ca' : '#f06248';
      c.fillRect(
        e.x - cam - 18,
        e.y - 40 * figure,
        (36 * e.hp) / (e.kind === 'drone' ? 36 : 60),
        3,
      );
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
    c.translate(p.x - cam, p.y - 43 * figure);
    c.rotate(Math.atan2(v.aim.y - (p.y - 43 * figure), v.aim.x - p.x));
    c.scale(figure, figure);
    c.fillStyle = '#707c7d';
    c.fillRect(7, -3, 18, 5);
    c.fillStyle = '#202a2d';
    c.fillRect(10, 2, 4, 7);
    c.restore();
    if (combat.cooldown > 0.085) {
      // The shot itself flares, and the point it is aimed at takes a smaller
      // one, so a burst reads across the whole line of fire.
      drawFlare(c, p.x - cam, p.y - 43 * figure, 0.17 * figure, 1.05);
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

import { interiorFinish } from './interior-finish.ts';
import { NearWeather } from './near-weather.ts';
import { evidenceLight, edgeLight, roomVeil, dampAsphalt } from './world-polish.ts';
import {
  drawRelief,
  drawAlley,
  drawNearArchitecture,
  drawRoomFurniture,
  shelterShade,
} from './spatial.ts';
import {
  underShelter,
  drawGutters,
  drawWindowLife,
  drawInteriorMood,
  drawPassingLight,
} from './atmosphere.ts';
import { AREAS, type AreaId, type ClueId, type SignLight } from './content.ts';
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
import { leakImpacts } from './water-events.ts';
import { drawLyraEmitter } from './lyra-projection.ts';
import type { ActorPerformance } from './interaction-staging.ts';
import { FootWater, drawInteriorForeground, drawMei } from './visual-details.ts';
import { CharacterMotion, footfallBetween } from './character-motion.ts';
import { streetWind, streetWindDisplacement } from './wind.ts';
import { drawStoryDetails } from './story-details.ts';
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
  examining: boolean;
  discovery: { id: ClueId; x: number; y: number } | null;
  speaker: string | null;
  performance?: ActorPerformance;
  /** Wall-clock seconds since the last frame, for the scarf's cloth sim. */
  dt: number;
}
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private distantReflection = document.createElement('canvas');
  private plates = new Map<AreaId, HTMLCanvasElement>();
  private sheens = new Map<AreaId, HTMLCanvasElement>();
  private sprites = new Sprites();
  private characterMotion = new CharacterMotion();
  private footWater = new FootWater();
  private nearWeather = new NearWeather();
  private discoveryLight = 0;
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
  cue: ((kind: 'traffic' | 'train' | 'drip' | 'step', strength: number) => void) | null = null;
  /** The player's motion clock at the last frame, for placing footfalls. */
  private footClock = 0;
  private footTag = '';
  private trainHead = 0;
  private crowd = new Crowd(CROWD, AREAS.street.width);
  private traffic = new Traffic();
  private lastArea: AreaId | null = null;
  private reflection = document.createElement('canvas');
  private reflectionContext = this.reflection.getContext('2d', { alpha: false })!;
  private foregroundGlow = this.radial('#65acb5', 128);
  private contactShadow = this.radial('#020a0c', 64);
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
        image.src = `${import.meta.env.BASE_URL}env/${id}.webp`;
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
    // Interior close-ups expose the imported sprite's three-pixel pivot padding.
    // Player.y remains the physical sole/floor position; only the art's anchor
    // changes, shared by the figure, scarf, light sampling, and cast shadows.
    const floorOffset = area !== 'street' && !v.combat ? this.sprites.floorOffset(73 * figure) : 0;
    const actorY = v.player.y + floorOffset;
    const ambientWind = area === 'street' ? streetWind(t, v.reducedMotion) : 0;
    if (area === 'street' && !v.reducedMotion)
      for (const strength of this.traffic.step(v.dt, W)) this.cue?.('traffic', strength);
    const movingLights =
      area === 'street' && !v.combat && !v.reducedMotion ? this.traffic.headlights(cam) : [];
    const lyraX =
      area === 'den'
        ? 1150
        : area === 'street' && v.model.deduced && !v.model.save.companion
          ? 1280
          : null;
    const lyraLight: SignLight | null =
      !v.combat && lyraX !== null
        ? { x: lyraX, y: world.ground - 36 * figure, color: '#83c9ff', intensity: 1.3 }
        : null;
    const sceneLights = lyraLight ? [...world.lights, lyraLight] : world.lights;
    const actorLights =
      !v.combat && area === 'street'
        ? [...sceneLights, ...movingLights, { x: 1008, y: 386, color: '#ecc18a', intensity: 0.75 }]
        : sceneLights;
    // The neon falling on Cole drives his wet rim and the scarf's edge glow.
    const rim = rimAt(actorLights, v.player.x, actorY - 40 * figure, v.player.facing, t);
    if (this.lastArea !== area) {
      this.lastArea = area;
      this.scarf.reset();
      this.footWater.reset();
      this.discoveryLight = 0;
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
      if (!v.combat) drawRelief(c, this.frontage, cam);
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
    if (lyraLight) {
      // Broad reflected light on the room and a flattened pool on the floor.
      // The captured live scene carries both into the water reflection.
      let glow = this.halos.get(lyraLight.color);
      if (!glow) this.halos.set(lyraLight.color, (glow = this.radial(lyraLight.color, 128)));
      const x = lyraLight.x - cam;
      const radius = 48 + 28 * figure;
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.16;
      c.drawImage(glow, x - radius, lyraLight.y - radius, radius * 2, radius * 2);
      c.globalAlpha = 0.25;
      c.drawImage(glow, x - radius, world.ground - 13, radius * 2, 42);
      c.restore();
    }
    if (!v.combat) {
      drawPassingLight(c, cam, movingLights);
      if (area === 'street' && !v.reducedMotion) drawWindowLife(c, cam, t);
      drawInteriorMood(c, area, cam, t);
    }
    if (!v.combat) {
      interiorFinish(c, area, cam, t);
      roomVeil(c, area, cam, t);
      if (!v.title) evidenceLight(c, v.model, cam);
      if (area === 'street') edgeLight(c, cam, movingLights);
    }
    if (!v.combat) drawRoomFurniture(c, area, cam, this.plates.get(area));
    if (!v.combat) drawStoryDetails(c, v.model, cam, t, v.reducedMotion);
    if (area === 'street' && !v.combat) {
      if (this.distantReflection.width !== W) {
        this.distantReflection.width = W;
        this.distantReflection.height = H;
      }
      this.distantReflection.getContext('2d')!.drawImage(this.canvas, 0, 0);
    }
    if (area === 'street') {
      drawMei(c, cam, t, v.speaker === 'MEI');
      if (!v.reducedMotion) this.crowd.step(v.dt);
      this.crowd.draw(c, cam, t, world.ground);
    }
    if (v.model.deduced && !v.model.save.companion && area === 'street')
      this.drawLyra(
        c,
        1280,
        cam,
        t,
        figure,
        438,
        world.lights,
        v.speaker === 'LYRA',
        v.player.x < 1280 ? -1 : 1,
        v.performance,
      );
    if (area === 'den')
      this.drawLyra(
        c,
        1150,
        cam,
        t,
        figure,
        world.ground,
        world.lights,
        v.speaker === 'LYRA',
        v.player.x < 1150 ? -1 : 1,
        v.performance,
      );
    const p = v.player,
      tag = !p.grounded ? 'jump' : Math.abs(p.vx) > 8 ? 'walk' : 'idle';
    const motion = this.characterMotion.update(
      v.dt,
      p.facing,
      p.vx,
      v.examining,
      !!v.speaker,
      v.reducedMotion,
    );
    if (!v.combat && v.performance?.gravity) {
      motion.tag = v.performance.gravity;
      motion.time = v.performance.gravityTime;
      motion.lean = 0;
    }
    // Footsteps follow the feet: a tap each time the drawn stride lands.
    if (
      !v.combat &&
      p.grounded &&
      footfallBetween(motion.tag, this.footClock, motion.time, this.footTag)
    )
      this.cue?.('step', motion.tag === 'sprint' ? 1 : 0.7);
    this.footClock = motion.time;
    this.footTag = motion.tag;
    if (!v.combat) {
      const againstWall =
        area !== 'street' || (p.x > 70 && p.x < 500) || (p.x > 800 && p.x < 1140) || p.x > 1400;
      if (againstWall)
        this.sprites.drawGroundShadow(
          c,
          motion.tag,
          motion.time,
          p.x - cam,
          world.ground,
          p.facing,
          73 * figure,
          (rim?.dirX ?? 0.3) * p.facing,
          0,
          true,
          floorOffset,
        );
      this.sprites.drawGroundShadow(
        c,
        motion.tag,
        motion.time,
        p.x - cam,
        world.ground,
        p.facing,
        73 * figure,
        (rim?.dirX ?? 0.3) * p.facing,
        Math.abs(p.y - world.ground),
        false,
        floorOffset,
      );
      c.save();
      c.globalAlpha = Math.max(0.08, 0.45 - Math.abs(p.y - world.ground) * 0.004);
      const contactWidth = area === 'street' ? 40 : 24;
      c.drawImage(
        this.contactShadow,
        p.x - cam - (contactWidth / 2) * figure,
        world.ground - (area === 'street' ? 3 : 2) * figure,
        contactWidth * figure,
        (area === 'street' ? 8 : 5) * figure,
      );
      if (area !== 'street' && p.grounded) {
        // A small, dense contact core keeps the soles attached to the slab;
        // the larger projected silhouette still supplies the direction of light.
        c.globalAlpha = 0.34;
        c.fillStyle = '#020708';
        c.beginPath();
        c.ellipse(
          p.x - cam,
          world.ground + 0.6 * figure,
          8 * figure,
          1.1 * figure,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      c.restore();
    } else {
      c.globalAlpha = v.combat ? 0.4 : Math.max(0.12, 0.48 - Math.abs(p.y - world.ground) * 0.004);
      c.fillStyle = '#000';
      c.beginPath();
      c.ellipse(p.x - cam, world.ground + 2, 22 * figure, 4 * figure, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    const neck = this.sprites.neck(
      v.combat ? tag : motion.tag,
      v.combat ? t : motion.time,
      73 * figure,
    );
    this.scarf.step(
      v.reducedMotion ? 0 : v.dt,
      p.x + neck.x * p.facing + (!v.combat ? neck.y * motion.lean : 0),
      actorY + neck.y,
      p.vx,
      73 * figure,
      ambientWind * (area === 'street' && underShelter(p.x, p.y - 25) ? 0.22 : 1),
    );
    if (!v.combat || v.combat.invulnerable <= 0 || Math.floor(t * 18) % 2 === 0) {
      if (this.sprites.candidateActive) this.scarf.draw(c, cam, rim);
      c.save();
      if (!v.combat && motion.lean) {
        c.translate(p.x - cam, actorY);
        c.transform(1, 0, motion.lean, 1, 0, 0);
        c.translate(-(p.x - cam), -actorY);
      }
      // The coat's original pixel silhouette and red scarf remain recognizable.
      this.sprites.draw(
        c,
        'cole',
        v.combat ? tag : motion.tag,
        v.combat ? t : motion.time,
        p.x - cam,
        actorY,
        p.facing,
        73 * figure,
        rim,
        !v.combat && area === 'street' ? shelterShade(p.x) : 0,
      );
      c.restore();
      if (!this.sprites.candidateActive) this.scarf.draw(c, cam, rim);
    }
    if (!v.combat) {
      const wet =
        area === 'street' ||
        !!world.water?.puddles?.some(
          (w) => Math.abs(w.x - p.x) < w.rx && Math.abs(w.y - world.ground) < w.ry + 25,
        );
      this.footWater.step(
        v.dt,
        p.x,
        world.ground + 7,
        wet,
        p.grounded && Math.abs(p.vx) > 8,
        v.reducedMotion,
      );
    } else this.footWater.reset();
    if (v.combat) {
      this.drawCombat(c, v, figure, world.ground);
    }
    // Puddles come after the actors, so what is standing over them lands in
    // them. They sit below the interior floor line, so nothing they draw can
    // cover the figure casting the reflection.
    if (world.water?.puddles && area !== 'street')
      drawPuddles(c, cam, t, world.water.puddles, sceneLights);
    if (area === 'street') {
      if (!v.combat) dampAsphalt(c, cam, sceneLights);
      this.drawReflections(c, cam, t, !v.combat);
    }
    if (!v.combat) this.footWater.draw(c, cam);
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
    if (area === 'street') this.weather(c, t, cam, v.reducedMotion, ambientWind);
    else this.interiorAir(c, cam, t, sceneLights);
    const water = world.water;
    if (water && area !== 'street') {
      if (water.openings) drawOpenings(c, cam, t, water.openings);
      if (water.panes) drawPanes(c, cam, t, water.panes);
      if (water.leaks) {
        drawLeaks(c, cam, t, water.leaks);
        for (const impact of leakImpacts(water.leaks, v.time, v.title ? 0 : v.dt, v.player.x))
          this.cue?.('drip', impact.strength);
      }
    }
    if (area === 'street') {
      this.traffic.draw(c, cam, sceneLights, t);
    }
    // Near-camera architecture moves faster than the street, making depth legible.
    if (area === 'street') {
      c.fillStyle = '#060c0ed9';
      for (const pole of [40, 1360, 2210]) {
        const x = layerX(pole, cam, PARALLAX.foreground);
        c.save();
        // Retain near-plane movement without hiding Cole behind a solid pole.
        if (!v.combat)
          c.globalAlpha = 0.32 + 0.68 * Math.min(1, Math.abs(x + 6 - (p.x - cam)) / (42 * figure));
        c.fillRect(x, 0, 13, H);
        c.fillRect(x - 4, 122, 21, 9);
        c.fillRect(x + 11, 216, 18, 13);
        c.restore();
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
    if (!v.combat) drawNearArchitecture(c, area, cam, t);
    if (!v.combat && area === 'street')
      this.nearWeather.draw(c, cam, t, actorLights, v.reducedMotion, ambientWind);
    if (!v.combat) drawInteriorForeground(c, area, cam, t, this.plates.get(area));
    this.discoveryLight +=
      ((v.discovery ? 1 : 0) - this.discoveryLight) *
      (v.reducedMotion ? 1 : 1 - Math.exp(-v.dt * 3));
    if (v.discovery && !v.combat) {
      const dx = v.discovery.x - cam,
        dy = v.discovery.y;
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.12 * this.discoveryLight;
      c.drawImage(this.light, dx - 100, dy - 80, 200, 160);
      c.restore();
      if (v.discovery.id === 'fragment' || v.discovery.id === 'chime') {
        c.save();
        c.translate(dx - 22, dy + 50);
        c.strokeStyle = '#a2d9c5';
        c.lineWidth = 1.5;
        c.globalAlpha = 0.65 * this.discoveryLight;
        c.beginPath();
        c.moveTo(-32, 7);
        c.quadraticCurveTo(-12, -28, 8, -5);
        c.lineTo(35, -27);
        c.lineTo(24, 0);
        c.quadraticCurveTo(41, 0, 47, 10);
        c.lineTo(25, 14);
        c.quadraticCurveTo(0, 38, -18, 14);
        c.lineTo(-41, 24);
        c.lineTo(-30, 9);
        c.stroke();
        c.globalAlpha = 0.15 * this.discoveryLight;
        for (let y = -32; y < 40; y += 4) c.fillRect(-50, y, 105, 1);
        c.restore();
      }
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
    sky.src = `${import.meta.env.BASE_URL}env/skyline.webp`;
    front.src = `${import.meta.env.BASE_URL}env/street-front.webp`;
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
    drawAlley(c, cam, t);
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
      const r = 6 + level * 5;
      c.globalAlpha = level * 0.24;
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
    wash.addColorStop(0, '#38576800');
    wash.addColorStop(0.4, '#3857680a');
    wash.addColorStop(0.72, '#46657420');
    wash.addColorStop(1, '#5678843d');
    c.fillStyle = wash;
    c.fillRect(0, 60, width, 385);

    c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const drift = ((t * (4 + i * 2.1) + i * 470) % 2900) - 800;
      const x = drift - cam * PARALLAX.midground * 0.5;
      const y = 258 + i * 24 + Math.sin(t * 0.24 + i) * 14;
      c.globalAlpha = 0.03 + 0.012 * Math.sin(t * 0.3 + i * 1.7);
      c.drawImage(this.mist, x, y, 680 + i * 80, 190 + i * 20);
    }

    // Low banks sit against the foundations, below the train and upper floors.
    // Keep the dark feet visible through the mist so it never hides a sky gap.
    for (let i = 0; i < 6; i++) {
      const x = layerX(-140 + i * 390, cam, PARALLAX.midground);
      const drift = Math.sin(t * 0.09 + i * 1.8) * 24 + streetWind(t) * 20;
      if (x + drift > width || x + drift + 520 < 0) continue;
      c.globalAlpha = 0.13 + Math.sin(t * 0.16 + i) * 0.015;
      c.drawImage(this.mist, x + drift, 368 + (i % 3) * 9, 520, 82);
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

      c.save();
      c.globalCompositeOperation = 'screen';
      const spill = c.createLinearGradient(0, 210, 0, 285);
      spill.addColorStop(0, '#b49c5715');
      spill.addColorStop(1, '#b49c5700');
      c.fillStyle = spill;
      for (let window = 0; window < 6; window++) c.fillRect(x + 6 + window * 10, 210, 5, 75);
      c.restore();
      c.fillStyle = '#10232b';
      c.fillRect(x, 177, 71, 17);
      c.fillStyle = '#07151c';
      c.fillRect(x + 2, 189, 66, 4);
      // Door seams and recessed window surrounds give the dark body weight.
      c.fillRect(x + 2, 180, 1, 9);
      c.fillRect(x + 68, 180, 1, 9);
      c.fillRect(x + 32, 180, 1, 12);
      for (let j = 0; j < 6; j++) {
        const wx = x + 6 + j * 10;
        c.fillStyle = '#07151c';
        c.fillRect(wx - 1, 180, 8, 7);
        c.fillStyle = j === (i * 3 + 1) % 6 ? '#4e5040' : '#a78a50';
        c.fillRect(wx, 181, 6, 5);
        // Sparse seated/standing silhouettes stay inside the tiny warm panes.
        // Stable per carriage: passengers travel with their seats, not the city.
        if ((i * 7 + j * 3) % 11 < 3) {
          const seated = (i + j) % 2 === 0;
          c.fillStyle = '#27302b';
          c.fillRect(wx + 2, seated ? 183 : 182, 1, 1);
          c.fillRect(wx + 1, seated ? 184 : 183, 3, seated ? 2 : 3);
        }
      }
      c.fillStyle = '#061219';
      c.fillRect(x + 12, 193, 10, 2);
      c.fillRect(x + 51, 193, 10, 2);
      if (i < TRAIN_CARS - 1) c.fillRect(x + 71, 189, 3, 2);
      c.fillStyle = '#354f5b';
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
        c.globalAlpha = 0.18 * power;
        c.fillRect(x, 177, 71, 4);
        c.globalAlpha = 0.58 * power;
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

  private drawReflections(c: CanvasRenderingContext2D, cam: number, t: number, layered: boolean) {
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
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const edge = 1 + Math.sin(i * 2.7 + p.x) * 0.025;
        const px = x + ((Math.cos(a) * p.w) / 2) * edge;
        const py = p.y + Math.sin(a) * p.h * edge + Math.sin(i * 1.7) * 1.5;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
    }
    c.clip();
    // Distant facades stretch through the water more than nearby figures.
    if (layered && this.distantReflection.width === c.canvas.width) {
      for (let depth = 0; depth < 91; depth += 3) {
        c.globalAlpha = 0.13 * (1 - depth / 120);
        c.drawImage(
          this.distantReflection,
          0,
          Math.max(0, reflectionSourceY(438, depth, 0.25)),
          c.canvas.width,
          3,
          Math.sin(depth * 0.15 + t) * 2,
          442 + depth,
          c.canvas.width,
          3,
        );
      }
    }
    for (let depth = 0; depth < 91; depth += 2) {
      const y = 442 + depth,
        sy = reflectionSourceY(438, depth);
      const ripple =
        Math.sin(depth * 0.81 + t * 2.7) * (0.4 + depth * 0.025) +
        Math.sin(depth * 0.19 - t * 1.4) * 1.4;
      c.globalAlpha =
        (layered ? 0.62 : 0.58) *
        (1 - depth / 120) *
        (layered ? 0.88 + 0.12 * Math.cos(depth * 0.63) : 1);
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
    // Local wavefronts distort only the patch beneath each foot, keeping distant mirrors still.
    for (const foot of this.footWater.ripples) {
      const radius = 5 + foot.age * 34;
      c.globalAlpha = (1 - foot.age / 0.85) * 0.42;
      for (let row = -2; row <= 2; row++) {
        const y = Math.round(foot.y + foot.age * 10 + row * 2);
        const sy = reflectionSourceY(438, Math.max(0, y - 442));
        const x = Math.round(foot.x - cam - radius);
        const width = Math.round(radius * 2);
        c.drawImage(
          this.reflection,
          x,
          sy,
          width,
          2,
          x + Math.sin(foot.age * 28 + row) * 2,
          y,
          width,
          2,
        );
      }
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
    ground: number,
    lights: SignLight[],
    speaking = false,
    facing = 1,
    performance?: ActorPerformance,
  ) {
    const x = worldX - cam,
      y = ground;
    // Halo and sprite stay within this bound; skip off-camera projection work.
    if (x < -80 * figure || x > c.canvas.width + 80 * figure) return;
    drawLyraEmitter(c, x, y, 70 * figure, t);
    const rim = rimAt(lights, worldX, y - 40 * figure, facing, t);
    c.save();
    c.globalAlpha = 1;
    const reaction = performance?.lyra ?? (speaking ? 'speak' : 'idle');
    this.sprites.draw(
      c,
      'lyra',
      reaction,
      reaction === 'idle' ? t : (performance?.lyraTime ?? t),
      x,
      y,
      facing,
      70 * figure,
      rim,
    );
    c.restore();
  }
  private weather(
    c: CanvasRenderingContext2D,
    t: number,
    cam: number,
    reduced: boolean,
    ambientWind: number,
  ) {
    const W = this.canvas.width;
    if (!reduced) {
      // Integrated wind moves drops continuously; the instantaneous force
      // changes their streak angle in step with cloth and vent steam.
      const windTravel = streetWindDisplacement(t) * 150;
      const slant = -3 + ambientWind * 6;
      c.lineWidth = 0.65;
      // Batch the cool rain and the streaks crossing the studio's warm doorway.
      for (const warm of [false, true]) {
        c.strokeStyle = warm ? '#edc88e78' : '#aad3d440';
        c.beginPath();
        for (const [index, r] of this.rain.entries()) {
          const x = (((r.x + (windTravel - t * 48) * r.s - cam * 0.12) % W) + W) % W,
            y = (r.y + t * 330 * r.s) % H;
          if (index % 3 !== 0 && underShelter(x + cam, y)) continue;
          const inDoorLight = Math.abs(x + cam - 1008) < 34 && y > 332 && y < 441;
          if (inDoorLight !== warm) continue;
          c.moveTo(x, y);
          c.lineTo(x + slant * r.s, y + 12 * r.s);
        }
        c.stroke();
      }
    }
    if (!reduced) drawGutters(c, cam, t);
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
        x - 32 + Math.sin(t + i) * 9 + ambientWind * cycle * 36,
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

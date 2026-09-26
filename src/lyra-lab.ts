import './character-lab.css';
import {
  loadLyraHumanoid,
  LYRA_HUMAN_CROP,
  lyraReactionFrame,
  type LyraReaction,
} from './lyra-candidate.ts';
import { drawLyraSignal } from './lyra-projection.ts';
import { hopState, orbPose, type OrbMode } from './lyra-orb.ts';
import { drawLyraBeam, drawLyraHop, drawLyraOrb } from './lyra-orb-draw.ts';
const base = import.meta.env.BASE_URL;
document.querySelector('#lab')!.innerHTML =
  `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 07</p><h1>Someone is watching.</h1><p class="intro">Lyra is an AI who lives in the city’s machines. She travels with Gravity in a small floating shell with a single eye, and she can leave it: her light hops into a camera, a screen or a lock, then comes home. Compare the humanoid projection she used before with the drone now in the game.</p></header><section class="controls"><label>Motion<select id="motion"><option value="idle">Idle / hovering</option><option value="listen">Listening / attention</option><option value="speak">Speaking</option><option value="project">Projecting / archive memory</option><option value="hop">Hopping into a machine</option></select></label><button id="pause">Pause</button><button id="replay">Replay reaction</button><button id="face">Look left</button><label>Location<select id="scene"><option value="den">Memory Den</option><option value="street">Sector 07</option></select></label></section><section class="comparison"><article><h2>01 · Previous humanoid</h2><canvas id="before" width="640" height="360" aria-label="Previous humanoid Lyra reactions"></canvas><p>The humanoid model with its cyber palette, as it appeared in the game until September 25.</p></article><article><h2>02 · Lyra’s drone — in game</h2><canvas id="after" width="640" height="360" aria-label="Lyra's drone reactions"></canvas><p>Drawn in code at 17 × 17 pixels. Shown here at five times the street scale; interiors draw her at 2.8×.</p></article></section><footer><p id="status" role="status">Loading character comparison…</p><p>Her eye tracks what holds her attention and brightens as she speaks. When she hops, the eye goes dark and the shell waits for her. The drone’s poses and timing are shared with the game.</p><p><a href="${base}">Return to the investigation ↗</a> · <a href="${base}character-lab.html">Gravity’s motion study ↗</a> · <a href="https://opengameart.org/content/mv-platformer-female-32x64">Previous model’s source &amp; CC0 license ↗</a></p></footer>`;
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const scene = document.querySelector<HTMLSelectElement>('#scene')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let playing = !reduced;
let look = 1;
function updateButton() {
  pause.textContent = playing ? 'Pause' : 'Play';
  pause.setAttribute('aria-pressed', String(playing));
}
updateButton();
pause.onclick = () => {
  playing = !playing;
  updateButton();
};
document.querySelector<HTMLButtonElement>('#face')!.onclick = (event) => {
  look *= -1;
  (event.currentTarget as HTMLButtonElement).textContent = look === 1 ? 'Look left' : 'Look right';
};
async function plate(name: string) {
  const image = new Image();
  image.src = `${base}env/${name}.webp`;
  await image.decode();
  return image;
}
const MACHINE = { x: 540, y: 110 };
const MEMORY = { x: 110, y: 170 };
Promise.all([plate('street'), plate('den'), loadLyraHumanoid()])
  .then(([street, den, humanoid]) => {
    document.querySelector('#status')!.textContent = 'READY · previous humanoid and in-game drone';
    let time = 0,
      previous = 0;
    motion.onchange = () => {
      time = playing ? 0 : 0.5;
      document.querySelector('#status')!.textContent =
        `READY · ${motion.selectedOptions[0].textContent}`;
    };
    document.querySelector<HTMLButtonElement>('#replay')!.onclick = () => {
      time = 0;
      previous = 0;
      playing = true;
      updateButton();
    };
    function backdrop(c: CanvasRenderingContext2D) {
      const background = scene.value === 'den' ? den : street;
      c.imageSmoothingEnabled = false;
      c.drawImage(
        background,
        0,
        0,
        (background.height * 16) / 9,
        background.height,
        0,
        0,
        640,
        360,
      );
      c.fillStyle = '#020a1470';
      c.fillRect(0, 0, 640, 360);
    }
    function draw(now: number) {
      if (playing && previous && !document.hidden) time += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const choice = motion.value as OrbMode | 'hop';
      const before = document.querySelector<HTMLCanvasElement>('#before')!.getContext('2d')!;
      backdrop(before);
      before.save();
      before.translate(320, 300);
      before.scale(look, 1);
      const reaction: LyraReaction = choice === 'hop' || choice === 'away' ? 'idle' : choice;
      const frames = humanoid[reaction];
      const index = lyraReactionFrame(reaction, time);
      const crop = LYRA_HUMAN_CROP;
      const scale = 160 / crop.cellHeight;
      const box = [-crop.pivotX * scale, -160, crop.width * scale, crop.height * scale] as const;
      before.drawImage(frames[index], crop.x, crop.y, crop.width, crop.height, ...box);
      drawLyraSignal(before, frames[index], crop, ...box, time);
      before.restore();

      const after = document.querySelector<HTMLCanvasElement>('#after')!.getContext('2d')!;
      backdrop(after);
      const orb = { x: 320, y: 190 };
      const zoom = 5;
      // The hop loops: out, a moment inside the machine, home, and a rest.
      const cycle = time % 4;
      const hop = choice === 'hop' ? { to: MACHINE, start: 0.4, end: 2.6 } : null;
      const state = hop ? hopState(hop, cycle, orb, reduced) : null;
      const shell = state ? state.shell : 1;
      const mode: OrbMode = shell < 0.5 ? 'away' : choice === 'hop' ? 'idle' : choice;
      const target = choice === 'project' ? MEMORY.x - orb.x : -look;
      const pose = orbPose(mode, time, time, target, reduced);
      drawLyraOrb(after, orb.x, orb.y, zoom, pose, shell);
      if (choice === 'project')
        drawLyraBeam(
          after,
          { x: orb.x + pose.gaze * zoom, y: orb.y + pose.bob * zoom },
          MEMORY,
          zoom / 2,
          time,
          reduced,
        );
      if (hop && state) drawLyraHop(after, state, hop.to, state.spark, zoom / 2, time);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })
  .catch(() => {
    document.querySelector('#status')!.textContent =
      'Could not load the comparison. Reload to retry.';
  });

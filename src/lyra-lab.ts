import './character-lab.css';
import {
  loadLyraHumanoid,
  LYRA_HUMAN_CROP,
  lyraReactionFrame,
  type LyraReaction,
} from './lyra-candidate.ts';
import { drawLyraEmitter, drawLyraSignal } from './lyra-projection.ts';
const base = import.meta.env.BASE_URL;
document.querySelector('#lab')!.innerHTML =
  `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 07</p><h1>Someone is listening.</h1><p class="intro">Lyra keeps her dark technical suit, cyan circuitry and luminous visor. Her new conversation poses add a small turn of attention, measured hand gestures, and a deliberate hand-raised pose for the archive. Compare her earlier projection with the reactions used in the game.</p></header><section class="controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="listen">Listening / attention</option><option value="speak">Speaking / hand gesture</option><option value="project">Projecting / archive memory</option><option value="walk">Walk / movement study</option></select></label><button id="pause">Pause</button><button id="replay">Replay reaction</button><button id="face">Face left</button><label>Location<select id="scene"><option value="den">Memory Den</option><option value="street">Sector 07</option></select></label><label><input id="original" type="checkbox"> Original asset colors</label></section><section class="comparison"><article><h2>01 · Previous projection</h2><canvas id="before" width="640" height="360" aria-label="Previous pale humanoid Lyra animation"></canvas><p>The approved humanoid model with its earlier pale-blue palette and neutral conversation pose.</p></article><article><h2>02 · Cyber Lyra — in game</h2><canvas id="after" width="640" height="360" aria-label="Cyber Lyra conversation reactions"></canvas><p>New pixel poses use the source artist’s arms on Lyra’s planted stance. Her projection and small idle breath remain.</p></article></section><footer><p id="status" role="status">Loading character comparison…</p><p>Listening settles into a single attention pose. Speaking rests between gestures. Projecting raises one hand and holds it for the memory; use Replay reaction to watch the transition again. Frames and timing are shared with the game.</p><p><a href="${base}">Return to the investigation ↗</a> · <a href="${base}character-lab.html">Gravity’s motion study ↗</a> · <a href="https://opengameart.org/content/mv-platformer-female-32x64">Source asset &amp; CC0 license ↗</a></p></footer>`;
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const scene = document.querySelector<HTMLSelectElement>('#scene')!;
const originalColors = document.querySelector<HTMLInputElement>('#original')!;
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let facing = 1;
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
  facing *= -1;
  (event.currentTarget as HTMLButtonElement).textContent =
    facing === 1 ? 'Face left' : 'Face right';
};
async function plate(name: string) {
  const image = new Image();
  image.src = `${base}env/${name}.webp`;
  await image.decode();
  return image;
}
Promise.all([
  plate('street'),
  plate('den'),
  loadLyraHumanoid(false, 'projection'),
  loadLyraHumanoid(),
  loadLyraHumanoid(true),
])
  .then(([street, den, current, candidate, original]) => {
    document.querySelector('#status')!.textContent =
      'READY · previous projection and cyber game version';
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
    function draw(now: number) {
      if (playing && previous && !document.hidden) time += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const reaction = motion.value as LyraReaction;
      const walking = reaction === 'walk';
      const background = scene.value === 'den' ? den : street;
      for (const [i, id] of ['before', 'after'].entries()) {
        const c = document.querySelector<HTMLCanvasElement>(`#${id}`)!.getContext('2d')!;
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
        if (i) drawLyraEmitter(c, 320, 300, 160, time);
        else {
          const glow = c.createRadialGradient(320, 235, 4, 320, 235, 110);
          glow.addColorStop(0, '#62cdeb30');
          glow.addColorStop(1, '#62cdeb00');
          c.fillStyle = glow;
          c.fillRect(200, 120, 240, 230);
        }
        c.save();
        c.translate(320, 300);
        c.scale(facing, 1);
        c.globalAlpha = i ? 1 : 0.93;
        const crop = LYRA_HUMAN_CROP;
        const frames = i
          ? (originalColors.checked ? original : candidate)[reaction]
          : current[walking ? 'walk' : 'idle'];
        const index = lyraReactionFrame(i ? reaction : walking ? 'walk' : 'idle', time);
        // A restrained breath changes chest/head height around a fixed sole pivot.
        // The single authored idle pose is preserved; no leg cropping or bobbing.
        if (!walking) {
          const breath = Math.sin(time * 1.7);
          c.transform(1, 0, breath * 0.002, 1 + breath * 0.004, 0, 0);
        }
        const scale = 160 / crop.cellHeight;
        c.drawImage(
          frames[index],
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          -crop.pivotX * scale,
          -160,
          crop.width * scale,
          crop.height * scale,
        );
        if (i && !originalColors.checked)
          drawLyraSignal(
            c,
            frames[index],
            crop,
            -crop.pivotX * scale,
            -160,
            crop.width * scale,
            crop.height * scale,
            time,
          );
        c.restore();
        if (!i) {
          c.strokeStyle = '#88cfe050';
          c.beginPath();
          c.ellipse(320, 301, 28, 4, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })
  .catch(() => {
    document.querySelector('#status')!.textContent =
      'Could not load the comparison. Reload to retry.';
  });

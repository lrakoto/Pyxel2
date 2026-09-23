import './character-lab.css';
import {
  loadLyraCandidate,
  LYRA_CROP,
  loadLyraHumanoid,
  LYRA_HUMAN_CROP,
} from './lyra-candidate.ts';
const base = import.meta.env.BASE_URL;
document.querySelector('#lab')!.innerHTML =
  `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 05</p><h1>A more human Lyra.</h1><p class="intro">A different character model, with a slender silhouette, short bob and a readable face. MoikMellah’s female platformer character becomes a cyan projection. Compare the new game model directly with Lyra’s previous design.</p></header><section class="controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="walk">Walk / movement study</option></select></label><button id="pause">Pause</button><button id="face">Face left</button><label>Location<select id="scene"><option value="den">Memory Den</option><option value="street">Sector 07</option></select></label><label><input id="original" type="checkbox"> New model: original asset colors</label></section><section class="comparison"><article><h2>01 · Previous model</h2><canvas id="before" width="640" height="360" aria-label="Previous Warped Caves Lyra animation"></canvas><p>Ansimuz’s Warped Caves character, retained here for comparison.</p></article><article><h2>02 · New game model — Lyra</h2><canvas id="after" width="640" height="360" aria-label="New female humanoid Lyra animation"></canvas><p>Lyra’s new CC0 model by MoikMellah, with bob hair and a cyan palette.</p></article></section><footer><p id="status" role="status">Loading character comparison…</p><p>New model: breathing from 1 authored idle pose · 6 authored walk frames. Breathing stays anchored at the feet. The previous model has 4 idle and 10 run frames; its run is shown alongside the new walk for comparison.</p><p><a href="${base}">Return to the investigation ↗</a> · <a href="${base}character-lab.html">Gravity’s motion study ↗</a> · <a href="https://opengameart.org/content/mv-platformer-female-32x64">New asset &amp; CC0 license ↗</a></p></footer>`;
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
  loadLyraCandidate(),
  loadLyraHumanoid(),
  loadLyraHumanoid(true),
])
  .then(([street, den, current, candidate, original]) => {
    document.querySelector('#status')!.textContent = 'READY · previous model and new game model';
    let time = 0,
      previous = 0;
    function draw(now: number) {
      if (playing && previous && !document.hidden) time += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const walking = motion.value === 'walk';
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
        const glow = c.createRadialGradient(320, 235, 4, 320, 235, 110);
        glow.addColorStop(0, '#62cdeb30');
        glow.addColorStop(1, '#62cdeb00');
        c.fillStyle = glow;
        c.fillRect(200, 120, 240, 230);
        c.save();
        c.translate(320, 300);
        c.scale(facing, 1);
        c.globalAlpha = 0.93;
        const crop = i ? LYRA_HUMAN_CROP : LYRA_CROP;
        const frames = i
          ? (originalColors.checked ? original : candidate)[walking ? 'walk' : 'idle']
          : current[walking ? 'run' : 'idle'];
        const index = Math.floor(time * (walking ? (i ? 8 : 12.5) : 4 / 1.2)) % frames.length;
        // A restrained breath changes chest/head height around a fixed sole pivot.
        // The single authored idle pose is preserved; no leg cropping or bobbing.
        if (i && !walking) {
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
        c.restore();
        c.strokeStyle = '#88cfe050';
        c.beginPath();
        c.ellipse(320, 301, 28, 4, 0, 0, Math.PI * 2);
        c.stroke();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })
  .catch(() => {
    document.querySelector('#status')!.textContent =
      'Could not load the comparison. Reload to retry.';
  });

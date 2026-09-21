import { Scarf } from './scarf.ts';
import './character-lab.css';
import {
  loadCandidate,
  CANDIDATE_CLIPS,
  CANDIDATE_CROP,
  scarfSocket,
} from './character-candidate.ts';
const base = import.meta.env.BASE_URL;
const root = document.querySelector<HTMLElement>('#lab')!;
root.innerHTML = `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 03</p><h1>Meet Gravity.</h1><p class="intro">Our detective, reimagined. Blonde hair, black clothing and the same hand-authored animation you chose. Compare the original palette with Gravity, then take her onto the street.</p></header><section class="controls" aria-label="Animation controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="walk" selected>Walk</option><option value="sprint">Sprint</option></select></label><button id="play" aria-pressed="true">Pause</button><button id="face">Face left</button><label>Speed<select id="speed"><option value="0.5">½ speed</option><option value="1" selected>Normal</option><option value="1.5">1½ speed</option></select></label><label class="scrub">Frame<input id="scrub" type="range" min="0" max="11" value="0" step="1"></label></section><section class="controls" aria-label="Movement controls"><button id="control" aria-pressed="false">Take control</button><button id="left" aria-label="Move left">←</button><button id="right" aria-label="Move right">→</button><button id="dash">Hold to sprint</button><span>Keyboard: A / D or arrows · Shift to sprint</span></section><section class="comparison"><article><h2><span>01</span> Original palette · Ansimuz</h2><canvas id="current" width="640" height="360" aria-label="Original Warped City animation on the street"></canvas><p>The original yellow outfit and purple hair, preserved for comparison.</p></article><article><h2><span>02</span> Gravity · final palette</h2><canvas id="prototype" width="640" height="360" aria-label="Gravity animation on the street"></canvas><p>16-frame walk · 8-frame run · 4-frame idle. Adapted from Luis Zuno’s CC0 pixel art.</p></article></section><footer><p id="status" role="status">Loading character study…</p><p>Gravity is now the protagonist. Her red scarf now follows her movement, with a fitted neck wrap and simulated cloth tail. Investigation gestures currently use her idle animation.</p><p><a href="${base}">Play as Gravity ↗</a> · <a href="${base}?character=original">Try the original palette ↗</a></p><a href="https://opengameart.org/content/warped-city">Source art &amp; CC0 license ↗</a></footer>`;
type Clip = { name: string; count: number; duration: number };
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;
const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const face = document.querySelector<HTMLButtonElement>('#face')!;
const contexts = ['current', 'prototype'].map(
  (id) => document.querySelector<HTMLCanvasElement>(`#${id}`)!.getContext('2d')!,
);
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let facing = 1,
  elapsed = 0,
  last = 0;
let clips: Clip[] = [];
let controlled = false,
  position = 320;
const keys = new Set<string>();
const control = document.querySelector<HTMLButtonElement>('#control')!;
control.onclick = () => {
  controlled = !controlled;
  control.textContent = controlled ? 'Return to animation study' : 'Take control';
  control.setAttribute('aria-pressed', String(controlled));
  motion.disabled = play.disabled = scrub.disabled = speed.disabled = face.disabled = controlled;
  keys.clear();
  if (controlled) speed.value = '1';
  face.textContent = facing === 1 ? 'Face left' : 'Face right';
  elapsed = 0;
  button();
};
for (const id of ['left', 'right', 'dash']) {
  const target = document.querySelector<HTMLButtonElement>(`#${id}`)!;
  target.onpointerdown = (event) => {
    event.preventDefault();
    if (!controlled) control.click();
    target.setPointerCapture(event.pointerId);
    keys.add(id);
  };
  target.onpointerup = target.onpointercancel = target.onlostpointercapture = () => keys.delete(id);
}
function movementKey(code: string) {
  return ['KeyA', 'ArrowLeft'].includes(code)
    ? 'left'
    : ['KeyD', 'ArrowRight'].includes(code)
      ? 'right'
      : code.startsWith('Shift')
        ? 'dash'
        : null;
}
addEventListener('keydown', (event) => {
  const key = movementKey(event.code);
  if (!controlled || !key) return;
  event.preventDefault();
  keys.add(key);
});
addEventListener('keyup', (event) => {
  const key = movementKey(event.code);
  if (key) keys.delete(key);
});
addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) keys.clear();
});
function button() {
  play.textContent = playing ? 'Pause' : 'Play';
  play.setAttribute('aria-pressed', String(playing));
}
play.onclick = () => {
  playing = !playing;
  button();
};
face.onclick = () => {
  facing *= -1;
  face.textContent = facing === 1 ? 'Face left' : 'Face right';
};
motion.onchange = () => {
  elapsed = 0;
  scrub.max = String((clips.find((c) => c.name === motion.value)?.count ?? 1) - 1);
  button();
};
scrub.oninput = () => {
  const clip = clips.find((c) => c.name === motion.value);
  if (!clip) return;
  elapsed = (Number(scrub.value) / clip.count) * clip.duration;
  playing = false;
  button();
};
async function image(src: string) {
  const im = new Image();
  im.src = base + src;
  await im.decode();
  return im;
}
async function load() {
  const [street, candidate, original] = await Promise.all([
    image('env/street.webp'),
    loadCandidate(),
    loadCandidate('original'),
  ]);
  clips = Object.entries(CANDIDATE_CLIPS)
    .filter(([name]) => name !== 'jump')
    .map(([name, clip]) => ({
      name,
      count: clip.count,
      duration: clip.duration,
    }));
  scrub.max = '15';
  document.querySelector('#status')!.textContent =
    'READY · 28 authored frames · matching foot baseline';
  button();
  const scarf = new Scarf();
  function draw(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    if (controlled) {
      const direction = Number(keys.has('right')) - Number(keys.has('left'));
      if (direction) facing = direction;
      position = Math.max(
        60,
        Math.min(580, position + direction * (keys.has('dash') ? 220 : 110) * dt),
      );
      motion.value = direction ? (keys.has('dash') ? 'sprint' : 'walk') : 'idle';
      playing = true;
    }
    const clip = clips.find((c) => c.name === motion.value)!;
    scrub.max = String(clip.count - 1);
    if (playing && last && !document.hidden)
      elapsed += Math.min(0.05, (now - last) / 1000) * Number(speed.value);
    last = now;
    const phase = (elapsed % clip.duration) / clip.duration;
    const frame = Math.floor(phase * clip.count);
    scrub.value = String(frame);
    for (const [index, c] of contexts.entries()) {
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, 640, 360);
      c.drawImage(street, 0, 0, street.height * (16 / 9), street.height, 0, 0, 640, 360);
      c.fillStyle = '#03080745';
      c.fillRect(0, 0, 640, 360);
      c.fillStyle = '#02070999';
      c.beginPath();
      c.ellipse(position, 312, 28, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.save();
      c.translate(position, 312);
      c.scale(facing, 1);
      const frames = (index === 1 ? candidate : original)[clip.name as keyof typeof candidate];
      const crop = CANDIDATE_CROP;
      const scale = 160 / crop.cellHeight;
      if (index === 1) {
        const neck = scarfSocket(frames[frame]);
        scarf.step(
          !playing || matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 0
            : dt * Number(speed.value),
          position + (neck.x - crop.pivotX) * scale * facing,
          312 - 160 + (neck.y - crop.y) * scale,
          clip.name === 'idle' ? 0 : (clip.name === 'sprint' ? 290 : 145) * facing,
          160,
        );
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        scarf.draw(c, 0, null);
        c.restore();
      }
      c.drawImage(
        frames[frame],
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
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
load().catch((error) => {
  document.querySelector('#status')!.textContent = 'Could not load the study. Reload to retry.';
  console.error(error);
});

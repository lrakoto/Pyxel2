import './character-lab.css';
import { COLE_STORY_FRAMES } from './character-art.ts';
import { loadCandidate, CANDIDATE_CLIPS, CANDIDATE_CROP } from './character-candidate.ts';
const base = import.meta.env.BASE_URL;
const root = document.querySelector<HTMLElement>('#lab')!;
root.innerHTML = `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 02</p><h1>Cole, in motion.</h1><p class="intro">Hand-authored pixel animation alongside Cole. Compare the footwork and weight, then try the candidate on the actual street. The yellow outfit is the original asset, ready for a later noir redesign.</p></header><section class="controls" aria-label="Animation controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="walk" selected>Walk</option><option value="sprint">Sprint</option></select></label><button id="play" aria-pressed="true">Pause</button><button id="face">Face left</button><label>Speed<select id="speed"><option value="0.5">½ speed</option><option value="1" selected>Normal</option><option value="1.5">1½ speed</option></select></label><label class="scrub">Frame<input id="scrub" type="range" min="0" max="11" value="0" step="1"></label></section><section class="controls" aria-label="Movement controls"><button id="control" aria-pressed="false">Take control</button><button id="left" aria-label="Move left">←</button><button id="right" aria-label="Move right">→</button><button id="dash">Hold to sprint</button><span>Keyboard: A / D or arrows · Shift to sprint</span></section><section class="comparison"><article><h2><span>01</span> Current pixel character</h2><canvas id="current" width="640" height="360" aria-label="Current Cole animation on the street"></canvas><p>Procedural pixel poses and existing silhouette.</p></article><article><h2><span>02</span> Warped City · Ansimuz</h2><canvas id="prototype" width="640" height="360" aria-label="Warped City pixel animation on the street"></canvas><p>16-frame walk · 8-frame run · 4-frame idle. Original CC0 pixel art by Luis Zuno.</p></article></section><footer><p id="status" role="status">Loading character study…</p><p>This study uses the original outfit and palette. A Cole adaptation would retain his hat, coat and red scarf. Investigation gestures currently use the candidate’s idle pose.</p><p><a href="${base}?character=warped">Play the candidate in the game ↗</a> · <a href="${base}">Play original Cole ↗</a></p><a href="https://opengameart.org/content/warped-city">Source art &amp; CC0 license ↗</a></footer>`;
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
  const [street, candidate] = await Promise.all([image('env/street.webp'), loadCandidate()]);
  clips = Object.entries(CANDIDATE_CLIPS).map(([name, clip]) => ({
    name,
    count: clip.count,
    duration: clip.duration,
  }));
  scrub.max = '15';
  document.querySelector('#status')!.textContent =
    'READY · 28 authored frames · matching foot baseline';
  button();
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
      if (index === 1) {
        const frames = candidate[clip.name as keyof typeof candidate];
        const crop = CANDIDATE_CROP;
        const scale = 160 / crop.cellHeight;
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
      } else {
        const tag = clip.name === 'walk' ? 'stride' : clip.name === 'idle' ? 'breathe' : 'sprint';
        const frames = COLE_STORY_FRAMES[tag];
        const im = frames[Math.min(frames.length - 1, Math.floor(phase * frames.length))];
        if (clip.name === 'sprint') c.transform(1, 0, -0.045, 1, 0, 0);
        c.drawImage(im, -40, -160, 80, 160);
      }
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

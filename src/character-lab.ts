import './character-lab.css';
import { COLE_STORY_FRAMES } from './character-art.ts';
const base = import.meta.env.BASE_URL;
const root = document.querySelector<HTMLElement>('#lab')!;
root.innerHTML = `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 01</p><h1>Cole, in motion.</h1><p class="intro">A first Blender rig alongside the current pixel character. Same street, same height. Judge the silhouette, weight and transitions before we commit to new art.</p></header><section class="controls" aria-label="Animation controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="walk" selected>Walk</option><option value="sprint">Sprint</option><option value="stop">Stop / settle</option></select></label><button id="play" aria-pressed="true">Pause</button><button id="face">Face left</button><label>Speed<select id="speed"><option value="0.5">½ speed</option><option value="1" selected>Normal</option><option value="1.5">1½ speed</option></select></label><label class="scrub">Frame<input id="scrub" type="range" min="0" max="11" value="0" step="1"></label></section><section class="comparison"><article><h2><span>01</span> Current pixel character</h2><canvas id="current" width="640" height="360" aria-label="Current Cole animation on the street"></canvas><p>Procedural pixel poses and existing silhouette.</p></article><article><h2><span>02</span> Blender rig prototype</h2><canvas id="prototype" width="640" height="360" aria-label="Blender Cole animation on the street"></canvas><p>Articulated limbs, planted-foot targets, split coat and orthographic rendering.</p></article></section><footer><p id="status" role="status">Loading character study…</p><p>This is a motion prototype, not final character art. The gameplay character remains unchanged. The stop study holds its final pose; choose Replay to watch it again.</p><a href="${base}character-lab/cole.png">View the rendered sprite sheet ↗</a></footer>`;
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
function button() {
  play.textContent = playing
    ? 'Pause'
    : motion.value === 'stop' && elapsed >= 0.45
      ? 'Replay'
      : 'Play';
  play.setAttribute('aria-pressed', String(playing));
}
play.onclick = () => {
  if (!playing && motion.value === 'stop' && elapsed >= 0.45) elapsed = 0;
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
  const [street, atlas, manifest] = await Promise.all([
    image('env/street.webp'),
    image('character-lab/cole.png'),
    fetch(base + 'character-lab/clips.json').then((r) => {
      if (!r.ok) throw Error('Missing clip metadata');
      return r.json();
    }),
  ]);
  clips = manifest.clips;
  document.querySelector('#status')!.textContent =
    'READY · 40 rendered frames · 64 × 96 sprite cells';
  button();
  function draw(now: number) {
    const clip = clips.find((c) => c.name === motion.value)!;
    if (playing && last && !document.hidden)
      elapsed += Math.min(0.05, (now - last) / 1000) * Number(speed.value);
    last = now;
    if (clip.name === 'stop' && elapsed >= clip.duration) {
      elapsed = clip.duration;
      playing = false;
      button();
    }
    const phase =
      clip.name === 'stop'
        ? Math.min(0.999, elapsed / clip.duration)
        : (elapsed % clip.duration) / clip.duration;
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
      c.ellipse(320, 312, 28, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.save();
      c.translate(320, 312);
      c.scale(facing, 1);
      if (index === 1) {
        const row = clips.indexOf(clip);
        // Camera frames 2.25m; foot baseline includes the transparent camera margin.
        c.drawImage(atlas, frame * 64, row * 96, 64, 96, -57, -165, 114, 172);
      } else {
        const tag =
          clip.name === 'walk'
            ? 'stride'
            : clip.name === 'idle'
              ? 'breathe'
              : clip.name === 'stop'
                ? 'breathe'
                : 'sprint';
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

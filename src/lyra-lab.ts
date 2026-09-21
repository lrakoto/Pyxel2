import './character-lab.css';
import { LYRA_STORY_FRAMES } from './character-art.ts';
import { loadLyraCandidate, LYRA_CROP } from './lyra-candidate.ts';
const base = import.meta.env.BASE_URL;
document.querySelector('#lab')!.innerHTML =
  `<header><a href="${base}">← Return to the investigation</a><p>CHARACTER DEPARTMENT · STUDY 04</p><h1>Lyra, in the light.</h1><p class="intro">A new character asset: Ansimuz’s Warped Caves heroine, adapted into Lyra’s blue and cyan projection. Compare her silhouette with the previous procedural character.</p></header><section class="controls"><label>Motion<select id="motion"><option value="idle">Idle / breathing</option><option value="run">Run / asset preview</option></select></label><button id="pause">Pause</button><button id="face">Face left</button><label><input id="original" type="checkbox"> Original asset colors</label></section><section class="comparison"><article><h2>01 · Previous projection</h2><canvas id="before" width="640" height="360" aria-label="Previous Lyra animation"></canvas></article><article><h2>02 · New asset — Lyra</h2><canvas id="after" width="640" height="360" aria-label="New asset-based Lyra animation"></canvas></article></section><footer><p id="status" role="status">Loading street…</p><p>4-frame idle · 10-frame run · CC0 artwork by Luis Zuno / Ansimuz. The game uses idle during dialogue; dedicated speaking poses are not included in this asset.</p><p><a href="${base}">Return to Gravity and Lyra ↗</a> · <a href="${base}character-lab.html">Gravity’s motion study ↗</a> · <a href="https://opengameart.org/content/warped-caves-pixel-art-pack">Asset &amp; license ↗</a></p></footer>`;
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
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
const street = new Image();
street.src = `${base}env/street.webp`;
Promise.all([street.decode(), loadLyraCandidate(), loadLyraCandidate(true)])
  .then(([, candidate, original]) => {
    document.querySelector('#status')!.textContent = 'READY · actual game frames';
    let time = 0,
      previous = 0;
    function draw(now: number) {
      if (playing && previous && !document.hidden) time += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const running = motion.value === 'run';
      for (const [i, id] of ['before', 'after'].entries()) {
        const c = document.querySelector<HTMLCanvasElement>(`#${id}`)!.getContext('2d')!;
        c.imageSmoothingEnabled = false;
        c.drawImage(street, 0, 0, (street.height * 16) / 9, street.height, 0, 0, 640, 360);
        c.fillStyle = '#020a1490';
        c.fillRect(0, 0, 640, 360);
        const glow = c.createRadialGradient(320, 235, 4, 320, 235, 110);
        glow.addColorStop(0, '#62cdeb30');
        glow.addColorStop(1, '#62cdeb00');
        c.fillStyle = glow;
        c.fillRect(200, 120, 240, 230);
        c.save();
        c.translate(320, 312);
        c.scale(facing, 1);
        c.globalAlpha = 0.9;
        if (i) {
          const frames = (
            document.querySelector<HTMLInputElement>('#original')!.checked ? original : candidate
          )[running ? 'run' : 'idle'];
          const index = Math.floor(time * (running ? 12.5 : 4 / 1.2)) % frames.length;
          const crop = LYRA_CROP,
            scale = 160 / crop.cellHeight;
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
        } else {
          c.drawImage(LYRA_STORY_FRAMES.idle[Math.floor(time * 2) % 4], -40, -160, 80, 160);
        }
        c.restore();
        c.strokeStyle = '#88cfe050';
        c.beginPath();
        c.ellipse(320, 313, 28, 4, 0, 0, Math.PI * 2);
        c.stroke();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })
  .catch(() => {
    document.querySelector('#status')!.textContent = 'Could not load the street. Reload to retry.';
  });

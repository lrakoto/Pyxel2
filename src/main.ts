import './style.css';
import {
  AREAS,
  CLUES,
  DEDUCTIONS,
  LYRA_INTRO,
  LYRA_ARCHIVE,
  type AreaId,
  type ClueId,
  type Hotspot,
} from './content.ts';
import {
  CaseModel,
  SAVE_KEY,
  parseSave,
  freshSave,
  clamp,
  stepBody,
  nextRouteHotspot,
  type Body,
} from './model.ts';
import { Renderer, H } from './renderer.ts';
import { AudioEngine } from './audio.ts';
import { Combat } from './combat.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const icon = (name: string) => {
  const paths: Record<string, string> = {
    case: '<rect x="3" y="6" width="18" height="15" rx="1"/><path d="M8 6V3h8v3M3 12h18M10 12v3h4v-3"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    sound: '<path d="M11 4 5 9H2v6h3l6 5zM15 8q6 4 0 8M18 4q10 8 0 16"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',
    focus: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    headphones: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v8h4v-8zM20 12h2v8h-4v-8z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
let raw: string | null = null;
try {
  raw = localStorage.getItem(SAVE_KEY);
} catch {
  /* Device storage can be unavailable. */
}
const model = new CaseModel(parseSave(raw));
const hasSave = model.save.clues.length > 0 || model.save.x !== 440 || model.save.area !== 'street';
document.getElementById('app')!.innerHTML = `
 <main class="shell" id="shell">
  <header class="topbar">
   <a class="monogram" href="#" id="brand" aria-label="Pause Everybody Nobody">E<span>/</span>N<span class="brand-dot">®</span></a>
   <div class="edition"><span>EVERYBODY / NOBODY</span><strong>ISSUE 01 <i>—</i> FRAGMENTS</strong></div>
   <nav aria-label="Game controls">
    <button class="nav-button" id="board-btn" aria-label="Case board">${icon('case')}<span>Case board</span><kbd>J</kbd><b id="clue-count">00</b></button>
    <button class="icon-button" id="map-btn" aria-label="District map" title="District map [M]">${icon('map')}</button>
    <button class="icon-button" id="sound-btn" aria-label="Mute sound" aria-pressed="false" title="Toggle sound">${icon('sound')}</button>
    <button class="icon-button" id="pause-btn" aria-label="Pause and settings" title="Pause [Esc]">${icon('pause')}</button>
   </nav>
  </header>
  <section class="game-wrap" aria-label="Playable investigation">
   <div class="scene-meta"><span><i class="live-dot"></i> <span id="district-label">NEW ANGELES</span></span><span id="scene-clock">04 SEP 2077 <b>·</b> 02:37 AM</span></div>
   <div id="stage" class="stage">
    <canvas id="world" aria-label="Side-scrolling game world. Use A and D to walk, E to examine, I to highlight evidence, and J to open the case board."></canvas>
    <div class="vignette" aria-hidden="true"></div><div class="scanlines" aria-hidden="true"></div>
    <div class="scene-hud" id="scene-hud"><div class="location"><span class="eyebrow" id="location-subtitle"></span><h1 id="location-title"></h1><span class="location-rule"></span></div><button id="objective-btn" class="objective"><span class="eyebrow"><i class="red-square"></i> CURRENT LEAD</span><span id="objective-text"></span><small id="objective-hint">OPEN CASE BOARD ↗</small></button></div>
    <div id="hotspots" class="hotspots" aria-label="Nearby places and evidence"></div>
    <div id="focus-status" class="focus-status" hidden><i></i> FOCUS ACTIVE <span>Follow what the city leaves behind.</span></div>
    <div id="destination" class="destination" hidden>⌄</div>
    <div id="interaction" class="interaction" hidden><button id="interact-btn"><kbd>E</kbd><span id="interaction-label">Examine</span>${icon('arrow')}</button></div>
    <div id="area-card" class="area-card" aria-live="polite"></div>
    <div id="combat-hud" class="combat-hud" hidden><div><span class="eyebrow">COLE · VITALS</span><strong id="hp-text">100</strong><div class="hp-track"><i id="hp-fill"></i></div></div><div><span class="eyebrow">HOSTILE CONTACT</span><strong id="wave-text">WAVE 01 / 02</strong><button id="withdraw-btn">Disengage <kbd>Q</kbd></button></div></div>
    <div id="companion" class="companion" hidden><button id="companion-btn"><span class="waveform">▂▆▃▇▂</span><span>LYRA <small>CHANNEL OPEN</small></span></button></div>
    <div id="dialogue" class="dialogue" hidden aria-label="Conversation"><div class="portrait-mark" id="portrait-mark">C<span>/</span></div><div class="dialogue-copy"><div class="dialogue-top"><span id="speaker" class="eyebrow">COLE</span><span id="line-count" class="eyebrow"></span></div><p id="dialogue-text"></p><div class="dialogue-bottom"><span id="dialogue-context">DETECTIVE’S OBSERVATION</span><button id="advance-btn">Continue <kbd>E</kbd>${icon('arrow')}</button></div></div></div>
    <div id="transition" class="transition" aria-hidden="true"></div>
    <section id="title-screen" class="title-screen" aria-label="Start game"><div class="title-content"><div class="eyebrow title-kicker"><span>AN INTERACTIVE NOIR</span><i></i> NEW ANGELES, 2077</div><h1 class="game-title">EVERYBODY<span class="title-slash">/</span><br><span class="nobody">NOBODY</span><span class="title-period">.</span></h1><div class="issue-label"><span>ISSUE 01</span><i></i><strong>Fragments</strong></div><p class="opening">One dead artist. A thousand stolen minds.<br>Someone has to remember.</p><button class="primary" id="begin-btn" disabled><span id="begin-text">Entering New Angeles</span>${icon('arrow')}</button><div class="title-footnote">${icon('headphones')} HEADPHONES RECOMMENDED <span>·</span> SAVED ON THIS DEVICE</div></div><div class="title-coordinates"><span>SECTOR</span><strong>07</strong><span>34°03′ N<br>118°15′ W</span></div></section>
    <div class="touch-controls" id="touch-controls"><button data-hold="left" aria-label="Move left">←</button><button data-hold="right" aria-label="Move right">→</button><button data-hold="jump" aria-label="Jump">↑</button><button id="touch-act" aria-label="Examine">E</button><button data-hold="fire" aria-label="Fire toward nearest enemy">◎</button></div>
   </div>
   <div class="scene-footer"><span id="chapter-label"><i>01</i> THE LAST WORK</span><span id="save-status"><i class="save-dot"></i> LOCAL CHECKPOINT</span><span>RAIN EXPECTED <i>↙</i> 17°C</span></div>
  </section>
  <footer class="bottom-bar"><div class="controls-hint" id="controls-hint"><span><kbd>A</kbd><kbd>D</kbd> Walk</span><span><kbd>E</kbd> Interact</span><span><kbd>I</kbd> Focus</span><span class="desktop-hint">Click to walk</span></div><button id="focus-btn" class="focus-button" aria-pressed="false">${icon('focus')}<span>Focus mode</span><kbd>I</kbd></button><span class="build-label">A NEW ANGELES STORY <b>/</b> 01</span></footer>
 </main>
 <dialog id="panel" class="panel" aria-labelledby="panel-title"><div id="panel-content"></div></dialog>
 <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

class Game {
  model = model;
  renderer = new Renderer($<HTMLCanvasElement>('world'));
  audio = new AudioEngine();
  player: Body = {
    x: model.save.x,
    y: AREAS[model.save.area].ground,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
  };
  camera = clamp(model.save.x - this.viewW * 0.48, 0, AREAS[model.save.area].width - this.viewW);
  time = 0;
  started = false;
  ready = false;
  scan = false;
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  combat: Combat | null = null;
  combatStory = false;
  aim = { x: 700, y: 400 };
  firing = false;
  keys = new Set<string>();
  touchPointers = new Map<number, string>();
  target: number | null = null;
  pending: Hotspot | null = null;
  queuedRoute: string | null = null;
  nearest: Hotspot | null = null;
  lines: { speaker: string; text: string }[] = [];
  lineIndex = 0;
  reveal = 0;
  dialogueDone: (() => void) | null = null;
  transitioning = false;
  panelMode = '';
  selected: ClueId[] = [];
  previous = 0;
  accumulator = 0;
  lastUI = 0;
  lastSave = 0;
  stepTime = 0;
  toastTimer = 0;
  raf = 0;
  events = new AbortController();
  resizeObserver: ResizeObserver;
  get viewW() {
    return this.renderer.canvas.width;
  }
  constructor() {
    this.loadPreferences();
    this.bind();
    this.refreshArea();
    this.sync();
    this.resizeObserver = new ResizeObserver(() => {
      const r = $('stage').getBoundingClientRect();
      this.renderer.resize(Math.round((H * r.width) / r.height));
      this.camera = clamp(
        this.player.x - this.viewW * 0.48,
        0,
        this.currentArea.width - this.viewW,
      );
      this.syncHotspots();
    });
    this.resizeObserver.observe($('stage'));
    this.renderer
      .load()
      .then(() => {
        this.ready = true;
        $<HTMLButtonElement>('begin-btn').disabled = false;
        $('begin-text').textContent = hasSave ? 'Continue investigation' : 'Begin investigation';
      })
      .catch(() => {
        $('begin-text').textContent = 'Retry loading the city';
        $<HTMLButtonElement>('begin-btn').disabled = false;
        this.toast('The environment could not load. Select Retry to try again.');
      });
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  loadPreferences() {
    try {
      const p = JSON.parse(localStorage.getItem('en:preferences') || 'null');
      if (p) {
        this.audio.volume =
          typeof p.volume === 'number' && Number.isFinite(p.volume) ? clamp(p.volume, 0, 1) : 0.5;
        this.audio.muted = p.muted === true;
        this.reducedMotion =
          typeof p.reducedMotion === 'boolean' ? p.reducedMotion : this.reducedMotion;
      }
    } catch {
      /**/
    }
    document.body.classList.toggle('reduced-motion', this.reducedMotion);
    this.syncSound();
  }
  preferences() {
    try {
      localStorage.setItem(
        'en:preferences',
        JSON.stringify({
          volume: this.audio.volume,
          muted: this.audio.muted,
          reducedMotion: this.reducedMotion,
        }),
      );
    } catch {
      /**/
    }
  }
  bind() {
    const s = { signal: this.events.signal };
    $('begin-btn').addEventListener(
      'click',
      () => {
        if (!this.ready) {
          location.reload();
          return;
        }
        this.begin();
      },
      s,
    );
    $('board-btn').addEventListener('click', () => this.openBoard(), s);
    $('objective-btn').addEventListener('click', () => this.openBoard(), s);
    $('map-btn').addEventListener('click', () => this.openMap(), s);
    $('pause-btn').addEventListener('click', () => this.openPause(), s);
    $('brand').addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        this.openPause();
      },
      s,
    );
    $('sound-btn').addEventListener(
      'click',
      () => {
        void this.audio.init().then(() => this.audio.area(this.model.save.area));
        this.audio.toggle();
        this.syncSound();
        this.preferences();
      },
      s,
    );
    $('focus-btn').addEventListener('click', () => this.toggleScan(), s);
    $('interact-btn').addEventListener('click', () => this.examineNearest(), s);
    $('touch-act').addEventListener('click', () => this.examineNearest(), s);
    $('advance-btn').addEventListener('click', () => this.advance(), s);
    $('withdraw-btn').addEventListener('click', () => this.finishCombat(true), s);
    $('companion-btn').addEventListener('click', () => this.companionTalk(), s);
    $('hotspots').addEventListener(
      'click',
      (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hotspot]');
        if (b) {
          const h = this.currentArea.hotspots.find((h) => h.id === b.dataset.hotspot);
          if (h) this.goTo(h);
        }
      },
      s,
    );
    $('world').addEventListener(
      'pointerdown',
      (e) => {
        if (!this.started || this.modal || this.lines.length || this.transitioning) return;
        const p = this.pointer(e);
        this.aim = p;
        if (this.combat) {
          this.firing = true;
          return;
        }
        this.target = clamp(p.x, 35, this.currentArea.width - 35);
        this.pending = null;
        this.queuedRoute = null;
        this.keys.clear();
      },
      s,
    );
    $('stage').addEventListener(
      'pointermove',
      (e) => {
        this.aim = this.pointer(e);
      },
      s,
    );
    window.addEventListener(
      'pointerup',
      (e) => {
        if (this.touchPointers.has(e.pointerId)) this.releaseTouch(e.pointerId);
        else if (!this.keys.has('touch-fire')) this.firing = false;
      },
      s,
    );
    window.addEventListener('pointercancel', (e) => this.releaseTouch(e.pointerId), s);
    for (const button of document.querySelectorAll<HTMLElement>('[data-hold]')) {
      button.addEventListener(
        'pointerdown',
        (e) => {
          e.preventDefault();
          if (this.modal || !this.started) return;
          button.setPointerCapture(e.pointerId);
          const action = button.dataset.hold!;
          this.touchPointers.set(e.pointerId, action);
          this.keys.add('touch-' + action);
          this.target = null;
          this.pending = null;
          this.queuedRoute = null;
          if (action === 'fire') this.firing = true;
        },
        s,
      );
      button.addEventListener('lostpointercapture', (e) => this.releaseTouch(e.pointerId), s);
    }
    window.addEventListener('keydown', (e) => this.keydown(e), s);
    window.addEventListener('keyup', (e) => this.keys.delete(e.code), s);
    window.addEventListener('blur', () => this.clearInput(), s);
    document.addEventListener(
      'visibilitychange',
      () => {
        this.clearInput();
        if (document.hidden) {
          this.persist();
          this.audio.suspend();
          this.accumulator = 0;
        } else {
          this.previous = performance.now();
          this.audio.resume();
        }
      },
      s,
    );
    window.addEventListener('pagehide', () => this.persist(), s);
    $<HTMLDialogElement>('panel').addEventListener(
      'close',
      () => {
        this.panelMode = '';
        this.keys.clear();
        this.firing = false;
        this.sync();
      },
      s,
    );
    $<HTMLDialogElement>('panel').addEventListener('cancel', () => this.clearInput(), s);
    $('panel').addEventListener('click', (e) => this.panelAction(e), s);
    $('panel').addEventListener(
      'input',
      (e) => {
        const target = e.target as HTMLInputElement;
        if (target.id === 'volume') {
          this.audio.setVolume(Number(target.value));
          $('volume-value').textContent = Math.round(Number(target.value) * 100) + '%';
          this.preferences();
        }
      },
      s,
    );
    $('panel').addEventListener(
      'change',
      (e) => {
        const target = e.target as HTMLInputElement;
        if (target.id === 'reduce-motion') {
          this.reducedMotion = target.checked;
          document.body.classList.toggle('reduced-motion', this.reducedMotion);
          this.preferences();
        }
      },
      s,
    );
  }
  get currentArea() {
    return AREAS[this.model.save.area];
  }
  get modal() {
    return $<HTMLDialogElement>('panel').open;
  }
  pointer(e: PointerEvent) {
    const r = $('world').getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * this.viewW + this.camera,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }
  clearInput() {
    this.keys.clear();
    this.touchPointers.clear();
    this.firing = false;
    this.player.vx = 0;
    this.target = null;
    this.pending = null;
    this.queuedRoute = null;
  }
  releaseTouch(pointerId: number) {
    const action = this.touchPointers.get(pointerId);
    if (!action) return;
    this.touchPointers.delete(pointerId);
    this.keys.delete('touch-' + action);
    if (action === 'fire') this.firing = false;
  }
  keydown(e: KeyboardEvent) {
    if (e.code === 'Escape') {
      if (this.modal) return;
      e.preventDefault();
      if (this.lines.length) this.closeDialogue();
      else if (this.started) this.openPause();
      return;
    }
    if (this.modal) return;
    if ((e.target as HTMLElement).matches('input,select,textarea')) return;
    if (!this.started) {
      if (e.code === 'Enter' && this.ready) {
        e.preventDefault();
        this.begin();
      }
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
    if (this.lines.length) {
      if (!e.repeat && ['KeyE', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        this.advance();
      }
      return;
    }
    if (this.transitioning) return;
    if (!e.repeat) {
      if (e.code === 'KeyJ') {
        this.openBoard();
        return;
      }
      if (e.code === 'KeyM') {
        this.openMap();
        return;
      }
      if (e.code === 'KeyI') {
        this.toggleScan();
        return;
      }
      if (e.code === 'KeyE') {
        this.examineNearest();
        return;
      }
      if (e.code === 'KeyB' && this.model.save.area === 'street' && !this.combat) {
        this.startCombat(false);
        return;
      }
      if (e.code === 'KeyQ' && this.combat) {
        this.finishCombat(true);
        return;
      }
      if (e.code === 'BracketRight' || e.code === 'BracketLeft') {
        const spots = this.currentArea.hotspots.filter((h) => this.model.available(h));
        const current = this.pending ?? this.nearest;
        let index = spots.findIndex((h) => h === current);
        index = (index + (e.code === 'BracketRight' ? 1 : -1) + spots.length) % spots.length;
        this.goTo(spots[index]);
        return;
      }
    }
    this.keys.add(e.code);
    if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      this.target = null;
      this.pending = null;
      this.queuedRoute = null;
    }
  }
  begin() {
    this.started = true;
    $('title-screen').hidden = true;
    $('shell').classList.add('started');
    void this.audio.init().then(() => this.audio.area(this.model.save.area));
    this.areaCard();
    this.sync();
    if (!hasSave) this.toast('Marlon Graves is dead. His last work is still inside.');
  }
  toggleScan() {
    if (!this.started || this.combat || this.modal) return;
    this.scan = !this.scan;
    $('stage').classList.toggle('scanning', this.scan);
    $('focus-status').hidden = !this.scan;
    $('focus-btn').setAttribute('aria-pressed', String(this.scan));
    this.audio.tone(this.scan ? 440 : 220, 0.15, 0.07);
  }
  refreshArea() {
    const a = this.currentArea;
    $('location-title').textContent = a.title;
    $('location-subtitle').textContent = a.subtitle;
    $('hotspots').innerHTML = a.hotspots
      .filter((h) => this.model.available(h))
      .map(
        (h) =>
          `<button class="hotspot ${h.kind === 'door' ? 'door' : ''} ${h.clue && this.model.save.clues.includes(h.clue) ? 'collected' : ''}" data-hotspot="${h.id}" aria-label="${h.label}" style="top:${(h.y / H) * 100}%"><span class="hotspot-dot">${h.kind === 'door' ? '↗' : h.kind === 'talk' ? '◌' : h.clue && this.model.save.clues.includes(h.clue) ? '✓' : '+'}</span><span class="hotspot-label">${h.label}${!this.model.unlocked(h) ? ' · LOCKED' : ''}</span></button>`,
      )
      .join('');
    $('district-label').textContent = a.id === 'street' ? 'NEW ANGELES' : 'SECTOR 07 · INTERIOR';
    this.syncHotspots();
  }
  syncHotspots() {
    for (const b of document.querySelectorAll<HTMLElement>('[data-hotspot]')) {
      const h = this.currentArea.hotspots.find((h) => h.id === b.dataset.hotspot)!;
      const x = ((h.x - this.camera) / this.viewW) * 100;
      b.style.left = x + '%';
      b.hidden = x < 2 || x > 98;
      b.classList.toggle('near', h === this.nearest);
    }
  }
  goTo(h: Hotspot, route: string | null = null) {
    if (!this.started || this.modal || this.combat || this.lines.length || this.transitioning)
      return;
    this.keys.clear();
    this.queuedRoute = route;
    this.target = h.x;
    this.pending = h;
    if (Math.abs(this.player.x - h.x) < 48) {
      this.target = null;
      this.pending = null;
      this.interact(h);
    }
  }
  examineNearest() {
    if (this.lines.length) {
      this.advance();
      return;
    }
    if (this.nearest && !this.combat && !this.modal) this.interact(this.nearest);
  }
  interact(h: Hotspot) {
    if (!this.started || this.transitioning || this.modal || !this.model.available(h)) return;
    const route = this.queuedRoute;
    this.clearInput();
    if (!this.model.unlocked(h)) {
      this.say([
        {
          speaker: 'COLE',
          text: 'Locked from inside. Whoever runs this place isn’t taking walk-ins. Marlon’s studio is my way into this.',
        },
      ]);
      return;
    }
    if (h.kind === 'door') {
      void this.travel(h.target!, route);
      return;
    }
    if (h.kind === 'clue' && h.clue) {
      const clue = CLUES[h.clue],
        fresh = this.model.collect(h.clue);
      if (fresh) {
        this.audio.clue();
        this.toast('EVIDENCE RECORDED', clue.title);
        this.persist();
        this.refreshArea();
        this.sync();
      }
      this.say(
        [{ speaker: 'COLE', text: clue.observation }],
        () => {
          if (clue.id === 'fragment') {
            this.toast('ARCHIVE 001 RECOVERED', 'Lyra is waiting beside the terminal.');
          } else if (
            this.model.save.clues.filter((id) =>
              ['device', 'residue', 'painting', 'diary', 'writing', 'portrait'].includes(id),
            ).length === 6 &&
            !this.model.deduced
          ) {
            this.toast(
              'THE ROOM HAS GIVEN UP ITS SECRETS',
              'Open the case board [J] to connect the evidence.',
            );
          }
        },
        clue.category,
      );
    } else if (h.kind === 'talk') {
      if (this.model.save.area === 'street')
        this.say(LYRA_INTRO, () => {
          this.model.save.contact = true;
          this.persist();
          this.sync();
          this.refreshArea();
          this.toast('NEW LEAD', 'Enter the Memory Den.');
        });
      else if (!this.model.save.clues.includes('fragment'))
        this.say([
          {
            speaker: 'LYRA',
            text: 'Archive zero-zero-one. The projection in the center of the room. I kept it waiting for someone who would listen.',
          },
        ]);
      else if (!this.model.save.companion) this.say(LYRA_ARCHIVE, () => this.openCompanionChoice());
      else this.companionTalk();
    } else this.say([{ speaker: 'COLE', text: h.text! }]);
  }
  say(
    lines: { speaker: string; text: string }[],
    done: (() => void) | null = null,
    context = 'PRIVATE CHANNEL',
  ) {
    this.clearInput();
    this.lines = lines;
    this.lineIndex = 0;
    this.reveal = 0;
    this.dialogueDone = done;
    $('dialogue').hidden = false;
    $('interaction').hidden = true;
    $('hotspots').classList.add('inactive');
    $('dialogue-context').textContent = context;
    this.showLine();
  }
  showLine() {
    const line = this.lines[this.lineIndex];
    $('speaker').textContent = line.speaker;
    $('portrait-mark').innerHTML = line.speaker === 'LYRA' ? 'L<span>◌</span>' : 'C<span>/</span>';
    $('dialogue').classList.toggle('lyra', line.speaker === 'LYRA');
    $('line-count').textContent =
      `${String(this.lineIndex + 1).padStart(2, '0')} / ${String(this.lines.length).padStart(2, '0')}`;
    $('dialogue-text').textContent = this.reducedMotion ? line.text : '';
    this.reveal = this.reducedMotion ? line.text.length : 0;
    $('advance-btn').innerHTML =
      `${this.lineIndex === this.lines.length - 1 ? 'Close' : 'Continue'} <kbd>E</kbd>${icon('arrow')}`;
  }
  advance() {
    if (!this.lines.length) return;
    const text = this.lines[this.lineIndex].text;
    if (this.reveal < text.length) {
      this.reveal = text.length;
      $('dialogue-text').textContent = text;
      return;
    }
    if (this.lineIndex < this.lines.length - 1) {
      this.lineIndex++;
      this.showLine();
    } else this.closeDialogue();
  }
  closeDialogue() {
    const done = this.dialogueDone;
    this.lines = [];
    this.dialogueDone = null;
    $('dialogue').hidden = true;
    $('hotspots').classList.remove('inactive');
    this.clearInput();
    done?.();
  }
  async travel(id: AreaId, route: string | null = null) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.clearInput();
    $('transition').classList.add('active');
    await new Promise((r) => setTimeout(r, this.reducedMotion ? 40 : 350));
    const from = this.model.save.area;
    this.model.save.area = id;
    this.player.x = id === 'street' ? (from === 'studio' ? 965 : 1465) : this.currentArea.spawn;
    this.player.y = this.currentArea.ground;
    this.player.vy = 0;
    this.player.grounded = true;
    this.nearest = null;
    this.camera = clamp(this.player.x - this.viewW * 0.48, 0, this.currentArea.width - this.viewW);
    this.audio.area(id);
    this.refreshArea();
    this.sync();
    this.persist();
    $('transition').classList.remove('active');
    this.transitioning = false;
    this.areaCard();
    if (id === 'street' && this.model.save.companion && !this.model.save.escaped) this.openAmbush();
    else if (route) {
      const next = nextRouteHotspot(id, route);
      if (next) this.goTo(next);
    }
  }
  areaCard() {
    const el = $('area-card');
    el.innerHTML = `<span class="eyebrow">${this.currentArea.subtitle}</span><strong>${this.currentArea.title}</strong>`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  persist() {
    if (!this.started) return;
    this.model.save.x = this.player.x;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.model.save));
      $('save-status').innerHTML = '<i class="save-dot"></i> CHECKPOINT SAVED';
    } catch {
      $('save-status').textContent = 'SESSION ONLY · STORAGE UNAVAILABLE';
    }
  }
  sync() {
    $('clue-count').textContent = String(this.model.save.clues.length).padStart(2, '0');
    $('objective-text').textContent = this.model.objective;
    $('chapter-label').innerHTML =
      `<i>${this.model.save.contact ? '03' : this.model.deduced ? '02' : '01'}</i> ${this.model.chapter}`;
    $('companion').hidden = !this.model.save.companion || !!this.combat || !this.started;
    $('scene-hud').hidden = !!this.combat;
    $('combat-hud').hidden = !this.combat;
    $('controls-hint').innerHTML = this.combat
      ? '<span><kbd>A</kbd><kbd>D</kbd> Move</span><span><kbd>Space</kbd> Jump</span><span><kbd>Shift</kbd> Sprint</span><span>Hold click to fire</span>'
      : '<span><kbd>A</kbd><kbd>D</kbd> Walk</span><span><kbd>E</kbd> Interact</span><span><kbd>I</kbd> Focus</span><span class="desktop-hint">Click to walk</span>';
    $('stage').classList.toggle('in-combat', !!this.combat);
    $<HTMLButtonElement>('focus-btn').disabled = !!this.combat;
  }
  syncSound() {
    $('sound-btn').setAttribute('aria-pressed', String(this.audio.muted));
    $('sound-btn').setAttribute('aria-label', this.audio.muted ? 'Unmute sound' : 'Mute sound');
    $('sound-btn').classList.toggle('muted', this.audio.muted);
  }
  toast(title: string, detail = '') {
    clearTimeout(this.toastTimer);
    $('toast').innerHTML =
      `<i>+</i><div><span>${title}</span>${detail ? `<strong>${detail}</strong>` : ''}</div>`;
    $('toast').classList.add('show');
    this.toastTimer = window.setTimeout(() => $('toast').classList.remove('show'), 4500);
  }
  panel(title: string, eyebrow: string, body: string, mode: string) {
    this.clearInput();
    this.panelMode = mode;
    $('panel-content').innerHTML =
      `<header class="panel-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="panel-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Close panel">${icon('close')}</button></header>${body}`;
    const d = $<HTMLDialogElement>('panel');
    if (!d.open) d.showModal();
  }
  closePanel() {
    $<HTMLDialogElement>('panel').close();
    this.clearInput();
  }
  openBoard() {
    if (!this.started) return;
    this.selected = [];
    this.renderBoard();
  }
  renderBoard(message = 'Select two pieces of evidence. Find what connects them.') {
    const focusedClue = (document.activeElement as HTMLElement | null)?.dataset.clue;
    const scrollTop = $('panel').scrollTop;
    const clues = this.model.save.clues;
    const cards = clues
      .map((id) => {
        const c = CLUES[id],
          selected = this.selected.includes(id),
          linked = DEDUCTIONS.some(
            (d) => this.model.save.deductions.includes(d.id) && d.pair.includes(id),
          );
        return `<button class="evidence-card ${selected ? 'selected' : ''} ${linked ? 'linked' : ''}" data-clue="${id}" aria-pressed="${selected}"><div class="evidence-art evidence-${id}"><span>${c.glyph}</span><small>${String(Object.keys(CLUES).indexOf(id) + 1).padStart(2, '0')}</small></div><span class="card-category">${c.category}${linked ? ' · LINKED' : ''}</span><h3>${c.title}</h3><p>${c.body}</p><span class="card-select">${selected ? 'SELECTED −' : linked ? 'READ / CONNECT +' : 'SELECT EVIDENCE +'}</span></button>`;
      })
      .join('');
    const deductions = DEDUCTIONS.map((d, i) => {
      const solved = this.model.save.deductions.includes(d.id);
      return `<article class="deduction ${solved ? 'solved' : ''}"><span>${solved ? '✓' : String(i + 1).padStart(2, '0')}</span><div><h3>${solved ? d.title : ['What happened to Marlon?', 'What is inside the painting?', 'Who is the first one?'][i]}</h3><p>${solved ? d.conclusion : ['Compare the machine with what it left behind.', 'Look for a personal account of the faces.', 'His last words point to something he painted.'][i]}</p></div></article>`;
    }).join('');
    this.panel(
      'The Graves case',
      'CASE FILE 07–031 · MARLON GRAVES',
      `<div class="case-summary"><p>${this.model.objective}</p><span>${clues.length} RECORDS <b>/</b> ${this.model.save.deductions.length} OF 3 CONNECTIONS</span></div><div class="board-layout"><div><div class="section-label">COLLECTED EVIDENCE <span>${String(clues.length).padStart(2, '0')}</span></div><div class="evidence-grid">${cards || '<div class="empty-evidence"><span>∅</span><h3>A blank file. A dead artist.</h3><p>Visit Marlon’s studio. Examine objects to record evidence here.</p><button class="text-button" data-action="close">Return to the street →</button></div>'}</div></div><aside class="deductions"><div class="section-label">WORKING THEORIES</div>${deductions}<div class="connection-box"><span class="eyebrow">MAKE A CONNECTION</span><div class="connection-pair"><span>${this.selected[0] ? CLUES[this.selected[0]].title : 'Evidence A'}</span><i>↔</i><span>${this.selected[1] ? CLUES[this.selected[1]].title : 'Evidence B'}</span></div><button class="primary" data-action="connect" ${this.selected.length !== 2 ? 'disabled' : ''}>Connect evidence ${icon('arrow')}</button><p class="connection-feedback" role="status">${message}</p></div></aside></div>`,
      'board',
    );
    if (this.selected.length) {
      $('panel-content').insertAdjacentHTML(
        'beforeend',
        `<div class="board-mobile-actions"><span>${this.selected.length} / 2 selected</span><button class="primary" data-action="connect" ${this.selected.length !== 2 ? 'disabled' : ''}>Connect ${icon('arrow')}</button></div>`,
      );
    }
    if (focusedClue) {
      document
        .querySelector<HTMLElement>(`[data-clue="${focusedClue}"]`)
        ?.focus({ preventScroll: true });
      $('panel').scrollTop = scrollTop;
    }
  }
  openMap() {
    if (!this.started) return;
    const sites = [
      { x: 15, y: 57, label: 'Night shift', id: 'noodles', area: 'street' },
      { x: 37, y: 42, label: 'Graves’ studio', id: 'studio-door', area: 'studio' },
      { x: 76, y: 53, label: 'Memory Den', id: 'den-door', area: 'den' },
    ];
    this.panel(
      'Sector 07',
      'DISTRICT MAP · NEW ANGELES',
      `<div class="map-canvas"><div class="map-grid"></div><div class="map-rail"></div><div class="map-road"><span>FREMONT AVENUE</span></div>${sites.map((site, i) => `<button class="map-place ${site.area === this.model.save.area ? 'current' : ''}" style="left:${site.x}%;top:${site.y}%" data-route="${site.id}"><i>${String(i + 1).padStart(2, '0')}</i><strong>${site.label}</strong><span>${site.area === this.model.save.area ? 'CURRENT LOCATION' : i === 2 && !this.model.save.contact ? 'CONTACT REQUIRED' : 'SET WALKING DESTINATION'}</span></button>`).join('')}<span class="map-north">N<br>↑</span><span class="map-caption">LOW DISTRICT<br>34°03′ N · 118°15′ W</span></div><div class="map-note"><span class="live-dot"></span><p>${this.model.objective}</p><span>Destinations guide Cole through connected rooms.</span></div>`,
      'map',
    );
  }
  openPause() {
    this.panel(
      this.started ? 'A moment in the rain.' : 'Before you step outside.',
      'EVERYBODY / NOBODY',
      `<div class="settings"><p class="settings-intro">The city can wait.</p><div class="setting-row"><label for="volume">Soundscape volume</label><span id="volume-value">${Math.round(this.audio.volume * 100)}%</span><input id="volume" type="range" min="0" max="1" step="0.05" value="${this.audio.volume}"></div><label class="setting-row switch-row" for="reduce-motion"><span>Reduced motion<small>Still rain, steady lights, no screen shake.</small></span><input id="reduce-motion" type="checkbox" ${this.reducedMotion ? 'checked' : ''}></label><div class="control-list"><span><kbd>A</kbd> <kbd>D</kbd> / Arrow keys</span><b>Walk</b><span><kbd>E</kbd> / Click a marker</span><b>Examine / enter</b><span><kbd>I</kbd></span><b>Highlight evidence</b><span><kbd>J</kbd> / <kbd>M</kbd></span><b>Case board / map</b><span><kbd>[</kbd> <kbd>]</kbd></span><b>Walk to next marker</b><span><kbd>B</kbd> on the street</span><b>Combat practice</b><span><kbd>Space</kbd> / Hold click</span><b>Jump / fire in combat</b></div><div class="settings-actions"><button class="primary" data-action="close">${this.combat ? 'Resume encounter' : this.started ? 'Return to investigation' : 'Back'} ${icon('arrow')}</button><button class="text-button" data-action="new">Start a new investigation</button></div><p class="small-note">Progress saves automatically on this device. This chapter ends after the Memory Den.</p></div>`,
      'pause',
    );
  }
  openCompanionChoice() {
    this.panel(
      'An open channel.',
      'LYRA · PRIVATE CONNECTION',
      `<div class="story-choice"><span class="signal-large">◌</span><p>“If you let me, I can stay with you.”</p><small>Let Lyra accompany Cole through the city. Her presence will travel between areas.</small><button class="primary" data-action="accept-lyra">Open the channel ${icon('arrow')}</button><button class="text-button" data-action="close">I need a moment.</button></div>`,
      'companion',
    );
  }
  openAmbush() {
    this.panel(
      'They found the signal.',
      'SECTOR 07 · HOSTILE CONTACT',
      `<div class="story-choice"><span class="eyebrow danger">VEIL ENFORCERS INBOUND</span><p>“Cole. Two blocks out. They know you have the memory.”</p><small>Hold them off, or take Lyra’s route through the service alley. The evidence comes first.</small><button class="primary" data-action="fight">Stand your ground ${icon('arrow')}</button><button class="secondary" data-action="evade">Take the service alley →</button></div>`,
      'ambush',
    );
  }
  ending() {
    this.model.save.escaped = true;
    this.persist();
    this.sync();
    this.panel(
      'Someone remembers.',
      'ISSUE 01 · FRAGMENTS / CHAPTER COMPLETE',
      `<div class="ending"><span class="ending-number">001</span><p>A woman. A child. A drawing of a bird.</p><h3>They took her name.<br>They didn’t take everything.</h3><div class="ending-stats"><span><b>${this.model.save.clues.length}</b> EVIDENCE RECORDS</span><span><b>03</b> CONNECTIONS MADE</span><span><b>LYRA</b> CHANNEL OPEN</span></div><blockquote>“Find the first one.”</blockquote><button class="primary" data-action="close">Keep exploring ${icon('arrow')}</button><span class="small-note">End of this playable chapter. Your case is saved.</span></div>`,
      'ending',
    );
  }
  companionTalk() {
    if (this.combat || this.lines.length || this.modal) return;
    this.say([
      {
        speaker: 'LYRA',
        text: this.model.save.escaped
          ? 'I’m still here, Cole. Every name they erased left a space. We start with hers.'
          : this.model.save.area === 'studio'
            ? 'He thought if he painted enough of them, someone would understand. You did.'
            : 'I kept their memories on machines too old for the city to notice. Sometimes being obsolete is how you survive.',
      },
    ]);
  }
  panelAction(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-action],[data-clue],[data-route]',
    );
    if (!el) return;
    if (el.dataset.clue) {
      const id = el.dataset.clue as ClueId;
      if (this.selected.includes(id)) this.selected = this.selected.filter((c) => c !== id);
      else {
        if (this.selected.length === 2) this.selected.shift();
        this.selected.push(id);
      }
      this.renderBoard();
      return;
    }
    if (el.dataset.route) {
      const id = el.dataset.route;
      this.closePanel();
      const h = nextRouteHotspot(this.model.save.area, id);
      if (h) {
        this.goTo(h, id);
      } else this.toast('YOU’RE ALREADY HERE', this.currentArea.title);
      return;
    }
    switch (el.dataset.action) {
      case 'close':
        this.closePanel();
        break;
      case 'connect': {
        if (this.selected.length !== 2) return;
        const wasDeduced = this.model.deduced;
        const [a, b] = this.selected,
          d = this.model.connect(a, b);
        if (d) {
          this.audio.deduction();
          this.selected = [];
          this.persist();
          this.sync();
          this.refreshArea();
          this.renderBoard(d.conclusion);
          if (!wasDeduced && this.model.deduced)
            this.toast('THE CASE HAS A NEW LEAD', 'Someone is waiting outside the Memory Den.');
        } else
          this.renderBoard(
            'Not enough to support a conclusion. Compare the details in the records and try another pair.',
          );
        break;
      }
      case 'new':
        this.panel(
          'Start over?',
          'NEW INVESTIGATION',
          `<div class="story-choice"><p>Begin the Graves case again.</p><small>This replaces the checkpoint for this version on this device.</small><button class="primary" data-action="restart">Start a new case ${icon('arrow')}</button><button class="text-button" data-action="pause">Keep my progress</button></div>`,
          'restart',
        );
        break;
      case 'pause':
        this.openPause();
        break;
      case 'restart':
        this.model.save = freshSave();
        this.player = {
          x: 440,
          y: AREAS.street.ground,
          vx: 0,
          vy: 0,
          grounded: true,
          facing: 1,
        };
        this.camera = 0;
        this.combat = null;
        this.lines = [];
        $('dialogue').hidden = true;
        this.closePanel();
        this.started = true;
        $('title-screen').hidden = true;
        $('shell').classList.add('started');
        this.scan = false;
        $('focus-btn').setAttribute('aria-pressed', 'false');
        $('stage').classList.remove('scanning');
        $('focus-status').hidden = true;
        this.refreshArea();
        this.sync();
        this.persist();
        void this.audio.init().then(() => this.audio.area('street'));
        break;
      case 'accept-lyra':
        this.model.save.companion = true;
        this.closePanel();
        this.audio.deduction();
        this.persist();
        this.sync();
        this.refreshArea();
        this.toast('LYRA CONNECTED', 'You don’t have to do this alone.');
        break;
      case 'fight':
        this.closePanel();
        this.startCombat(true);
        break;
      case 'evade':
        this.closePanel();
        this.ending();
        break;
      case 'retry-combat':
        this.closePanel();
        this.startCombat(this.combatStory);
        break;
      case 'leave-combat':
        this.closePanel();
        this.finishCombat(true);
        break;
    }
  }
  startCombat(story: boolean) {
    if (this.model.save.area !== 'street') return;
    this.clearInput();
    this.combatStory = story;
    this.combat = new Combat(this.currentArea.width, this.player.x);
    this.combat.onShot = () => this.audio.shot();
    this.combat.onHit = () => this.audio.hit();
    this.scan = false;
    $('stage').classList.remove('scanning');
    $('focus-status').hidden = true;
    $('focus-btn').setAttribute('aria-pressed', 'false');
    this.sync();
    this.toast(
      story ? 'PROTECT THE MEMORY' : 'COMBAT PRACTICE',
      'Aim with the mouse. Hold to fire. Space to jump. Q to disengage.',
    );
  }
  finishCombat(evaded = false) {
    if (!this.combat) return;
    this.clearInput();
    this.combat = null;
    this.player.y = this.currentArea.ground;
    this.player.vy = 0;
    this.player.grounded = true;
    this.sync();
    if (this.combatStory) this.ending();
    else this.toast(evaded ? 'PRACTICE ENDED' : 'SECTOR CLEAR', 'Back to the investigation.');
  }
  frame(now: number) {
    const elapsed = this.previous ? Math.min((now - this.previous) / 1000, 0.1) : 0;
    this.previous = now;
    if (!document.hidden) {
      const active = this.started && !this.modal && !this.transitioning;
      if (!this.modal) this.time += elapsed;
      if (active && this.lines.length) {
        this.reveal += elapsed * 48;
        const text = this.lines[this.lineIndex].text;
        const next = text.slice(0, Math.floor(this.reveal));
        if ($('dialogue-text').textContent !== next) $('dialogue-text').textContent = next;
      }
      this.accumulator = active && !this.lines.length ? this.accumulator + elapsed : 0;
      let steps = 0;
      while (this.accumulator >= 1 / 60 && steps < 6) {
        this.update(1 / 60);
        this.accumulator -= 1 / 60;
        steps++;
      }
      if (steps === 6) this.accumulator = 0;
      if (active && !this.lines.length) {
        const desired = clamp(
          this.player.x - this.viewW * 0.48,
          0,
          this.currentArea.width - this.viewW,
        );
        this.camera += (desired - this.camera) * (1 - Math.exp(-elapsed * 5));
      }
      this.renderer.draw({
        model: this.model,
        player: this.player,
        camera: this.camera,
        time: this.time,
        scan: this.scan,
        reducedMotion: this.reducedMotion,
        combat: this.combat,
        aim: this.aim,
        title: !this.started,
        dt: elapsed,
      });
      this.syncHotspots();
      if (now - this.lastUI > 100) {
        this.lastUI = now;
        this.tickUI();
      }
      if (this.started && now - this.lastSave > 5000) {
        this.lastSave = now;
        this.persist();
      }
    }
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  update(dt: number) {
    if (this.combat?.down || this.combat?.complete) return;
    let axis =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('touch-right')
        ? 1
        : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('touch-left') ? 1 : 0);
    if (this.target !== null) {
      const d = this.target - this.player.x;
      if (Math.abs(d) < 4) {
        const h = this.pending;
        this.target = null;
        this.pending = null;
        this.player.vx = 0;
        if (h) {
          this.interact(h);
          return;
        }
      } else axis = Math.sign(d);
    }
    const jump =
      !!this.combat &&
      (this.keys.has('Space') ||
        this.keys.has('KeyW') ||
        this.keys.has('ArrowUp') ||
        this.keys.has('touch-jump'));
    if (jump) {
      this.keys.delete('Space');
      this.keys.delete('KeyW');
      this.keys.delete('ArrowUp');
      this.keys.delete('touch-jump');
    }
    const hitstop = this.combat && this.combat.hitstop > 0 && !this.reducedMotion;
    if (!hitstop)
      stepBody(
        this.player,
        axis,
        jump,
        dt,
        this.currentArea.width,
        !!this.combat && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')),
        this.currentArea.ground,
      );
    if (Math.abs(this.player.vx) > 20 && this.player.grounded) {
      this.stepTime += dt;
      if (this.stepTime > 0.38) {
        this.stepTime = 0;
        this.audio.step();
      }
    }
    this.nearest =
      this.currentArea.hotspots
        .filter((h) => this.model.available(h) && Math.abs(h.x - this.player.x) < 65)
        .sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x))[0] ?? null;
    if (this.combat) {
      if (this.firing) {
        if (this.keys.has('touch-fire') || matchMedia('(pointer: coarse)').matches) {
          const enemy = this.combat.enemies.reduce<(typeof this.combat.enemies)[number] | null>(
            (best, e) =>
              !best || Math.abs(e.x - this.player.x) < Math.abs(best.x - this.player.x) ? e : best,
            null,
          );
          if (enemy) this.aim = { x: enemy.x, y: enemy.y };
        }
        this.combat.shoot(this.player, this.aim);
      }
      this.combat.update(dt, this.player);
      if (this.combat.down)
        this.panel(
          'Still breathing.',
          'COLE · NEURAL RECOVERY',
          `<div class="story-choice"><p>“Get up, Cole. You still have the memory.”</p><small>Your evidence is safe. Retry the encounter at full health, or disengage.</small><button class="primary" data-action="retry-combat">Try again ${icon('arrow')}</button><button class="text-button" data-action="leave-combat">Disengage</button></div>`,
          'down',
        );
      else if (this.combat.complete) this.finishCombat();
    }
  }
  tickUI() {
    const show =
      this.started &&
      !this.modal &&
      !this.lines.length &&
      !this.combat &&
      !this.transitioning &&
      !!this.nearest;
    $('interaction').hidden = !show;
    if (show) $('interaction-label').textContent = this.nearest!.label;
    $('hotspots').hidden = !this.started || !!this.combat || this.transitioning;
    if (this.combat) {
      $('hp-text').textContent = String(this.combat.hp);
      $('hp-fill').style.width = this.combat.hp + '%';
      $('wave-text').textContent = `WAVE 0${this.combat.wave} / 02 · ${this.combat.kills} DOWN`;
    }
    const showDestination = this.target !== null && !this.pending && !this.combat;
    $('destination').hidden = !showDestination;
    if (showDestination) {
      $('destination').style.left = ((this.target! - this.camera) / this.viewW) * 100 + '%';
      $('destination').style.top = '80%';
    }
  }
  dispose() {
    this.resizeObserver.disconnect();
    this.events.abort();
    cancelAnimationFrame(this.raf);
    clearTimeout(this.toastTimer);
    this.audio.suspend();
  }
}
const game = new Game();
if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());

import './style.css';
import './notebook.css';
import './desk.css';
import './fullscreen.css';
import './patina.css';
import './field-feedback.css';
import './cinematic.css';
import './archive.css';
import './case-board.css';
import './examination-crt.css';
import { bindFullscreen } from './fullscreen.ts';
import { RECORD_MOUNTS } from './notebook.ts';
import { readCheckpoint } from './checkpoint.ts';
import { SaveArchive, ACTIVE_SLOT_KEY, slotKey, slotBackupKey } from './save-archive.ts';
import { renderArchive, renderResume, renderRecovery } from './archive-ui.ts';
import { evidenceArt } from './evidence-art.ts';
import { evidenceBoardState, renderEvidenceCard } from './case-board.ts';
import {
  AREAS,
  CLUES,
  DEDUCTIONS,
  FOLLOWUP_CLUES,
  FOLLOWUP_DEDUCTIONS,
  LYRA_ARCHIVE,
  type AreaId,
  type ClueId,
  type Hotspot,
} from './content.ts';
import {
  CaseModel,
  freshSave,
  clamp,
  stepBody,
  nextRouteHotspot,
  type Body,
  type SaveData,
} from './model.ts';
import { Renderer, H } from './renderer.ts';
import { AudioEngine } from './audio.ts';
import { Combat } from './combat.ts';
import { Cinematic, INTRO } from './cinematic.ts';
import {
  INSIGHTS,
  boardHint,
  insightFor,
  lyraIntroduction,
  lyraTopics,
  FOLLOWUP_OPENING,
  type Line,
} from './narrative.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const icon = (name: string) => {
  const paths: Record<string, string> = {
    case: '<path d="M5 3h15v18H5zM8 3v18M3 7h4M3 12h4M3 17h4M11 8h6M11 12h6"/>',
    fullscreen: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
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
let archive: SaveArchive | null = null;
let checkpoint = { save: freshSave(), recovered: false };
try {
  archive = new SaveArchive(localStorage);
  checkpoint = archive.read();
} catch {
  // A failed migration must not hide the player's original checkpoint.
  try {
    checkpoint = readCheckpoint(localStorage);
  } catch {
    /* Session-only play. */
  }
}
const model = new CaseModel(checkpoint.save);
const hasSave =
  model.save.introSeen ||
  model.save.clues.length > 0 ||
  model.save.x !== 440 ||
  model.save.area !== 'street';
document.getElementById('app')!.innerHTML = `
 <main class="shell" id="shell">
  <header class="topbar">
   <a class="monogram" href="#" id="brand" aria-label="Pause Gravity">G<span>/</span></a>
   <div class="edition"><span>DETECTIVE GRAVITY · FIELD NOTES</span><strong>CASE 07–031 <i>/</i> FRAGMENTS</strong></div>
   <nav aria-label="Game controls">
    <button class="nav-button" id="board-btn" aria-label="Investigation notebook">${icon('case')}<span>Notebook</span><kbd>J</kbd><b id="clue-count">00</b></button>
    <button class="icon-button" id="map-btn" aria-label="District map" title="District map [M]">${icon('map')}</button>
    <button class="icon-button" id="sound-btn" aria-label="Mute sound" aria-pressed="false" title="Toggle sound">${icon('sound')}</button>
    <button class="icon-button" id="fullscreen-btn" aria-label="Enter fullscreen view" aria-pressed="false" title="Fullscreen view">${icon('fullscreen')}</button>
    <button class="icon-button" id="pause-btn" aria-label="Pause and settings" title="Pause [Esc]">${icon('pause')}</button>
   </nav>
  </header>
  <section class="game-wrap" aria-label="Playable investigation">
   <div class="scene-meta"><span><i class="live-dot"></i> <span id="district-label">NEW ANGELES</span></span><span id="scene-clock">04 SEP 2077 <b>·</b> 02:37 AM</span></div>
   <div id="stage" class="stage">
    <canvas id="world" aria-label="Side-scrolling game world. Use A and D to walk, E to examine, I to highlight evidence, and J to open the notebook."></canvas>
    <div class="vignette" aria-hidden="true"></div><div class="scanlines" aria-hidden="true"></div>
    <div class="scene-hud" id="scene-hud"><div class="location"><span class="eyebrow" id="location-subtitle"></span><h1 id="location-title"></h1><span class="location-rule"></span></div><button id="objective-btn" class="objective" aria-expanded="false" aria-controls="objective-text objective-hint" aria-label="Current objective"><span class="eyebrow"><i class="red-square"></i> FOLLOW UP</span><span id="objective-text"></span><small id="objective-hint">TAP TO FOLD · NOTEBOOK [J]</small></button></div>
    <div id="hotspots" class="hotspots" aria-label="Nearby places and evidence"></div>
    <div id="focus-status" class="focus-status" hidden><i></i> FOCUS ACTIVE <span>Follow what the city leaves behind.</span></div>
    <div id="destination" class="destination" hidden>⌄</div>
    <div id="interaction" class="interaction" hidden><button id="interact-btn"><kbd>E</kbd><span id="interaction-label">Examine</span>${icon('arrow')}</button></div>
    <div id="area-card" class="area-card" aria-live="polite"></div>
    <div id="combat-hud" class="combat-hud" hidden><div><span class="eyebrow">GRAVITY · VITALS</span><strong id="hp-text">100</strong><div class="hp-track"><i id="hp-fill"></i></div></div><div><span class="eyebrow">HOSTILE CONTACT</span><strong id="wave-text">WAVE 01 / 02</strong><button id="withdraw-btn">Disengage <kbd>Q</kbd></button></div></div>
    <div id="companion" class="companion" hidden><button id="companion-btn"><span class="waveform">▂▆▃▇▂</span><span>LYRA <small>CHANNEL OPEN</small></span></button></div>
    <aside id="evidence-closeup" class="evidence-closeup" hidden aria-label="Evidence illustration"></aside><div id="dialogue" class="dialogue" hidden aria-label="Conversation"><div class="portrait-mark" id="portrait-mark">G<span>/</span></div><div class="dialogue-copy"><div class="dialogue-top"><span id="speaker" class="eyebrow">GRAVITY</span><span id="line-count" class="eyebrow"></span></div><p id="dialogue-text" aria-hidden="true"></p><p id="dialogue-announcement" class="sr-only" aria-live="polite" aria-atomic="true"></p><div class="dialogue-bottom"><span id="dialogue-context">DETECTIVE’S OBSERVATION</span><button id="advance-btn">Continue <kbd>E</kbd>${icon('arrow')}</button></div></div></div>
    <div id="transition" class="transition" aria-hidden="true"></div>
    <section id="cinematic" class="cinematic" hidden aria-label="Opening scene"><div class="cine-bar top"></div><div class="cine-bar bottom"></div><div class="cine-fade" id="cine-fade"></div><div class="cine-caption" id="cine-caption" aria-live="polite"><span class="eyebrow" id="cine-kicker"></span><p id="cine-text"></p></div><button class="cine-skip" id="cine-skip">Skip <kbd>Esc</kbd></button></section>
    <section id="title-screen" class="title-screen" aria-label="Start game"><div class="title-content"><div class="eyebrow title-kicker"><span>AN INTERACTIVE NOIR</span><i></i> NEW ANGELES, 2077</div><h1 class="game-title"><span class="wordmark">GRAVITY<span class="title-period">.</span></span></h1><div class="issue-label"><span>ISSUE 01</span><i></i><strong>Fragments</strong></div><p class="opening">One dead artist. A thousand stolen minds.<br>Someone has to remember.</p><button class="primary" id="begin-btn" disabled><span id="begin-text">Entering New Angeles</span>${icon('arrow')}</button><button class="text-button" id="archive-btn">Open case archive</button><div class="title-footnote">${icon('headphones')} HEADPHONES RECOMMENDED <span>·</span> SAVED ON THIS DEVICE</div></div><div class="title-coordinates"><span>SECTOR</span><strong>07</strong><span>34°03′ N<br>118°15′ W</span></div></section>
    <div class="touch-controls" id="touch-controls"><button data-hold="left" aria-label="Move left">←</button><button data-hold="right" aria-label="Move right">→</button><button data-hold="jump" aria-label="Jump">↑</button><button data-hold="sprint" aria-label="Hold to sprint">»</button><button id="touch-act" aria-label="Examine">E</button><button data-hold="fire" aria-label="Fire toward nearest enemy">◎</button></div>
   </div>
   <div class="scene-footer"><span id="chapter-label"><i>01</i> THE LAST WORK</span><span id="save-status"><i class="save-dot"></i> LOCAL CHECKPOINT</span><span>RAIN EXPECTED <i>↙</i> 17°C</span></div>
  </section>
  <footer class="bottom-bar"><div class="controls-hint" id="controls-hint"><span><kbd>A</kbd><kbd>D</kbd> Walk</span><span><kbd>E</kbd> Interact</span><span><kbd>⇧</kbd> Sprint</span><span><kbd>I</kbd> Focus</span><span class="desktop-hint">Click to walk</span></div><button id="focus-btn" class="focus-button" aria-pressed="false">${icon('focus')}<span>Focus mode</span><kbd>I</kbd></button><span class="build-label">PRIVATE NOTES <b>/</b> GRAVITY</span></footer>
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
  archiveChanged = false;
  ready = false;
  scan = false;
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  combat: Combat | null = null;
  combatStory = false;
  cinematic: Cinematic | null = null;
  /** Where the running cinematic is walking Gravity, if anywhere. */
  cineWalk: number | null = null;
  aim = { x: 700, y: 400 };
  firing = false;
  keys = new Set<string>();
  touchPointers = new Map<number, string>();
  target: number | null = null;
  pending: Hotspot | null = null;
  queuedRoute: string | null = null;
  nearest: Hotspot | null = null;
  private hotspotNodes: { element: HTMLElement; hotspot: Hotspot }[] = [];
  lines: { speaker: string; text: string }[] = [];
  lineIndex = 0;
  reveal = 0;
  dialogueDone: (() => void) | null = null;
  transitioning = false;
  panelMode = '';
  inspectedClue: ClueId | null = null;
  boardScroll = 0;
  selected: ClueId[] = [];
  boardFile: 'graves' | 'first-one' = 'graves';
  examining = false;
  discovery: { id: ClueId; x: number; y: number } | null = null;
  previous = 0;
  accumulator = 0;
  lastUI = 0;
  renderDirty = true;
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
      this.renderDirty = true;
      this.renderer.resize(Math.round((H * r.width) / r.height));
      this.camera = clamp(
        this.player.x - this.viewW * 0.48,
        0,
        this.currentArea.width - this.viewW,
      );
      this.syncHotspots();
    });
    this.resizeObserver.observe($('stage'));
    // The renderer reports what happens in the scene; the audio engine
    // decides what it sounds like.
    this.renderer.cue = (kind, strength) => {
      if (kind === 'traffic') this.audio.traffic(strength);
      else if (kind === 'drip') this.audio.drip();
      else if (kind === 'step') this.audio.step(strength);
      else this.audio.train();
    };
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
    bindFullscreen($<HTMLButtonElement>('fullscreen-btn'), this.events.signal);
    $('begin-btn').addEventListener(
      'click',
      () => {
        if (!this.ready) {
          location.reload();
          return;
        }
        this.openStart();
      },
      s,
    );
    $('archive-btn').addEventListener('click', () => this.openArchive(), s);
    $('cine-skip').addEventListener('click', () => this.finishIntro(), s);
    $('board-btn').addEventListener('click', () => this.openBoard(), s);
    $('objective-btn').addEventListener(
      'click',
      () => {
        const button = $('objective-btn');
        button.setAttribute(
          'aria-expanded',
          String(button.getAttribute('aria-expanded') !== 'true'),
        );
      },
      s,
    );
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!$('objective-btn').contains(event.target as Node))
          $('objective-btn').setAttribute('aria-expanded', 'false');
      },
      s,
    );
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
        if (
          !this.started ||
          this.cinematic ||
          this.modal ||
          this.lines.length ||
          this.transitioning
        )
          return;
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
    // iOS long-press callouts must not interrupt held game controls.
    $('touch-controls').addEventListener('contextmenu', (e) => e.preventDefault(), s);
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
    window.addEventListener(
      'storage',
      (event) => {
        if (
          !archive ||
          (event.key !== null &&
            ![ACTIVE_SLOT_KEY, slotKey(archive.activeId), slotBackupKey(archive.activeId)].includes(
              event.key,
            ))
        )
          return;
        this.archiveChanged = true;
        $('save-status').textContent = 'ARCHIVE UPDATED IN ANOTHER TAB';
        this.panel(
          'This file changed elsewhere.',
          'CASE ARCHIVE',
          '<p>Another tab updated the archive. Saving is paused here to protect those notes. Reload to use the newest saved file; any unfiled changes in this tab will not be kept.</p><button class="primary" data-action="archive-reload">Reload saved archive</button>',
          'archive',
        );
      },
      s,
    );
    $<HTMLDialogElement>('panel').addEventListener(
      'close',
      () => {
        if (this.modal) return;
        this.panelMode = '';
        this.keys.clear();
        this.firing = false;
        this.sync();
      },
      s,
    );
    $<HTMLDialogElement>('panel').addEventListener(
      'cancel',
      (e) => {
        this.clearInput();
        if (this.panelMode === 'record') {
          e.preventDefault();
          this.returnToBoard();
        }
      },
      s,
    );
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
          this.renderDirty = true;
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
    if ([...this.touchPointers.values()].includes(action)) return;
    this.keys.delete('touch-' + action);
    if (action === 'fire') this.firing = false;
  }
  keydown(e: KeyboardEvent) {
    if (this.cinematic && !this.modal) {
      if (['Escape', 'Enter'].includes(e.code) && !e.repeat) this.finishIntro();
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
      return;
    }
    if (e.code === 'Escape') {
      if ($('objective-btn').getAttribute('aria-expanded') === 'true') {
        $('objective-btn').setAttribute('aria-expanded', 'false');
        e.preventDefault();
        return;
      }
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
        this.openStart();
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
  openStart() {
    if (this.archiveChanged) {
      this.archiveError();
      return;
    }
    if (!archive) {
      this.begin();
      return;
    }
    const slot = archive.list().find((slot) => slot.id === archive!.activeId);
    if (slot?.save) this.openResume(slot.id);
    else this.openArchive();
  }
  archiveError() {
    let message = document.getElementById('archive-error');
    if (!message) {
      message = document.createElement('p');
      message.id = 'archive-error';
      message.setAttribute('role', 'alert');
      $('panel-content').append(message);
    }
    message.textContent =
      'The case could not be filed. Storage may be full or unavailable. Your current session is still open; no other case was replaced.';
  }
  openArchive() {
    if (this.transitioning || !this.ready) return;
    if (this.started && !this.persist()) {
      this.panel(
        'Your notes are still open.',
        'CASE ARCHIVE',
        '<p>Device storage is unavailable. Keep this session open to retain your progress.</p><button class="primary" data-action="close">Return to investigation</button>',
        'archive',
      );
      return;
    }
    if (!archive) {
      this.panel(
        'Archive unavailable.',
        'CASE ARCHIVE',
        '<p>Device storage is unavailable. You can continue this session, but cases cannot be saved on this device.</p>',
        'archive',
      );
      return;
    }
    this.panel(
      'The case archive.',
      'GRAVITY · PRIVATE FILES',
      renderArchive(archive.list(), archive.activeId),
      'archive',
    );
  }
  openResume(id: number) {
    const slot = archive?.list().find((slot) => slot.id === id);
    if (!slot?.save) return;
    this.panel(
      'Where we left off.',
      'CASE ARCHIVE · RETURN TO THE FIELD',
      renderResume(slot),
      'archive',
    );
  }
  loadCase(save: SaveData, recovered: boolean) {
    clearTimeout(this.toastTimer);
    $('toast').classList.remove('show');
    $('toast').textContent = '';
    $('save-status').innerHTML = `<i class="save-dot"></i> NOTES FILED · 0${archive!.activeId}`;
    this.model.save = save;
    this.closePanel();
    this.clearInput();
    checkpoint = { save, recovered };
    this.player = {
      x: save.x,
      y: AREAS[save.area].ground,
      vx: 0,
      vy: 0,
      grounded: true,
      facing: 1,
    };
    this.combat = null;
    this.combatStory = false;
    this.cinematic = null;
    this.cineWalk = null;
    this.lines = [];
    this.lineIndex = 0;
    this.reveal = 0;
    this.dialogueDone = null;
    this.nearest = null;
    this.discovery = null;
    this.examining = false;
    this.scan = false;
    this.selected = [];
    this.inspectedClue = null;
    this.accumulator = 0;
    this.stepTime = 0;
    $('world').style.transform = '';
    $('cinematic').hidden = true;
    $('shell').classList.remove('in-cinematic');
    $('dialogue').hidden = true;
    $('evidence-closeup').hidden = true;
    $('dialogue-announcement').textContent = '';
    $('stage').classList.remove('in-dialogue', 'scanning', 'examining-clue');
    $('hotspots').classList.remove('inactive');
    $('focus-btn').setAttribute('aria-pressed', 'false');
    $('focus-status').hidden = true;
    this.camera = clamp(save.x - this.viewW * 0.48, 0, this.currentArea.width - this.viewW);
    this.refreshArea();
    this.renderDirty = true;
    this.begin();
  }
  resumeCase(id: number, recovered = false) {
    const slot = archive!.list().find((slot) => slot.id === id);
    if (!slot?.save || slot.corrupt) throw new Error('Case unavailable');
    archive!.select(id);
    // No further storage reads after selection: the model must follow the selected file.
    this.model.save = slot.save;
    this.loadCase(slot.save, recovered || slot.recovered);
  }
  archiveAction(el: HTMLElement) {
    if (!archive || !this.ready || this.transitioning || this.archiveChanged) return;
    const id = Number(el.dataset.slot);
    if (![1, 2, 3].includes(id)) return;
    try {
      switch (el.dataset.action) {
        case 'archive-open':
          this.openResume(id);
          break;
        case 'archive-create':
          this.panel(
            'Open a new file.',
            `CASE ARCHIVE · FOLDER 0${id}`,
            `<div class="archive-new"><label for="archive-new-name">Case file name</label><input id="archive-new-name" maxlength="40" value="Case file 0${id}" autocomplete="off"><p>A separate investigation. Your other case folders stay in the archive.</p><button class="primary" data-action="archive-create-confirm" data-slot="${id}">Open case &amp; begin</button><button class="text-button" data-action="archive">Back to archive</button></div>`,
            'archive',
          );
          break;
        case 'archive-create-confirm':
          if (!this.persist()) {
            this.archiveError();
            return;
          }
          archive.create(id, $<HTMLInputElement>('archive-new-name').value);
          this.resumeCase(id);
          break;
        case 'resume-slot':
          if (!this.persist()) {
            this.archiveError();
            return;
          }
          this.resumeCase(id);
          break;
        case 'archive-rename':
          archive.rename(id, $<HTMLInputElement>('archive-name').value);
          this.openResume(id);
          break;
        case 'archive-history': {
          const slot = archive.list().find((slot) => slot.id === id)!;
          this.panel(
            'Earlier field notes.',
            'CASE ARCHIVE · RECOVERY',
            renderRecovery(slot),
            'archive',
          );
          break;
        }
        case 'archive-restore':
          if (!this.persist()) {
            this.archiveError();
            return;
          }
          archive.restore(id, el.dataset.checkpoint ?? '');
          // If loading fails after restore, block autosave until reload so old notes cannot replace it.
          this.archiveChanged = true;
          this.resumeCase(id, true);
          this.archiveChanged = false;
          this.toast(
            'FIELD NOTES RESTORED',
            'Your previous progress is still available in Earlier checkpoints.',
          );
          break;
      }
    } catch {
      this.archiveError();
    }
  }
  begin() {
    this.started = true;
    $('title-screen').hidden = true;
    $('shell').classList.add('started');
    void this.audio.init().then(() => this.audio.area(this.model.save.area));
    this.sync();
    if (!this.model.save.introSeen && !checkpoint.recovered) {
      this.playIntro();
      return;
    }
    this.areaCard();
    if (this.model.awaitingAmbush) this.openAmbush();
    else if (this.model.save.resumeHotspot) {
      const h = this.currentArea.hotspots.find((h) => h.id === this.model.save.resumeHotspot);
      if (h && this.model.available(h)) this.interact(h);
    }
    if (checkpoint.recovered)
      this.toast('CHECKPOINT RECOVERED', 'Resumed the last intact local save.');
  }
  playIntro() {
    this.clearInput();
    this.cinematic = new Cinematic(INTRO);
    this.cineWalk = null;
    $('shell').classList.add('in-cinematic');
    $('cinematic').hidden = false;
    this.stepIntro(0);
  }
  /** Advances the opening, applying its cues and framing. */
  stepIntro(dt: number) {
    const cine = this.cinematic!;
    for (const cue of cine.step(dt)) {
      if (cue.kind === 'place') {
        this.player.x = cue.x;
        this.player.vx = 0;
        this.player.facing = cue.facing;
      } else if (cue.kind === 'walk') this.cineWalk = cue.x;
      else if (cue.sound === 'dispatch') this.audio.dispatch();
      else this.audio.sting();
    }
    const shot = cine.shot;
    const still = this.reducedMotion;
    this.camera = clamp(
      (still ? this.player.x : shot.focus) - this.viewW * (still ? 0.48 : 0.5),
      0,
      this.currentArea.width - this.viewW,
    );
    // Zoom is a display transform over the native canvas: the pixels simply
    // get larger, and the origin keeps the subject where the camera put it.
    const canvas = $('world');
    const zoom = still ? 1 : shot.zoom;
    canvas.style.transform = zoom > 1.001 ? `scale(${zoom})` : '';
    canvas.style.transformOrigin = `${((shot.focus - this.camera) / this.viewW) * 100}% ${12 + shot.lift * 60}%`;
    $('cine-fade').style.opacity = String(shot.fade);
    $('cinematic').style.setProperty('--bars', String(shot.bars));
    const caption = shot.caption;
    const box = $('cine-caption');
    box.style.opacity = String(caption?.alpha ?? 0);
    if (caption) {
      box.dataset.voice = caption.voice;
      $('cine-kicker').textContent = caption.kicker;
      const text = caption.text.slice(0, still ? caption.text.length : caption.shown);
      if ($('cine-text').textContent !== text) $('cine-text').textContent = text;
    }
    if (cine.done) this.finishIntro();
  }
  /** Ends the opening, whether it ran out or was skipped, and hands over control. */
  finishIntro() {
    const cine = this.cinematic;
    if (!cine) return;
    // A skip lands Gravity where the scene would have left her.
    for (const cue of cine.remainder()) {
      this.player.x = cue.x;
      if (cue.kind === 'place') this.player.facing = cue.facing;
    }
    if (this.cineWalk !== null) this.player.x = this.cineWalk;
    this.player.vx = 0;
    this.model.save.introSeen = true;
    this.cinematic = null;
    this.cineWalk = null;
    $('world').style.transform = '';
    $('shell').classList.remove('in-cinematic');
    $('cinematic').hidden = true;
    $('cine-text').textContent = '';
    this.clearInput();
    this.areaCard();
    this.sync();
    this.persist();
    this.toast('Marlon Graves is dead. His last work is still inside.');
  }
  toggleScan() {
    if (!this.started || this.cinematic || this.combat || this.modal) return;
    this.scan = !this.scan;
    $('stage').classList.toggle('scanning', this.scan);
    $('focus-status').hidden = !this.scan;
    $('focus-btn').setAttribute('aria-pressed', String(this.scan));
    this.audio.tone(this.scan ? 440 : 220, 0.15, 0.07);
  }
  refreshArea() {
    const a = this.currentArea;
    $('shell').dataset.area = a.id;
    $('location-title').textContent = a.title;
    $('location-subtitle').textContent = a.subtitle;
    $('hotspots').innerHTML = a.hotspots
      .filter((h) => this.model.available(h))
      .map((h) => {
        const insight = h.clue && insightFor(this.model, h.clue);
        const freshInsight = insight && !this.model.save.insights.includes(insight.id);
        return `<button class="hotspot ${h.kind === 'door' ? 'door' : ''} ${h.clue && this.model.save.clues.includes(h.clue) ? 'collected' : ''} ${freshInsight ? 'new-insight' : ''}" data-hotspot="${h.id}" aria-label="${h.label}${freshInsight ? ' · New perspective' : ''}" style="top:${(h.y / H) * 100}%"><span class="hotspot-dot">${freshInsight ? '!' : h.kind === 'door' ? '↗' : h.kind === 'talk' ? '◌' : h.clue && this.model.save.clues.includes(h.clue) ? '✓' : '+'}</span><span class="hotspot-label">${h.label}${freshInsight ? ' · REVISIT' : ''}${!this.model.unlocked(h) ? ' · LOCKED' : ''}</span></button>`;
      })
      .join('');
    this.hotspotNodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-hotspot]'),
      (element) => ({
        element,
        hotspot: a.hotspots.find((h) => h.id === element.dataset.hotspot)!,
      }),
    );
    $('district-label').textContent = a.id === 'street' ? 'NEW ANGELES' : 'SECTOR 07 · INTERIOR';
    this.syncHotspots();
  }
  syncHotspots() {
    for (const { element: b, hotspot: h } of this.hotspotNodes) {
      const x = ((h.x - this.camera) / this.viewW) * 100;
      b.style.left = x + '%';
      b.hidden = x < 2 || x > 98;
      b.classList.toggle('near', h === this.nearest);
      b.classList.toggle('destination-selected', h === this.pending);
      b.classList.toggle('edge-left', x < 22);
      b.classList.toggle('edge-right', x > 78);
    }
  }
  goTo(h: Hotspot, route: string | null = null) {
    if (
      !this.started ||
      this.cinematic ||
      this.modal ||
      this.combat ||
      this.lines.length ||
      this.transitioning
    )
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
    if (Math.abs(h.x - this.player.x) > 1) this.player.facing = Math.sign(h.x - this.player.x);
    this.clearInput();
    if (!this.model.unlocked(h)) {
      this.say([
        {
          speaker: 'GRAVITY',
          text: this.model.deduced
            ? 'Still locked. The woman outside has been watching me. Time to ask what she knows.'
            : 'Locked from inside. Whoever runs this place isn’t taking walk-ins. Marlon’s studio is my way into this.',
        },
      ]);
      return;
    }
    if (h.kind === 'door') {
      void this.travel(h.target!, route);
      return;
    }
    if (h.kind === 'clue' || h.kind === 'talk') {
      this.model.save.resumeHotspot = h.id;
      this.persist();
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
      const insight = !fresh ? insightFor(this.model, h.clue) : undefined;
      if (insight && !this.model.save.insights.includes(insight.id)) {
        this.model.save.insights.push(insight.id);
        this.toast('FIELD NOTE ADDED', insight.title);
        this.persist();
      }
      this.say(
        [{ speaker: 'GRAVITY', text: insight?.text ?? clue.observation }],
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
              'Open the notebook [J] to connect the evidence.',
            );
          }
        },
        insight ? 'RE-EXAMINATION · ' + insight.title.toUpperCase() : clue.category,
      );
      this.examining = true;
      $('stage').classList.add('examining-clue');
      this.discovery = { id: h.clue, x: h.x, y: h.y };
      const art = evidenceArt(h.clue);
      $('evidence-closeup').innerHTML = art
        ? `${art}<span>${clue.category}</span><strong>${clue.title}</strong>`
        : '';
      $('evidence-closeup').hidden = !art;
    } else if (h.kind === 'talk') {
      if (h.id === 'mei') {
        this.openMei();
        return;
      }
      if (h.id === 'lyra' && !this.model.save.contact)
        this.say(lyraIntroduction(this.model), () => {
          this.model.save.contact = true;
          this.persist();
          this.sync();
          this.refreshArea();
          this.toast('NEW LEAD', 'Enter the Memory Den.');
        });
      else if (this.model.followupSolved && !this.model.save.resolution) this.openResolution();
      else if (this.model.save.contact && h.id === 'lyra' && !this.model.save.companion)
        this.say([
          {
            speaker: 'LYRA',
            text: 'The Den is open. Archive zero-zero-one is waiting at the projection. I’ll meet you inside.',
          },
        ]);
      else if (!this.model.save.clues.includes('fragment'))
        this.say([
          {
            speaker: 'LYRA',
            text: 'Archive zero-zero-one. The projection in the center of the room. I kept it waiting for someone who would listen.',
          },
        ]);
      else if (!this.model.save.companion) this.say(LYRA_ARCHIVE, () => this.openCompanionChoice());
      else this.companionTalk();
    } else this.say([{ speaker: 'GRAVITY', text: h.text! }]);
  }
  say(
    lines: { speaker: string; text: string }[],
    done: (() => void) | null = null,
    context = 'PRIVATE CHANNEL',
  ) {
    this.clearInput();
    this.examining = false;
    this.discovery = null;
    $('evidence-closeup').hidden = true;
    $('stage').classList.remove('examining-clue');
    this.lines = lines;
    this.lineIndex = 0;
    this.reveal = 0;
    this.dialogueDone = done;
    $('dialogue').hidden = false;
    $('stage').classList.add('in-dialogue');
    $('interaction').hidden = true;
    $('hotspots').classList.add('inactive');
    $('dialogue-context').textContent = context;
    this.showLine();
  }
  showLine() {
    const line = this.lines[this.lineIndex];
    $('speaker').textContent = line.speaker;
    $('dialogue-announcement').textContent = `${line.speaker}: ${line.text}`;
    $('portrait-mark').innerHTML = line.speaker === 'LYRA' ? 'L<span>◌</span>' : 'G<span>/</span>';
    if (line.speaker === 'MEI') $('portrait-mark').innerHTML = 'M<span>·</span>';
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
    this.model.save.resumeHotspot = null;
    this.persist();
    this.lines = [];
    this.examining = false;
    this.discovery = null;
    $('evidence-closeup').hidden = true;
    this.dialogueDone = null;
    $('dialogue').hidden = true;
    $('stage').classList.remove('in-dialogue', 'examining-clue');
    $('dialogue-announcement').textContent = '';
    $('hotspots').classList.remove('inactive');
    this.clearInput();
    this.refreshArea();
    done?.();
  }
  async travel(id: AreaId, route: string | null = null) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.clearInput();
    $('transition').classList.add('active');
    await new Promise((r) => setTimeout(r, this.reducedMotion ? 40 : 350));
    const from = this.model.save.area;
    this.model.save.resumeHotspot = null;
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
    if (this.model.awaitingAmbush) this.openAmbush();
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
  persist(reset = false) {
    if (this.archiveChanged) return false;
    // Mid-cinematic positions are staging, not progress.
    if (!this.started || this.cinematic || this.combat) return true;
    this.model.save.x = this.player.x;
    try {
      if (!archive) throw new Error('Storage unavailable');
      archive.write(this.model.save, reset);
      $('save-status').innerHTML = `<i class="save-dot"></i> NOTES FILED · 0${archive.activeId}`;
      return true;
    } catch {
      $('save-status').textContent = 'SESSION ONLY · STORAGE UNAVAILABLE';
      return false;
    }
  }
  caseMarginNote() {
    const save = this.model.save;
    if (save.resolution === 'protect') return 'Keep her safe. Keep the record.';
    if (save.resolution === 'testify') return 'Put the truth on record.';
    if (save.followup) return 'A person behind every fragment.';
    if (save.companion) return 'No longer working alone.';
    if (this.model.deduced) return 'The pieces agree. Follow them out.';
    if (save.deductions.length) return 'A connection. Now test the rest.';
    if (save.clues.length) return 'Record first. Conclusions later.';
    return 'Follow the evidence.';
  }
  sync() {
    $('clue-count').textContent = String(this.model.save.clues.length).padStart(2, '0');
    $('objective-text').textContent = this.model.objective;
    $('chapter-label').innerHTML =
      `<i>${this.model.save.followup ? '04' : this.model.save.contact ? '03' : this.model.deduced ? '02' : '01'}</i> ${this.model.chapter}`;
    $('companion').hidden = !this.model.save.companion || !!this.combat || !this.started;
    $('scene-hud').hidden = !!this.combat;
    $('combat-hud').hidden = !this.combat;
    $('controls-hint').innerHTML = this.combat
      ? '<span><kbd>A</kbd><kbd>D</kbd> Move</span><span><kbd>Space</kbd> Jump</span><span><kbd>Shift</kbd> Sprint</span><span>Hold click to fire</span>'
      : '<span><kbd>A</kbd><kbd>D</kbd> Walk</span><span><kbd>E</kbd> Interact</span><span><kbd>⇧</kbd> Sprint</span><span><kbd>I</kbd> Focus</span><span class="desktop-hint">Click to walk</span>';
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
    $('panel').dataset.mode = mode;
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
    if (!this.started || this.cinematic) return;
    this.selected = [];
    this.boardFile = this.model.save.followup ? 'first-one' : 'graves';
    this.renderBoard();
  }
  renderBoard(message = 'Select two pieces of evidence. Find what connects them.') {
    const focusedClue = (document.activeElement as HTMLElement | null)?.dataset.clue;
    const scrollTop = $('panel').scrollTop;
    this.selected = this.selected.filter(
      (id) => evidenceBoardState(this.model.save, id).selectable,
    );
    const second = this.boardFile === 'first-one';
    const clues = this.model.save.clues.filter((id) =>
      second ? id === 'fragment' || FOLLOWUP_CLUES.includes(id) : !FOLLOWUP_CLUES.includes(id),
    );
    const theories = DEDUCTIONS.filter((d) => second === FOLLOWUP_DEDUCTIONS.includes(d.id));
    const cards = clues
      .map((id) => renderEvidenceCard(this.model.save, id, this.selected.includes(id)))
      .join('');
    const required = theories.filter((d) => d.id !== 'entry');
    const progress = `${required.filter((d) => this.model.save.deductions.includes(d.id)).length} OF ${required.length} CORE CONNECTIONS${second ? '' : ` · OPTIONAL ENTRY ${this.model.save.deductions.includes('entry') ? '✓' : 'OPEN'}`}`;
    const deductions = theories
      .map((d, i) => {
        const solved = this.model.save.deductions.includes(d.id);
        // A solved theory records the two records that made it, so the board
        // reads back as reasoning rather than as a list of unlocked text.
        const workings = solved
          ? `<span class="deduction-pair">${d.pair.map((id) => CLUES[id].title).join(' <i>↔</i> ')}</span>`
          : '';
        return `<article class="deduction ${solved ? 'solved' : ''}"><span>${solved ? '✓' : String(i + 1).padStart(2, '0')}</span><div><h3>${solved ? `<span class="resolved-question">${d.question}</span>${d.title}` : d.question}${d.id === 'entry' ? ' <small>OPTIONAL</small>' : ''}</h3><p>${solved ? d.conclusion : d.hint}</p>${workings}</div></article>`;
      })
      .join('');
    this.panel(
      second ? 'The first one' : 'The Graves case',
      second ? 'CASE FILE 07–032 · ARCHIVE 001' : 'CASE FILE 07–031 · MARLON GRAVES',
      `<nav class="case-tabs" aria-label="Case files"><button data-action="file-graves" aria-pressed="${!second}">01 · The Graves case</button>${this.model.save.followup ? `<button data-action="file-first" aria-pressed="${second}">02 · The first one</button>` : this.model.save.escaped ? `<button data-action="followup">Open the next case →</button>` : ''}</nav><div class="case-summary"><p>${this.model.objective}</p><span>${clues.length} RECORDS <b>/</b> ${progress}</span></div><details class="case-hint"><summary>Need a lead?</summary><p>${boardHint(this.model, second)}</p></details><div class="notebook-inscription"><span><s>Close the file.</s> ${this.caseMarginNote()}</span><small>Gravity / private working copy</small></div><div class="board-layout"><div><div class="section-label">EXHIBITS & OBSERVATIONS <span>${String(clues.length).padStart(2, '0')}</span></div><div class="evidence-grid">${cards || '<div class="empty-evidence"><span>∅</span><h3>A blank file. A dead artist.</h3><p>Visit Marlon’s studio. Examine objects to record evidence here.</p><button class="text-button" data-action="close">Return to the street →</button></div>'}</div></div><aside class="deductions"><div class="section-label">MARGIN NOTES / THEORIES</div>${deductions}<div class="connection-box"><span class="eyebrow">MAKE A CONNECTION</span><div class="connection-pair"><span>${this.selected[0] ? CLUES[this.selected[0]].title : 'Evidence A'}</span><i>↔</i><span>${this.selected[1] ? CLUES[this.selected[1]].title : 'Evidence B'}</span></div><button class="primary" data-action="connect" ${this.selected.length !== 2 ? 'disabled' : ''}>Connect evidence ${icon('arrow')}</button><p class="connection-feedback" role="status">${message}</p></div></aside></div>`,
      'board',
    );
    const notes = INSIGHTS.filter(
      (i) => this.model.save.insights.includes(i.id) && clues.includes(i.clue),
    );
    if (notes.length)
      $('panel-content').insertAdjacentHTML(
        'beforeend',
        `<section class="field-notes"><div class="section-label">FIELD NOTES · RE-EXAMINATION</div>${notes.map((i) => `<article><h3>${i.title}</h3><p>${i.text}</p></article>`).join('')}</section>`,
      );
    if (this.selected.length) {
      $('panel-content').insertAdjacentHTML(
        'beforeend',
        `<div class="board-mobile-actions"><span>${this.selected.length} / 2 selected</span><button class="primary" data-action="connect" ${this.selected.length !== 2 ? 'disabled' : ''}>Connect ${icon('arrow')}</button></div>`,
      );
    }
    if (focusedClue) {
      document
        .querySelector<HTMLElement>(
          evidenceBoardState(this.model.save, focusedClue as ClueId).selectable
            ? `[data-clue="${focusedClue}"]`
            : `[data-inspect="${focusedClue}"]`,
        )
        ?.focus({ preventScroll: true });
      $('panel').scrollTop = scrollTop;
    }
  }
  inspectRecord(id: ClueId) {
    if (!this.model.save.clues.includes(id)) return;
    if (this.panelMode === 'board') this.boardScroll = $('panel').scrollTop;
    this.inspectedClue = id;
    const clue = CLUES[id];
    const notes = INSIGHTS.filter((i) => i.clue === id && this.model.save.insights.includes(i.id));
    const links = DEDUCTIONS.filter(
      (d) => this.model.save.deductions.includes(d.id) && d.pair.includes(id),
    );
    this.panel(
      clue.title,
      `EVIDENCE RECORD · ${clue.category}`,
      `<div class="record-reader" data-material="${RECORD_MOUNTS[id].material}"><figure>${evidenceArt(id)}<figcaption>RECORD ${String(Object.keys(CLUES).indexOf(id) + 1).padStart(2, '0')} · ${RECORD_MOUNTS[id].label}</figcaption></figure><section><span class="file-stamp">FILED / GRAVITY</span><span class="eyebrow">RECORDED OBSERVATION</span><p class="record-body">${clue.body}</p><blockquote>${clue.observation}<cite>— Gravity</cite></blockquote>${notes.map((i) => `<div class="record-note"><span class="eyebrow">RE-EXAMINATION</span><h3>${i.title}</h3><p>${i.text}</p></div>`).join('')}${links.map((d) => `<div class="record-note"><span class="eyebrow">ESTABLISHED CONNECTION</span><h3>${d.title}</h3><p>${d.conclusion}</p></div>`).join('')}<button class="primary" data-action="record-back">Return to notebook ${icon('arrow')}</button></section></div>`,
      'record',
    );
    $('panel').scrollTop = 0;
    document
      .querySelector<HTMLElement>('[data-action="record-back"]')
      ?.focus({ preventScroll: true });
  }
  returnToBoard() {
    const id = this.inspectedClue;
    this.renderBoard();
    $('panel').scrollTop = this.boardScroll;
    if (id)
      document.querySelector<HTMLElement>(`[data-inspect="${id}"]`)?.focus({ preventScroll: true });
    this.inspectedClue = null;
  }
  openMap() {
    if (!this.started || this.cinematic) return;
    const sites = [
      {
        x: 15,
        y: 57,
        label: this.model.save.followup ? 'Mei’s night shift' : 'Night shift',
        id: this.model.save.followup ? 'mei' : 'noodles',
        area: 'street',
      },
      { x: 37, y: 42, label: 'Graves’ studio', id: 'studio-door', area: 'studio' },
      { x: 76, y: 53, label: 'Memory Den', id: 'den-door', area: 'den' },
    ];
    this.panel(
      'Sector 07',
      'DISTRICT MAP · NEW ANGELES',
      `<div class="map-canvas"><div class="map-grid"></div><div class="map-rail"></div><div class="map-road"><span>FREMONT AVENUE</span></div>${sites.map((site, i) => `<button class="map-place ${site.area === this.model.save.area ? 'current' : ''}" style="left:${site.x}%;top:${site.y}%" data-route="${site.id}"><i>${String(i + 1).padStart(2, '0')}</i><strong>${site.label}</strong><span>${site.area === this.model.save.area ? 'CURRENT LOCATION' : i === 2 && !this.model.save.contact ? 'CONTACT REQUIRED' : 'SET WALKING DESTINATION'}</span></button>`).join('')}<span class="map-north">N<br>↑</span><span class="map-caption">LOW DISTRICT<br>34°03′ N · 118°15′ W</span></div><div class="map-note"><span class="live-dot"></span><p>${this.model.objective}</p><span>Destinations guide Gravity through connected rooms.</span></div>`,
      'map',
    );
  }
  openPause() {
    this.panel(
      this.started ? 'A moment in the rain.' : 'Before you step outside.',
      'GRAVITY',
      `<div class="settings"><p class="settings-intro">The city can wait.</p><div class="setting-row"><label for="volume">Soundscape volume</label><span id="volume-value">${Math.round(this.audio.volume * 100)}%</span><input id="volume" type="range" min="0" max="1" step="0.05" value="${this.audio.volume}"></div><label class="setting-row switch-row" for="reduce-motion"><span>Reduced motion<small>Still rain, steady lights, no screen shake.</small></span><input id="reduce-motion" type="checkbox" ${this.reducedMotion ? 'checked' : ''}></label><div class="control-list"><span><kbd>A</kbd> <kbd>D</kbd> / Arrow keys</span><b>Walk</b><span><kbd>Shift</kbd> / Hold » + direction</span><b>Sprint</b><span><kbd>E</kbd> / Click a marker</span><b>Examine / enter</b><span><kbd>I</kbd></span><b>Highlight evidence</b><span><kbd>J</kbd> / <kbd>M</kbd></span><b>Notebook / map</b><span><kbd>[</kbd> <kbd>]</kbd></span><b>Walk to next marker</b><span><kbd>B</kbd> on the street</span><b>Combat practice</b><span><kbd>Space</kbd> / Hold click</span><b>Jump / fire in combat</b></div><div class="settings-actions"><button class="primary" data-action="close">${this.combat ? 'Resume encounter' : this.started ? 'Return to investigation' : 'Back'} ${icon('arrow')}</button><button class="text-button" data-action="archive">Case archive · saves &amp; recovery</button><button class="text-button" data-action="new">Start a new investigation</button></div><p class="small-note">Progress saves automatically on this device. Continue into The First One after the Graves case.</p></div>`,
      'pause',
    );
  }
  openCompanionChoice() {
    this.panel(
      'An open channel.',
      'LYRA · PRIVATE CONNECTION',
      `<div class="story-choice"><span class="signal-large">◌</span><p>“If you let me, I can stay with you.”</p><small>Let Lyra accompany Gravity through the city. Her presence will travel between areas.</small><button class="primary" data-action="accept-lyra">Open the channel ${icon('arrow')}</button><button class="text-button" data-action="close">I need a moment.</button></div>`,
      'companion',
    );
  }
  openAmbush() {
    this.panel(
      'They found the signal.',
      'SECTOR 07 · HOSTILE CONTACT',
      `<div class="story-choice"><span class="eyebrow danger">VEIL ENFORCERS INBOUND</span><p>“Gravity. Two blocks out. They know you have the memory.”</p><small>Hold them off, or take Lyra’s route through the service alley. The evidence comes first.</small><button class="primary" data-action="fight">Stand your ground ${icon('arrow')}</button><button class="secondary" data-action="evade">Take the service alley →</button></div>`,
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
      `<div class="ending"><span class="ending-number">001</span><p>A woman. A child. A drawing of a bird.</p><h3>They took her name.<br>They didn’t take everything.</h3><div class="ending-stats"><span><b>${this.model.save.clues.length}</b> EVIDENCE RECORDS</span><span><b>03</b> CONNECTIONS MADE</span><span><b>LYRA</b> CHANNEL OPEN</span></div><blockquote>“Find the first one.”</blockquote><button class="primary" data-action="followup">Continue · The first one ${icon('arrow')}</button><button class="text-button" data-action="close">Stay a little longer</button><span class="small-note">The Graves case is saved. A new investigation is ready.</span></div>`,
      'ending',
    );
  }
  companionTalk() {
    if (this.cinematic || this.combat || this.lines.length || this.modal) return;
    const topics = lyraTopics(this.model);
    this.panel(
      'An open channel.',
      'LYRA · PRIVATE CONNECTION',
      `<div class="topic-list"><p class="topic-intro">“I’m here, Gravity.”</p>${topics.map((t) => `<button data-topic="${t.id}"><strong>${t.title}</strong><span>${t.detail}</span>${icon('arrow')}</button>`).join('')}${this.model.save.escaped && !this.model.save.followup ? '<button data-action="followup"><strong>Open the next case</strong><span>Find the woman in archive 001</span>↗</button>' : ''}${this.model.followupSolved && !this.model.save.resolution && this.model.save.area === 'den' ? '<button data-action="resolution"><strong>Decide what happens to the archive</strong><span>Three conclusions, one person to protect</span>↗</button>' : ''}</div>`,
      'topics',
    );
  }
  openMei() {
    if (this.model.save.clues.includes('witness')) {
      this.say([
        {
          speaker: 'MEI',
          text: 'You have the receipt. V-17, intake B. Don’t let them turn another person into a delivery number.',
        },
      ]);
      return;
    }
    const prepared = this.model.save.deductions.includes('entry');
    this.panel(
      'The night shift.',
      'MEI · NOODLE BAR WINDOW',
      `<div class="topic-list"><p class="topic-intro">“If you’re asking about Marlon, ask quietly.”</p>${prepared ? '<button data-action="mei-pickup"><strong>Ask about the scheduled pickup</strong><span>Use the camera outage and prepared lock</span>↗</button>' : '<button data-action="mei-trust"><strong>Tell her why you are looking</strong><span>She needs a reason to risk talking</span>↗</button>'}<button data-action="close"><strong>Let her finish the shift</strong><span>You can come back</span>↗</button></div>`,
      'mei',
    );
  }
  recordWitness() {
    const prepared = this.model.save.deductions.includes('entry');
    const lines: Line[] = [
      {
        speaker: 'GRAVITY',
        text: prepared
          ? 'I’m asking about a pickup. Eleven minutes off the camera, a lock prepared beforehand. A driver with somewhere else to be.'
          : 'Marlon kept a woman’s memory after the city erased her. Someone came to take it. We’re trying to give her a name again.',
      },
      {
        speaker: 'MEI',
        text: prepared
          ? 'You did your homework. V-17 signed for two meals. Asked me where Meridian’s intake B was. Called Marlon “the collection.” I kept the carbon.'
          : 'He paid for the children who couldn’t. Marlon, I mean. All right. A driver signed V-17. Asked for Meridian’s intake B. Here. I kept the carbon.',
      },
      { speaker: 'GRAVITY', text: 'I’ll keep this safe.' },
    ];
    this.say(
      lines,
      () => {
        if (this.model.collect('witness')) {
          this.audio.clue();
          this.toast('WITNESS ACCOUNT RECORDED', CLUES.witness.title);
        }
        this.persist();
        this.refreshArea();
        this.sync();
      },
      'MEI · WITNESS ACCOUNT',
    );
  }
  startFollowup() {
    if (!this.model.startFollowup()) return;
    this.closePanel();
    this.persist();
    this.refreshArea();
    this.sync();
    this.audio.deduction();
    this.say(FOLLOWUP_OPENING, () =>
      this.toast('CASE FILE 07–032 OPENED', 'The first one · Return to the Memory Den.'),
    );
  }
  openResolution() {
    if (!this.model.followupSolved || this.model.save.resolution) return;
    this.panel(
      'Ada Vale.',
      'CASE FILE 07–032 · THREE CONCLUSIONS',
      `<div class="story-choice"><span class="signal-large">001</span><p>“She has a name now. What do we do with it?”</p><small>The archive is real. The shipment went to Meridian. Both choices preserve the evidence; this choice decides how Gravity and Lyra keep Ada’s identity.</small><button class="primary" data-action="resolve-protect">Keep her name in Lyra’s private archive ${icon('arrow')}</button><button class="secondary" data-action="resolve-testify">Write a sealed witness statement ${icon('arrow')}</button><button class="text-button" data-action="close">Talk it through first</button></div>`,
      'resolution',
    );
  }
  finishFollowup(choice: 'protect' | 'testify') {
    if (!this.model.resolveFollowup(choice)) return;
    this.closePanel();
    this.persist();
    this.sync();
    this.refreshArea();
    this.audio.deduction();
    this.say(
      [
        {
          speaker: 'GRAVITY',
          text:
            choice === 'protect'
              ? 'Keep her name here. Encrypted. We follow the route before giving the city another person to hunt.'
              : 'Write it down. Her name, the drawing, the route. Seal it until somebody can answer for what happened.',
        },
        {
          speaker: 'LYRA',
          text:
            choice === 'protect'
              ? 'Ada Vale. Teacher. Remembered by a child who learned to draw a bird. I’ll keep all of it.'
              : 'Ada Vale. Teacher. Not redundant data. Not an anonymous fragment. A witness whose statement is waiting to be heard.',
        },
      ],
      () =>
        this.panel(
          'A name kept safe.',
          'THE FIRST ONE · CASE COMPLETE',
          `<div class="ending"><span class="ending-number">ADA</span><p>One name recovered. One memory verified.</p><h3>Meridian Clinic.<br>Intake B.</h3><blockquote>${choice === 'protect' ? 'Her identity stays in Lyra’s private archive.' : 'A sealed statement preserves her name and the evidence.'}</blockquote><button class="primary" data-action="close">Return to the city ${icon('arrow')}</button><span class="small-note">End of this investigation. The Meridian lead is saved for the next chapter.</span></div>`,
          'case-complete',
        ),
      'LYRA · A NAME RECOVERED',
    );
  }
  panelAction(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-action],[data-clue],[data-route],[data-topic],[data-inspect]',
    );
    if (!el) return;
    if (
      [
        'archive-open',
        'archive-create',
        'archive-create-confirm',
        'archive-rename',
        'archive-history',
        'archive-restore',
        'resume-slot',
      ].includes(el.dataset.action ?? '')
    ) {
      this.archiveAction(el);
      return;
    }
    if (el.dataset.inspect) {
      this.inspectRecord(el.dataset.inspect as ClueId);
      return;
    }
    if (el.dataset.topic) {
      const topic = lyraTopics(this.model).find((t) => t.id === el.dataset.topic);
      if (topic) {
        this.closePanel();
        this.say(topic.lines, null, 'LYRA · ' + topic.title.toUpperCase());
      }
      return;
    }
    if (el.dataset.clue) {
      const id = el.dataset.clue as ClueId;
      if (!evidenceBoardState(this.model.save, id).selectable) return;
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
      case 'archive-reload':
        location.reload();
        break;
      case 'file-graves':
      case 'file-first':
        this.boardFile = el.dataset.action === 'file-first' ? 'first-one' : 'graves';
        this.selected = [];
        this.renderBoard();
        break;
      case 'followup':
        this.startFollowup();
        break;
      case 'resolution':
        this.closePanel();
        this.openResolution();
        break;
      case 'resolve-protect':
        this.finishFollowup('protect');
        break;
      case 'resolve-testify':
        this.finishFollowup('testify');
        break;
      case 'mei-pickup':
        this.closePanel();
        this.recordWitness();
        break;
      case 'mei-trust':
        this.closePanel();
        this.say(
          [
            {
              speaker: 'MEI',
              text: 'People disappear after they talk to detectives. Tell me this isn’t going to put my window on somebody’s list.',
            },
          ],
          () =>
            this.panel(
              'A reason to trust you.',
              'MEI · NIGHT SHIFT',
              '<div class="story-choice"><p>“I can tell you about the driver. I have to know you’ll listen.”</p><button class="primary" data-action="mei-pickup">Explain the memory and listen</button><button class="text-button" data-action="close">Give her some space</button></div>',
              'mei-trust',
            ),
        );
        break;

      case 'record-back':
        this.returnToBoard();
        break;
      case 'close':
        if (this.panelMode === 'record') {
          this.returnToBoard();
          break;
        }
        this.closePanel();
        break;
      case 'connect': {
        if (this.selected.length !== 2) return;
        const wasDeduced = this.model.deduced;
        const wasFollowupSolved = this.model.followupSolved;
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
          if (!wasFollowupSolved && this.model.followupSolved)
            this.toast('THE RECORDS AGREE', 'Return to Lyra in the Den.');
        } else {
          const miss = this.model.explain(a, b);
          if (miss.reason !== 'matched')
            this.audio.tone(miss.reason === 'warm' ? 196 : 147, 0.18, 0.05, 'sine');
          this.renderBoard(miss.text);
        }
        break;
      }
      case 'new':
      case 'archive':
        this.openArchive();
        break;
      case 'pause':
        this.openPause();
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
    this.persist();
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
      if (active && this.cinematic) this.stepIntro(elapsed);
      else if (active && (!this.lines.length || (this.discovery && !this.reducedMotion))) {
        const desired = clamp(
          (this.discovery && !this.reducedMotion
            ? this.player.x * 0.65 + this.discovery.x * 0.35
            : this.player.x) -
            this.viewW * (this.discovery && !this.reducedMotion ? 0.42 : 0.48),
          0,
          this.currentArea.width - this.viewW,
        );
        this.camera += (desired - this.camera) * (1 - Math.exp(-elapsed * 5));
      }
      if (!this.modal || this.renderDirty) {
        this.renderer.draw({
          model: this.model,
          player: this.player,
          camera: this.camera,
          time: this.time,
          scan: this.scan,
          reducedMotion: this.reducedMotion,
          combat: this.combat,
          aim: this.aim,
          title: !this.started || !!this.cinematic,
          examining: this.examining,
          discovery: this.discovery,
          speaker: this.lines[this.lineIndex]?.speaker ?? null,
          dt: this.modal ? 0 : elapsed,
        });
        this.renderDirty = false;
      }
      if (!this.modal) this.syncHotspots();
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
    if (this.cinematic) {
      const d = this.cineWalk === null ? 0 : this.cineWalk - this.player.x;
      const arrived = Math.abs(d) < Math.max(4, Math.abs(this.player.vx) * dt + 1);
      if (arrived && this.cineWalk !== null) {
        this.player.x = this.cineWalk;
        this.player.vx = 0;
        this.cineWalk = null;
      }
      stepBody(this.player, arrived ? 0 : Math.sign(d), false, dt, this.currentArea.width);
      return;
    }
    if (this.combat?.down || this.combat?.complete) return;
    let axis =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('touch-right')
        ? 1
        : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('touch-left') ? 1 : 0);
    if (this.target !== null) {
      const d = this.target - this.player.x;
      if (Math.abs(d) < Math.max(4, Math.abs(this.player.vx) * dt + 1)) {
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
        this.keys.has('ShiftLeft') ||
          this.keys.has('ShiftRight') ||
          (!this.combat && this.keys.has('touch-sprint')),
        this.currentArea.ground,
        // Exploration gets a modest boost; combat keeps its existing tuning.
        this.combat ? 290 : 330,
      );
    // Exploration footsteps come from the renderer, on the animation's footfalls.
    if (this.combat && Math.abs(this.player.vx) > 20 && this.player.grounded) {
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
          'GRAVITY · NEURAL RECOVERY',
          `<div class="story-choice"><p>“Get up, Gravity. You still have the memory.”</p><small>Your evidence is safe. Retry the encounter at full health, or disengage.</small><button class="primary" data-action="retry-combat">Try again ${icon('arrow')}</button><button class="text-button" data-action="leave-combat">Disengage</button></div>`,
          'down',
        );
      else if (this.combat.complete) this.finishCombat();
    }
  }
  tickUI() {
    const walking =
      Math.abs(this.player.vx) > 20 && !this.modal && !this.lines.length && !this.combat;
    $('stage').classList.toggle('walking', walking);
    const show =
      this.started &&
      !this.cinematic &&
      !this.modal &&
      !this.lines.length &&
      !this.combat &&
      !this.transitioning &&
      !!this.nearest;
    $('interaction').hidden = !show;
    if (show) {
      const h = this.nearest!;
      const verb = !this.model.unlocked(h)
        ? 'Inspect'
        : h.kind === 'door'
          ? 'Enter'
          : h.kind === 'talk'
            ? 'Talk'
            : h.clue && this.model.save.clues.includes(h.clue)
              ? 'Revisit'
              : 'Examine';
      $('interaction-label').textContent = h.label.startsWith('Return to ')
        ? h.label
        : `${verb} · ${h.label}`;
      $('touch-act').setAttribute(
        'aria-label',
        h.label.startsWith('Return to ') ? h.label : `${verb} ${h.label}`,
      );
    }
    $<HTMLButtonElement>('touch-act').disabled = !show;
    $('hotspots').hidden = !this.started || !!this.cinematic || !!this.combat || this.transitioning;
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

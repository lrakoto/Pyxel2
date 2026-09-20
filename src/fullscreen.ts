/** Native fullscreen where available; immersive viewport layout on iPhone Safari. */
export function bindFullscreen(button: HTMLButtonElement, signal: AbortSignal) {
  const root = document.documentElement;
  let immersive = false;
  let pending = false;
  const sync = () => {
    root.classList.toggle('immersive', immersive);
    button.setAttribute('aria-pressed', String(immersive));
    button.setAttribute('aria-label', immersive ? 'Exit fullscreen view' : 'Enter fullscreen view');
    button.title = immersive ? 'Exit fullscreen view' : 'Fullscreen view';
  };
  document.addEventListener(
    'fullscreenchange',
    () => {
      immersive = Boolean(document.fullscreenElement);
      sync();
    },
    { signal },
  );
  button.addEventListener(
    'click',
    async () => {
      if (pending) return;
      pending = true;
      try {
        if (immersive) {
          if (document.fullscreenElement) await document.exitFullscreen();
          immersive = false;
        } else {
          immersive = true;
          sync();
          try {
            if (root.requestFullscreen) await root.requestFullscreen();
          } catch {
            // Browser denied native fullscreen; retain the reversible immersive layout.
          }
        }
      } finally {
        pending = false;
        sync();
      }
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        immersive &&
        !document.fullscreenElement &&
        !document.querySelector('dialog[open]')
      ) {
        immersive = false;
        sync();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { signal, capture: true },
  );
  signal.addEventListener('abort', () => root.classList.remove('immersive'), { once: true });
}

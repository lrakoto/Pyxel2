/** Opt-in local diagnostics only; no telemetry and no production UI. */
export class RenderProbe {
  private samples: number[] = [];
  private writes = 0;
  private last = 0;
  private output: HTMLOutputElement;
  constructor() {
    this.output = document.createElement('output');
    this.output.id = 'render-probe';
    this.output.style.cssText =
      'position:fixed;bottom:4px;right:4px;z-index:1000;padding:8px;background:#081519ee;color:#c8d8bd;font:11px monospace;pointer-events:none';
    document.body.append(this.output);
  }
  sample(milliseconds: number, writes: number, now: number) {
    this.samples.push(milliseconds);
    this.writes += writes;
    if (now - this.last < 1000) return;
    const sorted = this.samples.slice().sort((a, b) => a - b);
    this.output.textContent = `Frame CPU median ${sorted[Math.floor(sorted.length / 2)].toFixed(2)} ms · p95 ${sorted[Math.floor(sorted.length * 0.95)].toFixed(2)} ms · marker writes ${this.writes} · ${sorted.length} frames`;
    this.samples = [];
    this.writes = 0;
    this.last = now;
  }
  dispose() {
    this.output.remove();
  }
}

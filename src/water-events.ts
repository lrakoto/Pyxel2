import type { Leak } from './water.ts';

/** Shared by falling drops and their sound, without depending on canvas rendering. */
export function leakPhase(time: number, x: number) {
  const period = 1.05 + (x % 13) * 0.055;
  const position = (time + x * 0.017) / period;
  return { cycle: Math.floor(position), progress: position - Math.floor(position) };
}

/** Audio stays active with reduced motion and fades with distance, not screen edges. */
export function leakImpacts(leaks: readonly Leak[], time: number, dt: number, listenerX: number) {
  if (!Number.isFinite(time) || !Number.isFinite(dt) || dt <= 0) return [];
  const previousTime = time - Math.min(dt, 0.1);
  return leaks.flatMap((leak) => {
    if (leakPhase(time, leak.x).cycle === leakPhase(previousTime, leak.x).cycle) return [];
    const distance = Math.abs(leak.x - listenerX);
    return [{ x: leak.x, strength: 1 / (1 + (distance / 480) ** 2) }];
  });
}

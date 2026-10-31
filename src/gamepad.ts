export interface GamepadSnapshot {
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value: number }[];
}

export interface ControllerFrame {
  moveX: number;
  aimX: number;
  aimY: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  back: boolean;
  focus: boolean;
  board: boolean;
  map: boolean;
  pause: boolean;
  previous: boolean;
  next: boolean;
  fire: boolean;
  sprint: boolean;
  active: boolean;
}

export type ControllerButton = Exclude<keyof ControllerFrame, 'moveX' | 'aimX' | 'aimY' | 'active'>;

export function analog(value: number | undefined, deadZone = 0.22) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const clamped = Math.max(-1, Math.min(1, value));
  const magnitude = Math.abs(clamped);
  if (magnitude <= deadZone) return 0;
  return Math.sign(clamped) * Math.min(1, (magnitude - deadZone) / (1 - deadZone));
}

export function readController(pad: GamepadSnapshot | null): ControllerFrame {
  const button = (index: number) => {
    const b = pad?.buttons[index];
    return !!b && (b.pressed || b.value > 0.5);
  };
  const moveX = button(14) ? -1 : button(15) ? 1 : analog(pad?.axes[0]);
  const up = button(12) || analog(pad?.axes[1]) < -0.6;
  const down = button(13) || analog(pad?.axes[1]) > 0.6;
  const frame: ControllerFrame = {
    moveX,
    aimX: analog(pad?.axes[2]),
    aimY: analog(pad?.axes[3]),
    up,
    down,
    left: button(14) || moveX < -0.6,
    right: button(15) || moveX > 0.6,
    confirm: button(0),
    back: button(1),
    focus: button(2),
    board: button(3),
    previous: button(4),
    next: button(5),
    sprint: button(6),
    fire: button(7),
    map: button(8),
    pause: button(9),
    active: false,
  };
  frame.active =
    Math.abs(frame.moveX) > 0.01 ||
    Math.abs(frame.aimX) > 0.01 ||
    Math.abs(frame.aimY) > 0.01 ||
    Object.entries(frame).some(([key, value]) => key !== 'active' && value === true);
  return frame;
}

export function justPressed(
  current: ControllerFrame,
  previous: ControllerFrame,
  action: ControllerButton,
) {
  return current[action] && !previous[action];
}

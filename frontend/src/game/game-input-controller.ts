import * as THREE from 'three';
import type { MatchState, Role } from './game-scene-types';

export type GameInputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  targetYaw: number;
  moveYaw: number;
  yaw: number;
  debugRange: boolean;
  wolfPounce: boolean;
  wolfScent: boolean;
  deerEat: boolean;
  deerLook: boolean;
  deerCamouflage: boolean;
  wolfPounceSeq: number;
  wolfScentSeq: number;
  deerEatSeq: number;
  deerLookSeq: number;
  deerCamouflageSeq: number;
};

type OneShotAction = 'wolfPounce' | 'wolfScent' | 'deerEat' | 'deerLook' | 'deerCamouflage';

type BindGameInputOptions = {
  input: GameInputState;
  match: MatchState;
  gameAudioResume: () => void | Promise<void>;
  sprintBtn: HTMLButtonElement;
  trackBtn: HTMLButtonElement;
  lookBtn: HTMLButtonElement;
  attackBtn: HTMLButtonElement;
  startWolfBtn: HTMLButtonElement;
  startDeerBtn: HTMLButtonElement;
  restartBtn: HTMLButtonElement;
  startDialog: HTMLDialogElement;
  resultDialog: HTMLDialogElement;
  joystickEl: HTMLElement;
  devLocalMode: boolean;
  assignedRole: Role;
  resetRound: (role: Role) => void;
  onFormalRestart?: () => void;
  onResize: () => void;
};

export function bindGameInput(options: BindGameInputOptions) {
  const { input, match } = options;
  window.addEventListener('pointerdown', () => void options.gameAudioResume(), { once: true });
  window.addEventListener('keydown', () => void options.gameAudioResume(), { once: true });
  window.addEventListener('keydown', (event) => {
    setKey(input, match, event.code, true);
    if (isMovementKey(event.code)) event.preventDefault();
    if (event.code === 'KeyF' && !event.repeat) input.debugRange = !input.debugRange;
  });
  window.addEventListener('keyup', (event) => {
    setKey(input, match, event.code, false);
    if (isMovementKey(event.code)) event.preventDefault();
  });
  window.addEventListener('blur', () => clearHeldInput(input));
  window.addEventListener('pointerup', () => {
    input.sprint = false;
  });
  options.sprintBtn.addEventListener('pointerdown', () => {
    input.sprint = true;
  });
  options.trackBtn.addEventListener('click', () => {
    if (match.role === 'wolf') triggerRoleAction(input, 'wolfScent');
    else triggerRoleAction(input, 'deerEat');
  });
  options.lookBtn.addEventListener('click', () => {
    if (match.role === 'wolf') triggerRoleAction(input, 'wolfScent');
    else triggerRoleAction(input, 'deerLook');
  });
  options.attackBtn.addEventListener('click', () => {
    if (match.role === 'wolf') triggerRoleAction(input, 'wolfPounce');
    else triggerRoleAction(input, 'deerCamouflage');
  });
  options.startWolfBtn.addEventListener('click', () => {
    options.startDialog.close();
    options.resetRound('wolf');
  });
  options.startDeerBtn.addEventListener('click', () => {
    options.startDialog.close();
    options.resetRound('deer');
  });
  options.restartBtn.addEventListener('click', () => {
    options.resultDialog.close();
    if (options.devLocalMode) {
      options.startDialog.showModal();
      match.phase = 'menu';
    } else if (options.onFormalRestart) {
      options.onFormalRestart();
    } else {
      options.resetRound(options.assignedRole);
    }
  });
  window.addEventListener('resize', options.onResize);
  bindVirtualJoystick(input, options.joystickEl);
}

export function clearHeldInput(input: GameInputState) {
  input.forward = false;
  input.back = false;
  input.left = false;
  input.right = false;
  input.sprint = false;
  clearRoleActions(input);
}

export function clearRoleActions(input: GameInputState) {
  input.wolfPounce = false;
  input.wolfScent = false;
  input.deerEat = false;
  input.deerLook = false;
  input.deerCamouflage = false;
}

function triggerRoleAction(input: GameInputState, action: OneShotAction) {
  input[action] = true;
  const seqKey = `${action}Seq` as const;
  input[seqKey] += 1;
}

function bindVirtualJoystick(input: GameInputState, joystickEl: HTMLElement) {
  const knob = joystickEl.querySelector<HTMLElement>('span');
  let activePointer: number | null = null;
  const center = () => {
    const rect = joystickEl.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: rect.width / 2 };
  };
  joystickEl.addEventListener('pointerdown', (event) => {
    activePointer = event.pointerId;
    joystickEl.setPointerCapture(event.pointerId);
    updateStick(event.clientX, event.clientY);
  });
  joystickEl.addEventListener('pointermove', (event) => {
    if (activePointer !== event.pointerId) return;
    updateStick(event.clientX, event.clientY);
  });
  joystickEl.addEventListener('pointerup', () => resetStick());
  joystickEl.addEventListener('pointercancel', () => resetStick());

  function updateStick(x: number, y: number) {
    const origin = center();
    const dx = THREE.MathUtils.clamp((x - origin.x) / origin.radius, -1, 1);
    const dy = THREE.MathUtils.clamp((y - origin.y) / origin.radius, -1, 1);
    input.forward = dy < -0.25;
    input.back = dy > 0.35;
    input.left = dx < -0.25;
    input.right = dx > 0.25;
    if (knob) {
      knob.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
    }
  }

  function resetStick() {
    activePointer = null;
    input.forward = false;
    input.back = false;
    input.left = false;
    input.right = false;
    if (knob) knob.style.transform = 'translate(0, 0)';
  }
}

function isMovementKey(code: string) {
  return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(code);
}

function setKey(input: GameInputState, match: MatchState, code: string, pressed: boolean) {
  if (code === 'KeyW' || code === 'ArrowUp') input.forward = pressed;
  if (code === 'KeyS' || code === 'ArrowDown') input.back = pressed;
  if (code === 'KeyA' || code === 'ArrowLeft') input.left = pressed;
  if (code === 'KeyD' || code === 'ArrowRight') input.right = pressed;
  if (code === 'ShiftLeft' || code === 'ShiftRight') input.sprint = pressed;
  if (!pressed) return;
  if (match.role === 'wolf') {
    if (code === 'Space') triggerRoleAction(input, 'wolfPounce');
    if (code === 'KeyQ' || code === 'KeyE') triggerRoleAction(input, 'wolfScent');
    return;
  }
  if (code === 'Space') triggerRoleAction(input, 'deerCamouflage');
  if (code === 'KeyQ') triggerRoleAction(input, 'deerEat');
  if (code === 'KeyE') triggerRoleAction(input, 'deerLook');
}

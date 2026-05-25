export type LoadingGate = {
  terrain: boolean;
  nature: boolean;
  models: boolean;
  hud: boolean;
  audio: boolean;
  firstSnapshot: boolean;
};

export function createLoadingGate(): LoadingGate {
  return { terrain: false, nature: false, models: false, hud: false, audio: false, firstSnapshot: false };
}

export function loadingGateReady(gate: LoadingGate) {
  return Object.values(gate).every(Boolean);
}

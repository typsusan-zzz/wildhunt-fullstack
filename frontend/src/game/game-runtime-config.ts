export type RuntimeGameConfig = {
  durationSeconds: number;
  maxTime: number;
  realDeerCount: number;
  aiDeerCount: number;
  correctBonus: number;
  wrongPenalty: number;
  arenaRadius: number;
  worldRadius: number;
  sceneryRadius: number;
  turnSpeed: number;
  idleTurnSpeedRatio: number;
  backwardSpeedRatio: number;
  maxWalkableSlope: number;
  wolfRadius: number;
  deerRadius: number;
  wolfStepUp: number;
  deerStepUp: number;
  wolfDropDown: number;
  deerDropDown: number;
  wolfBaseSpeed: number;
  wolfSprintSpeed: number;
  deerBaseSpeed: number;
  deerSprintSpeed: number;
  wolfPounceImpulse: number;
  wolfPounceDuration: number;
  biteCooldownSeconds: number;
  biteLockSeconds: number;
  biteImpactSeconds: number;
  scentDurationSeconds: number;
  deerCamouflageDurationSeconds: number;
  deerCamouflageCooldownSeconds: number;
  deerLookDurationSeconds: number;
  deerLookCooldownSeconds: number;
  deerEatDurationSeconds: number;
  foodPatchCount: number;
  foodSpawnRadius: number;
  deerSpawnRadius: number;
  deerWanderArenaRadius: number;
  natureDensityMultiplier: number;
};

export function normalizeRuntimeConfig(raw: Record<string, unknown> | undefined): RuntimeGameConfig {
  const numberValue = (key: string, fallback: number) => {
    const value = Number(raw?.[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    durationSeconds: numberValue('durationSeconds', numberValue('initialTime', 240)),
    maxTime: numberValue('maxTime', 360),
    realDeerCount: numberValue('realDeerCount', 4),
    aiDeerCount: numberValue('aiDeerCount', 16),
    correctBonus: numberValue('correctBonus', 35),
    wrongPenalty: numberValue('wrongPenalty', 20),
    arenaRadius: numberValue('arenaRadius', 142),
    worldRadius: numberValue('worldRadius', 162),
    sceneryRadius: numberValue('sceneryRadius', 154),
    turnSpeed: numberValue('turnSpeed', 2.65),
    idleTurnSpeedRatio: numberValue('idleTurnSpeedRatio', 0.72),
    backwardSpeedRatio: numberValue('backwardSpeedRatio', 0.56),
    maxWalkableSlope: numberValue('maxWalkableSlope', 0.65),
    wolfRadius: numberValue('wolfRadius', 1),
    deerRadius: numberValue('deerRadius', 0.65),
    wolfStepUp: numberValue('wolfStepUp', 0.75),
    deerStepUp: numberValue('deerStepUp', 0.55),
    wolfDropDown: numberValue('wolfDropDown', 1.25),
    deerDropDown: numberValue('deerDropDown', 0.95),
    wolfBaseSpeed: numberValue('wolfBaseSpeed', numberValue('wolfSpeed', 13)),
    wolfSprintSpeed: numberValue('wolfSprintSpeed', 22),
    deerBaseSpeed: numberValue('deerBaseSpeed', numberValue('deerSpeed', 7)),
    deerSprintSpeed: numberValue('deerSprintSpeed', 11.2),
    wolfPounceImpulse: numberValue('wolfPounceImpulse', 17),
    wolfPounceDuration: numberValue('wolfPounceDuration', 0.42),
    biteCooldownSeconds: numberValue('biteCooldownSeconds', 0.72),
    biteLockSeconds: numberValue('biteLockSeconds', 0.48),
    biteImpactSeconds: numberValue('biteImpactSeconds', 0.28),
    scentDurationSeconds: numberValue('scentDurationSeconds', 9.2),
    deerCamouflageDurationSeconds: numberValue('deerCamouflageDurationSeconds', 3),
    deerCamouflageCooldownSeconds: numberValue('deerCamouflageCooldownSeconds', 6),
    deerLookDurationSeconds: numberValue('deerLookDurationSeconds', 3.5),
    deerLookCooldownSeconds: numberValue('deerLookCooldownSeconds', 4.5),
    deerEatDurationSeconds: numberValue('deerEatDurationSeconds', 2),
    foodPatchCount: numberValue('foodPatchCount', 42),
    foodSpawnRadius: numberValue('foodSpawnRadius', 124),
    deerSpawnRadius: numberValue('deerSpawnRadius', 118),
    deerWanderArenaRadius: numberValue('deerWanderArenaRadius', 80),
    natureDensityMultiplier: numberValue('natureDensityMultiplier', 1),
  };
}

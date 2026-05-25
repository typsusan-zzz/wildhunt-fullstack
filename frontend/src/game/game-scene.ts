import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createLoadingGate, loadingGateReady } from './game-loader';
import { createMutedGameAudio, loadGameAudio, type GameAudio } from './game-audio';
import { leaveCurrentMatch } from '../api/match-api';
import { normalizeRuntimeConfig } from './game-runtime-config';
import { SpatialHash } from './game-collision';
import { bindGameInput, clearHeldInput, clearRoleActions, type GameInputState } from './game-input-controller';
import { formatTime, lerpAngle, randomPoint, randomRange, randomRingPoint, seededRandom, wrapAngle, yawFromDirection } from './game-math';
import { connectAuthoritativeGameChannel, type AuthoritativeGameConnection, type ServerGameSnapshot, type ServerPlayerState } from './game-network';
import { NatureBatcher } from './game-nature-batcher';
import { ScentTrailSystem } from './game-scent';
import type {
  AnimalAnimator,
  AnimalClip,
  AnimalKind,
  Collider,
  ColliderCategory,
  Deer,
  DeerState,
  GameStartOptions,
  MatchState,
  MoveOptions,
  NatureAssetSpec,
  NatureCategory,
  PlaceOnTerrainOptions,
  Role,
  SurfaceKind,
} from './game-scene-types';
import { TerrainSampler } from './game-terrain-sampler';

declare global {
  interface Window {
    __wildhuntGameOptions?: GameStartOptions;
  }
}

export function mountGameScene(options: GameStartOptions = {}) {
  window.__wildhuntGameOptions = options;
}

const MATCH_OPTIONS_KEY = 'wildhunt.match.options';
const storedGameOptions = (() => {
  try {
    return JSON.parse(window.sessionStorage.getItem(MATCH_OPTIONS_KEY) || 'null') as GameStartOptions | null;
  } catch {
    return null;
  }
})();
const gameOptions = window.__wildhuntGameOptions ?? storedGameOptions ?? undefined;
const DEV_LOCAL_MODE = import.meta.env.DEV && !gameOptions?.matchId;
const FORMAL_GAME = Boolean(gameOptions?.matchId);
const LOCAL_USER_ID = gameOptions?.userId == null ? '' : String(gameOptions.userId);

const runtimeConfig = normalizeRuntimeConfig(gameOptions?.gameConfig);
const INITIAL_TIME = runtimeConfig.durationSeconds;
const MAX_TIME = runtimeConfig.maxTime;
const REAL_DEER_COUNT = runtimeConfig.realDeerCount;
const AI_DEER_COUNT = runtimeConfig.aiDeerCount;
const CORRECT_BONUS = runtimeConfig.correctBonus;
const WRONG_PENALTY = runtimeConfig.wrongPenalty;
const ARENA_RADIUS = runtimeConfig.arenaRadius;
const WORLD_RADIUS = runtimeConfig.worldRadius;
const SCENERY_RADIUS = runtimeConfig.sceneryRadius;
const TURN_SPEED = runtimeConfig.turnSpeed;
const IDLE_TURN_SPEED_RATIO = runtimeConfig.idleTurnSpeedRatio;
const BACKWARD_SPEED_RATIO = runtimeConfig.backwardSpeedRatio;
const MODEL_FORWARD_YAW_OFFSET = 0;
const MAX_WALKABLE_SLOPE = runtimeConfig.maxWalkableSlope;
const WOLF_RADIUS = runtimeConfig.wolfRadius;
const DEER_RADIUS = runtimeConfig.deerRadius;
const WOLF_STEP_UP = runtimeConfig.wolfStepUp;
const DEER_STEP_UP = runtimeConfig.deerStepUp;
const WOLF_DROP_DOWN = runtimeConfig.wolfDropDown;
const DEER_DROP_DOWN = runtimeConfig.deerDropDown;
const WOLF_BASE_SPEED = runtimeConfig.wolfBaseSpeed;
const WOLF_SPRINT_SPEED = runtimeConfig.wolfSprintSpeed;
const DEER_BASE_SPEED = runtimeConfig.deerBaseSpeed;
const DEER_SPRINT_SPEED = runtimeConfig.deerSprintSpeed;
const WOLF_POUNCE_IMPULSE = runtimeConfig.wolfPounceImpulse;
const WOLF_POUNCE_DURATION = runtimeConfig.wolfPounceDuration;
const BITE_COOLDOWN_SECONDS = runtimeConfig.biteCooldownSeconds;
const BITE_LOCK_SECONDS = runtimeConfig.biteLockSeconds;
const BITE_IMPACT_SECONDS = runtimeConfig.biteImpactSeconds;
const SCENT_DURATION_SECONDS = runtimeConfig.scentDurationSeconds;
const DEER_CAMOUFLAGE_DURATION_SECONDS = runtimeConfig.deerCamouflageDurationSeconds;
const DEER_CAMOUFLAGE_COOLDOWN_SECONDS = runtimeConfig.deerCamouflageCooldownSeconds;
const DEER_LOOK_DURATION_SECONDS = runtimeConfig.deerLookDurationSeconds;
const DEER_LOOK_COOLDOWN_SECONDS = runtimeConfig.deerLookCooldownSeconds;
const DEER_EAT_DURATION_SECONDS = runtimeConfig.deerEatDurationSeconds;
const FOOD_PATCH_COUNT = Math.max(0, Math.round(runtimeConfig.foodPatchCount));
const FOOD_SPAWN_RADIUS = runtimeConfig.foodSpawnRadius;
const DEER_SPAWN_RADIUS = runtimeConfig.deerSpawnRadius;
const DEER_WANDER_ARENA_RADIUS = runtimeConfig.deerWanderArenaRadius;
const NATURE_DENSITY_MULTIPLIER = Math.max(0.1, runtimeConfig.natureDensityMultiplier);
const LOOK = {
  background: 0xa9c7b2,
  fog: 0xa9c7b2,
  fogDensity: 0.0032,
  exposure: 0.92,
  hemiIntensity: 1.15,
  sunIntensity: 2.1,
  bloomStrength: 0.025,
  bloomRadius: 0.12,
  bloomThreshold: 0.82,
};
const QUALITY = {
  pixelRatio: Math.min(window.devicePixelRatio, /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 1.35 : 1.5),
  ssaoKernelRadius: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 4 : window.devicePixelRatio > 1.7 ? 6 : 8,
};
const DEBUG_FOLIAGE_SHADOWS = false;
const TERRAIN_PATCHES = [
  { x: -62, z: -42, radius: 54, color: 0x5f9f4a, strength: 0.56 },
  { x: -50, z: 58, radius: 52, color: 0x6fae55, strength: 0.46 },
  { x: 64, z: 54, radius: 46, color: 0x9b8c5e, strength: 0.52 },
  { x: 8, z: -92, radius: 38, color: 0x4d7a45, strength: 0.48 },
  { x: -92, z: 8, radius: 36, color: 0x3f6f3f, strength: 0.5 },
];
const FOREST_CLUSTER_CENTERS = [
  new THREE.Vector2(-86, -72),
  new THREE.Vector2(-106, 36),
  new THREE.Vector2(-34, 98),
  new THREE.Vector2(42, 94),
  new THREE.Vector2(104, 52),
  new THREE.Vector2(98, -74),
  new THREE.Vector2(-18, -112),
  new THREE.Vector2(20, -38),
];
const FOREST_CLEARINGS = [
  { x: 0, z: 22, radius: 24 },
  { x: 58, z: -48, radius: 45 },
  { x: -18, z: 12, radius: 16 },
  { x: -10, z: 4, radius: 14 },
];
const FOREST_PATHS = [
  { ax: -130, az: 18, bx: -52, bz: 8, width: 7.5 },
  { ax: -52, az: 8, bx: 6, bz: 20, width: 6.2 },
  { ax: 6, az: 20, bx: 82, bz: -38, width: 7.5 },
  { ax: -18, az: 105, bx: 4, bz: 20, width: 5.6 },
];

if (gameOptions?.matchSeed) {
  Math.random = seededRandom(Number(gameOptions.matchSeed));
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root');

app.innerHTML = `
  <div id="game-root">
    <canvas id="game-canvas" aria-label="\u8352\u91ce\u8ffd\u730e"></canvas>
    <div class="vignette"></div>

    <header class="topbar">
      <div>
        <p class="eyebrow">\u8352\u91ce\u8ffd\u730e</p>
        <h1>WildHunt</h1>
      </div>
      <div class="topbar-actions">
        <button id="exit-match-btn" class="game-exit-btn" type="button">\u9000\u51fa\u5f53\u5c40</button>
        <div class="timer" id="timer">04:00</div>
      </div>
    </header>

    <section class="hud hud-left" aria-label="\u5bf9\u5c40\u72b6\u6001">
      <div class="stat-row"><span>\u9635\u8425</span><b id="role-text">\u72fc</b></div>
      <div class="stat-row wolf-only"><span>\u76ee\u6807\u9e7f</span><b id="target-text">0 / 4</b></div>
      <div class="stat-row wolf-only"><span>\u8bef\u4f24</span><b id="mistake-text">0</b></div>
      <div class="meter wolf-only">
        <span>\u4f53\u529b</span>
        <b id="stamina-text">100</b>
        <i><em id="stamina-bar"></em></i>
      </div>
      <div class="meter deer-only">
        <span>\u9965\u997f</span>
        <b id="hunger-text">100</b>
        <i><em id="hunger-bar"></em></i>
      </div>
      <div class="meter deer-only">
        <span>\u53ef\u7591</span>
        <b id="suspicion-text">0</b>
        <i><em id="suspicion-bar"></em></i>
      </div>
    </section>

    <section class="hud hud-right" aria-label="\u8ffd\u730e\u611f\u77e5">
      <p id="hunt-tip">\u6c14\u5473\u8ffd\u8e2a\uff1a1 / 1</p>
      <p class="debug" id="debug-text">debug</p>
    </section>

    <section class="hintbar" id="hintbar" aria-label="\u64cd\u4f5c\u63d0\u793a">
      <span>W/S \u524d\u540e\u79fb\u52a8</span>
      <span>A/D \u6216 \u2190/\u2192 \u6301\u7eed\u8f6c\u5411</span>
      <span>Shift \u51b2\u523a</span>
      <span>Space \u6251\u54ac / \u77ed\u6251</span>
      <span>Q / E \u6c14\u5473\u8ffd\u8e2a\uff1a\u672c\u5c40\u4e00\u6b21</span>
      <span>F \u8c03\u8bd5\u78b0\u649e</span>
    </section>

    <div class="game-loading" id="game-loading">\u8d44\u6e90\u52a0\u8f7d\u4e2d...</div>
    <div class="virtual-joystick" id="virtual-joystick" aria-label="\u865a\u62df\u6447\u6746"><span></span></div>

    <div class="mobile-controls" aria-label="\u79fb\u52a8\u7aef\u64cd\u4f5c">
      <button id="btn-sprint" type="button">\u51b2\u523a</button>
      <button id="btn-track" type="button">\u6c14\u5473</button>
      <button id="btn-look" type="button" class="deer-action">\u73af\u987e</button>
      <button id="btn-attack" type="button">\u6251\u54ac</button>
    </div>

    <dialog id="start-dialog">
      <form method="dialog" class="start-panel">
        <p class="eyebrow">\u9009\u62e9\u9635\u8425</p>
        <h2>\u8352\u91ce\u8ffd\u730e</h2>
        <p>\u72fc\u9700\u8981\u5728\u5012\u8ba1\u65f6\u5185\u627e\u51fa\u5168\u90e8\u771f\u4eba\u9e7f\uff1b\u9e7f\u8981\u6df7\u8fdb AI \u9e7f\u7fa4\uff0c\u62d6\u5230\u65f6\u95f4\u7ed3\u675f\u3002</p>
        <div class="role-grid">
          <button id="start-wolf" type="button">\u4f5c\u4e3a\u72fc\u5f00\u59cb</button>
          <button id="start-deer" type="button">\u4f5c\u4e3a\u9e7f\u5f00\u59cb</button>
        </div>
      </form>
    </dialog>

    <dialog id="result-dialog">
      <form method="dialog">
        <p class="eyebrow">\u672c\u5c40\u7ed3\u679c</p>
        <h2 id="result-title">\u9e7f\u7fa4\u80dc\u5229</h2>
        <p id="result-detail">\u4ecd\u6709\u771f\u4eba\u9e7f\u5b58\u6d3b\u3002</p>
        <div class="result-grid">
          <span>\u627e\u51fa\u771f\u4eba\u9e7f</span><b id="result-found">0 / 4</b>
          <span>\u8bef\u4f24 AI \u9e7f</span><b id="result-mistakes">0</b>
          <span>\u5269\u4f59\u65f6\u95f4</span><b id="result-time">00:00</b>
        </div>
        <button id="restart-btn" type="submit">\u518d\u6765\u4e00\u5c40</button>
      </form>
    </dialog>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const timerEl = document.querySelector<HTMLElement>('#timer')!;
const roleText = document.querySelector<HTMLElement>('#role-text')!;
const targetText = document.querySelector<HTMLElement>('#target-text')!;
const mistakeText = document.querySelector<HTMLElement>('#mistake-text')!;
const staminaText = document.querySelector<HTMLElement>('#stamina-text')!;
const staminaBar = document.querySelector<HTMLElement>('#stamina-bar')!;
const hungerText = document.querySelector<HTMLElement>('#hunger-text')!;
const hungerBar = document.querySelector<HTMLElement>('#hunger-bar')!;
const suspicionText = document.querySelector<HTMLElement>('#suspicion-text')!;
const suspicionBar = document.querySelector<HTMLElement>('#suspicion-bar')!;
const huntTip = document.querySelector<HTMLElement>('#hunt-tip')!;
const debugText = document.querySelector<HTMLElement>('#debug-text')!;
const hintbar = document.querySelector<HTMLElement>('#hintbar')!;
const startDialog = document.querySelector<HTMLDialogElement>('#start-dialog')!;
const resultDialog = document.querySelector<HTMLDialogElement>('#result-dialog')!;
const resultTitle = document.querySelector<HTMLElement>('#result-title')!;
const resultDetail = document.querySelector<HTMLElement>('#result-detail')!;
const resultFound = document.querySelector<HTMLElement>('#result-found')!;
const resultMistakes = document.querySelector<HTMLElement>('#result-mistakes')!;
const resultTime = document.querySelector<HTMLElement>('#result-time')!;
const startWolfBtn = document.querySelector<HTMLButtonElement>('#start-wolf')!;
const startDeerBtn = document.querySelector<HTMLButtonElement>('#start-deer')!;
const restartBtn = document.querySelector<HTMLButtonElement>('#restart-btn')!;
const exitMatchBtn = document.querySelector<HTMLButtonElement>('#exit-match-btn')!;
const sprintBtn = document.querySelector<HTMLButtonElement>('#btn-sprint')!;
const trackBtn = document.querySelector<HTMLButtonElement>('#btn-track')!;
const lookBtn = document.querySelector<HTMLButtonElement>('#btn-look')!;
const attackBtn = document.querySelector<HTMLButtonElement>('#btn-attack')!;
const loadingEl = document.querySelector<HTMLElement>('#game-loading')!;
const joystickEl = document.querySelector<HTMLElement>('#virtual-joystick')!;

if (gameOptions?.matchId) restartBtn.textContent = '\u8fd4\u56de\u5927\u5385';

const scene = new THREE.Scene();
scene.background = new THREE.Color(LOOK.background);
scene.fog = new THREE.FogExp2(LOOK.fog, LOOK.fogDensity);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(QUALITY.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = LOOK.exposure;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = QUALITY.ssaoKernelRadius;
ssaoPass.minDistance = 0.006;
ssaoPass.maxDistance = 0.14;
composer.addPass(ssaoPass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), LOOK.bloomStrength, LOOK.bloomRadius, LOOK.bloomThreshold));
scene.add(camera);

const loader = new GLTFLoader();
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const animalAnimators = new WeakMap<THREE.Object3D, AnimalAnimator>();
const natureTemplates = new Map<NatureCategory, THREE.Object3D[]>();
const windUniforms = {
  time: { value: 0 },
  windDirection: { value: new THREE.Vector2(0.82, 0.38).normalize() },
  windStrength: { value: 0.11 },
  gustStrength: { value: 0.055 },
};
const natureBatcher = new NatureBatcher({
  scene,
  templates: natureTemplates,
  placeOnTerrain,
  terrainScaleVariation,
  randomRange,
});
let nextColliderId = 1;
const colliders: Collider[] = [];
const spatialHash = new SpatialHash(10);
const debugColliderGroup = new THREE.Group();
const terrainSampler = new TerrainSampler((x, z) => terrainSurfaceHeightAt(x, z), ARENA_RADIUS, MAX_WALKABLE_SLOPE);
const scentTrailSystem = new ScentTrailSystem(scene, terrainSampler, windUniforms, randomRange);

const natureAssetSpecs: Record<NatureCategory, NatureAssetSpec[]> = {
  tree: [
    { url: '/models/nature/tree_broad_01.glb', height: 8.8 },
    { url: '/models/nature/tree_broad_02.glb', height: 8.4 },
    { url: '/models/nature/tree_broad_03.glb', height: 8.2 },
    { url: '/models/nature/pine_01.glb', height: 9.4 },
    { url: '/models/nature/pine_02.glb', height: 9 },
    { url: '/models/nature/pine_03.glb', height: 8.7 },
    { url: '/models/nature/twisted_tree_01.glb', height: 6.8 },
  ],
  bush: [
    { url: '/models/nature/bush_01.glb', height: 1.45 },
    { url: '/models/nature/bush_flowers_01.glb', height: 1.2 },
  ],
  grass: [
    { url: '/models/nature/grass_01.glb', height: 0.65 },
    { url: '/models/nature/grass_wispy_01.glb', height: 0.85 },
    { url: '/models/nature/tall_grass_01.glb', height: 1.05 },
  ],
  rock: [
    { url: '/models/nature/rock_medium_01.glb', height: 1.25 },
    { url: '/models/nature/rock_medium_02.glb', height: 1.15 },
    { url: '/models/nature/rock_medium_03.glb', height: 1.3 },
    { url: '/models/nature/pebble_round_01.glb', height: 0.45 },
    { url: '/models/nature/pebble_square_01.glb', height: 0.45 },
  ],
  mushroom: [
    { url: '/models/nature/mushroom_01.glb', height: 0.7 },
    { url: '/models/nature/mushroom_laetiporus_01.glb', height: 0.65 },
  ],
  plant: [
    { url: '/models/nature/plant_01.glb', height: 0.9 },
  ],
  cliff: [
    { url: '/models/kenney-nature/cliffs/cliff_large_rock.glb', height: 9.4 },
    { url: '/models/kenney-nature/cliffs/cliff_top_rock.glb', height: 8.2 },
    { url: '/models/kenney-nature/cliffs/cliff_half_rock.glb', height: 7.4 },
    { url: '/models/kenney-nature/cliffs/cliff_blockSlope_rock.glb', height: 9.8 },
    { url: '/models/kenney-nature/cliffs/cliff_cornerLarge_rock.glb', height: 8.8 },
    { url: '/models/kenney-nature/cliffs/cliff_diagonal_rock.glb', height: 9.2 },
    { url: '/models/kenney-nature/cliffs/cliff_steps_rock.glb', height: 7.8 },
    { url: '/models/kenney-nature/cliffs/rock_tallA.glb', height: 7.6 },
    { url: '/models/kenney-nature/cliffs/rock_tallB.glb', height: 8.4 },
    { url: '/models/kenney-nature/cliffs/rock_tallH.glb', height: 7.2 },
    { url: '/models/kenney-nature/cliffs/stone_tallA.glb', height: 7.6 },
    { url: '/models/kenney-nature/cliffs/stone_tallB.glb', height: 8.4 },
  ],
};

const input: GameInputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
  wolfPounce: false,
  wolfScent: false,
  deerEat: false,
  deerLook: false,
  deerCamouflage: false,
  debugRange: false,
  yaw: 0,
  targetYaw: 0,
  moveYaw: Math.PI,
};

const match: MatchState = {
  phase: 'menu',
  role: 'wolf',
  timeLeft: INITIAL_TIME,
  maxTime: MAX_TIME,
  foundReal: 0,
  realTotal: REAL_DEER_COUNT,
  mistakes: 0,
  stamina: 100,
  scentUsed: false,
  resultTitle: '',
  resultDetail: '',
};

const wolf = {
  group: createWolf(),
  velocity: new THREE.Vector3(),
  attackCooldown: 0,
  pounceTimer: 0,
  biteLock: 0,
  biteTarget: null as Deer | null,
  biteImpactTimer: 0,
};

let playerDeer: Deer | null = null;
let deerCamouflageTimer = 0;
let deerCamouflageCooldown = 0;
let deerLookTimer = 0;
let deerLookCooldown = 0;
let deerEatTimer = 0;
let deerEatQuality = 0;
let deerSprintTimer = 0;
let scentActiveTimer = 0;
let scentTarget: Deer | null = null;
let huntTipHold = 0;
let debugColliderKey = '';
let countdownUntil = 0;
const deer: Deer[] = [];
const foodPatches: THREE.Mesh[] = [];
let gameAudio: GameAudio = createMutedGameAudio();
let authoritativeConnection: AuthoritativeGameConnection | null = null;
const serverDeerByUserId = new Map<string, Deer>();
let latestServerSnapshot: { snapshot: ServerGameSnapshot; players: ServerPlayerState[] } | null = null;
let allowGameNavigation = false;

window.addEventListener('beforeunload', handleGameBeforeUnload);

setupLights();
scene.add(debugColliderGroup);
const loadingGate = createLoadingGate();
loadingEl.textContent = '閸旂姾娴囬崷鏉胯埌娑撳氦鍤滈悞鍓佸⒖...';
loadingEl.textContent = '正在生成荒野地形...';
await setupWorld();
loadingGate.terrain = true;
loadingGate.nature = true;
loadingEl.textContent = '閸旂姾娴囩憴鎺曞濡€崇€?..';
loadingEl.textContent = '正在布置森林和掩体...';
scene.add(wolf.group);
await loadGameModels();
loadingGate.models = true;
loadingEl.textContent = '閸旂姾娴囬棅鎶筋暥...';
loadingEl.textContent = '正在加载角色与音效...';
const assignedRole = gameOptions?.assignedRole === 'DEER' ? 'deer' : 'wolf';
gameAudio = await loadGameAudio(assignedRole);
loadingGate.audio = true;
bindGameInput({
  input,
  match,
  gameAudioResume: () => gameAudio.resume(),
  sprintBtn,
  trackBtn,
  lookBtn,
  attackBtn,
  startWolfBtn,
  startDeerBtn,
  restartBtn,
  startDialog,
  resultDialog,
  joystickEl,
  devLocalMode: DEV_LOCAL_MODE,
  assignedRole,
  resetRound,
  onFormalRestart: returnToLobby,
  onResize,
});
exitMatchBtn.addEventListener('click', () => void exitCurrentGame());
loadingGate.hud = true;
loadingEl.textContent = gameOptions?.matchId ? '閸氬本顒炵€电懓鐪＃鏍ф姎...' : '閸戝棗顦張顒€婀寸€电懓鐪?..';
loadingEl.textContent = FORMAL_GAME ? '正在连接服务器对局...' : '正在准备本地练习...';
try {
  await connectAuthoritativeChannel();
} catch (error) {
  loadingEl.textContent = '鐎电懓鐪崥灞绢劄婢惰精瑙﹂敍宀冾嚞鏉╂柨娲栨径褍宸洪柌宥堢槸';
  loadingEl.textContent = '连接服务器对局失败，请返回大厅后重试。';
  throw error;
}
loadingGate.firstSnapshot = true;
if (!loadingGateReady(loadingGate)) {
  throw new Error('Game loading gate did not complete.');
}
resetRound(assignedRole);
gameAudio.playStinger('match_start_stinger');
loadingEl.hidden = true;
if (DEV_LOCAL_MODE) {
  startDialog.showModal();
} else {
  startDialog.remove();
}
animate();

function setupLights() {
  const hemi = new THREE.HemisphereLight(0xdcefe5, 0x263f27, LOOK.hemiIntensity);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffd596, LOOK.sunIntensity);
  sun.position.set(-44, 74, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -175;
  sun.shadow.camera.right = 175;
  sun.shadow.camera.top = 175;
  sun.shadow.camera.bottom = -175;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 210;
  sun.shadow.bias = -0.00018;
  sun.shadow.normalBias = 0.018;
  scene.add(sun);

  const warmBounce = new THREE.DirectionalLight(0xffefbf, 0.58);
  warmBounce.position.set(80, 24, -70);
  scene.add(warmBounce);
}

async function setupWorld() {
  const groundGeometry = createTerrainGeometry(WORLD_RADIUS, 128);
  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({ roughness: 0.98, metalness: 0, flatShading: true, vertexColors: true }),
  );
  ground.receiveShadow = true;
  scene.add(ground);

  await loadNatureModels();
  for (let i = 0; i < FOOD_PATCH_COUNT; i += 1) foodPatches.push(createFoodPatch(randomPoint(FOOD_SPAWN_RADIUS)));

  for (let i = 0; i < REAL_DEER_COUNT + AI_DEER_COUNT; i += 1) {
    deer.push(createDeer(i, randomPoint(DEER_SPAWN_RADIUS)));
  }
}

function createTerrainGeometry(radius: number, segments: number) {
  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  if (position instanceof THREE.BufferAttribute) {
    const color = new THREE.Color();
    const colors: number[] = [];
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = terrainSurfaceHeightAt(x, z, radius);
      const path = pathInfluenceAt(x, z);
      const clearing = clearingInfluenceAt(x, z);
      const shade = THREE.MathUtils.clamp((y + 4) / 19, 0, 1);
      const ground = color
        .set(0x5f8f48)
        .lerp(new THREE.Color(0x2f6137), shade * 0.58)
        .lerp(new THREE.Color(0x8f8059), path * 0.72)
        .lerp(new THREE.Color(0x6f9958), clearing * 0.22);
      for (const patch of TERRAIN_PATCHES) {
        const influence = patchInfluenceAt(x, z, patch.x, patch.z, patch.radius) * patch.strength;
        if (influence > 0) ground.lerp(new THREE.Color(patch.color), influence);
      }
      position.setY(i, y);
      colors.push(ground.r, ground.g, ground.b);
    }
    position.needsUpdate = true;
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function terrainHeightAt(x: number, z: number) {
  const slope = -z * 0.045 + x * 0.014;
  const rolling =
    Math.sin(x * 0.045 + z * 0.018) * 2.2 +
    Math.cos(z * 0.04 - x * 0.015) * 1.7 +
    Math.sin((x + z) * 0.025) * 1.2;
  const ridge = Math.max(0, 1 - Math.hypot(x + 52, z - 76) / 82) * 7.5;
  const lake = Math.max(0, 1 - Math.hypot(x - 58, z + 48) / 43);
  const hollow = lake * lake * -4.8;
  return slope + rolling + ridge + hollow;
}

function terrainSurfaceHeightAt(x: number, z: number, radius = WORLD_RADIUS) {
  const edgeFade = THREE.MathUtils.smoothstep(Math.hypot(x, z), radius * 0.82, radius);
  return terrainHeightAt(x, z) - edgeFade * 7;
}

function groundHeightAt(x: number, z: number) {
  return terrainSampler.sampleHeight(x, z);
}

function alignToTerrain(object: THREE.Object3D, x = object.position.x, z = object.position.z, offset = 0) {
  object.position.x = x;
  object.position.z = z;
  placeOnTerrain(object, { offset, mode: 'center' });
}

function placeOnTerrain(object: THREE.Object3D, options: PlaceOnTerrainOptions = {}) {
  const mode = options.mode ?? 'center';
  const samples = Math.max(1, options.samples ?? (mode === 'center' ? 1 : 5));
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const radiusX = Math.max(0.25, size.x * 0.42);
  const radiusZ = Math.max(0.25, size.z * 0.42);
  const points: THREE.Vector2[] = [new THREE.Vector2(object.position.x, object.position.z)];

  if (samples >= 4) {
    points.push(
      new THREE.Vector2(object.position.x + radiusX, object.position.z + radiusZ),
      new THREE.Vector2(object.position.x - radiusX, object.position.z + radiusZ),
      new THREE.Vector2(object.position.x + radiusX, object.position.z - radiusZ),
      new THREE.Vector2(object.position.x - radiusX, object.position.z - radiusZ),
    );
  }
  if (samples >= 9) {
    points.push(
      new THREE.Vector2(object.position.x + radiusX, object.position.z),
      new THREE.Vector2(object.position.x - radiusX, object.position.z),
      new THREE.Vector2(object.position.x, object.position.z + radiusZ),
      new THREE.Vector2(object.position.x, object.position.z - radiusZ),
    );
  }

  const heights = points.map((point) => groundHeightAt(point.x, point.y));
  const base = mode === 'lowest'
    ? Math.min(...heights)
    : mode === 'average'
      ? heights.reduce((sum, height) => sum + height, 0) / heights.length
      : heights[0];
  object.position.y = base + (options.offset ?? 0) - (options.bury ?? 0);
  if (!options.keepUpright && mode !== 'center') {
    const normal = terrainSampler.sampleNormal(object.position.x, object.position.z);
    const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const yaw = object.rotation.y;
    object.quaternion.copy(tilt);
    object.rotateY(yaw);
  }
}

function registerCollider(collider: Omit<Collider, 'id'>) {
  const next = { ...collider, id: nextColliderId };
  nextColliderId += 1;
  colliders.push(next);
  spatialHash.insert(next);
  return next;
}

function registerNatureCollider(category: NatureCategory, object: THREE.Object3D) {
  if (category === 'grass' || category === 'mushroom' || category === 'plant') return;
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxXZ = Math.max(size.x, size.z);
  let radius = 1;
  let blocks = true;
  let colliderCategory: ColliderCategory = category === 'cliff' ? 'cliff' : category === 'rock' ? 'rock' : category === 'bush' ? 'bush' : 'tree';
  if (category === 'tree') radius = THREE.MathUtils.clamp(maxXZ * 0.16, 0.7, 1.8);
  if (category === 'rock') radius = THREE.MathUtils.clamp(maxXZ * 0.48, 0.65, 3.2);
  if (category === 'cliff') radius = THREE.MathUtils.clamp(maxXZ * 0.55, 2.2, 8.5);
  if (category === 'bush') {
    radius = THREE.MathUtils.clamp(maxXZ * 0.32, 0.55, 1.4);
    blocks = false;
  }
  registerCollider({
    category: colliderCategory,
    center: new THREE.Vector2(object.position.x, object.position.z),
    radius,
    height: Math.max(1, size.y),
    object,
    blocks,
  });
}

function moveActorWithCollision(actor: THREE.Object3D, velocity: THREE.Vector3, dt: number, options: MoveOptions) {
  if (dt <= 0 || options.height <= 0) return;
  const current = actor.position.clone();
  const next = current.clone();
  const tryAxis = (axis: 'x' | 'z', delta: number) => {
    if (Math.abs(delta) < 0.0001) return;
    const candidate = next.clone();
    candidate[axis] += delta;
    resolveArena(candidate, options.arenaRadius);
    if (!canStandAt(candidate.x, candidate.z, current.y, options)) {
      velocity[axis] *= -0.08;
      return;
    }
    const beforePush = candidate.clone();
    const blocked = resolveStaticCollisions(candidate, options);
    if (blocked && !canStandAt(candidate.x, candidate.z, beforePush.y, options)) {
      velocity[axis] *= -0.08;
      return;
    }
    next.x = candidate.x;
    next.z = candidate.z;
    if (blocked) velocity[axis] *= 0.18;
  };

  tryAxis('x', velocity.x * dt);
  tryAxis('z', velocity.z * dt);
  next.y = terrainSampler.sampleHeight(next.x, next.z);
  actor.position.copy(next);
}

function canStandAt(x: number, z: number, currentY: number, options: MoveOptions) {
  if (Math.hypot(x, z) > options.arenaRadius) return false;
  const nextY = terrainSampler.sampleHeight(x, z);
  if (nextY - currentY > options.maxStepUp) return false;
  if (currentY - nextY > options.maxDropDown) return false;
  return terrainSampler.isWalkable(x, z, options.maxSlope);
}

function resolveStaticCollisions(position: THREE.Vector3, options: MoveOptions) {
  const center = new THREE.Vector2(position.x, position.z);
  const nearby = spatialHash.query(center, options.radius + 9);
  let blocked = false;
  for (const collider of nearby) {
    if (!collider.blocks || collider.object === options.ignore) continue;
    const dx = center.x - collider.center.x;
    const dz = center.y - collider.center.y;
    const distance = Math.hypot(dx, dz);
    const minDistance = options.radius + collider.radius;
    if (distance <= 0.0001 || distance >= minDistance) continue;
    const push = (minDistance - distance) + 0.025;
    position.x += (dx / distance) * push;
    position.z += (dz / distance) * push;
    resolveArena(position, options.arenaRadius);
    center.set(position.x, position.z);
    blocked = true;
  }
  return blocked;
}

function resolveArena(position: THREE.Vector3, radius: number) {
  const distance = Math.hypot(position.x, position.z);
  if (distance <= radius) return;
  const scale = radius / distance;
  position.x *= scale;
  position.z *= scale;
}

async function loadNatureModels() {
  const entries = Object.entries(natureAssetSpecs) as [NatureCategory, NatureAssetSpec[]][];
  await Promise.all(entries.flatMap(([category, specs]) => specs.map(async (spec) => {
    try {
      const template = await loadNatureTemplate(spec);
      const templates = natureTemplates.get(category) ?? [];
      templates.push(template);
      natureTemplates.set(category, templates);
    } catch (error) {
      console.warn(`Nature model missing or failed: ${spec.url}`, error);
    }
  })));
  populateNatureModels();
}

function loadNatureTemplate(spec: NatureAssetSpec) {
  return new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(
      spec.url,
      (gltf) => {
        const model = gltf.scene;
        prepareModel(model);
        normalizeModel(model, spec.height, 0);
        resolve(model);
      },
      undefined,
      reject,
    );
  });
}

function populateNatureModels() {
  const layers = createLayeredForestPoints();
  for (const point of layers.canopy) {
    const pineBias = forestDensityAt(point.x, point.z);
    placeNature('tree', point, randomRange(1.02, 1.7) * (1 + pineBias * 0.34));
  }
  for (const point of layers.secondary) {
    placeNature('tree', point, randomRange(0.66, 1.15) * (0.92 + forestDensityAt(point.x, point.z) * 0.18));
  }
  for (const point of layers.bushes) placeNature('bush', point, randomRange(0.72, 1.8));
  for (const point of layers.grasses) natureBatcher.add('grass', point, randomRange(0.58, 1.75));
  for (const point of layers.plants) natureBatcher.add('plant', point, randomRange(0.62, 1.65));
  for (let i = 0; i < scaledNatureCount(72); i += 1) placeNature('rock', randomBreakupPoint(146), randomRange(0.58, 2.7));
  for (let i = 0; i < scaledNatureCount(86); i += 1) natureBatcher.add('mushroom', randomForestPoint(136, 10), randomRange(0.48, 1.45));
  for (let i = 0; i < scaledNatureCount(58); i += 1) placeNature('cliff', randomRingPoint(112, SCENERY_RADIUS), randomRange(2.2, 5.6));
  natureBatcher.flush();
}

function scaledNatureCount(count: number) {
  return Math.max(0, Math.round(count * NATURE_DENSITY_MULTIPLIER));
}

function placeNature(category: NatureCategory, point: THREE.Vector3, scale: number) {
  const templates = natureTemplates.get(category);
  if (!templates?.length) return;
  const model = templates[Math.floor(Math.random() * templates.length)].clone(true);
  model.position.copy(point);
  model.rotation.y = category === 'cliff'
    ? Math.atan2(point.x, point.z) + randomRange(-0.52, 0.52)
    : randomRange(0, Math.PI * 2);
  model.rotation.x = category === 'cliff' ? 0 : randomRange(-0.035, 0.035);
  model.rotation.z = category === 'cliff' ? 0 : randomRange(-0.035, 0.035);
  model.scale.multiplyScalar(scale * terrainScaleVariation(point.x, point.z));
  placeOnTerrain(model, {
    mode: category === 'tree' || category === 'grass' || category === 'plant' || category === 'mushroom' ? 'center' : category === 'rock' ? 'average' : 'lowest',
    samples: category === 'grass' || category === 'plant' ? 5 : category === 'cliff' ? 9 : category === 'rock' ? 5 : 1,
    offset: category === 'cliff' ? -0.1 : 0.03,
    bury: category === 'cliff' ? randomRange(0.15, 0.45) : category === 'rock' ? 0.08 : 0,
    keepUpright: category === 'tree' || category === 'grass' || category === 'plant' || category === 'mushroom',
  });
  tuneNatureInstance(category, model);
  scene.add(model);
  registerNatureCollider(category, model);
}

function terrainScaleVariation(x: number, z: number) {
  return 0.88 + Math.abs(Math.sin(x * 12.9898 + z * 78.233)) * 0.34;
}

function tuneNatureInstance(category: NatureCategory, model: THREE.Object3D) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = Array.isArray(child.material) ? child.material[0] : child.material;
    const surface = classifyMeshSurface(category, child.name, material?.name ?? '');
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = 1;
      material.metalness = 0;
      material.flatShading = surface !== 'foliage' && surface !== 'grass';
      if (surface === 'foliage' || surface === 'grass') material.emissive.set(0x000000);
      prepareFoliageMaterial(material, category, child.name);
      if (shouldWindAffect(category, child.name, material.name)) {
        applyWindToMaterial(material, child.name);
      }
    }
    child.castShadow = false;
    child.receiveShadow = false;
    if (surface === 'trunk' || surface === 'rock') {
      child.castShadow = true;
      child.receiveShadow = true;
    }
    if ((surface === 'foliage' || surface === 'grass') && DEBUG_FOLIAGE_SHADOWS) {
      child.castShadow = true;
    }
    if (category === 'grass' || category === 'plant' || category === 'mushroom' || surface === 'grass') {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

function classifyMeshSurface(category: NatureCategory | undefined, meshName = '', materialName = ''): SurfaceKind {
  const names = `${category ?? ''} ${meshName} ${materialName}`;
  if (/trunk|bark|log|stem/i.test(names)) return 'trunk';
  if (/rock|stone|cliff|boulder/i.test(names) || category === 'rock' || category === 'cliff') return 'rock';
  if (/grass|reed|fern|flower|plant/i.test(names) || category === 'grass' || category === 'plant') return 'grass';
  if (/leaf|leaves|foliage|crown|branch|bush/i.test(names) || category === 'bush') return 'foliage';
  if (category === 'tree') return 'trunk';
  return 'unknown';
}

function isFoliageName(name = '') {
  return /leaf|leaves|foliage|branch|crown|grass|bush|plant/i.test(name);
}

function isHardSurfaceName(name = '') {
  return /trunk|bark|rock|stone|cliff/i.test(name);
}

function prepareFoliageMaterial(material: THREE.MeshStandardMaterial, category?: NatureCategory, meshName = '') {
  const names = `${meshName} ${material.name}`;
  const foliageCategory = category === 'tree' || category === 'bush' || category === 'grass' || category === 'plant' || isFoliageName(names);
  const needsCutout = foliageCategory && !isHardSurfaceName(names) && (Boolean(material.alphaMap) || Boolean(material.map) || isFoliageName(names));
  if (!needsCutout) return;
  if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
  if (material.alphaMap) material.alphaMap.colorSpace = THREE.SRGBColorSpace;
  material.alphaTest = category === 'grass' || category === 'plant' ? 0.62 : 0.68;
  material.transparent = false;
  material.depthWrite = true;
  material.depthTest = true;
  material.side = THREE.DoubleSide;
  material.premultipliedAlpha = false;
  if ('alphaHash' in material) material.alphaHash = true;
  material.needsUpdate = true;
}

function shouldWindAffect(category: NatureCategory, meshName = '', materialName = '') {
  const names = `${meshName} ${materialName}`;
  if (isHardSurfaceName(names)) return false;
  return category === 'grass' || category === 'plant' || category === 'bush' || isFoliageName(names);
}

function applyWindToMaterial(material: THREE.MeshStandardMaterial, meshName = '') {
  if (material.userData.windEnabled) return;
  material.userData.windEnabled = true;
  const lowAnchor = /grass|plant/i.test(meshName) ? 0.08 : 0.38;
  const highAnchor = /grass|plant/i.test(meshName) ? 1.75 : 5.2;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.windTime = windUniforms.time;
    shader.uniforms.windDirection = windUniforms.windDirection;
    shader.uniforms.windStrength = windUniforms.windStrength;
    shader.uniforms.gustStrength = windUniforms.gustStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float windTime;
        uniform vec2 windDirection;
        uniform float windStrength;
        uniform float gustStrength;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 worldPositionWind = modelMatrix * vec4(position, 1.0);
        float heightMask = smoothstep(${lowAnchor.toFixed(2)}, ${highAnchor.toFixed(2)}, position.y);
        float wave = sin(dot(worldPositionWind.xz, windDirection) * 0.18 + windTime * 1.55);
        float gust = sin((worldPositionWind.x + worldPositionWind.z) * 0.055 + windTime * 0.72);
        transformed.xz += windDirection * (wave * windStrength + gust * gustStrength) * heightMask;`,
      );
  };
  material.needsUpdate = true;
}

function createFoodPatch(point: THREE.Vector3) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.65, 0.16, 8),
    new THREE.MeshStandardMaterial({ color: 0xa8df62, roughness: 0.85, flatShading: true }),
  );
  mesh.position.copy(point);
  placeOnTerrain(mesh, { mode: 'center', offset: 0.09 });
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createWolf() {
  const group = new THREE.Group();
  group.name = 'wolf';
  const shell = new THREE.Group();
  shell.name = 'procedural-shell';
  const mat = new THREE.MeshStandardMaterial({ color: 0x767d8d, roughness: 0.72, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.1, 4), mat);
  body.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.7, 5), mat);
  head.position.set(0, 1.65, -2.7);
  head.rotation.x = -Math.PI / 2;
  for (const mesh of [body, head]) {
    mesh.castShadow = true;
    shell.add(mesh);
  }
  group.add(shell);
  return group;
}

function createDeer(id: number, point: THREE.Vector3): Deer {
  const group = new THREE.Group();
  const shell = new THREE.Group();
  shell.name = 'procedural-shell';
  const mat = new THREE.MeshStandardMaterial({ color: 0xd59a58, roughness: 0.78, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1, 2.35), mat);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.7, 0.82), mat);
  head.position.set(0, 1.35, -1.45);
  for (const x of [-0.48, 0.48]) {
    const antler = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.9, 5),
      new THREE.MeshStandardMaterial({ color: 0xf7e4b5, roughness: 0.75, flatShading: true }),
    );
    antler.position.set(x, 1.95, -1.52);
    antler.rotation.z = x > 0 ? -0.35 : 0.35;
    shell.add(antler);
  }
  for (const mesh of [body, head]) {
    mesh.castShadow = true;
    shell.add(mesh);
  }
  group.add(shell);
  group.position.copy(point);
  alignToTerrain(group, point.x, point.z);
  scene.add(group);
  return {
    id,
    group,
    velocity: new THREE.Vector3(),
    state: 'wander',
    stateTime: randomRange(1.5, 4),
    wanderAngle: randomRange(0, Math.PI * 2),
    speed: randomRange(3.2, 5.1),
    hunger: 100,
    suspicion: 0,
    isReal: false,
    isPlayer: false,
    markedUntil: 0,
  };
}

async function loadGameModels() {
  await Promise.all([
    loadModel('/models/quaternius/Wolf.gltf', wolf.group, 2.6, 0, 'wolf'),
    new Promise<void>((resolve, reject) => loader.load('/models/quaternius/Deer.gltf', (gltf) => {
    const template = gltf.scene;
    prepareModel(template);
    normalizeModel(template, 2.05, 0);
    for (const item of deer) {
      const shell = item.group.getObjectByName('procedural-shell');
      if (shell) shell.visible = false;
      const model = cloneSkeleton(template);
      setupAnimalAnimator(item.group, model, gltf.animations, 'deer');
      item.group.add(model);
    }
    resolve();
  }, undefined, reject)),
  ]);
}

function loadModel(url: string, target: THREE.Group, height: number, yRotation: number, kind: AnimalKind) {
  return new Promise<void>((resolve, reject) => loader.load(url, (gltf) => {
    const model = gltf.scene;
    prepareModel(model);
    normalizeModel(model, height, yRotation);
    setupAnimalAnimator(target, model, gltf.animations, kind);
    const shell = target.getObjectByName('procedural-shell');
    if (shell) shell.visible = false;
    target.add(model);
    resolve();
  }, undefined, reject));
}

function prepareModel(model: THREE.Object3D) {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        const surface = classifyMeshSurface(undefined, child.name, material.name);
        material.roughness = 0.82;
        material.metalness = 0;
        material.flatShading = surface !== 'foliage' && surface !== 'grass';
        prepareFoliageMaterial(material, undefined, child.name);
        child.castShadow = surface !== 'foliage' && surface !== 'grass';
        child.receiveShadow = surface !== 'foliage' && surface !== 'grass';
      } else {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
  });
}

function normalizeModel(model: THREE.Object3D, fitHeight: number, yRotation: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar(fitHeight / Math.max(size.y, 0.001));
  const nextBox = new THREE.Box3().setFromObject(model);
  const center = nextBox.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -nextBox.min.y, -center.z);
  model.rotation.y = yRotation;
}

function setupAnimalAnimator(owner: THREE.Object3D, model: THREE.Object3D, clips: THREE.AnimationClip[], kind: AnimalKind) {
  const mixer = new THREE.AnimationMixer(model);
  const actions: Partial<Record<AnimalClip, THREE.AnimationAction>> = {
    idle: findAction(mixer, clips, 'Idle'),
    walk: findAction(mixer, clips, 'Walk'),
    gallop: findAction(mixer, clips, 'Gallop'),
    eat: findAction(mixer, clips, 'Eating'),
    attack: findAction(mixer, clips, kind === 'wolf' ? 'Attack' : 'Attack_Headbutt'),
    death: findAction(mixer, clips, 'Death'),
  };

  for (const action of Object.values(actions)) {
    action?.setEffectiveWeight(1);
    action?.setEffectiveTimeScale(1);
  }

  animalAnimators.set(owner, { mixer, actions, speed: 0 });
  playAnimalClip(owner, 'idle', 0);
}

function findAction(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[], name: string) {
  const clip = clips.find((item) => item.name.toLowerCase() === name.toLowerCase());
  return clip ? mixer.clipAction(clip) : undefined;
}

function updateAnimalAnimations(dt: number) {
  updateAnimalAnimation(wolf.group, wolf.velocity.length(), 'wander', dt);
  for (const item of deer) {
    updateAnimalAnimation(item.group, item.state === 'dead' ? 0 : item.velocity.length(), item.state, dt);
  }
}

function updateAnimalAnimation(actor: THREE.Object3D, targetSpeed: number, state: DeerState, dt: number) {
  const animator = animalAnimators.get(actor);
  if (!animator) return;

  animator.speed = THREE.MathUtils.lerp(animator.speed, targetSpeed, 1 - Math.pow(0.003, dt));
  const clip = pickAnimalClip(animator, animator.speed, state);
  playAnimalClip(actor, clip, 0.22);
  const activeAction = animator.active ? animator.actions[animator.active] : undefined;
  if (activeAction) {
    const scale = clip === 'gallop' ? THREE.MathUtils.clamp(animator.speed / 11, 0.9, 1.55) : THREE.MathUtils.clamp(animator.speed / 5.6, 0.75, 1.25);
    activeAction.setEffectiveTimeScale(scale);
  }
  animator.mixer.update(dt);
}

function pickAnimalClip(animator: AnimalAnimator, speed: number, state: DeerState): AnimalClip {
  if (state === 'dead' && animator.actions.death) return 'death';
  if (state === 'graze' && animator.actions.eat && speed < 0.4) return 'eat';
  if (speed > 6.2 && animator.actions.gallop) return 'gallop';
  if (speed > 0.18 && animator.actions.walk) return 'walk';
  return 'idle';
}

function playAnimalClip(actor: THREE.Object3D, clip: AnimalClip, fade: number) {
  const animator = animalAnimators.get(actor);
  if (!animator || animator.active === clip) return;

  const next = animator.actions[clip] ?? animator.actions.idle;
  if (!next) return;

  const previous = animator.active ? animator.actions[animator.active] : undefined;
  next.reset().enabled = true;
  next.play();
  if (previous && fade > 0) {
    previous.crossFadeTo(next, fade, false);
  } else {
    previous?.stop();
  }
  animator.active = clip;
}

function connectAuthoritativeChannel() {
  authoritativeConnection?.close();
  authoritativeConnection = connectAuthoritativeGameChannel({
    matchId: gameOptions?.matchId,
    input,
    isPlaying: () => match.phase === 'playing',
    isCountdownLocked,
    setServerTick: (tick) => {
      timerEl.dataset.serverTick = String(tick);
    },
    setServerSnapshot: (snapshot, players) => {
      applyServerSnapshot(snapshot, players);
    },
    onMatchEnd: (result) => {
      finishRound(result.title ?? '对局已结算', result.detail ?? '结果来自服务器 MATCH_END。', true);
    },
  });
  return authoritativeConnection.ready;
}

function applyServerSnapshot(snapshot: ServerGameSnapshot, players: ServerPlayerState[]) {
  if (!FORMAL_GAME || match.phase === 'result') return;
  latestServerSnapshot = { snapshot, players };
  if (typeof snapshot.serverTimeLeft === 'number') match.timeLeft = snapshot.serverTimeLeft;
  if (typeof snapshot.foundReal === 'number') match.foundReal = snapshot.foundReal;
  if (typeof snapshot.realTotal === 'number') match.realTotal = snapshot.realTotal;
  if (typeof snapshot.mistakes === 'number') match.mistakes = snapshot.mistakes;
  applySkillConfirm(snapshot.skillConfirm);
  for (const player of players) {
    if (!hasServerPosition(player)) continue;
    if (player.roleType === 'WOLF') {
      applyServerPlayerToObject(wolf.group, wolf.velocity, player);
      if (player.dead) wolf.group.visible = false;
      continue;
    }
    const targetDeer = deerForServerPlayer(player);
    if (!targetDeer) continue;
    applyServerPlayerToObject(targetDeer.group, targetDeer.velocity, player);
    if (player.dead) {
      if (targetDeer.state !== 'dead') playAnimalClip(targetDeer.group, 'death', 0.08);
      targetDeer.state = 'dead';
      targetDeer.group.visible = false;
    } else {
      targetDeer.group.visible = true;
      if (targetDeer.state === 'dead') targetDeer.state = 'wander';
      if (isServerControlledDeer(targetDeer) && !targetDeer.isPlayer) {
        targetDeer.state = targetDeer.velocity.lengthSq() > 0.04 ? 'wander' : 'pause';
      }
    }
  }
}

function hasServerPosition(player: ServerPlayerState) {
  return Number.isFinite(Number(player.x)) && Number.isFinite(Number(player.z));
}

function applyServerPlayerToObject(object: THREE.Object3D, velocity: THREE.Vector3, player: ServerPlayerState) {
  const nextX = Number(player.x);
  const nextZ = Number(player.z);
  const nextYaw = Number(player.yaw ?? object.rotation.y);
  const previousX = object.position.x;
  const previousZ = object.position.z;
  object.position.x = nextX;
  object.position.z = nextZ;
  alignToTerrain(object);
  object.rotation.y = nextYaw + MODEL_FORWARD_YAW_OFFSET;
  const dx = object.position.x - previousX;
  const dz = object.position.z - previousZ;
  if (dx * dx + dz * dz < 0.0004) {
    velocity.set(0, 0, 0);
  } else {
    velocity.set(dx, 0, dz).multiplyScalar(20);
  }
}

function deerForServerPlayer(player: ServerPlayerState) {
  const key = String(player.userId);
  let item = serverDeerByUserId.get(key);
  if (!item && isLocalServerPlayer(player) && playerDeer) item = playerDeer;
  if (!item) item = deer.find((candidate) => candidate.serverUserId === key);
  if (!item) {
    item = deer.find((candidate) => !candidate.serverUserId && (!candidate.isPlayer || isLocalServerPlayer(player)));
  }
  if (!item) return null;
  item.serverUserId = player.userId;
  item.isReal = !player.ai;
  if (isLocalServerPlayer(player)) {
    if (playerDeer && playerDeer !== item) playerDeer.isPlayer = false;
    playerDeer = item;
    item.isPlayer = true;
  }
  serverDeerByUserId.set(key, item);
  return item;
}

function isLocalServerPlayer(player: ServerPlayerState) {
  return Boolean(LOCAL_USER_ID && String(player.userId) === LOCAL_USER_ID);
}

function isServerControlledDeer(item: Deer) {
  return FORMAL_GAME && item.serverUserId !== undefined && item.serverUserId !== null;
}

function applySkillConfirm(confirm: Record<string, unknown> | undefined) {
  if (!confirm || typeof confirm.type !== 'string') return;
  if (confirm.type === 'WOLF_POUNCE' && confirm.confirmed) {
    setHuntTip(confirm.hit ? '服务器确认：扑咬命中' : '服务器确认：扑空', 1.2);
    gameAudio.playCue(confirm.hit ? 'hit' : 'pounce');
  }
  if (confirm.type === 'DEER_LOOK' && typeof confirm.wolfDistance === 'number') {
    setHuntTip(`环顾：狼距离约 ${confirm.wolfDistance}m`, 1.4);
  }
  if (confirm.type === 'DEER_EAT' && confirm.confirmed) {
    setHuntTip('服务器确认：进食成功', 1.0);
  }
}

function setHuntTip(text: string, holdSeconds = 1) {
  huntTip.textContent = text;
  huntTipHold = Math.max(huntTipHold, holdSeconds);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  if (match.phase === 'playing') {
    updateMatch(dt);
    updatePlayerActor(dt);
    if (!FORMAL_GAME && match.role === 'deer') updateEnemyWolfAI(dt);
    updateAIDeer(dt);
    if (!FORMAL_GAME) handleWolfDeerCollision();
    updateAnimalAnimations(dt);
    scentTrailSystem.update(dt);
    updateDebugColliders();
    updateCamera(dt);
    updateHud();
  }
  composer.render();
}

function updateMatch(dt: number) {
  if (isCountdownLocked()) {
    timerEl.textContent = Math.ceil((countdownUntil - performance.now()) / 1000).toString();
    windUniforms.time.value += dt;
    return;
  }
  match.timeLeft -= dt;
  wolf.attackCooldown = Math.max(0, wolf.attackCooldown - dt);
  wolf.pounceTimer = Math.max(0, wolf.pounceTimer - dt);
  wolf.biteLock = Math.max(0, wolf.biteLock - dt);
  huntTipHold = Math.max(0, huntTipHold - dt);
  updateBiteSequence(dt);
  windUniforms.time.value += dt;
  if (scentActiveTimer > 0 && scentTarget && match.role === 'wolf') {
    scentActiveTimer -= dt;
    if (scentActiveTimer <= 0 || scentTarget.state === 'dead') {
      scentTarget = null;
    } else if (Math.floor(scentActiveTimer / 0.22) !== Math.floor((scentActiveTimer + dt) / 0.22)) {
      const distance = scentTarget.group.position.distanceTo(wolf.group.position);
      const intensity = THREE.MathUtils.clamp(1.18 - distance / 130, 0.36, 1.05);
      scentTrailSystem.emit(wolf.group.position, scentTarget.group.position, intensity * 0.62);
    }
  }
  if (match.timeLeft <= 0) {
    finishRound('\u9e7f\u7fa4\u80dc\u5229', '\u5012\u8ba1\u65f6\u7ed3\u675f\u65f6\u4ecd\u6709\u771f\u4eba\u9e7f\u5b58\u6d3b\u3002');
  }
}

function updatePlayerActor(dt: number) {
  if (isCountdownLocked()) return;
  const actor = match.role === 'wolf' ? wolf.group : playerDeer?.group;
  if (!actor) return;
  const moveAxis = getMoveAxis();
  const turnAxis = getTurnAxis();
  const wantsMove = Math.abs(moveAxis) > 0.01;
  const wantsTurn = Math.abs(turnAxis) > 0.01;
  const sprinting = input.sprint && wantsMove && moveAxis > 0 && match.stamina > 3;
  const baseSpeed = match.role === 'wolf' ? WOLF_BASE_SPEED : DEER_BASE_SPEED;
  const sprintSpeed = match.role === 'wolf' ? WOLF_SPRINT_SPEED : DEER_SPRINT_SPEED;
  const speed = sprinting ? sprintSpeed : baseSpeed;

  if (wantsTurn) {
    const turnSpeed = TURN_SPEED * (wantsMove ? 1 : IDLE_TURN_SPEED_RATIO);
    input.moveYaw = wrapAngle(input.moveYaw - turnAxis * turnSpeed * dt);
  }
  input.targetYaw = input.moveYaw + Math.PI;

  const velocity = match.role === 'wolf' ? wolf.velocity : playerDeer?.velocity;
  if (velocity) {
    if (wantsMove) {
      const signedSpeed = speed * moveAxis * (moveAxis < 0 ? BACKWARD_SPEED_RATIO : 1);
      const targetVelocity = tmp.set(Math.sin(input.moveYaw), 0, Math.cos(input.moveYaw)).multiplyScalar(signedSpeed);
      velocity.lerp(targetVelocity, 1 - Math.pow(0.00055, dt));
    } else {
      velocity.multiplyScalar(Math.pow(0.00004, dt));
    }
    if (match.role === 'wolf') updateWolfPlayerActions(dt, wantsMove || wantsTurn, sprinting);
    else updateDeerPlayerActions(dt, wantsMove || wantsTurn, sprinting);
    if (match.role === 'wolf' && wolf.biteLock > 0) {
      velocity.multiplyScalar(Math.pow(0.001, dt));
    } else {
      moveActorWithCollision(actor, velocity, dt, {
        radius: match.role === 'wolf' ? WOLF_RADIUS : DEER_RADIUS,
        height: match.role === 'wolf' ? 2.3 : 1.7,
        maxStepUp: match.role === 'wolf' ? WOLF_STEP_UP : DEER_STEP_UP,
        maxDropDown: match.role === 'wolf' ? WOLF_DROP_DOWN : DEER_DROP_DOWN,
        maxSlope: MAX_WALKABLE_SLOPE,
        arenaRadius: ARENA_RADIUS,
        ignore: actor,
      });
    }
  }

  if (wantsMove || wantsTurn || (velocity && velocity.lengthSq() > 0.08)) {
    actor.rotation.y = lerpAngle(actor.rotation.y, input.moveYaw + MODEL_FORWARD_YAW_OFFSET, 1 - Math.pow(0.00002, dt));
  }

  clearRoleActions(input);
}

function getMoveAxis() {
  return (input.forward ? 1 : 0) - (input.back ? 1 : 0);
}

function getTurnAxis() {
  return (input.right ? 1 : 0) - (input.left ? 1 : 0);
}

function updateWolfPlayerActions(dt: number, _isMoving: boolean, sprinting: boolean) {
  match.stamina = sprinting ? Math.max(0, match.stamina - dt * 34) : Math.min(100, match.stamina + dt * 24);
  if (input.wolfPounce && wolf.attackCooldown <= 0 && wolf.biteLock <= 0) {
    const forward = tmp2.set(Math.sin(input.moveYaw), 0, Math.cos(input.moveYaw));
    wolf.velocity.addScaledVector(forward, WOLF_POUNCE_IMPULSE);
    wolf.pounceTimer = WOLF_POUNCE_DURATION;
    wolf.attackCooldown = BITE_COOLDOWN_SECONDS;
    playAnimalClip(wolf.group, 'attack', 0.08);
    gameAudio.playCue('pounce');
    setHuntTip('\u77ed\u6251\u4e2d\uff0c\u649e\u4e0a\u76ee\u6807\u624d\u4f1a\u547d\u4e2d', 1.2);
  }
  if (input.wolfScent) activateScentTrail();
}

function updateDeerPlayerActions(dt: number, isMoving: boolean, sprinting: boolean) {
  if (!playerDeer) return;
  deerCamouflageTimer = Math.max(0, deerCamouflageTimer - dt);
  deerCamouflageCooldown = Math.max(0, deerCamouflageCooldown - dt);
  deerLookTimer = Math.max(0, deerLookTimer - dt);
  deerLookCooldown = Math.max(0, deerLookCooldown - dt);
  deerEatTimer = Math.max(0, deerEatTimer - dt);
  const stillEnough = !isMoving && playerDeer.velocity.lengthSq() < 0.3;
  const wolfDistance = wolf.group.position.distanceTo(playerDeer.group.position);
  if (deerEatTimer > 0 && isMoving) {
    deerEatTimer = 0;
    setHuntTip('\u79fb\u52a8\u6253\u65ad\u4e86\u8fdb\u98df', 1.0);
  }
  if (deerCamouflageTimer > 0 && (!stillEnough || wolfDistance < 5)) {
    deerCamouflageTimer = 0;
    setHuntTip(wolfDistance < 5 ? '\u72fc\u592a\u8fd1\uff0c\u4f2a\u88c5\u88ab\u8bc6\u7834' : '\u52a8\u4f5c\u592a\u5927\uff0c\u4f2a\u88c5\u5931\u6548', 1.4);
  }
  if (input.deerCamouflage && deerCamouflageCooldown <= 0 && stillEnough) {
    deerCamouflageTimer = DEER_CAMOUFLAGE_DURATION_SECONDS;
    deerCamouflageCooldown = DEER_CAMOUFLAGE_COOLDOWN_SECONDS;
    gameAudio.playCue('camouflage');
    setHuntTip('\u4f2a\u88c5\u4e2d\uff1a\u72fc\u6682\u65f6\u5931\u53bb\u9501\u5b9a', 1.8);
  } else if (input.deerCamouflage && deerCamouflageCooldown > 0) {
    setHuntTip(`\u4f2a\u88c5\u51b7\u5374\u4e2d ${deerCamouflageCooldown.toFixed(0)}s`, 1.0);
  } else if (input.deerCamouflage) {
    setHuntTip('\u4f2a\u88c5\u9700\u8981\u4f4e\u901f\u6216\u9759\u6b62', 1.0);
  }
  if (input.deerLook && deerLookCooldown <= 0) {
    deerLookTimer = DEER_LOOK_DURATION_SECONDS;
    deerLookCooldown = DEER_LOOK_COOLDOWN_SECONDS;
    playerDeer.suspicion = Math.min(100, playerDeer.suspicion + randomRange(4, 8));
    gameAudio.playCue('look');
    setHuntTip(`\u73af\u987e\uff1a${deerWolfDirectionHint()}`, 2.2);
  } else if (input.deerLook) {
    setHuntTip(`\u73af\u987e\u51b7\u5374\u4e2d ${deerLookCooldown.toFixed(0)}s`, 0.9);
  }
  if (input.deerEat && deerEatTimer <= 0) {
    const nearest = nearestFood(playerDeer.group.position);
    const distance = nearest ? playerDeer.group.position.distanceTo(nearest.position) : Number.POSITIVE_INFINITY;
    deerEatTimer = DEER_EAT_DURATION_SECONDS;
    deerEatQuality = distance < 4 ? 1 : 0.22;
    gameAudio.playCue('eat');
    setHuntTip(distance < 4 ? '\u8fdb\u98df\u4e2d\uff1a\u9965\u997f\u5feb\u901f\u6062\u590d' : '\u9644\u8fd1\u98df\u7269\u5f88\u5c11\uff0c\u53ea\u80fd\u5047\u88c5\u5403\u8349', 1.4);
  }
  playerDeer.hunger = Math.max(0, playerDeer.hunger - dt * 3.2);
  const herdGrazeBonus = countNearbyAIDeer(playerDeer.group.position, 8, 'graze') > 0 ? 2.3 : 0;
  playerDeer.suspicion = Math.max(0, playerDeer.suspicion - dt * (deerCamouflageTimer > 0 ? 8.2 : 2.5) - dt * herdGrazeBonus);
  if (isMoving) playerDeer.suspicion += dt * (sprinting ? 24 : 4.2);
  if (sprinting) {
    deerSprintTimer += dt;
    if (deerSprintTimer > 2 && countNearbyAIDeer(playerDeer.group.position, 10) > 0) {
      playerDeer.suspicion = Math.min(100, playerDeer.suspicion + dt * 9);
      startleNearbyDeer(playerDeer.group.position, 10);
    }
  } else {
    deerSprintTimer = Math.max(0, deerSprintTimer - dt * 1.4);
  }
  if (deerEatTimer > 0) {
    playerDeer.state = 'graze';
    playerDeer.velocity.multiplyScalar(Math.pow(0.0008, dt));
    playerDeer.hunger = Math.min(100, playerDeer.hunger + dt * (deerEatQuality > 0.5 ? randomRange(24, 36) : 7));
    playerDeer.suspicion = Math.max(0, playerDeer.suspicion - dt * (deerEatQuality > 0.5 ? 1.8 + herdGrazeBonus : 0.7));
  } else if (deerLookTimer > 0) {
    playerDeer.state = 'look';
    playerDeer.velocity.multiplyScalar(Math.pow(0.04, dt));
  } else if (deerCamouflageTimer > 0) {
    playerDeer.state = 'pause';
    playerDeer.velocity.multiplyScalar(Math.pow(0.01, dt));
  } else if (isMoving) {
    playerDeer.state = sprinting ? 'startled' : 'wander';
  } else {
    playerDeer.state = 'pause';
  }
  if (playerDeer.hunger <= 0) {
    playerDeer.suspicion = Math.min(100, playerDeer.suspicion + dt * 18);
  }
  if (wolfDistance < 18 && huntTipHold <= 0) {
    huntTip.textContent = '\u72fc\u9760\u8fd1\u4e86\uff0c\u52a8\u4f5c\u8d8a\u81ea\u7136\u8d8a\u5b89\u5168';
  }
}

function deerWolfDirectionHint() {
  if (!playerDeer) return '\u6ca1\u6709\u660e\u663e\u72fc\u8ff9';
  const distance = wolf.group.position.distanceTo(playerDeer.group.position);
  const band = distance < 12 ? '\u5f88\u8fd1' : distance < 25 ? '\u4e0d\u8fdc' : '\u8f83\u8fdc';
  return `${relativeDirectionText(playerDeer.group.rotation.y - MODEL_FORWARD_YAW_OFFSET, wolf.group.position, playerDeer.group.position)}\u6709\u72fc\uff0c${band}`;
}

function countNearbyAIDeer(position: THREE.Vector3, radius: number, state?: DeerState) {
  let count = 0;
  const radiusSq = radius * radius;
  for (const item of deer) {
    if (item.isPlayer || item.state === 'dead') continue;
    if (state && item.state !== state) continue;
    if (item.group.position.distanceToSquared(position) <= radiusSq) count += 1;
  }
  return count;
}

function startleNearbyDeer(position: THREE.Vector3, radius: number) {
  const radiusSq = radius * radius;
  for (const item of deer) {
    if (item.isPlayer || item.state === 'dead') continue;
    if (item.group.position.distanceToSquared(position) > radiusSq) continue;
    item.state = 'startled';
    item.stateTime = randomRange(0.9, 1.8);
  }
}

// Enemy wolf AI only runs in deer mode; player input never steers the wolf there.
function updateEnemyWolfAI(dt: number) {
  if (match.role !== 'deer' || !playerDeer || playerDeer.state === 'dead') return;
  const distance = wolf.group.position.distanceTo(playerDeer.group.position);
  const hasCover = countNearbyAIDeer(playerDeer.group.position, 8) > 0 || nearbySoftCover(playerDeer.group.position, 7);
  const camouflageWorks = deerCamouflageTimer > 0 && distance > 6 && hasCover;
  const effectiveSuspicion = Math.max(0, playerDeer.suspicion - (camouflageWorks ? 32 : 0));
  let target = averageDeerCenter();
  if (effectiveSuspicion >= 60 || distance < 8) target = playerDeer.group.position;
  else if (effectiveSuspicion >= 35) target = tmp2.copy(playerDeer.group.position).lerp(averageDeerCenter(), 0.45);
  if (camouflageWorks) target = averageDeerCenter();
  tmp.copy(target).sub(wolf.group.position).setY(0);
  if (tmp.lengthSq() > 1) tmp.normalize();
  wolf.velocity.lerp(tmp.multiplyScalar(effectiveSuspicion > 60 || distance < 7 ? 16 : 8), 1 - Math.pow(0.003, dt));
  moveActorWithCollision(wolf.group, wolf.velocity, dt, {
    radius: WOLF_RADIUS,
    height: 2.3,
    maxStepUp: WOLF_STEP_UP,
    maxDropDown: WOLF_DROP_DOWN,
    maxSlope: MAX_WALKABLE_SLOPE,
    arenaRadius: ARENA_RADIUS,
    ignore: wolf.group,
  });
  if (wolf.velocity.lengthSq() > 0.1) {
    wolf.group.rotation.y = lerpAngle(wolf.group.rotation.y, yawFromDirection(wolf.velocity), 1 - Math.pow(0.001, dt));
  }
  if (distance < 4.8 && effectiveSuspicion > 58) {
    playerDeer.state = 'dead';
    playerDeer.group.visible = false;
    finishRound('\u72fc\u7fa4\u80dc\u5229', '\u4f60\u7684\u52a8\u4f5c\u592a\u53ef\u7591\uff0c\u88ab\u72fc\u8bc6\u7834\u4e86\u3002');
  }
}

function nearbySoftCover(position: THREE.Vector3, radius: number) {
  const center = new THREE.Vector2(position.x, position.z);
  return spatialHash.query(center, radius).some((collider) => collider.category === 'bush' && !collider.blocks);
}

function updateAIDeer(dt: number) {
  for (const item of deer) {
    if (item.state === 'dead' || item.isPlayer || isServerControlledDeer(item)) continue;
    item.stateTime -= dt;
    const distToWolf = item.group.position.distanceTo(wolf.group.position);
    const wasStartled = item.state === 'startled';

    if (distToWolf < 10 && Math.random() < dt * 1.8) {
      item.state = 'startled';
      item.stateTime = randomRange(1.1, 2.1);
    } else if (item.stateTime <= 0) {
      item.state = pickDeerState(item.isReal);
      item.stateTime = item.state === 'graze' ? randomRange(2.5, 5.2) : randomRange(1.1, 3.6);
      if (item.isReal && Math.random() < 0.42) item.suspicion = Math.min(100, item.suspicion + randomRange(8, 18));
    }

    if (item.state === 'wander' || item.state === 'startled') {
      const erratic = item.isReal ? randomRange(-1.5, 1.5) : randomRange(-0.45, 0.45);
      item.wanderAngle += erratic * dt;
      const speed = item.state === 'startled' ? item.speed * 2.2 : item.speed * (item.isReal ? 1.08 : 0.72);
      if (wasStartled) item.wanderAngle = Math.atan2(item.group.position.x - wolf.group.position.x, item.group.position.z - wolf.group.position.z);
      item.velocity.set(Math.sin(item.wanderAngle), 0, Math.cos(item.wanderAngle)).multiplyScalar(speed);
    } else {
      item.velocity.multiplyScalar(0.82);
    }
    applyDeerSeparation(item);

    if (item.state === 'graze') {
      item.hunger = Math.min(100, item.hunger + dt * 14);
    } else {
      item.hunger = Math.max(0, item.hunger - dt * 1.3);
    }

    item.suspicion = Math.max(0, item.suspicion - dt * 1.1);
    moveActorWithCollision(item.group, item.velocity, dt, {
      radius: DEER_RADIUS,
      height: 1.7,
      maxStepUp: DEER_STEP_UP,
      maxDropDown: DEER_DROP_DOWN,
      maxSlope: MAX_WALKABLE_SLOPE,
      arenaRadius: DEER_WANDER_ARENA_RADIUS,
      ignore: item.group,
    });
    if (item.velocity.lengthSq() > 0.04) item.group.rotation.y = yawFromDirection(item.velocity);
  }
}

function pickDeerState(isReal: boolean): DeerState {
  const roll = Math.random();
  if (isReal && roll < 0.22) return 'wander';
  if (roll < 0.32) return 'graze';
  if (roll < 0.52) return 'pause';
  if (roll < 0.72) return 'look';
  return 'wander';
}


function applyDeerSeparation(item: Deer) {
  for (const other of deer) {
    if (other === item || other.state === 'dead') continue;
    const dx = item.group.position.x - other.group.position.x;
    const dz = item.group.position.z - other.group.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < 0.0001 || distanceSq > 2.25) continue;
    const distance = Math.sqrt(distanceSq);
    const strength = (1.5 - distance) * 1.8;
    item.velocity.x += (dx / distance) * strength;
    item.velocity.z += (dz / distance) * strength;
  }
}

function handleWolfDeerCollision() {
  if (wolf.biteTarget || wolf.biteLock > 0) return;
  if (match.role === 'deer') {
    if (!playerDeer || playerDeer.state === 'dead') return;
    const distance = wolf.group.position.distanceTo(playerDeer.group.position);
    const camoBuffer = deerCamouflageTimer > 0 && distance > 3.2 ? 24 : 0;
    if (distance < WOLF_RADIUS + DEER_RADIUS + 0.4 && (playerDeer.suspicion - camoBuffer > 54 || distance < 1.35)) {
      playerDeer.state = 'dead';
      playAnimalClip(playerDeer.group, 'death', 0.08);
      finishRound('\u72fc\u7fa4\u80dc\u5229', '\u4f60\u88ab\u654c\u65b9 AI \u72fc\u8bc6\u7834\u5e76\u6251\u4e2d\u4e86\u3002');
    }
    return;
  }
  const wolfForward = tmp.set(Math.sin(wolf.group.rotation.y - MODEL_FORWARD_YAW_OFFSET), 0, Math.cos(wolf.group.rotation.y - MODEL_FORWARD_YAW_OFFSET)).normalize();
  for (const target of deer) {
    if (target.state === 'dead') continue;
    const dir = tmp2.copy(target.group.position).sub(wolf.group.position).setY(0);
    const distance = dir.length();
    if (distance > WOLF_RADIUS + DEER_RADIUS + 0.3 || distance < 0.001) continue;
    dir.normalize();
    const facing = wolfForward.dot(dir);
    const fastEnough = wolf.velocity.length() > 10.5 || wolf.pounceTimer > 0;
    if (facing > 0.35 && fastEnough && match.role === 'wolf') {
      beginBiteSequence(target);
      return;
    }
    if (facing > 0.12) {
      target.state = 'startled';
      target.stateTime = randomRange(1.1, 2.2);
      target.velocity.addScaledVector(dir, 4.5);
    }
  }
}

function beginBiteSequence(target: Deer) {
  if (wolf.attackCooldown > 0 && wolf.pounceTimer <= 0) return;
  wolf.attackCooldown = BITE_COOLDOWN_SECONDS;
  wolf.biteLock = BITE_LOCK_SECONDS;
  wolf.biteTarget = target;
  wolf.biteImpactTimer = BITE_IMPACT_SECONDS;
  wolf.velocity.multiplyScalar(0.35);
  playAnimalClip(wolf.group, 'attack', 0.08);
  gameAudio.playCue('hit');
  setHuntTip('\u6251\u54ac\u547d\u4e2d', 1.2);
  createBiteDust(target.group.position);
}

function updateBiteSequence(dt: number) {
  if (!wolf.biteTarget) return;
  wolf.biteImpactTimer -= dt;
  if (wolf.biteImpactTimer > 0) return;
  const target = wolf.biteTarget;
  wolf.biteTarget = null;
  resolveBiteResult(target);
}

function resolveBiteResult(target: Deer) {
  if (target.state === 'dead') return;
  target.state = 'dead';
  playAnimalClip(target.group, 'death', 0.08);
  setTimeout(() => {
    target.group.visible = false;
  }, 420);
  if (target.isReal) {
    match.foundReal += 1;
    match.timeLeft = Math.min(match.maxTime, match.timeLeft + CORRECT_BONUS);
    setHuntTip('\u627e\u5230\u771f\u4eba\u9e7f\uff0c\u65f6\u95f4 +' + CORRECT_BONUS + 's', 2);
    if (match.foundReal >= match.realTotal) {
      finishRound('\u72fc\u65b9\u80dc\u5229', '\u5168\u90e8\u771f\u4eba\u9e7f\u90fd\u88ab\u627e\u51fa\u6765\u4e86\u3002');
    }
  } else {
    match.mistakes += 1;
    match.timeLeft = Math.max(0, match.timeLeft - WRONG_PENALTY);
    setHuntTip('\u8bef\u4f24 AI \u9e7f\uff0c\u65f6\u95f4 -' + WRONG_PENALTY + 's', 2);
  }
}

function activateScentTrail() {
  if (match.role !== 'wolf') return;
  if (match.scentUsed) {
    setHuntTip('\u672c\u5c40\u6c14\u5473\u8ffd\u8e2a\u5df2\u7528\u5c3d', 1.3);
    return;
  }
  const target = nearestRealDeer(wolf.group.position);
  if (!target) {
    setHuntTip('\u6ca1\u6709\u5269\u4f59\u6c14\u5473', 1.5);
    return;
  }
  match.scentUsed = true;
  const distance = target.group.position.distanceTo(wolf.group.position);
  const intensity = THREE.MathUtils.clamp(1.25 - distance / 120, 0.32, 1.15);
  scentTarget = target;
  scentActiveTimer = SCENT_DURATION_SECONDS;
  scentTrailSystem.emit(wolf.group.position, target.group.position, intensity);
  gameAudio.playCue('scent');
  setHuntTip(`\u6c14\u5473${scentStrengthText(distance)}\uff0c${relativeDirectionText(wolf.group.rotation.y - MODEL_FORWARD_YAW_OFFSET, target.group.position, wolf.group.position)}\u98d8\u6765`, 2.2);
}

function scentStrengthText(distance: number) {
  if (distance < 25) return '\u5f88\u6d53';
  if (distance < 70) return '\u6e05\u6670';
  return '\u5f88\u6de1\uff0c\u4f46\u65b9\u5411\u53ef\u8fa8';
}

function relativeDirectionText(yaw: number, target: THREE.Vector3, origin: THREE.Vector3) {
  const targetYaw = Math.atan2(target.x - origin.x, target.z - origin.z);
  const delta = wrapAngle(targetYaw - yaw);
  const abs = Math.abs(delta);
  if (abs < 0.42) return '\u6b63\u524d\u65b9';
  if (abs > Math.PI * 0.72) return '\u8eab\u540e';
  const side = delta > 0 ? '\u53f3' : '\u5de6';
  return abs < 1.45 ? `${side}\u524d\u65b9` : `${side}\u540e\u65b9`;
}

function createBiteDust(position: THREE.Vector3) {
  const dust = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xd8c187, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 12; i += 1) {
    const mote = new THREE.Mesh(new THREE.PlaneGeometry(randomRange(0.18, 0.42), randomRange(0.18, 0.42)), material);
    mote.position.set(position.x + randomRange(-1.2, 1.2), terrainSampler.sampleHeight(position.x, position.z) + randomRange(0.16, 0.75), position.z + randomRange(-1.2, 1.2));
    mote.rotation.set(randomRange(0, Math.PI), randomRange(0, Math.PI), randomRange(0, Math.PI));
    dust.add(mote);
  }
  scene.add(dust);
  const born = performance.now();
  const fade = () => {
    const age = (performance.now() - born) / 1000;
    dust.position.y = age * 1.3;
    material.opacity = Math.max(0, 0.42 - age * 0.9);
    if (age < 0.48) requestAnimationFrame(fade);
    else {
      scene.remove(dust);
      dust.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      material.dispose();
    }
  };
  fade();
}

function updateCamera(dt: number) {
  const target = match.role === 'deer' && playerDeer ? playerDeer.group : wolf.group;
  const distance = match.role === 'deer' ? 8.2 : 9.4;
  const height = match.role === 'deer' ? 3.1 : 3.55;
  input.targetYaw = input.moveYaw + Math.PI;
  input.yaw = lerpAngle(input.yaw, input.targetYaw, 1 - Math.pow(0.00002, dt));
  const offset = new THREE.Vector3(Math.sin(input.yaw) * distance, height, Math.cos(input.yaw) * distance);
  camera.position.lerp(tmp.copy(target.position).add(offset), 1 - Math.pow(0.00008, dt));
  camera.lookAt(tmp2.copy(target.position).add(new THREE.Vector3(0, 1.2, 0)));
  camera.fov = THREE.MathUtils.lerp(camera.fov, input.sprint && getMoveAxis() > 0 ? 66 : 60, 1 - Math.pow(0.01, dt));
  camera.updateProjectionMatrix();
}

function updateHud() {
  timerEl.textContent = isCountdownLocked() ? Math.ceil((countdownUntil - performance.now()) / 1000).toString() : formatTime(match.timeLeft);
  roleText.textContent = match.role === 'wolf' ? '\u72fc' : '\u9e7f';
  targetText.textContent = match.role === 'wolf' ? `${match.foundReal} / ${match.realTotal}` : '\u9690\u85cf';
  mistakeText.textContent = match.role === 'wolf' ? `${match.mistakes}` : '\u9690\u85cf';
  staminaText.textContent = `${Math.round(match.stamina)}`;
  staminaBar.style.width = `${match.stamina}%`;
  const activeDeer = playerDeer ?? deer.find((item) => item.isReal && item.state !== 'dead') ?? deer[0];
  hungerText.textContent = `${Math.round(activeDeer?.hunger ?? 0)}`;
  hungerBar.style.width = `${activeDeer?.hunger ?? 0}%`;
  suspicionText.textContent = `${Math.round(activeDeer?.suspicion ?? 0)}`;
  suspicionBar.style.width = `${activeDeer?.suspicion ?? 0}%`;
  document.body.classList.toggle('is-deer', match.role === 'deer');
  debugText.hidden = !DEV_LOCAL_MODE;
  if (huntTipHold <= 0) {
    if (match.role === 'wolf') {
      huntTip.textContent = `\u6c14\u5473\u8ffd\u8e2a\uff1a${match.scentUsed ? '\u5df2\u7528\u5c3d' : '1 / 1'}`;
    } else if (playerDeer) {
      const wolfDistance = wolf.group.position.distanceTo(playerDeer.group.position);
      const sensed = deerLookTimer > 0 ? deerWolfDirectionHint() : wolfDistance < 18 ? '\u72fc\u5f88\u8fd1' : '\u6ca1\u6709\u660e\u663e\u72fc\u8ff9';
      const state = deerEatTimer > 0
        ? '\u8fdb\u98df\u4e2d'
        : deerCamouflageTimer > 0
          ? '\u4f2a\u88c5\u4e2d\uff1a\u72fc\u6682\u65f6\u5931\u53bb\u9501\u5b9a'
          : deerLookTimer > 0
            ? '\u73af\u987e\u4e2d'
            : `\u4f2a\u88c5 ${deerCamouflageCooldown > 0 ? deerCamouflageCooldown.toFixed(0) + 's' : '\u53ef\u7528'} / \u73af\u987e ${deerLookCooldown > 0 ? deerLookCooldown.toFixed(0) + 's' : '\u53ef\u7528'}`;
      huntTip.textContent = `\u9965\u997f ${Math.round(playerDeer.hunger)} / \u53ef\u7591 ${Math.round(playerDeer.suspicion)}\uff1b${sensed}\uff1b${state}`;
    }
  }
  if (match.role === 'wolf') {
    debugText.textContent = `wolf speed ${wolf.velocity.length().toFixed(1)} | scent ${match.scentUsed ? 'used' : 'ready'} | colliders ${colliders.length} | slope ${terrainSampler.sampleSlope(wolf.group.position.x, wolf.group.position.z).toFixed(2)}`;
  } else if (playerDeer) {
    debugText.textContent = `deer speed ${playerDeer.velocity.length().toFixed(1)} | hunger ${playerDeer.hunger.toFixed(0)} | suspicion ${playerDeer.suspicion.toFixed(0)} | wolf ${wolf.group.position.distanceTo(playerDeer.group.position).toFixed(1)}m`;
  }
}

function updateDebugColliders() {
  debugColliderGroup.visible = input.debugRange;
  if (!input.debugRange) {
    debugColliderKey = '';
    debugColliderGroup.clear();
    return;
  }
  const actor = match.role === 'deer' && playerDeer ? playerDeer.group : wolf.group;
  const cellX = Math.floor(actor.position.x / 6);
  const cellZ = Math.floor(actor.position.z / 6);
  const nextKey = `${match.role}:${cellX},${cellZ}`;
  if (nextKey === debugColliderKey) return;
  debugColliderKey = nextKey;
  debugColliderGroup.clear();
  const center = new THREE.Vector2(actor.position.x, actor.position.z);
  for (const collider of spatialHash.query(center, 28)) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(collider.radius * 0.96, collider.radius, 24),
      new THREE.MeshBasicMaterial({
        color: collider.blocks ? 0xff8844 : 0x88aa66,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(collider.center.x, terrainSampler.sampleHeight(collider.center.x, collider.center.y) + 0.12, collider.center.y);
    debugColliderGroup.add(ring);
  }
}

function configureRoleUI(role: Role) {
  document.body.classList.toggle('is-deer', role === 'deer');
  if (role === 'wolf') {
    hintbar.innerHTML = `
      <span>W/S \u524d\u540e\u79fb\u52a8</span>
      <span>A/D \u6216 \u2190/\u2192 \u6301\u7eed\u8f6c\u5411</span>
      <span>Shift \u51b2\u523a</span>
      <span>Space \u6251\u54ac / \u77ed\u6251</span>
      <span>Q / E \u6c14\u5473\u8ffd\u8e2a\uff1a\u672c\u5c40\u4e00\u6b21</span>
      <span>F \u8c03\u8bd5\u78b0\u649e</span>
    `;
    sprintBtn.textContent = '\u51b2\u523a';
    trackBtn.textContent = '\u6c14\u5473';
    lookBtn.textContent = '\u6c14\u5473';
    attackBtn.textContent = '\u6251\u54ac';
  } else {
    hintbar.innerHTML = `
      <span>W/S \u524d\u540e\u79fb\u52a8</span>
      <span>A/D \u6216 \u2190/\u2192 \u6301\u7eed\u8f6c\u5411</span>
      <span>Shift \u5c0f\u8dd1\uff0c\u4f1a\u589e\u52a0\u53ef\u7591\u5ea6</span>
      <span>Space \u4f2a\u88c5\u9759\u6b62</span>
      <span>Q \u8fdb\u98df</span>
      <span>E \u73af\u987e / \u89c2\u5bdf\u72fc</span>
      <span>F \u8c03\u8bd5\u78b0\u649e</span>
    `;
    sprintBtn.textContent = '\u5c0f\u8dd1';
    trackBtn.textContent = '\u8fdb\u98df';
    lookBtn.textContent = '\u73af\u987e';
    attackBtn.textContent = '\u4f2a\u88c5';
  }
}

function resetRound(role: Role) {
  match.phase = 'playing';
  match.role = role;
  match.timeLeft = INITIAL_TIME;
  match.maxTime = MAX_TIME;
  match.foundReal = 0;
  match.realTotal = REAL_DEER_COUNT;
  match.mistakes = 0;
  match.stamina = 100;
  match.scentUsed = false;
  countdownUntil = performance.now() + 3000;
  huntTip.textContent = role === 'wolf' ? '\u6c14\u5473\u8ffd\u8e2a\uff1a1 / 1' : '\u9965\u997f\u3001\u53ef\u7591\u5ea6\u548c\u72fc\u8ddd\u79bb\u662f\u4f60\u7684\u5173\u952e\u4fe1\u606f';
  huntTipHold = 0;
  deerCamouflageTimer = 0;
  deerCamouflageCooldown = 0;
  deerLookTimer = 0;
  deerLookCooldown = 0;
  deerEatTimer = 0;
  deerEatQuality = 0;
  deerSprintTimer = 0;
  scentActiveTimer = 0;
  scentTarget = null;
  configureRoleUI(role);
  wolf.group.position.set(0, 0, 22);
  alignToTerrain(wolf.group);
  wolf.group.visible = true;
  wolf.velocity.set(0, 0, 0);
  wolf.pounceTimer = 0;
  wolf.biteLock = 0;
  wolf.biteTarget = null;
  wolf.biteImpactTimer = 0;
  input.moveYaw = Math.PI;
  input.targetYaw = input.moveYaw + Math.PI;
  input.yaw = input.targetYaw;
  wolf.group.rotation.y = input.moveYaw + MODEL_FORWARD_YAW_OFFSET;
  clearHeldInput(input);
  clearRoleActions(input);
  playerDeer = null;
  serverDeerByUserId.clear();

  const shuffled = shuffleDeer(deer);
  for (const item of deer) {
    item.serverUserId = undefined;
    item.group.visible = true;
    item.group.position.copy(randomPoint(DEER_SPAWN_RADIUS));
    alignToTerrain(item.group);
    item.velocity.set(0, 0, 0);
    item.state = 'wander';
    item.stateTime = randomRange(1, 4);
    item.hunger = randomRange(65, 100);
    item.suspicion = 0;
    item.isReal = false;
    item.isPlayer = false;
    item.markedUntil = 0;
  }

  for (let i = 0; i < REAL_DEER_COUNT; i += 1) {
    shuffled[i].isReal = true;
  }

  if (role === 'deer') {
    playerDeer = shuffled[0];
    playerDeer.isPlayer = true;
    playerDeer.group.position.set(-10, 0, 4);
    alignToTerrain(playerDeer.group);
    playerDeer.group.rotation.y = input.moveYaw + MODEL_FORWARD_YAW_OFFSET;
  }

  if (FORMAL_GAME && latestServerSnapshot) {
    applyServerSnapshot(latestServerSnapshot.snapshot, latestServerSnapshot.players);
  }
}

function finishRound(title: string, detail: string, serverConfirmed = false) {
  if (gameOptions?.matchId && !serverConfirmed) return;
  if (match.phase === 'result') return;
  match.phase = 'result';
  match.resultTitle = title;
  match.resultDetail = detail;
  resultTitle.textContent = title;
  resultDetail.textContent = detail;
  resultFound.textContent = `${match.foundReal} / ${match.realTotal}`;
  resultMistakes.textContent = `${match.mistakes}`;
  resultTime.textContent = formatTime(match.timeLeft);
  const playerWon = (match.role === 'wolf' && title.includes('狼')) || (match.role === 'deer' && title.includes('鹿'));
  gameAudio.stop();
  gameAudio.playStinger(playerWon ? 'victory_stinger' : 'defeat_stinger');
  gameAudio.playCue('result');
  resultDialog.showModal();
}

function handleGameBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldBlockGameNavigation()) return;
  event.preventDefault();
  event.returnValue = '';
}

function shouldBlockGameNavigation() {
  return Boolean(gameOptions?.matchId) && !allowGameNavigation && match.phase === 'playing';
}

async function exitCurrentGame() {
  if (exitMatchBtn.disabled) return;
  if (match.phase === 'playing') {
    const confirmed = window.confirm('\u9000\u51fa\u5f53\u5c40\u4f1a\u7ed3\u675f\u672c\u5c40\u5e76\u8fd4\u56de\u5927\u5385\uff0c\u786e\u5b9a\u9000\u51fa\u5417\uff1f');
    if (!confirmed) return;
  }
  exitMatchBtn.disabled = true;
  exitMatchBtn.textContent = '\u9000\u51fa\u4e2d...';
  try {
    if (gameOptions?.matchId && match.phase !== 'result') {
      await leaveCurrentMatch();
    }
    returnToLobby();
  } catch (error) {
    exitMatchBtn.disabled = false;
    exitMatchBtn.textContent = '\u9000\u51fa\u5f53\u5c40';
    window.alert(error instanceof Error ? error.message : '\u9000\u51fa\u5f53\u5c40\u5931\u8d25');
  }
}

function returnToLobby() {
  allowGameNavigation = true;
  window.removeEventListener('beforeunload', handleGameBeforeUnload);
  authoritativeConnection?.close();
  clearHeldInput(input);
  gameAudio.stop();
  window.sessionStorage.removeItem(MATCH_OPTIONS_KEY);
  delete (window as unknown as { __wildhuntGameOptions?: GameStartOptions }).__wildhuntGameOptions;
  window.location.assign('/');
}

function isCountdownLocked() {
  return match.phase === 'playing' && performance.now() < countdownUntil;
}

function nearestRealDeer(position: THREE.Vector3) {
  let best: Deer | null = null;
  let bestDistanceSq = Number.POSITIVE_INFINITY;
  for (const item of deer) {
    if (!item.isReal || item.state === 'dead') continue;
    const distanceSq = item.group.position.distanceToSquared(position);
    if (distanceSq < bestDistanceSq) {
      best = item;
      bestDistanceSq = distanceSq;
    }
  }
  return best;
}

function nearestFood(position: THREE.Vector3) {
  let best = foodPatches[0];
  let bestDistanceSq = Number.POSITIVE_INFINITY;
  for (const patch of foodPatches) {
    const distanceSq = patch.position.distanceToSquared(position);
    if (distanceSq < bestDistanceSq) {
      best = patch;
      bestDistanceSq = distanceSq;
    }
  }
  return best;
}

function averageDeerCenter() {
  const center = new THREE.Vector3();
  let count = 0;
  for (const item of deer) {
    if (item.state === 'dead') continue;
    center.add(item.group.position);
    count += 1;
  }
  return center.multiplyScalar(1 / Math.max(1, count));
}

function shuffleDeer(items: Deer[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createForestTreePoints() {
  return poissonDiskPoints(SCENERY_RADIUS, 8.2, scaledNatureCount(210), (point) => {
    const path = pathInfluenceAt(point.x, point.z);
    const clearing = clearingInfluenceAt(point.x, point.z);
    const density = forestDensityAt(point.x, point.z);
    return path < 0.38 && clearing < 0.48 && Math.random() < density;
  });
}

function createLayeredForestPoints() {
  const canopy = createForestTreePoints();
  const secondary = poissonDiskPoints(SCENERY_RADIUS, 5.8, scaledNatureCount(145), (point) => {
    const path = pathInfluenceAt(point.x, point.z);
    const clearing = clearingInfluenceAt(point.x, point.z);
    const density = forestDensityAt(point.x, point.z);
    return path < 0.52 && clearing < 0.68 && Math.random() < density + 0.18 && farFromStart(point, 16);
  });
  const bushes = poissonDiskPoints(SCENERY_RADIUS, 4.1, scaledNatureCount(220), (point) => {
    const path = pathInfluenceAt(point.x, point.z);
    const clearing = clearingInfluenceAt(point.x, point.z);
    const density = forestDensityAt(point.x, point.z);
    const edge = Math.abs(path - 0.34) < 0.18 || Math.abs(clearing - 0.55) < 0.22;
    return clearing < 0.86 && path < 0.72 && farFromStart(point, 13) && Math.random() < density * 0.72 + (edge ? 0.38 : 0.12);
  });
  const grasses = Array.from({ length: scaledNatureCount(1120) }, () => randomGrassPoint(138));
  const plants = Array.from({ length: scaledNatureCount(240) }, () => randomForestPoint(142, 12));
  return { canopy, secondary, bushes, grasses, plants };
}

function farFromStart(point: THREE.Vector3, distance: number) {
  return Math.hypot(point.x, point.z - 22) > distance && Math.hypot(point.x + 10, point.z - 4) > distance;
}

function poissonDiskPoints(radius: number, minDistance: number, targetCount: number, accept: (point: THREE.Vector3) => boolean) {
  const points: THREE.Vector3[] = [];
  const minDistanceSq = minDistance * minDistance;
  const maxAttempts = targetCount * 90;
  for (let attempt = 0; attempt < maxAttempts && points.length < targetCount; attempt += 1) {
    const point = randomPoint(radius);
    if (!accept(point)) continue;
    let valid = true;
    for (const existing of points) {
      if (existing.distanceToSquared(point) < minDistanceSq) {
        valid = false;
        break;
      }
    }
    if (valid) points.push(point);
  }
  return points;
}

function forestDensityAt(x: number, z: number) {
  let cluster = 0;
  for (const center of FOREST_CLUSTER_CENTERS) {
    const distanceSq = (x - center.x) ** 2 + (z - center.y) ** 2;
    cluster = Math.max(cluster, Math.exp(-distanceSq / 3600));
  }
  const edge = THREE.MathUtils.smoothstep(Math.hypot(x, z), 58, SCENERY_RADIUS);
  const path = pathInfluenceAt(x, z);
  const clearing = clearingInfluenceAt(x, z);
  return THREE.MathUtils.clamp(0.15 + cluster * 0.72 + edge * 0.32 - path * 0.72 - clearing * 0.85, 0, 0.98);
}

function randomForestPoint(radius: number, minStartDistance: number) {
  for (let i = 0; i < 80; i += 1) {
    const point = Math.random() < 0.65 ? randomClusterPoint(radius) : randomPoint(radius);
    if (new THREE.Vector2(point.x, point.z - 22).length() < minStartDistance) continue;
    if (clearingInfluenceAt(point.x, point.z) > 0.72) continue;
    if (Math.random() > forestDensityAt(point.x, point.z) + 0.25) continue;
    return point;
  }
  return randomSceneryPoint(radius, minStartDistance);
}

function randomBreakupPoint(radius: number) {
  for (let i = 0; i < 64; i += 1) {
    const point = randomPoint(radius);
    const path = pathInfluenceAt(point.x, point.z);
    const edge = THREE.MathUtils.smoothstep(Math.hypot(point.x, point.z), 70, radius);
    if (Math.random() < 0.2 + path * 0.45 + edge * 0.28) return point;
  }
  return randomPoint(radius);
}

function randomGrassPoint(radius: number) {
  for (let i = 0; i < 80; i += 1) {
    const point = Math.random() < 0.58
      ? randomPoint(randomRange(38, radius))
      : randomClusterPoint(radius);
    const path = pathInfluenceAt(point.x, point.z);
    const clearing = clearingInfluenceAt(point.x, point.z);
    if (clearing > 0.92) continue;
    if (Math.random() < path * 0.76) continue;
    if (Math.random() > 0.42 + forestDensityAt(point.x, point.z) * 0.76) continue;
    return point;
  }
  return randomPoint(radius);
}

function randomClusterPoint(radius: number) {
  const center = FOREST_CLUSTER_CENTERS[Math.floor(Math.random() * FOREST_CLUSTER_CENTERS.length)];
  for (let i = 0; i < 24; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * randomRange(18, 56);
    const point = new THREE.Vector3(center.x + Math.cos(angle) * distance, 0, center.y + Math.sin(angle) * distance);
    if (Math.hypot(point.x, point.z) <= radius) return point;
  }
  return randomPoint(radius);
}

function pathInfluenceAt(x: number, z: number) {
  let influence = 0;
  for (const path of FOREST_PATHS) {
    const distance = distanceToSegment2D(x, z, path.ax, path.az, path.bx, path.bz);
    influence = Math.max(influence, 1 - THREE.MathUtils.smoothstep(distance, path.width, path.width + 8));
  }
  return THREE.MathUtils.clamp(influence, 0, 1);
}

function clearingInfluenceAt(x: number, z: number) {
  let influence = 0;
  for (const clearing of FOREST_CLEARINGS) {
    const distance = Math.hypot(x - clearing.x, z - clearing.z);
    influence = Math.max(influence, 1 - THREE.MathUtils.smoothstep(distance, clearing.radius, clearing.radius + 16));
  }
  return THREE.MathUtils.clamp(influence, 0, 1);
}

function patchInfluenceAt(x: number, z: number, px: number, pz: number, radius: number) {
  const distance = Math.hypot(x - px, z - pz);
  return 1 - THREE.MathUtils.smoothstep(distance, radius * 0.38, radius);
}

function distanceToSegment2D(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const t = THREE.MathUtils.clamp((apx * abx + apz * abz) / Math.max(0.0001, abx * abx + abz * abz), 0, 1);
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

function randomSceneryPoint(radius: number, minStartDistance: number) {
  const start = new THREE.Vector3(0, 0, 22);
  for (let i = 0; i < 24; i += 1) {
    const point = randomPoint(radius);
    if (new THREE.Vector2(point.x - start.x, point.z - start.z).length() >= minStartDistance) return point;
  }
  return randomPoint(radius);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(QUALITY.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  ssaoPass.setSize(window.innerWidth, window.innerHeight);
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { soundManager } from '../audio/SoundManager';
import {
  createModelMaterials,
  createPlayerCraft,
  createInterceptorDrone,
  createGoliathTank,
  createChronoTitan,
  createInfantrySoldier,
  createRealisticMilitaryTank,
  createPUBGSoldier,
  createTacticalBuggy,
  createYemeniFortress,
  createMilitaryWatchtower,
  createDesertAcaciaTree,
  createMilitaryOilDrum,
  createLootCrate,
  createAirdropCrate,
  createSandbagBarricade,
  createCollectible,
  createMonolith,
  createCrystalCluster,
  createCanyonRock,
  ModelMaterials,
} from './procedural/models';
import {
  createTerrainTexture,
  createRealisticTerrainTexture,
  createLandingPadTexture,
  createGlowSpriteTexture,
  createRingTexture,
} from './procedural/textures';
import { YEMEN_GOVERNORATES, YemenCity } from '../data/yemenGovernorates';
import { createAllYemenBeacons, CityBeaconNode } from './procedural/yemenBeacons';
import { WEAPON_UPGRADES, WeaponConfig } from '../data/weapons';

export type GamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';
export type CameraMode = 'CHASE' | 'ORBIT' | 'FREE_PAN';
export type PlayerRigMode = 'SOLDIER' | 'BUGGY';

export interface RadarBlip {
  id: number;
  x: number;
  z: number;
  type: 'interceptor' | 'goliath' | 'boss' | 'soldier' | 'tank';
  hpRatio: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  empCharge: number;
  empMax: number;
  score: number;
  combo: number;
  highScore: number;
  wave: number;
  kills: number;
  cameraMode?: CameraMode;
  bossHp?: number;
  bossMaxHp?: number;
  playerPos?: { x: number; z: number };
  playerHeading?: number;
  arenaRadius?: number;
  enemies?: RadarBlip[];
  selectedCity?: YemenCity;
  // Weapon Progression System & Ammo
  credits: number;
  weaponLevel: number;
  activeWeapon: WeaponConfig;
  availableWeapons: WeaponConfig[];
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  isScoped: boolean;
  playerRigMode: PlayerRigMode;
  helmetLevel: number;
  vestLevel: number;
  killFeed: string[];
  // Weapon Heat & Tactical Cooling System
  weaponHeat: number;
  isOverheated: boolean;
  // Dynamic Recoil & Crosshair Spread
  crosshairSpread: number;
  lastHitTime?: number;
  lastHitHeadshot?: boolean;
  // Structured Kill Events
  killEvents: KillEvent[];
}

export interface KillEvent {
  id: string;
  killer: string;
  victim: string;
  weaponName: string;
  isHeadshot: boolean;
  time: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  boost: boolean;
  emp: boolean;
}

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  isEnemy: boolean;
  damage: number;
  isHoming?: boolean;
  piercing?: boolean;
  color?: number;
}

interface Particle {
  mesh: THREE.Mesh | THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleDelta: number;
}

interface FloatingDamageNumber {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  initialScale: number;
}

interface EnemyActor {
  id: number;
  type: 'interceptor' | 'goliath' | 'boss' | 'soldier' | 'tank';
  group: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  fireCooldown: number;
  telegraphTimer: number; // for heavy attacks
  turret?: THREE.Group;
  barrel?: THREE.Group;
  aimTelegraph?: THREE.Line;
  chargeRings?: THREE.Mesh[];
  eye?: THREE.Mesh;
  flame?: THREE.Mesh;
  core?: THREE.Mesh;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
}

interface CollectibleItem {
  type: 'repair' | 'overdrive' | 'shard';
  group: THREE.Group;
  core: THREE.Mesh;
  rotSpeed: number;
}

// Module-scope reusable math variables to ensure ZERO GC in render loop
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  private phase: GamePhase = 'TITLE';
  private onStatsUpdate: (stats: PlayerStats, phase: GamePhase) => void;

  // Camera Controller
  private cameraMode: CameraMode = 'CHASE';
  private orbitControls: OrbitControls;

  // Materials & Player
  private mats: ModelMaterials;
  private playerGroup: THREE.Group;
  private thrusterFlames: THREE.Mesh[] = [];
  private leftCannon: THREE.Group;
  private rightCannon: THREE.Group;
  private repulsorRing: THREE.Mesh;

  // PUBG Player Rigs (Commando Soldier & Combat Buggy)
  private playerRigMode: PlayerRigMode = 'SOLDIER';
  private soldierGroup: THREE.Group | null = null;
  private soldierLeftLeg: THREE.Group | null = null;
  private soldierRightLeg: THREE.Group | null = null;
  private soldierRifle: THREE.Group | null = null;
  private soldierMuzzleTip: THREE.Group | null = null;
  private buggyGroup: THREE.Group | null = null;
  private buggyWheels: THREE.Mesh[] = [];
  private runCycle = 0;

  // Lighting & Sun
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Game state
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerRot = 0; // Yaw angle (radians)
  private playerRoll = 0;
  private playerPitch = 0;

  private hp = 100;
  private maxHp = 100;
  private shield = 100;
  private maxShield = 100;
  private energy = 100;
  private maxEnergy = 100;
  private empCharge = 100;
  private empMax = 100;
  private score = 0;
  private combo = 1;
  private comboTimer = 0;
  private highScore = 0;
  private wave = 1;
  private kills = 0;
  private shieldRegenTimer = 0;

  // Weapon Progression System & Tactical Credits
  private credits = 350;
  private weaponLevel = 1;
  private activeWeapon: WeaponConfig = WEAPON_UPGRADES[0];
  private availableWeapons: WeaponConfig[] = WEAPON_UPGRADES;

  // PUBG Tactical Ballistics & Ammo System
  private ammo = 30;
  private maxAmmo = 30;
  private reserveAmmo = 180;
  private isReloading = false;
  private reloadTimer = 0;
  private reloadTotalDuration = 1.8;

  // Aim Down Sights (ADS) Scope Zoom System
  private isScoped = false;
  private currentFov = 65;
  private targetFov = 65;

  // Gear Durability & Levels
  private helmetLevel = 3; // Iconic PUBG Level 3 Spetsnaz Altyn Helmet
  private vestLevel = 3;   // Level 3 Armored Vest

  // Live Tactical Kill Feed
  private killFeed: string[] = ['مرحباً بك في ساحة معركة اليمن - PUBG YEMEN'];
  private killEvents: KillEvent[] = [
    {
      id: 'init-1',
      killer: 'أكرم - Akram 🇾🇪',
      victim: 'معسكر تدريب العدو',
      weaponName: 'M416',
      isHeadshot: true,
      time: Date.now(),
    },
  ];

  // Weapon Heat & Forced Tactical Cooling System
  private weaponHeat = 0; // 0 to 100%
  private isOverheated = false;
  private heatCoolRate = 28;

  // Dynamic Crosshair & Recoil Spread
  private recoilSpread = 0;
  private crosshairSpread = 12;
  private lastHitTime = 0;
  private lastHitHeadshot = false;

  // Floating Arcade Damage Numbers
  private floatingDamageNumbers: FloatingDamageNumber[] = [];

  // Camera shake & hitstop
  private shakeIntensity = 0;
  private hitstopMs = 0;

  // Inputs
  private inputs: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    boost: false,
    emp: false,
  };
  private fireCooldown = 0;
  private fireAlternate = false;

  // Pools
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private enemies: EnemyActor[] = [];
  private collectibles: CollectibleItem[] = [];

  // Shockwave ring mesh
  private shockwaveRing: THREE.Mesh;
  private shockwaveActive = false;
  private shockwaveRadius = 0;

  // Enemy ID counter
  private enemyIdCounter = 1;

  // Boss
  private bossActor: EnemyActor | null = null;

  // Environment references
  private crystalNodes: THREE.Group[] = [];
  private monolithNodes: THREE.Group[] = [];

  // Imported 3D Models Support
  private importedPlayerMesh: THREE.Group | null = null;
  private showcaseModel: THREE.Group | null = null;
  private escortModel: THREE.Group | null = null;
  private originalPlayerPartsVisible = true;

  // 3D Yemen Territory Beacons
  private yemenBeacons: CityBeaconNode[] = [];
  private selectedCity: YemenCity = YEMEN_GOVERNORATES[0];

  constructor(
    container: HTMLElement,
    onStatsUpdate: (stats: PlayerStats, phase: GamePhase) => void
  ) {
    this.container = container;
    this.onStatsUpdate = onStatsUpdate;

    // Load saved high score
    const saved = localStorage.getItem('vortex_vanguard_highscore');
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0;
    }

    // 1. Scene & Realistic Daylight Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ec1e8); // Clear desert sky
    this.scene.fog = new THREE.FogExp2(0xd6c4a8, 0.0075); // Warm desert dust haze

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 450);
    this.camera.position.set(0, 4.5, 10);

    // 3. WebGLRenderer with PBR tone mapping & color space
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3.5 3D Camera Orbit, Pan, and Zoom Controller
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 2.0;
    this.orbitControls.maxDistance = 140.0;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.01;
    this.orbitControls.screenSpacePanning = true;
    this.orbitControls.enabled = false;

    // 4. Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Realistic Natural Desert Sunlight Rig
    this.keyLight = new THREE.DirectionalLight(0xfff6e8, 2.8); // Radiant warm sun
    this.keyLight.position.set(40, 55, 30);
    this.keyLight.castShadow = !isHeadless;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 180;
    const d = 60;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Natural sky blue & desert ground bounce hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x8ec1e8, 0x8a6e4d, 1.4);
    this.scene.add(this.hemiLight);

    // Subtle warm sun bounce fill
    const sunBounce = new THREE.DirectionalLight(0xd9b27c, 0.7);
    sunBounce.position.set(-35, 15, -30);
    this.scene.add(sunBounce);

    // 6. Materials & Models Setup
    this.mats = createModelMaterials();
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // 6a. Default PUBG Commando Soldier Rig (Level 3 Spetsnaz Helmet & Tactical Vest)
    const soldierData = createPUBGSoldier(this.mats, {
      isEnemy: false,
      camoType: 'desert',
    });
    this.soldierGroup = soldierData.group;
    this.soldierLeftLeg = soldierData.leftLeg;
    this.soldierRightLeg = soldierData.rightLeg;
    this.soldierRifle = soldierData.rifleGroup;
    this.soldierMuzzleTip = soldierData.muzzleTip;
    this.playerGroup.add(this.soldierGroup);

    // 6b. PUBG 4x4 Combat Buggy Rig (Alternative vehicle mode)
    const buggyData = createTacticalBuggy(this.mats);
    this.buggyGroup = buggyData.group;
    this.buggyWheels = buggyData.wheels;
    this.buggyGroup.visible = false;
    this.playerGroup.add(this.buggyGroup);

    // Fallback references for hovercraft compatibility
    this.leftCannon = new THREE.Group();
    this.rightCannon = new THREE.Group();
    this.repulsorRing = new THREE.Mesh(new THREE.BufferGeometry());

    // Soft Contact Shadow Plane beneath player
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
    playerShadow.position.y = 0.03;
    this.playerGroup.add(playerShadow);

    // EMP Shockwave Ring mesh
    const ringGeo = new THREE.PlaneGeometry(1, 1);
    ringGeo.rotateX(-Math.PI / 2);
    const ringTex = createRingTexture();
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.position.y = 0.1;
    this.scene.add(this.shockwaveRing);

    // 7. Build Atmospheric Yemeni Battleground Environment
    this.buildEnvironment();

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    this.clock = new THREE.Clock();

    // Event listeners
    this.setupListeners();

    // Start loop
    this.loop();
  }

  private buildEnvironment() {
    // 1. Realistic Desert Battleground Terrain with Sandy Ridges & Dirt Paths
    const terrainGeo = new THREE.PlaneGeometry(280, 280, 56, 56);
    terrainGeo.rotateX(-Math.PI / 2);

    // Displace outer edges to create rugged mountain basin
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 60) {
        const edgeFactor = (dist - 60) / 75;
        const h = Math.pow(edgeFactor, 1.8) * 16 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3.5;
        pos.setY(i, h);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainTex = createRealisticTerrainTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.9,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // 2. Central Military Outpost Landing Hub
    const padGeo = new THREE.PlaneGeometry(20, 20);
    padGeo.rotateX(-Math.PI / 2);
    const padTex = createLandingPadTexture();
    const padMat = new THREE.MeshStandardMaterial({
      map: padTex,
      roughness: 0.45,
      metalness: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.05;
    pad.receiveShadow = true;
    this.scene.add(pad);

    // 3. Authentic Yemeni Stone Citadels (قلعة وحصون تاريخية - تعز، صنعاء، عدن، مأرب)
    const fortLocations = [
      { x: -18, z: 28, rot: 0.4 },   // Taiz - Cairo Castle area
      { x: -14, z: -10, rot: -0.6 }, // Sana'a historical district
      { x: -8, z: 42, rot: 0.8 },    // Aden coastal fortress
      { x: 14, z: -16, rot: 0.2 },   // Marib ancient citadel
    ];

    fortLocations.forEach(({ x, z, rot }) => {
      const fort = createYemeniFortress(this.mats);
      fort.position.set(x, 0, z);
      fort.rotation.y = rot;
      this.scene.add(fort);
    });

    // 4. Tactical Military Observation Watchtowers
    const towerCoords = [
      [-32, 8],
      [28, -24],
      [-6, -42],
      [36, 32],
    ];

    towerCoords.forEach(([tx, tz]) => {
      const tower = createMilitaryWatchtower(this.mats);
      tower.position.set(tx, 0, tz);
      tower.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tower);
    });

    // 5. Sandbag Bunkers & Fuel Oil Barrels
    const bunkerCoords = [
      [-10, 14],
      [12, 10],
      [-16, -18],
      [15, -30],
      [0, 24],
    ];

    bunkerCoords.forEach(([bx, bz]) => {
      const sandbags = createSandbagBarricade();
      sandbags.position.set(bx, 0, bz);
      sandbags.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(sandbags);

      // Add adjacent oil drum
      const drum = createMilitaryOilDrum();
      drum.position.set(bx + 1.8, 0, bz + 0.6);
      this.scene.add(drum);
    });

    // 6. Desert Acacia Trees (شجر السمر والأكاسيا)
    const treeCoords = [
      [-24, -28],
      [-20, -32],
      [22, 18],
      [26, 22],
      [-38, 20],
      [42, -10],
      [6, -50],
      [-48, -12],
    ];

    treeCoords.forEach(([tx, tz]) => {
      const tree = createDesertAcaciaTree();
      tree.position.set(tx, 0, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.85 + Math.random() * 0.4;
      tree.scale.set(s, s, s);
      this.scene.add(tree);
    });

    // 7. Iconic PUBG Airdrop Crate with Billowing Red Smoke (صندوق الدروب الجوي)
    const airdrop = createAirdropCrate(this.mats);
    airdrop.position.set(18, 0, 18);
    this.scene.add(airdrop);

    // 8. Perimeter Mountain Barrier Rocks
    const numRocks = 48;
    const perimeterRadius = 88;
    for (let i = 0; i < numRocks; i++) {
      const angle = (i / numRocks) * Math.PI * 2;
      const r = perimeterRadius + (Math.random() - 0.5) * 16;
      const rock = createCanyonRock(0x8a6d4b);
      const scale = 5 + Math.random() * 7;
      rock.scale.set(scale, scale * (1.2 + Math.random() * 0.8), scale);
      rock.position.set(Math.cos(angle) * r, scale * 0.4, Math.sin(angle) * r);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(rock);
    }

    // 9. Yemen Governorates & Cities 3D Beacons
    this.yemenBeacons = createAllYemenBeacons();
    this.yemenBeacons.forEach((beacon) => {
      this.scene.add(beacon.group);
    });
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);

    // Mouse fire & ADS scope
    this.container.addEventListener('mousedown', this.handleMouseDown);
    this.container.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // If on title screen, Enter or Space starts the game
    if (this.phase === 'TITLE' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      this.startGame();
      return;
    }

    if (this.phase === 'GAME_OVER' || this.phase === 'VICTORY') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.restartGame();
        return;
      }
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      this.togglePause();
      return;
    }

    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputs.forward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputs.backward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.inputs.fire = true;
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.inputs.boost = true;
    }
    if (e.code === 'KeyQ' || e.code === 'KeyE') {
      this.triggerEMP();
    }

    // PUBG Reload Key: 'R'
    if (e.code === 'KeyR' && this.phase === 'PLAYING') {
      this.reloadWeapon();
    }

    // PUBG ADS Scope Toggle Key: 'V'
    if (e.code === 'KeyV' && this.phase === 'PLAYING') {
      this.toggleScope();
    }

    // PUBG Rig Mode Toggle Key: 'T' (Switch Soldier / Buggy)
    if (e.code === 'KeyT' && this.phase === 'PLAYING') {
      this.togglePlayerRigMode();
    }

    // Numeric Weapon Quick Switch Keys 1-5
    if (e.code === 'Digit1') this.selectWeapon(1);
    if (e.code === 'Digit2') this.selectWeapon(2);
    if (e.code === 'Digit3') this.selectWeapon(3);
    if (e.code === 'Digit4') this.selectWeapon(4);
    if (e.code === 'Digit5') this.selectWeapon(5);

    // Camera Mode Cycle Key: 'C'
    if (e.code === 'KeyC') {
      this.cycleCameraMode();
    }

    // Keyboard Zoom Controls: '+' or '=' zoom in, '-' or '_' zoom out
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.zoomCamera(-2.5);
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.zoomCamera(2.5);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputs.forward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputs.backward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = false;
    if (e.code === 'Space') this.inputs.fire = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.inputs.boost = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      if (this.phase === 'TITLE') {
        this.startGame();
      } else if (this.phase === 'PLAYING') {
        // Left click: Fire weapon in CHASE mode
        if (this.cameraMode === 'CHASE') {
          this.inputs.fire = true;
        }
      }
    } else if (e.button === 2) {
      e.preventDefault();
      // Right click: PUBG Aim-Down-Sights (ADS) Scope Toggle
      if (this.phase === 'PLAYING') {
        this.toggleScope();
      }
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.inputs.fire = false;
  };

  private handleBlur = () => {
    // Clear all held inputs on blur to prevent sticking keys
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      fire: false,
      boost: false,
      emp: false,
    };
  };

  private handleResize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Public methods for React UI integration
  public startGame() {
    soundManager.ensureAudio();
    this.phase = 'PLAYING';
    this.hp = 100;
    this.shield = 100;
    this.energy = 100;
    this.empCharge = 100;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.wave = 1;
    this.kills = 0;
    this.playerPos.set(0, 0, 0);
    this.playerVel.set(0, 0, 0);
    this.playerRot = 0;

    // Clear old enemies & projectiles
    this.cleanupCombatEntities();
    this.spawnWave(1);
    this.notifyStats();
  }

  public restartGame() {
    this.startGame();
  }

  public togglePause() {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
    }
    this.notifyStats();
  }

  public setVirtualInput(input: Partial<InputState>) {
    Object.assign(this.inputs, input);
  }

  public triggerEMP() {
    if (this.phase !== 'PLAYING') return;
    if (this.empCharge < 100) return;

    this.empCharge = 0;
    soundManager.playEMP();
    this.shakeIntensity = 0.45;
    this.hitstopMs = 40;

    // Activate shockwave ring
    this.shockwaveActive = true;
    this.shockwaveRadius = 1;
    this.shockwaveRing.position.set(this.playerPos.x, 0.3, this.playerPos.z);
    (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0.95;

    // Eliminate all enemy projectiles and damage all enemies within 35 units
    this.projectiles = this.projectiles.filter((p) => {
      if (p.isEnemy) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        return false;
      }
      return true;
    });

    this.enemies.forEach((enemy) => {
      const d = enemy.group.position.distanceTo(this.playerPos);
      if (d < 36) {
        this.damageEnemy(enemy, 90);
        // Push back
        _vecA.subVectors(enemy.group.position, this.playerPos).normalize().multiplyScalar(12);
        enemy.group.position.add(_vecA);
      }
    });

    // Particle burst
    this.spawnRadialSparks(this.playerPos, 50, 0x00f0ff);
    this.notifyStats();
  }

  private cleanupCombatEntities() {
    this.projectiles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.projectiles = [];

    this.enemies.forEach((e) => {
      this.scene.remove(e.group);
    });
    this.enemies = [];
    this.bossActor = null;

    this.collectibles.forEach((c) => {
      this.scene.remove(c.group);
    });
    this.collectibles = [];
  }

  private spawnWave(waveNum: number) {
    this.wave = waveNum;

    // Trigger Airdrop supply drop in wave 2 and 3!
    if (waveNum >= 2) {
      soundManager.playAirdropAlarm();
      this.killFeed.unshift(`🚨 تم رصد إسقاط جوي تكتيكي (Airdrop) في سماء المعركة!`);
    }

    if (waveNum === 4) {
      // BOSS WAVE: Citadel Super Heavy Battle Tank!
      this.spawnBoss();
      return;
    }

    // Number of human soldiers and heavy tanks
    const numSoldiers = 4 + waveNum * 2;
    const numTanks = Math.max(0, waveNum - 1);

    for (let i = 0; i < numSoldiers; i++) {
      const angle = (i / numSoldiers) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 32 + Math.random() * 25;
      const x = this.playerPos.x + Math.cos(angle) * dist;
      const z = this.playerPos.z + Math.sin(angle) * dist;
      this.spawnSoldier(x, z);
    }

    for (let i = 0; i < numTanks; i++) {
      const angle = ((i + 0.5) / (numTanks + 0.1)) * Math.PI * 2;
      const dist = 42 + Math.random() * 18;
      const x = this.playerPos.x + Math.cos(angle) * dist;
      const z = this.playerPos.z + Math.sin(angle) * dist;
      this.spawnTank(x, z);
    }

    this.killFeed.unshift(`⚔️ بدأت الموجة ${waveNum}: تقدم أرتال المشاة والدبابات!`);
  }

  private spawnSoldier(x: number, z: number) {
    const data = createPUBGSoldier(this.mats, { isEnemy: true });
    data.group.position.set(x, 0, z);
    this.scene.add(data.group);

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'soldier',
      group: data.group,
      hp: 50 + this.wave * 15,
      maxHp: 50 + this.wave * 15,
      speed: 8.5 + Math.random() * 2.5,
      fireCooldown: 1.5 + Math.random() * 1.5,
      telegraphTimer: 0,
      leftLeg: data.leftLeg.children[0] as THREE.Mesh,
      rightLeg: data.rightLeg.children[0] as THREE.Mesh,
      aimTelegraph: data.aimTelegraph,
      turret: data.rifleGroup,
    });
  }

  private spawnTank(x: number, z: number) {
    const data = createRealisticMilitaryTank(this.mats);
    data.group.position.set(x, 0, z);
    this.scene.add(data.group);

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'tank',
      group: data.group,
      hp: 200 + this.wave * 50,
      maxHp: 200 + this.wave * 50,
      speed: 5.5,
      fireCooldown: 3.5,
      telegraphTimer: 0,
      turret: data.turret,
      barrel: data.barrel,
      aimTelegraph: data.aimTelegraph,
    });
  }

  private spawnBoss() {
    const data = createRealisticMilitaryTank(this.mats);
    data.group.position.set(this.playerPos.x, 0, this.playerPos.z - 50);
    data.group.scale.set(2.4, 2.4, 2.4); // Giant Super-Heavy Citadel Dreadnought Tank!
    this.scene.add(data.group);

    const boss: EnemyActor = {
      id: this.enemyIdCounter++,
      type: 'boss',
      group: data.group,
      hp: 950,
      maxHp: 950,
      speed: 4.8,
      fireCooldown: 1.2,
      telegraphTimer: 0,
      turret: data.turret,
      barrel: data.barrel,
      aimTelegraph: data.aimTelegraph,
    };

    this.bossActor = boss;
    this.enemies.push(boss);

    // Also spawn 4 escort soldiers
    for (let i = 0; i < 4; i++) {
      this.spawnSoldier(this.playerPos.x + (i - 1.5) * 8, this.playerPos.z - 45);
    }

    soundManager.playWarningBeep();
    this.killFeed.unshift(`⚠️ تحذير: ظهور دبابة القلعة الحربية العملاقة (Dreadnought Tank)!`);
  }

  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const rawDt = this.clock.getDelta();
    // Clamped frame delta time (Math.min(rawDt, 0.05))
    const dt = Math.min(rawDt, 0.05);

    // Hitstop logic (simulation pause on heavy impacts)
    if (this.hitstopMs > 0) {
      this.hitstopMs -= dt * 1000;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const time = this.clock.getElapsedTime();

    if (this.phase === 'TITLE') {
      this.updateTitleScreen(dt, time);
    } else if (this.phase === 'PLAYING') {
      this.updateGame(dt, time);
    } else if (this.phase === 'PAUSED') {
      // Just render scene stationary
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateTitleScreen(dt: number, time: number) {
    // Stage an atmospheric live-world camera pan / orbit around the hero centerpiece on the Title Screen
    const orbitRadius = 9.5;
    const camX = Math.sin(time * 0.35) * orbitRadius;
    const camZ = Math.cos(time * 0.35) * orbitRadius;
    const camY = 3.8 + Math.sin(time * 0.5) * 1.0;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 1.2, 0);

    // Subtle gentle hover bob of player craft on landing pad
    this.playerGroup.position.set(0, 0.85 + Math.sin(time * 2.2) * 0.12, 0);
    this.playerGroup.rotation.y = time * 0.15;
    this.playerGroup.rotation.z = Math.sin(time * 1.5) * 0.05;

    // Animate thruster flame flicker
    const flameScale = 0.5 + Math.sin(time * 20) * 0.2;
    this.thrusterFlames.forEach((flame) => {
      flame.scale.set(flameScale, flameScale, flameScale);
    });

    // Animate crystal cluster glow
    this.crystalNodes.forEach((node, idx) => {
      node.position.y = Math.sin(time * 1.5 + idx) * 0.15;
    });

    // Animate Yemen 3D city beacons
    this.yemenBeacons.forEach((b, idx) => {
      b.crystal.rotation.y += dt * 1.6;
      b.crystal.position.y = 2.2 + Math.sin(time * 2.2 + idx) * 0.2;
      const s = 1 + Math.sin(time * 3 + idx) * 0.12;
      b.pulseRing.scale.set(s, s, s);
    });
  }

  private updateGame(dt: number, time: number) {
    // 1. Player Movement & Physics
    this.updatePlayer(dt, time);

    // 2. Weapons & Firing
    this.updateWeapons(dt);

    // 3. Projectiles
    this.updateProjectiles(dt);

    // 4. Enemies AI & Telegraphs
    this.updateEnemies(dt, time);

    // 5. Particles & Visual FX
    this.updateParticles(dt);

    // 6. Collectibles
    this.updateCollectibles(dt, time);

    // 7. Shockwave FX
    if (this.shockwaveActive) {
      this.shockwaveRadius += dt * 55;
      this.shockwaveRing.scale.set(this.shockwaveRadius, this.shockwaveRadius, 1);
      const ringMat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0, 1 - this.shockwaveRadius / 40);
      if (this.shockwaveRadius >= 40) {
        this.shockwaveActive = false;
        ringMat.opacity = 0;
      }
    }

    // 8. Shield Regeneration & Boost Energy
    if (this.shield < this.maxShield) {
      this.shieldRegenTimer += dt;
      if (this.shieldRegenTimer > 3.0) {
        this.shield = Math.min(this.maxShield, this.shield + dt * 18);
      }
    }

    if (!this.inputs.boost && this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + dt * 25);
    }

    // Passive EMP charge build
    if (this.empCharge < this.empMax) {
      this.empCharge = Math.min(this.empMax, this.empCharge + dt * 4.5);
    }

    // Combo multiplier decay
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // 9. Camera Tracking with Dynamic Bank and Shake
    this.updateCamera(dt);

    // 10. Check Wave Progression
    if (this.enemies.length === 0) {
      if (this.wave === 4 && (!this.bossActor || this.bossActor.hp <= 0)) {
        // Victory!
        this.phase = 'VICTORY';
        soundManager.playPickup();
      } else {
        // Next wave!
        this.spawnWave(this.wave + 1);
        soundManager.playPickup();
      }
    }

    // Notify React HUD
    this.notifyStats();
  }

  private updatePlayer(dt: number, time: number) {
    // Steer / Rotate
    const turnSpeed = 3.2;
    if (this.inputs.left) {
      this.playerRot += turnSpeed * dt;
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, -0.3, 10, dt);
    } else if (this.inputs.right) {
      this.playerRot -= turnSpeed * dt;
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, 0.3, 10, dt);
    } else {
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, 0, 8, dt);
    }

    // Acceleration & Boost (Tactical Sprint)
    let accel = 0;
    const isSoldier = this.playerRigMode === 'SOLDIER';
    let maxSpeed = isSoldier ? 14 : 26;

    const isBoosting = this.inputs.boost && this.energy > 8;
    if (isBoosting) {
      maxSpeed = isSoldier ? 22 : 42;
      this.energy = Math.max(0, this.energy - dt * 28);
      if (Math.random() < 0.25) {
        soundManager.playBoost();
      }
    }

    if (this.inputs.forward) {
      accel = isBoosting ? (isSoldier ? 48 : 70) : (isSoldier ? 30 : 42);
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, 0.1, 8, dt);
    } else if (this.inputs.backward) {
      accel = isSoldier ? -18 : -22;
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, -0.08, 8, dt);
    } else {
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, 0, 8, dt);
    }

    // Forward direction vector
    _vecA.set(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
    _vecB.copy(_vecA).multiplyScalar(accel * dt);
    this.playerVel.add(_vecB);

    // Realistic ground friction
    const drag = isBoosting ? 2.4 : 3.2;
    this.playerVel.multiplyScalar(Math.max(0, 1 - drag * dt));

    // Clamp max velocity
    const speed = this.playerVel.length();
    if (speed > maxSpeed) {
      this.playerVel.normalize().multiplyScalar(maxSpeed);
    }

    // Position integration
    this.playerPos.addScaledVector(this.playerVel, dt);

    // Bound player within arena radius
    const distFromOrigin = Math.sqrt(this.playerPos.x * this.playerPos.x + this.playerPos.z * this.playerPos.z);
    if (distFromOrigin > 82) {
      const clampFactor = 82 / distFromOrigin;
      this.playerPos.x *= clampFactor;
      this.playerPos.z *= clampFactor;
      this.playerVel.multiplyScalar(0.2);
    }

    // Ground positioning & Character rig animations
    this.playerGroup.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.playerGroup.rotation.set(0, this.playerRot, 0);

    if (isSoldier) {
      // Dynamic running leg stride cycle
      if (speed > 0.4) {
        this.runCycle += dt * (isBoosting ? 16 : 10);
        if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = Math.sin(this.runCycle) * 0.75;
        if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = -Math.sin(this.runCycle) * 0.75;
      } else {
        if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = THREE.MathUtils.damp(this.soldierLeftLeg.rotation.x, 0, 10, dt);
        if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = THREE.MathUtils.damp(this.soldierRightLeg.rotation.x, 0, 10, dt);
      }

      // Smooth gun recoil recovery
      if (this.soldierRifle) {
        this.soldierRifle.position.z = THREE.MathUtils.damp(this.soldierRifle.position.z, 0.28, 14, dt);
      }
    } else {
      // Buggy wheel roll animation
      this.buggyWheels.forEach((wheel) => {
        wheel.rotation.x += speed * dt * 3.5;
      });
    }

    // Move directional sunlight key shadow with player
    this.keyLight.position.set(this.playerPos.x + 35, 55, this.playerPos.z + 30);
    this.keyLight.target = this.playerGroup;
  }

  private updateWeapons(dt: number) {
    // 1. Handle Active Weapon Reload
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const needed = this.maxAmmo - this.ammo;
        const reloadAmount = Math.min(needed, this.reserveAmmo);
        this.ammo += reloadAmount;
        this.reserveAmmo -= reloadAmount;
        this.notifyStats();
      }
    }

    // 2. Weapon Heat Dissipation & Forced Cooling Management
    if (this.isOverheated) {
      // High-rate forced cooling cooldown period
      this.weaponHeat = Math.max(0, this.weaponHeat - 36 * dt);
      if (this.weaponHeat <= 0) {
        this.weaponHeat = 0;
        this.isOverheated = false;
        soundManager.playCoolingComplete();
      }
    } else {
      // Natural convective cooling when not actively shooting
      if (!this.inputs.fire) {
        this.weaponHeat = Math.max(0, this.weaponHeat - this.heatCoolRate * dt);
      }
    }

    // 3. Cooldown timer
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // 4. Fire Weapon
    if (this.inputs.fire && this.fireCooldown <= 0 && !this.isReloading && !this.isOverheated) {
      if (this.ammo <= 0) {
        this.reloadWeapon();
        return;
      }

      this.fireCooldown = this.activeWeapon.fireRate || 0.1;
      this.ammo--;

      // Weapon Heat increase
      const heatGain = this.activeWeapon.isExplosive ? 35 : this.activeWeapon.isSniper ? 22 : this.activeWeapon.id === 'm249' ? 4.2 : 7.0;
      this.weaponHeat = Math.min(100, this.weaponHeat + heatGain);
      if (this.weaponHeat >= 100) {
        this.weaponHeat = 100;
        this.isOverheated = true;
        soundManager.playOverheatWarning();
      }

      // Dynamic recoil spread impulse
      const recoilAdd = this.activeWeapon.isSniper ? 20 : this.activeWeapon.isExplosive ? 26 : 8.5;
      this.recoilSpread = Math.min(42, this.recoilSpread + recoilAdd);

      // Rifle physical recoil kick
      if (this.soldierRifle) {
        this.soldierRifle.position.z -= 0.14;
      }

      // Screen recoil camera shake
      this.shakeIntensity = this.activeWeapon.isSniper ? 0.38 : this.activeWeapon.isExplosive ? 0.45 : 0.08;

      // Calculate world position of muzzle tip
      _vecA.set(0.16, 1.18, 1.05);
      this.playerGroup.localToWorld(_vecA);

      // Direction vector with spread accuracy (tighter when scoped)
      const spread = this.isScoped ? this.activeWeapon.spread * 0.25 : this.activeWeapon.spread;
      const angle = this.playerRot + (Math.random() - 0.5) * spread;
      _vecB.set(Math.sin(angle), 0, Math.cos(angle)).normalize();

      this.spawnPlayerBullet(_vecA, _vecB, this.activeWeapon);

      // Eject spent brass shell casing
      this.spawnShellCasing(_vecA);

      // Play authentic weapon gunshot sound
      if (this.activeWeapon.id === 'm416') soundManager.playM416Shot();
      else if (this.activeWeapon.id === 'akm') soundManager.playAKMShot();
      else if (this.activeWeapon.id === 'awm') soundManager.playAWMShot();
      else if (this.activeWeapon.id === 'rpg_launcher') soundManager.playRPGShot();
      else soundManager.playM416Shot();
    }
  }

  private spawnPlayerBullet(origin: THREE.Vector3, dir: THREE.Vector3, weapon: WeaponConfig) {
    const isRPG = weapon.isExplosive;
    const isSniper = weapon.isSniper;

    const geo = isRPG
      ? new THREE.ConeGeometry(0.12, 0.8, 8)
      : new THREE.CylinderGeometry(isSniper ? 0.06 : 0.045, isSniper ? 0.06 : 0.045, isSniper ? 1.4 : 0.9, 6);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: isRPG ? 0xff4400 : weapon.color,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.scene.add(mesh);

    const speed = weapon.speed || 95;
    const velocity = dir.clone().multiplyScalar(speed);
    velocity.addScaledVector(this.playerVel, 0.3);

    this.projectiles.push({
      mesh,
      velocity,
      life: isRPG ? 2.5 : 1.6,
      isEnemy: false,
      damage: weapon.damage,
      piercing: isSniper,
    });
  }

  private spawnShellCasing(pos: THREE.Vector3) {
    const geo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Brass golden casing
      roughness: 0.3,
      metalness: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(0.2, 0, 0));
    this.scene.add(mesh);

    const right = new THREE.Vector3(Math.cos(this.playerRot), 0, -Math.sin(this.playerRot));
    const vel = right.multiplyScalar(3.0 + Math.random() * 2).add(new THREE.Vector3(0, 2.2 + Math.random() * 1.5, 0));

    this.particles.push({
      mesh,
      velocity: vel,
      life: 0.65,
      maxLife: 0.65,
      scaleDelta: 1.0,
    });
  }

  private spawnEnemyLaser(origin: THREE.Vector3, target: THREE.Vector3, speed = 40, damage = 14) {
    const dir = _vecA.subVectors(target, origin).normalize();
    const geo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3b30, // Red tracer bullet
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: dir.multiplyScalar(speed),
      life: 2.2,
      isEnemy: true,
      damage,
    });

    soundManager.playEnemyLaser();
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision
      if (!p.isEnemy) {
        // Player bullet vs enemies
        let hit = false;
        for (const enemy of this.enemies) {
          const hitRadius = enemy.type === 'boss' ? 4.8 : enemy.type === 'tank' ? 2.8 : 1.2;
          const dist = p.mesh.position.distanceTo(enemy.group.position);
          if (dist < hitRadius) {
            this.damageEnemy(enemy, p.damage, p.mesh.position);
            hit = true;
            break;
          }
        }

        if (hit) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullet vs player
        const dist = p.mesh.position.distanceTo(this.playerGroup.position);
        if (dist < 1.6) {
          this.damagePlayer(p.damage);
          this.spawnImpactSparks(p.mesh.position, 0xff1e56);
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  private damageEnemy(enemy: EnemyActor, amount: number, hitPos?: THREE.Vector3) {
    let isHeadshot = false;
    // Check if bullet struck the soldier's head (~1.45m above ground)
    if (enemy.type === 'soldier' && hitPos && hitPos.y > enemy.group.position.y + 1.4) {
      isHeadshot = true;
      amount *= 2.5; // PUBG Headshot critical multiplier!
    }

    enemy.hp -= amount;
    soundManager.playHitmarker(isHeadshot);

    if (hitPos) {
      this.spawnImpactSparks(hitPos, isHeadshot ? 0xff0044 : 0xffdd44);
    }

    if (enemy.hp <= 0) {
      this.destroyEnemy(enemy, isHeadshot);
    }
  }

  private destroyEnemy(enemy: EnemyActor, isHeadshot = false) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.scene.remove(enemy.group);

    this.kills++;
    const points = enemy.type === 'boss' ? 3000 : enemy.type === 'tank' ? 650 : 200;
    this.score += points * this.combo;

    // Tactical kill feed message
    const headshotTag = isHeadshot ? ' (Headshot 🎯)' : '';
    if (enemy.type === 'soldier') {
      this.killFeed.unshift(`🎖️ Akram eliminated [Enemy Soldier] with ${this.activeWeapon.nameEn}${headshotTag}`);
    } else if (enemy.type === 'tank') {
      this.killFeed.unshift(`💥 Akram destroyed [Armored Battle Tank] with ${this.activeWeapon.nameEn}`);
    } else if (enemy.type === 'boss') {
      this.killFeed.unshift(`🏆 Akram destroyed [Citadel Dreadnought Super Tank]!`);
    }

    if (this.killFeed.length > 5) {
      this.killFeed.pop();
    }

    // Increase combo
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = 5.0;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('vortex_vanguard_highscore', this.highScore.toString());
    }

    // Heavy explosion feedback
    const scale = enemy.type === 'boss' ? 3.5 : enemy.type === 'tank' ? 1.8 : 1.1;
    soundManager.playExplosion(scale);
    this.shakeIntensity = Math.min(0.5, 0.15 * scale);
    this.hitstopMs = enemy.type === 'boss' ? 80 : 35;

    this.spawnExplosion(enemy.group.position, scale);

    // Drop Authentic PUBG Green Military Loot Crate!
    this.spawnLootCrate(enemy.group.position);

    if (enemy.type === 'boss') {
      this.bossActor = null;
    }
  }

  private spawnLootCrate(pos: THREE.Vector3) {
    const crateGroup = createLootCrate(this.mats);
    crateGroup.position.set(pos.x, 0, pos.z);
    this.scene.add(crateGroup);

    this.collectibles.push({
      type: 'repair',
      group: crateGroup,
      core: crateGroup.children[0] as THREE.Mesh,
      rotSpeed: 0, // Loot box stays grounded
    });
  }

  private damagePlayer(amount: number) {
    this.shieldRegenTimer = 0;
    if (this.shield > 0) {
      soundManager.playShieldHit();
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
    }

    if (amount > 0) {
      soundManager.playExplosion(0.8);
      this.hp -= amount;
      this.shakeIntensity = 0.35;
      this.hitstopMs = 30;

      if (this.hp <= 0) {
        this.hp = 0;
        this.phase = 'GAME_OVER';
        soundManager.playExplosion(2.0);
        this.spawnExplosion(this.playerGroup.position, 2.5);
      }
    }
  }

  private updateEnemies(dt: number, time: number) {
    this.enemies.forEach((enemy) => {
      _vecA.subVectors(this.playerPos, enemy.group.position);
      const dist = _vecA.length();
      _vecA.normalize();

      if (enemy.type === 'soldier') {
        // Tactical Soldier AI: Run towards player, animate legs, aim rifle, fire burst
        if (dist > 16) {
          enemy.group.position.addScaledVector(_vecA, enemy.speed * dt);
        }
        enemy.group.lookAt(this.playerPos.x, enemy.group.position.y, this.playerPos.z);

        // Leg stride running animation
        if (enemy.leftLeg && enemy.rightLeg) {
          enemy.leftLeg.rotation.x = Math.sin(time * 12 + enemy.id) * 0.75;
          enemy.rightLeg.rotation.x = -Math.sin(time * 12 + enemy.id) * 0.75;
        }

        // Aiming telegraph & burst firing
        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 1.0 && dist < 42) {
          // Fade in red aiming laser
          if (enemy.aimTelegraph) {
            (enemy.aimTelegraph.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, (1.0 - enemy.fireCooldown) * 2.0);
          }

          if (enemy.fireCooldown <= 0) {
            enemy.fireCooldown = 2.4 + Math.random() * 1.2;
            if (enemy.aimTelegraph) {
              (enemy.aimTelegraph.material as THREE.LineBasicMaterial).opacity = 0;
            }

            // Burst fire 2 rounds
            _vecB.copy(enemy.group.position).add(new THREE.Vector3(0, 1.2, 0));
            this.spawnEnemyLaser(_vecB, this.playerPos, 45, 14);
          }
        }
      } else if (enemy.type === 'tank' || enemy.type === 'goliath') {
        // Armored Battle Tank: Advance, rotate turret, charge heavy 120mm shell
        if (dist > 22) {
          enemy.group.position.addScaledVector(_vecA, enemy.speed * dt);
        }
        enemy.group.lookAt(this.playerPos.x, enemy.group.position.y, this.playerPos.z);

        if (enemy.turret) {
          enemy.turret.lookAt(this.playerPos.x, enemy.turret.position.y + 0.65, this.playerPos.z);
        }

        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 1.6) {
          // Charging cannon telegraph
          if (enemy.aimTelegraph) {
            (enemy.aimTelegraph.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, (1.6 - enemy.fireCooldown) * 1.5);
          }

          if (enemy.fireCooldown <= 0) {
            enemy.fireCooldown = 4.0;
            if (enemy.aimTelegraph) {
              (enemy.aimTelegraph.material as THREE.LineBasicMaterial).opacity = 0;
            }

            _vecB.copy(enemy.group.position).add(new THREE.Vector3(0, 1.4, 0));
            this.spawnEnemyLaser(_vecB, this.playerPos, 52, 32); // Heavy cannon shell!
            soundManager.playExplosion(1.2);
          }
        }
      } else if (enemy.type === 'boss') {
        // Super Heavy Citadel Boss Tank
        if (dist > 26) {
          enemy.group.position.addScaledVector(_vecA, enemy.speed * dt);
        }
        enemy.group.lookAt(this.playerPos.x, enemy.group.position.y, this.playerPos.z);

        if (enemy.turret) {
          enemy.turret.lookAt(this.playerPos.x, enemy.turret.position.y + 1.2, this.playerPos.z);
        }

        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 0) {
          enemy.fireCooldown = 1.6;
          // Dual heavy artillery barrage!
          [-1.5, 1.5].forEach((offset) => {
            _vecB.copy(enemy.group.position).add(new THREE.Vector3(offset, 2.8, 1.5));
            this.spawnEnemyLaser(_vecB, this.playerPos, 48, 24);
          });
          soundManager.playExplosion(1.5);
        }
      }
    });
  }

  private spawnCollectible(type: 'repair' | 'overdrive' | 'shard', pos: THREE.Vector3) {
    const data = createCollectible(type, this.mats);
    data.group.position.copy(pos);
    data.group.position.y = 0.6;
    this.scene.add(data.group);

    this.collectibles.push({
      type,
      group: data.group,
      core: data.core,
      rotSpeed: 2 + Math.random() * 2,
    });
  }

  private updateCollectibles(dt: number, time: number) {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.core.rotation.y += dt * c.rotSpeed;
      c.core.rotation.x = Math.sin(time * 2) * 0.3;
      c.group.position.y = 0.6 + Math.sin(time * 3 + i) * 0.15;

      const dist = c.group.position.distanceTo(this.playerGroup.position);
      if (dist < 2.5) {
        // Collect!
        soundManager.playPickup();
        if (c.type === 'repair') {
          this.hp = Math.min(this.maxHp, this.hp + 35);
          this.shield = Math.min(this.maxShield, this.shield + 25);
        } else if (c.type === 'overdrive') {
          this.energy = this.maxEnergy;
          this.empCharge = Math.min(this.empMax, this.empCharge + 40);
        } else {
          this.score += 250 * this.combo;
        }

        this.spawnRadialSparks(c.group.position, 20, 0x00f0ff);
        this.scene.remove(c.group);
        this.collectibles.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;

      const progress = p.life / p.maxLife;
      const scale = Math.max(0.01, progress * p.scaleDelta);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if ('geometry' in p.mesh) {
          (p.mesh as THREE.Mesh).geometry.dispose();
        }
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnExplosion(center: THREE.Vector3, scale = 1.0) {
    const count = Math.floor(25 * scale);
    const spriteTex = createGlowSpriteTexture();

    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: spriteTex,
        color: i % 2 === 0 ? 0xff4500 : 0x00f0ff,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(center);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 22 * scale,
        Math.random() * 14 * scale,
        (Math.random() - 0.5) * 22 * scale
      );

      this.scene.add(sprite);
      this.particles.push({
        mesh: sprite,
        velocity: vel,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        scaleDelta: 2.5 * scale,
      });
    }
  }

  private spawnImpactSparks(center: THREE.Vector3, color: number) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.35,
        maxLife: 0.35,
        scaleDelta: 1.0,
      });
    }
  }

  private spawnRadialSparks(center: THREE.Vector3, count: number, color: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 14 + Math.random() * 10;
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color, blending: THREE.AdditiveBlending });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);

      const vel = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 4, Math.sin(angle) * speed);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.55,
        maxLife: 0.55,
        scaleDelta: 1.2,
      });
    }
  }

  private spawnExhaustParticle(pos: THREE.Vector3, color: number) {
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);

    const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2);

    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: vel,
      life: 0.28,
      maxLife: 0.28,
      scaleDelta: 0.8,
    });
  }

  private updateCamera(dt: number) {
    // 1. Orbit and Free Pan Camera Modes
    if (this.cameraMode === 'ORBIT' || this.cameraMode === 'FREE_PAN') {
      if (this.cameraMode === 'ORBIT') {
        // Orbit smoothly around player hovercraft
        this.orbitControls.target.lerp(this.playerPos, dt * 6);
      }
      this.orbitControls.update();
      return;
    }

    // Dynamic Camera FOV transition for Scoped ADS mode
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 12, dt);
      this.camera.updateProjectionMatrix();
    }

    // 2. Dynamic Chase Camera (Default) with spring follow and roll damping
    const followDist = this.isScoped ? 3.8 : 9.0;
    const followHeight = this.isScoped ? 1.9 : 4.2;

    // Target position behind player (slightly right-offset shoulder cam when scoped)
    _vecA.set(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
    _vecB.copy(this.playerPos).addScaledVector(_vecA, -followDist);
    if (this.isScoped) {
      const rightVec = new THREE.Vector3(Math.cos(this.playerRot), 0, -Math.sin(this.playerRot));
      _vecB.addScaledVector(rightVec, 0.45);
    }
    _vecB.y += followHeight;

    // Smooth exponential damping
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _vecB.x, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _vecB.y, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _vecB.z, 8, dt);

    // Look slightly ahead of player
    _vecC.copy(this.playerPos).addScaledVector(_vecA, 8.0);
    _vecC.y += this.isScoped ? 1.35 : 1.2;
    this.camera.lookAt(_vecC);

    // Camera shake application
    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 10, dt);
    }
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    if (mode === 'ORBIT' || mode === 'FREE_PAN') {
      this.orbitControls.enabled = true;
      if (mode === 'ORBIT') {
        this.orbitControls.target.copy(this.playerPos);
      }
      this.orbitControls.update();
    } else {
      this.orbitControls.enabled = false;
    }
    this.notifyStats();
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public cycleCameraMode() {
    const modes: CameraMode[] = ['CHASE', 'ORBIT', 'FREE_PAN'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.setCameraMode(modes[nextIdx]);
    soundManager.playLaser(1.4);
  }

  public zoomCamera(delta: number) {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.camera.position.addScaledVector(dir, -delta);
    if (this.orbitControls.enabled) {
      this.orbitControls.update();
    }
  }

  public resetCamera() {
    this.setCameraMode('CHASE');
    this.camera.position.set(this.playerPos.x, this.playerPos.y + 4.2, this.playerPos.z - 9.0);
    this.camera.lookAt(this.playerPos);
  }

  private notifyStats() {
    this.onStatsUpdate(
      {
        hp: Math.round(this.hp),
        maxHp: this.maxHp,
        shield: Math.round(this.shield),
        maxShield: this.maxShield,
        energy: Math.round(this.energy),
        maxEnergy: this.maxEnergy,
        empCharge: Math.round(this.empCharge),
        empMax: this.empMax,
        score: this.score,
        combo: this.combo,
        highScore: this.highScore,
        wave: this.wave,
        kills: this.kills,
        cameraMode: this.cameraMode,
        bossHp: this.bossActor ? Math.max(0, Math.round(this.bossActor.hp)) : undefined,
        bossMaxHp: this.bossActor ? this.bossActor.maxHp : undefined,
        playerPos: { x: this.playerPos.x, z: this.playerPos.z },
        playerHeading: this.playerRot,
        arenaRadius: 80,
        selectedCity: this.selectedCity,
        credits: this.credits,
        weaponLevel: this.weaponLevel,
        activeWeapon: this.activeWeapon,
        availableWeapons: this.availableWeapons,
        ammo: this.ammo,
        maxAmmo: this.maxAmmo,
        reserveAmmo: this.reserveAmmo,
        isReloading: this.isReloading,
        reloadProgress: this.isReloading ? Math.max(0, 1 - this.reloadTimer / (this.reloadTotalDuration || 1.8)) : 0,
        isScoped: this.isScoped,
        playerRigMode: this.playerRigMode,
        helmetLevel: this.helmetLevel,
        vestLevel: this.vestLevel,
        killFeed: [...this.killFeed],
        enemies: this.enemies.map((e) => ({
          id: e.id,
          x: e.group.position.x,
          z: e.group.position.z,
          type: e.type,
          hpRatio: Math.max(0, e.hp / e.maxHp),
        })),
      },
      this.phase
    );
  }

  public reloadWeapon() {
    if (this.isReloading || this.ammo >= this.maxAmmo || this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadTotalDuration = this.activeWeapon.reloadTime || 1.8;
    this.reloadTimer = this.reloadTotalDuration;
    soundManager.playReload();
    this.notifyStats();
  }

  public toggleScope() {
    this.isScoped = !this.isScoped;
    this.targetFov = this.isScoped ? (this.activeWeapon.isSniper ? 22 : 36) : 65;
    soundManager.playLaser(1.5);
    this.notifyStats();
  }

  public setPlayerRigMode(mode: PlayerRigMode) {
    this.playerRigMode = mode;
    if (mode === 'SOLDIER') {
      if (this.soldierGroup) this.soldierGroup.visible = true;
      if (this.buggyGroup) this.buggyGroup.visible = false;
    } else {
      if (this.soldierGroup) this.soldierGroup.visible = false;
      if (this.buggyGroup) this.buggyGroup.visible = true;
    }
    soundManager.playBoost();
    this.notifyStats();
  }

  public togglePlayerRigMode() {
    this.setPlayerRigMode(this.playerRigMode === 'SOLDIER' ? 'BUGGY' : 'SOLDIER');
  }

  public upgradeWeapon(targetLevel?: number): boolean {
    const nextLevel = targetLevel || this.weaponLevel + 1;
    const upgrade = this.availableWeapons.find((w) => w.level === nextLevel);
    if (!upgrade) return false;

    if (this.credits >= upgrade.cost) {
      this.credits -= upgrade.cost;
      this.weaponLevel = nextLevel;
      this.activeWeapon = upgrade;
      this.maxAmmo = upgrade.magazineSize || 30;
      this.ammo = this.maxAmmo;
      if (this.isScoped) {
        this.targetFov = upgrade.isSniper ? 22 : 36;
      }
      soundManager.playUpgradeFanfare();
      this.spawnRadialSparks(this.playerPos, 45, upgrade.color);
      this.notifyStats();
      return true;
    }
    return false;
  }

  public selectWeapon(level: number) {
    const weapon = this.availableWeapons.find((w) => w.level === level);
    if (weapon && level <= this.weaponLevel) {
      this.activeWeapon = weapon;
      this.maxAmmo = weapon.magazineSize || 30;
      this.ammo = Math.min(this.ammo, this.maxAmmo);
      if (this.isScoped) {
        this.targetFov = weapon.isSniper ? 22 : 36;
      }
      soundManager.playLaser(1.2);
      this.notifyStats();
    }
  }

  public getCredits(): number {
    return this.credits;
  }

  public teleportToYemenCity(cityId: string) {
    const city = YEMEN_GOVERNORATES.find((c) => c.id === cityId);
    if (!city) return;
    this.selectedCity = city;
    this.playerPos.set(city.coord3D.x, 0, city.coord3D.z + 3);
    this.playerVel.set(0, 0, 0);
    this.spawnRadialSparks(this.playerPos, 35, parseInt(city.color.replace('#', '0x'), 16));
    soundManager.playBoost();
    this.notifyStats();
  }

  public getSelectedCity(): YemenCity {
    return this.selectedCity;
  }

  // ==========================================
  // IMPORTED 3D MODEL DISPLAY & MANAGEMENT
  // ==========================================

  public displayImportedModel(
    importedGroup: THREE.Group,
    mode: 'player' | 'showcase' | 'escort' = 'player'
  ) {
    if (mode === 'player') {
      // Clean up previously imported player mesh if any
      if (this.importedPlayerMesh) {
        this.playerGroup.remove(this.importedPlayerMesh);
        this.importedPlayerMesh = null;
      }

      // Hide or show the procedural hull parts
      this.playerGroup.traverse((child) => {
        // Keep thrusters and cannons functional, hide base procedural hull
        if (child !== this.playerGroup && child.name !== 'keep_visible') {
          if ((child as THREE.Mesh).isMesh && child !== this.repulsorRing) {
            child.visible = false;
          }
        }
      });
      this.originalPlayerPartsVisible = false;

      // Add imported model into player's flight rig
      this.importedPlayerMesh = importedGroup;
      this.importedPlayerMesh.position.set(0, 0.4, 0);
      this.playerGroup.add(this.importedPlayerMesh);

    } else if (mode === 'showcase') {
      // Remove old showcase model if any
      if (this.showcaseModel) {
        this.scene.remove(this.showcaseModel);
        this.showcaseModel = null;
      }

      // Place on landing pad showcase pedestal
      this.showcaseModel = importedGroup;
      this.showcaseModel.position.set(0, 1.8, 0);
      this.scene.add(this.showcaseModel);

    } else if (mode === 'escort') {
      // Remove old escort if any
      if (this.escortModel) {
        this.scene.remove(this.escortModel);
        this.escortModel = null;
      }

      this.escortModel = importedGroup;
      this.escortModel.position.copy(this.playerPos).add(new THREE.Vector3(-4, 1.5, -2));
      this.scene.add(this.escortModel);
    }
  }

  public updateImportedMaterial(options: {
    color?: string;
    metalness?: number;
    roughness?: number;
    wireframe?: boolean;
  }) {
    const targetGroups = [this.importedPlayerMesh, this.showcaseModel, this.escortModel].filter(Boolean) as THREE.Group[];

    targetGroups.forEach((group) => {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat) {
            if (options.color) mat.color.set(options.color);
            if (options.metalness !== undefined) mat.metalness = options.metalness;
            if (options.roughness !== undefined) mat.roughness = options.roughness;
            if (options.wireframe !== undefined) mat.wireframe = options.wireframe;
            mat.needsUpdate = true;
          }
        }
      });
    });
  }

  public resetImportedModel() {
    if (this.importedPlayerMesh) {
      this.playerGroup.remove(this.importedPlayerMesh);
      this.importedPlayerMesh = null;
    }

    if (this.showcaseModel) {
      this.scene.remove(this.showcaseModel);
      this.showcaseModel = null;
    }

    if (this.escortModel) {
      this.scene.remove(this.escortModel);
      this.escortModel = null;
    }

    // Restore default procedural player hull
    this.playerGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.visible = true;
      }
    });
    this.originalPlayerPartsVisible = true;
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mouseup', this.handleMouseUp);

    this.cleanupCombatEntities();
    this.resetImportedModel();
    this.scene.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

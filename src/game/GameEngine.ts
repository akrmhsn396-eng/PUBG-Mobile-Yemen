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
  createSupersonicFighterJet,
  createArmoredPersonnelCarrier,
  ModelMaterials,
} from './procedural/models';
import {
  createPanoramicSkyDome,
  createPanoramicMountainRidge,
  createPanoramicVantagePoints,
} from './procedural/panoramicVista';
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
import {
  EnvironmentalHazard,
  PlayerHazardState,
  HazardMeshInstance,
  PROCEDURAL_HAZARDS,
  createHazardMesh,
  animateHazardInstances,
  evaluatePlayerHazardExposure,
} from './procedural/environmentalHazards';
import {
  getTerrainHeight,
  getTerrainNormal,
  createArenaTerrainMesh,
  createArenaBoundaryPylons,
} from './procedural/terrainSystem';

export type GamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';
export type CameraMode = 'CHASE' | 'ORBIT' | 'FREE_PAN' | 'PANORAMIC';
export type PlayerRigMode = 'SOLDIER' | 'BUGGY';
export type PlayerStance = 'STAND' | 'CROUCH' | 'PRONE';

export interface RadarBlip {
  id: number;
  x: number;
  z: number;
  type: 'interceptor' | 'goliath' | 'boss' | 'soldier' | 'tank' | 'jet' | 'apc';
  hpRatio: number;
  screenX?: number;
  screenY?: number;
  isBehind?: boolean;
  distance?: number;
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
  lockedTargetEnemyId?: number | null;
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
  playerStance: PlayerStance;
  isPanoramic?: boolean;
  isCinematicLetterbox?: boolean;
  combatBranches?: {
    jets: number;
    tanks: number;
    apcs: number;
    soldiers: number;
  };
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
  lastHitDamage?: number;
  floatingDamage?: Array<{
    id: number;
    screenX: number;
    screenY: number;
    isBehind: boolean;
    damage: number;
    isHeadshot: boolean;
    life: number;
  }>;
  // Structured Kill Events
  killEvents: KillEvent[];
  missionTime?: number;
  missionCountdown?: number;
  xp: number;
  nextLevelXp: number;
  playerLevel: number;
  combatIntensity?: number;
  combatLog?: Array<{
    id: string;
    text: string;
    type: 'damage' | 'kill' | 'warning' | 'info';
    time: number;
  }>;
  droneActive?: boolean;
  droneCooldown?: number;
  comboTimer?: number;
  jetCooldown?: number;
  reinforcementsCooldown?: number;
  weather?: WeatherStats;
  hazards?: EnvironmentalHazard[];
  hazardState?: PlayerHazardState;
}

export type WeatherType = 'CLEAR' | 'STORMY' | 'SANDSTORM';

export interface WeatherStats {
  type: WeatherType;
  nameAr: string;
  nameEn: string;
  icon: string;
  visibilityPct: number;
  windSpeedKmh: number;
  windDirection: string;
  physicsEffectAr: string;
  nextChangeSeconds: number;
}

export const WEATHER_CONFIGS: Record<
  WeatherType,
  {
    nameAr: string;
    nameEn: string;
    icon: string;
    descriptionAr: string;
    visibilityPct: number;
    windSpeedKmh: number;
    windDirection: string;
    physicsEffectAr: string;
    fogColor: THREE.Color;
    fogDensity: number;
    skyColor: THREE.Color;
    sunColor: THREE.Color;
    sunIntensity: number;
    hemiSkyColor: THREE.Color;
    hemiGroundColor: THREE.Color;
    hemiIntensity: number;
    dragMultiplier: number;
    turnSpeedMultiplier: number;
    accelMultiplier: number;
    windPush: THREE.Vector3;
  }
> = {
  CLEAR: {
    nameAr: 'صحو صحراوي',
    nameEn: 'Clear Desert',
    icon: '☀️',
    descriptionAr: 'رؤية كاملة واحتكاك طبيعي متوازن',
    visibilityPct: 100,
    windSpeedKmh: 14,
    windDirection: 'شمالي خفيف',
    physicsEffectAr: 'تحكم قياسي متوازن',
    fogColor: new THREE.Color(0xd6c4a8),
    fogDensity: 0.0075,
    skyColor: new THREE.Color(0x8ec1e8),
    sunColor: new THREE.Color(0xfff6e8),
    sunIntensity: 2.8,
    hemiSkyColor: new THREE.Color(0x8ec1e8),
    hemiGroundColor: new THREE.Color(0x8a6e4d),
    hemiIntensity: 1.4,
    dragMultiplier: 1.0,
    turnSpeedMultiplier: 1.0,
    accelMultiplier: 1.0,
    windPush: new THREE.Vector3(0, 0, 0),
  },
  STORMY: {
    nameAr: 'عاصفة رعدية ممطرة',
    nameEn: 'Stormy Tempest',
    icon: '⛈️',
    descriptionAr: 'أمطار غزيرة وصواعق - أرضية رطبة وانزلاق مائي حاد',
    visibilityPct: 45,
    windSpeedKmh: 68,
    windDirection: 'جنوبي غربي',
    physicsEffectAr: 'انزلاق مائي وانخفاض الاحتكاك (Drift)',
    fogColor: new THREE.Color(0x242d38),
    fogDensity: 0.022,
    skyColor: new THREE.Color(0x1a2330),
    sunColor: new THREE.Color(0x8ea0b8),
    sunIntensity: 0.65,
    hemiSkyColor: new THREE.Color(0x354354),
    hemiGroundColor: new THREE.Color(0x1d242c),
    hemiIntensity: 0.6,
    dragMultiplier: 0.55,
    turnSpeedMultiplier: 0.82,
    accelMultiplier: 0.9,
    windPush: new THREE.Vector3(-4.5, 0, -3.0),
  },
  SANDSTORM: {
    nameAr: 'عاصفة رملية خماسين',
    nameEn: 'Haboob Sandstorm',
    icon: '🌪️',
    descriptionAr: 'رياح رملية عاتية تعيق الرؤية وتدفع المركبة',
    visibilityPct: 20,
    windSpeedKmh: 85,
    windDirection: 'شرقي هائج',
    physicsEffectAr: 'مقاومة رملية وضغط رياح عاتية',
    fogColor: new THREE.Color(0xc48443),
    fogDensity: 0.038,
    skyColor: new THREE.Color(0x995b28),
    sunColor: new THREE.Color(0xdf8a3c),
    sunIntensity: 0.85,
    hemiSkyColor: new THREE.Color(0xb26c30),
    hemiGroundColor: new THREE.Color(0x5a3112),
    hemiIntensity: 0.75,
    dragMultiplier: 1.45,
    turnSpeedMultiplier: 0.84,
    accelMultiplier: 0.8,
    windPush: new THREE.Vector3(12.5, 0, 6.0),
  },
};

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
  isExplosive?: boolean;
  splashRadius?: number;
  targetEnemyId?: number;
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
  type: 'interceptor' | 'goliath' | 'boss' | 'soldier' | 'tank' | 'jet' | 'apc';
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
  private lastHitDamage = 0;

  // Floating Arcade Damage Numbers
  private floatingDamageItems: Array<{
    id: number;
    worldPos: THREE.Vector3;
    damage: number;
    isHeadshot: boolean;
    life: number;
  }> = [];

  // Camera shake & hitstop
  private shakeIntensity = 0;
  private hitstopMs = 0;

  // Mission Timer & Objective Countdown
  private missionTime = 0;
  private missionCountdown = 300;

  // Player XP & Leveling System for Weapon Mods & Upgrades
  private xp = 0;
  private playerLevel = 1;
  private nextLevelXp = 400;

  private addXp(amount: number) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.playerLevel++;
      this.nextLevelXp = Math.round(this.nextLevelXp * 1.35);
      this.credits += 300;
      this.killFeed.unshift(`⭐ LEVEL UP! Reached Level ${this.playerLevel}! Weapon Mods Unlocked! +300 Credits 🪙`);
      soundManager.playPickup();
      this.shakeIntensity = 0.3;
    }
  }

  private combatLogMessages: Array<{
    id: string;
    text: string;
    type: 'damage' | 'kill' | 'warning' | 'info';
    time: number;
  }> = [];

  private logCombat(text: string, type: 'damage' | 'kill' | 'warning' | 'info') {
    this.combatLogMessages.unshift({
      id: Math.random().toString(),
      text,
      type,
      time: Date.now(),
    });
    if (this.combatLogMessages.length > 6) {
      this.combatLogMessages.pop();
    }
  }

  // Tactical Drone Support System (UAV Recon)
  private droneActive = false;
  private droneTimer = 0;
  private droneCooldownTimer = 0;
  private droneMesh: THREE.Group | null = null;

  public deployDrone() {
    if (this.phase !== 'PLAYING' || this.droneActive || this.droneCooldownTimer > 0) return;

    this.droneActive = true;
    this.droneTimer = 12.0;
    this.droneCooldownTimer = 25.0;

    if (!this.droneMesh) {
      const droneGroup = new THREE.Group();
      const bodyGeo = new THREE.ConeGeometry(0.6, 1.2, 6);
      bodyGeo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2, emissive: 0x0088ff, emissiveIntensity: 0.5 });
      const body = new THREE.Mesh(bodyGeo, mat);
      droneGroup.add(body);
      this.droneMesh = droneGroup;
      this.scene.add(this.droneMesh);
    }

    soundManager.playAirdropAlarm();
    this.logCombat('UAV Recon Drone deployed: Enemy positions revealed!', 'info');
    this.killFeed.unshift(`🚁 تم نشر طائرة استطلاع تكتيكية (UAV Recon) - تم الكشف عن مواقع الأعداء!`);
  }

  // Panoramic Sky & 4 War Branches Systems
  private playerStance: PlayerStance = 'STAND';
  private isCinematicLetterbox = false;
  private footstepTimer = 0;
  private crawlCycle = 0;
  private panoramicSky: THREE.Mesh | null = null;
  private panoramicMountains: THREE.Group | null = null;
  private panoramicVantage: THREE.Group | null = null;
  private panoramicPatrolJets: Array<{
    group: THREE.Group;
    baseAltitude: number;
    speed: number;
    angle: number;
    radius: number;
  }> = [];

  // Fighter Jet Air Support System (سرب مقاتلات نفاثة)
  private jetCooldownTimer = 0;
  private activeJets: Array<{ group: THREE.Group; velocity: THREE.Vector3; life: number }> = [];

  public callFighterJetStrike() {
    if (this.phase !== 'PLAYING' || this.jetCooldownTimer > 0) return;

    this.jetCooldownTimer = 35.0;

    // Spawn 2 Supersonic Fighter Jets in tactical pincer formation
    for (let i = 0; i < 2; i++) {
      const jetData = createSupersonicFighterJet(this.mats);
      const jetGroup = jetData.group;

      const startX = this.playerPos.x + (i === 0 ? -85 : 85);
      const startZ = this.playerPos.z - 75;
      jetGroup.position.set(startX, 42, startZ);
      jetGroup.rotation.y = i === 0 ? 0.35 : -0.35;
      jetGroup.rotation.z = i === 0 ? -0.2 : 0.2; // banking turn

      this.scene.add(jetGroup);
      this.activeJets.push({
        group: jetGroup,
        velocity: new THREE.Vector3((i === 0 ? 1 : -1) * 18, -3, 62),
        life: 4.8,
      });

      // Spawn missile smoke contrail behind jet
      this.spawnExhaustParticle(jetGroup.position, 0x00d2ff);
    }

    // Heavy carpet bomb on all ground targets
    this.enemies.forEach((enemy) => {
      this.damageEnemy(enemy, 380, enemy.group.position);
      this.spawnExplosion(enemy.group.position, 2.2);
    });

    soundManager.playAWMShot();
    soundManager.playLaser(0.6);
    this.logCombat('Fighter Jet CAS Airstrike executed! Mach 2 strike neutralized targets.', 'kill');
    this.killFeed.unshift(`✈️ غارة جوية نفاثة خارقة للصوت (Supersonic CAS Jet Strike) - قصف مدمر لجميع الأهداف!`);
    this.shakeIntensity = 0.75;
  }

  // Human Soldier Stance System (وقوف 🧍 / انحناء 🧎 / زحف 🚼)
  public setPlayerStance(stance: PlayerStance) {
    if (this.playerStance === stance) return;
    this.playerStance = stance;
    soundManager.playHumanStanceChange();
    const stanceAr =
      stance === 'STAND'
        ? 'وقوف قتالي 🧍'
        : stance === 'CROUCH'
        ? 'انحناء تكتيكي 🧎 (ثبات +50%)'
        : 'زحف قتالي أرضي 🚼 (ثبات قناص +85% وتخفٍ كامل)';
    this.logCombat(`Stance changed: ${stanceAr}`, 'info');
    this.notifyStats();
  }

  public togglePlayerStance() {
    if (this.playerStance === 'STAND') {
      this.setPlayerStance('CROUCH');
    } else if (this.playerStance === 'CROUCH') {
      this.setPlayerStance('PRONE');
    } else {
      this.setPlayerStance('STAND');
    }
  }

  // Panoramic Vista Mode Toggle (المشهد البانورامي 360°)
  public togglePanoramicMode(enabled?: boolean) {
    const next = enabled !== undefined ? enabled : this.cameraMode !== 'PANORAMIC';
    this.cameraMode = next ? 'PANORAMIC' : 'CHASE';
    if (next) {
      soundManager.playPanoramicVistaChime();
      this.targetFov = 92;
      this.logCombat('Panoramic Vista Mode active! 360° Theater & Mountain Horizons.', 'info');
      this.killFeed.unshift('🔭 تفعيل المشهد البانورامي 360° - استعراض مسرح المعركة وسلاسل الجبال اليمنية!');
    } else {
      this.targetFov = 65;
      this.logCombat('Standard Chase Camera restored.', 'info');
    }
    this.notifyStats();
  }

  // 21:9 Ultrawide Cinema Letterbox Toggle
  public toggleCinematicLetterbox(enabled?: boolean) {
    this.isCinematicLetterbox = enabled !== undefined ? enabled : !this.isCinematicLetterbox;
    this.notifyStats();
  }

  // Tactical Medkit & Stim Healing
  public useMedkit() {
    if (this.phase !== 'PLAYING') return;
    if (this.hp >= this.maxHp && this.energy >= this.maxEnergy) {
      this.logCombat('Health & Stamina already at 100%!', 'info');
      return;
    }
    this.hp = Math.min(this.maxHp, this.hp + 60);
    this.energy = Math.min(this.maxEnergy, this.energy + 50);
    soundManager.playPickup();
    this.spawnRadialSparks(this.playerPos, 24, 0x10b981);
    this.logCombat('Medkit Used: +60 HP, +50 Stamina Restored!', 'damage');
    this.killFeed.unshift('💉 استخدام حقيبة إسعافات تكتيكية وأدرينالين - تعافي فوري للأنسجة واللياقة!');
    this.notifyStats();
  }

  // Military Reinforcements System (تعزيزات عسكرية)
  private reinforcementsCooldownTimer = 0;

  public callMilitaryReinforcements() {
    if (this.phase !== 'PLAYING' || this.reinforcementsCooldownTimer > 0) return;

    this.reinforcementsCooldownTimer = 40.0;
    this.shield = Math.min(this.maxShield, this.shield + 50);
    this.ammo = this.maxAmmo;
    this.reserveAmmo += 120;
    this.credits += 500;

    soundManager.playPickup();
    this.logCombat('Military Reinforcements arrived: +50 Shield, Full Ammo, +500 Credits!', 'kill');
    this.killFeed.unshift(`🎖️ وصول التعزيزات العسكرية الميدانية: +50 درع، ذخيرة كاملة، +500 رصيد!`);
    this.shakeIntensity = 0.4;
  }

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
  private lockedTargetEnemyId: number | null = null;

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

  // Dynamic Weather System (Clear, Stormy, Sandstorm)
  private currentWeather: WeatherType = 'CLEAR';
  private weatherTimer = 45;
  private lightningTimer = 8;
  private isLightningFlashing = false;
  private lightningFlashTime = 0;
  private windSoundTimer = 6;
  private rainPoints!: THREE.Points;
  private rainGeom!: THREE.BufferGeometry;
  private rainPositions!: Float32Array;
  private sandPoints!: THREE.Points;
  private sandGeom!: THREE.BufferGeometry;
  private sandPositions!: Float32Array;
  private currentDragMultiplier = 1.0;
  private currentTurnSpeedMultiplier = 1.0;
  private currentAccelMultiplier = 1.0;
  private currentWindPush = new THREE.Vector3(0, 0, 0);

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

    // 6c. Dynamic Weather Particle Systems (Rain & Sandstorm)
    this.initWeatherParticles();

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

    // 10. 360° Panoramic Sky Dome & Mountain Amphitheater (المشهد البانورامي الشامل وسلاسل الجبال)
    this.panoramicSky = createPanoramicSkyDome(320);
    this.scene.add(this.panoramicSky);

    this.panoramicMountains = createPanoramicMountainRidge(210);
    this.scene.add(this.panoramicMountains);

    const vantage = createPanoramicVantagePoints();
    this.panoramicVantage = vantage.group;
    this.scene.add(this.panoramicVantage);

    // 11. High-Altitude Panoramic Supersonic Fighter Jets Patrol (سرب طائرات حربية نفاثة في السماء)
    for (let j = 0; j < 2; j++) {
      const jet = createSupersonicFighterJet(this.mats);
      jet.group.scale.set(1.6, 1.6, 1.6);
      this.scene.add(jet.group);
      this.panoramicPatrolJets.push({
        group: jet.group,
        baseAltitude: 72 + j * 16,
        speed: 0.28 + j * 0.08,
        angle: j * Math.PI,
        radius: 130 + j * 28,
      });
    }
  }

  private initWeatherParticles() {
    // 1. Torrential Rain Particle System (1,200 particles)
    const rainCount = 1200;
    this.rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3 + 0] = (Math.random() - 0.5) * 90;
      this.rainPositions[i * 3 + 1] = Math.random() * 45;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    this.rainGeom = new THREE.BufferGeometry();
    this.rainGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x9dc7f5,
      size: 0.38,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.rainPoints = new THREE.Points(this.rainGeom, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    // 2. Swirling Sandstorm Particle System (1,500 dust particles)
    const sandCount = 1500;
    this.sandPositions = new Float32Array(sandCount * 3);
    for (let i = 0; i < sandCount; i++) {
      this.sandPositions[i * 3 + 0] = (Math.random() - 0.5) * 90;
      this.sandPositions[i * 3 + 1] = Math.random() * 22 + 0.2;
      this.sandPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    this.sandGeom = new THREE.BufferGeometry();
    this.sandGeom.setAttribute('position', new THREE.BufferAttribute(this.sandPositions, 3));
    const sandMat = new THREE.PointsMaterial({
      color: 0xd99b54,
      size: 0.65,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.sandPoints = new THREE.Points(this.sandGeom, sandMat);
    this.sandPoints.visible = false;
    this.scene.add(this.sandPoints);
  }

  private updateWeather(dt: number, time: number) {
    // 1. Natural Weather Cycle Progression (every 45s)
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const order: WeatherType[] = ['CLEAR', 'STORMY', 'SANDSTORM'];
      const nextIdx = (order.indexOf(this.currentWeather) + 1) % order.length;
      this.setWeather(order[nextIdx]);
    }

    const config = WEATHER_CONFIGS[this.currentWeather];

    // 2. Smoothly damp Fog, Sky & Sunlight to target parameters
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, config.fogDensity, 1.2, dt);
      this.scene.fog.color.lerp(config.fogColor, dt * 1.5);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(config.skyColor, dt * 1.5);
    }

    // Lightning Flash Effect during Storm
    if (this.currentWeather === 'STORMY') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 6 + Math.random() * 8;
        this.isLightningFlashing = true;
        this.lightningFlashTime = 0.12;
        soundManager.playThunder();
        this.shakeIntensity = Math.max(this.shakeIntensity, 0.35);
      }
      if (this.isLightningFlashing) {
        this.lightningFlashTime -= dt;
        if (this.lightningFlashTime <= 0) {
          this.isLightningFlashing = false;
        }
      }
    } else {
      this.isLightningFlashing = false;
    }

    const targetSunIntensity = this.isLightningFlashing ? 6.5 : config.sunIntensity;
    const targetSunColor = this.isLightningFlashing ? new THREE.Color(0xddeeff) : config.sunColor;

    this.keyLight.color.lerp(targetSunColor, dt * 2.5);
    this.keyLight.intensity = THREE.MathUtils.damp(this.keyLight.intensity, targetSunIntensity, 2.0, dt);
    this.hemiLight.color.lerp(config.hemiSkyColor, dt * 1.5);
    this.hemiLight.groundColor.lerp(config.hemiGroundColor, dt * 1.5);
    this.hemiLight.intensity = THREE.MathUtils.damp(this.hemiLight.intensity, config.hemiIntensity, 1.2, dt);

    // 3. Audio Cues for Sandstorm
    if (this.currentWeather === 'SANDSTORM') {
      this.windSoundTimer -= dt;
      if (this.windSoundTimer <= 0) {
        this.windSoundTimer = 5 + Math.random() * 6;
        soundManager.playWindGust();
      }
    }

    // 4. Update Rain Particles
    this.rainPoints.visible = this.currentWeather === 'STORMY';
    if (this.rainPoints.visible) {
      const pos = this.rainPositions;
      const count = pos.length / 3;
      const pX = this.playerPos.x;
      const pZ = this.playerPos.z;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= 54 * dt;
        pos[i * 3 + 0] -= 12 * dt;
        pos[i * 3 + 2] -= 8 * dt;

        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 42;
        if (pos[i * 3 + 0] < pX - 45) pos[i * 3 + 0] = pX + 45;
        if (pos[i * 3 + 0] > pX + 45) pos[i * 3 + 0] = pX - 45;
        if (pos[i * 3 + 2] < pZ - 45) pos[i * 3 + 2] = pZ + 45;
        if (pos[i * 3 + 2] > pZ + 45) pos[i * 3 + 2] = pZ - 45;
      }
      this.rainGeom.attributes.position.needsUpdate = true;
    }

    // 5. Update Sandstorm Dust Particles
    this.sandPoints.visible = this.currentWeather === 'SANDSTORM';
    if (this.sandPoints.visible) {
      const pos = this.sandPositions;
      const count = pos.length / 3;
      const pX = this.playerPos.x;
      const pZ = this.playerPos.z;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 0] += 34 * dt;
        pos[i * 3 + 2] += 16 * dt;
        pos[i * 3 + 1] += Math.sin(time * 3 + i) * 2 * dt;

        if (pos[i * 3 + 0] > pX + 50) pos[i * 3 + 0] = pX - 50;
        if (pos[i * 3 + 2] > pZ + 50) pos[i * 3 + 2] = pZ - 50;
        if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 20;
        if (pos[i * 3 + 1] > 22) pos[i * 3 + 1] = 0.5;
      }
      this.sandGeom.attributes.position.needsUpdate = true;
    }

    // 6. Smooth Physics Modifiers
    this.currentDragMultiplier = THREE.MathUtils.damp(this.currentDragMultiplier, config.dragMultiplier, 2.0, dt);
    this.currentTurnSpeedMultiplier = THREE.MathUtils.damp(this.currentTurnSpeedMultiplier, config.turnSpeedMultiplier, 2.0, dt);
    this.currentAccelMultiplier = THREE.MathUtils.damp(this.currentAccelMultiplier, config.accelMultiplier, 2.0, dt);
    this.currentWindPush.lerp(config.windPush, dt * 2.0);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.weatherTimer = 45;
    
    if (type === 'STORMY') {
      this.killFeed.unshift(`⛈️ تحذير جوي: عاصفة رعدية ممطرة! انزلاق مائي وضعف التماسك.`);
      this.logCombat('Weather Alert: Stormy tempest active! Wet ground and increased drift.', 'warning');
      soundManager.playThunder();
    } else if (type === 'SANDSTORM') {
      this.killFeed.unshift(`🌪️ إنذار عاصفة خماسين: عاصفة رملية عاتية! انعدام الرؤية ومقاومة حركية وضغط رياح.`);
      this.logCombat('Weather Alert: Haboob Sandstorm active! Low visibility and heavy wind drag.', 'warning');
      soundManager.playWindGust();
    } else {
      this.killFeed.unshift(`☀️ استقرار الأجواء: طقس صحراوي صافٍ! الرؤية كاملة والتحكم قياسي متوازن.`);
      this.logCombat('Weather Update: Clear skies restored. Optimal visibility and traction.', 'info');
    }
    this.notifyStats();
  }

  public cycleWeather() {
    const order: WeatherType[] = ['CLEAR', 'STORMY', 'SANDSTORM'];
    const nextIdx = (order.indexOf(this.currentWeather) + 1) % order.length;
    this.setWeather(order[nextIdx]);
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);

    // Mouse fire & ADS scope & pointer aim
    this.container.addEventListener('mousedown', this.handleMouseDown);
    this.container.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('mousemove', this.handleMouseMove);
    this.container.addEventListener('touchmove', this.handleTouchMove);
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.phase !== 'PLAYING') return;
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const targetRot = Math.atan2(mouseX, mouseY);
    this.playerRot = THREE.MathUtils.lerp(this.playerRot, targetRot, 0.18);
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.phase !== 'PLAYING' || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const touchY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    const targetRot = Math.atan2(touchX, touchY);
    this.playerRot = THREE.MathUtils.lerp(this.playerRot, targetRot, 0.22);
  };

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
    if (e.code === 'KeyF' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.deployDrone();
    }
    if (e.code === 'KeyB' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.callFighterJetStrike();
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

    // Dynamic Weather Cycle Key: 'G'
    if (e.code === 'KeyG' && this.phase === 'PLAYING') {
      this.cycleWeather();
    }

    // Human Soldier Stance: 'C' (Crouch/Stand toggle), 'Z' (Prone Crawl)
    if (e.code === 'KeyC' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.togglePlayerStance();
    }
    if (e.code === 'KeyZ' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.setPlayerStance(this.playerStance === 'PRONE' ? 'STAND' : 'PRONE');
    }

    // Panoramic 360° Vista Mode Key: 'X'
    if (e.code === 'KeyX' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.togglePanoramicMode();
    }

    // Tactical Medkit Key: 'H'
    if (e.code === 'KeyH' && this.phase === 'PLAYING') {
      e.preventDefault();
      this.useMedkit();
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
    this.missionTime = 0;
    this.missionCountdown = 300;
    this.xp = 0;
    this.playerLevel = 1;
    this.nextLevelXp = 400;
    this.combatLogMessages = [];
    this.logCombat('Mission Started: Yemen Sector 1', 'info');
    this.droneActive = false;
    this.droneTimer = 0;
    this.droneCooldownTimer = 0;
    if (this.droneMesh) {
      this.scene.remove(this.droneMesh);
      this.droneMesh = null;
    }
    this.jetCooldownTimer = 0;
    this.activeJets.forEach((j) => this.scene.remove(j.group));
    this.activeJets = [];
    this.setWeather('CLEAR');
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

  // Direct manual targeting on enemy by ID (توجيه يدوي مباشر على العدو)
  public targetEnemyById(enemyId: number, autoAdvance: boolean = true) {
    if (this.phase !== 'PLAYING') return;
    const target = this.enemies.find((e) => e.id === enemyId);
    if (!target) return;

    this.lockedTargetEnemyId = enemyId;
    const dx = target.group.position.x - this.playerPos.x;
    const dz = target.group.position.z - this.playerPos.z;
    this.playerRot = Math.atan2(dx, dz);

    if (autoAdvance) {
      this.inputs.forward = true;
      this.inputs.fire = true;
      setTimeout(() => {
        // Stop continuous firing pulse after 350ms, keep moving
        this.inputs.fire = false;
      }, 350);
    }

    soundManager.playTargetLock();
    const typeAr =
      target.type === 'boss'
        ? 'الزعيم دبابة القلعة الخارقة'
        : target.type === 'tank'
        ? 'دبابة مدرعة'
        : 'جندي مشاة';
    const dist = Math.round(this.playerPos.distanceTo(target.group.position));
    this.logCombat(`🎯 استهداف يدوي مباشر: ${typeAr} (${dist}م)`, 'info');
    this.notifyStats();
  }

  public clearTargetLock() {
    this.lockedTargetEnemyId = null;
    this.notifyStats();
  }

  // Direct manual drag direction steering (سحب يدوي حر بدل الأزرار)
  public setManualDragDirection(angle: number, isMoving: boolean, autoFire: boolean = false) {
    if (this.phase !== 'PLAYING') return;
    if (isMoving) {
      this.playerRot = angle;
      this.inputs.forward = true;
      if (autoFire) {
        this.inputs.fire = true;
      }
    } else {
      this.inputs.forward = false;
      this.inputs.fire = false;
    }
  }

  // Direct touch on 3D battlefield plane or on enemy (لمس الشاشة للتوجيه والتحرك نحو العدو)
  public manualTouchMoveTowards(screenX: number, screenY: number, autoFire: boolean = false) {
    if (this.phase !== 'PLAYING') return;
    const rect = this.container.getBoundingClientRect();
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetPoint = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, targetPoint);

    if (hit) {
      // Check if tap was near an enemy (within 8 units)
      let nearestEnemy: EnemyActor | null = null;
      let minEnemyDist = 8.0;
      for (const enemy of this.enemies) {
        const d = targetPoint.distanceTo(enemy.group.position);
        if (d < minEnemyDist) {
          minEnemyDist = d;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        this.targetEnemyById(nearestEnemy.id, true);
        return;
      }

      // Rotate player directly towards tapped position and move forward
      const dx = targetPoint.x - this.playerPos.x;
      const dz = targetPoint.z - this.playerPos.z;
      this.playerRot = Math.atan2(dx, dz);
      this.inputs.forward = true;
      if (autoFire) {
        this.inputs.fire = true;
      }
    }
  }

  public stopManualMove() {
    this.inputs.forward = false;
    this.inputs.fire = false;
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

    if (waveNum >= 2) {
      soundManager.playAirdropAlarm();
      this.killFeed.unshift(`🚨 تم رصد إسقاط جوي تكتيكي (Airdrop) في سماء المعركة!`);
    }

    if (waveNum === 7) {
      // FINAL BOSS WAVE: Citadel Super Dreadnought Mega Tank!
      this.spawnBoss();
      this.killFeed.unshift(`⚠️ إنذار أحمر: ظهور دبابة القلعة الخارقة العملاقة (Citadel Dreadnought Super Tank)!`);
      return;
    }

    const titles = [
      'الموجة 1: دورية الطليعة الاستطلاعية (Vanguard Patrol)',
      'الموجة 2: أرتال الدبابات المدرعة الصحراوية (Armor Column)',
      'الموجة 3: غارة الكوماندوز النخبة (Elite Commando Raid)',
      'الموجة 4: حصار القلعة والمدفعية الثقيلة (Citadel Siege)',
      'الموجة 5: الهجوم الميكانيكي الشامل (Mechanized Assault)',
      'الموجة 6: كمين عاصفة الصحراء النارية (Sandstorm Ambush)',
    ];

    const numSoldiers = 4 + waveNum * 3;
    const numTanks = Math.max(1, Math.floor(waveNum / 2));
    const numAPCs = waveNum >= 2 ? Math.max(1, Math.floor(waveNum / 2)) : 0;

    for (let i = 0; i < numSoldiers; i++) {
      const angle = (i / numSoldiers) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 30 + Math.random() * 28;
      const x = this.playerPos.x + Math.cos(angle) * dist;
      const z = this.playerPos.z + Math.sin(angle) * dist;
      this.spawnSoldier(x, z);
    }

    for (let i = 0; i < numTanks; i++) {
      const angle = ((i + 0.5) / (numTanks + 0.1)) * Math.PI * 2;
      const dist = 40 + Math.random() * 20;
      const x = this.playerPos.x + Math.cos(angle) * dist;
      const z = this.playerPos.z + Math.sin(angle) * dist;
      this.spawnTank(x, z);
    }

    for (let i = 0; i < numAPCs; i++) {
      const angle = ((i + 0.25) / (numAPCs + 0.1)) * Math.PI * 2;
      const dist = 38 + Math.random() * 18;
      const x = this.playerPos.x + Math.cos(angle) * dist;
      const z = this.playerPos.z + Math.sin(angle) * dist;
      this.spawnAPC(x, z);
    }

    this.killFeed.unshift(`⚔️ ${titles[waveNum - 1] || `الموجة ${waveNum}`} بدأت!`);
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

  private spawnAPC(x: number, z: number) {
    const data = createArmoredPersonnelCarrier(this.mats);
    data.group.position.set(x, 0, z);
    this.scene.add(data.group);

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'apc',
      group: data.group,
      hp: 140 + this.wave * 35,
      maxHp: 140 + this.wave * 35,
      speed: 6.8,
      fireCooldown: 2.2,
      telegraphTimer: 0,
      turret: data.turret,
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
    this.missionTime += dt;
    this.missionCountdown = Math.max(0, this.missionCountdown - dt);

    // Dynamic Weather Cycle & Atmospheric Simulation
    this.updateWeather(dt, time);

    // UAV Drone update
    if (this.droneActive) {
      this.droneTimer -= dt;
      if (this.droneMesh) {
        const angle = time * 2.5;
        const dx = Math.cos(angle) * 14;
        const dz = Math.sin(angle) * 14;
        this.droneMesh.position.set(this.playerPos.x + dx, 9 + Math.sin(time * 4) * 1.5, this.playerPos.z + dz);
        this.droneMesh.rotation.y = -angle;
      }
      if (this.droneTimer <= 0) {
        this.droneActive = false;
        if (this.droneMesh) {
          this.scene.remove(this.droneMesh);
          this.droneMesh = null;
        }
        this.logCombat('UAV Recon Drone returned to base.', 'info');
      }
    }
    if (this.droneCooldownTimer > 0) {
      this.droneCooldownTimer -= dt;
    }

    // Fighter Jets update
    if (this.jetCooldownTimer > 0) {
      this.jetCooldownTimer -= dt;
    }
    if (this.reinforcementsCooldownTimer > 0) {
      this.reinforcementsCooldownTimer -= dt;
    }
    for (let i = this.activeJets.length - 1; i >= 0; i--) {
      const jet = this.activeJets[i];
      jet.life -= dt;
      jet.group.position.addScaledVector(jet.velocity, dt);
      if (jet.life <= 0) {
        this.scene.remove(jet.group);
        this.activeJets.splice(i, 1);
      }
    }

    // Panoramic Patrol Jets High in Sky
    this.panoramicPatrolJets.forEach((jet) => {
      jet.angle += jet.speed * dt * 0.4;
      jet.group.position.x = Math.cos(jet.angle) * jet.radius;
      jet.group.position.z = Math.sin(jet.angle) * jet.radius;
      jet.group.position.y = jet.baseAltitude + Math.sin(jet.angle * 2) * 4;
      jet.group.rotation.y = -jet.angle + Math.PI / 2;
      jet.group.rotation.z = -0.18;
    });

    // 1. Player Movement & Physics
    this.updatePlayer(dt, time);

    // 2. Weapons & Firing
    this.updateWeapons(dt);

    // 3. Projectiles
    this.updateProjectiles(dt);

    // 4. Enemies AI & Telegraphs
    this.updateEnemies(dt, time);

    // 5. Particles & Visual FX & Floating Damage
    this.updateParticles(dt);
    this.updateFloatingDamage(dt);

    // Decay recoil spread & update dynamic crosshair spread
    this.recoilSpread = Math.max(0, this.recoilSpread - dt * 25);
    const isMoving = this.inputs.forward || this.inputs.backward || this.inputs.left || this.inputs.right;
    const isBoosting = this.inputs.boost;
    let baseSpread = 10;
    if (isBoosting) baseSpread = 26;
    else if (isMoving) baseSpread = 16;
    
    this.crosshairSpread = THREE.MathUtils.damp(
      this.crosshairSpread,
      baseSpread + this.recoilSpread,
      14,
      dt
    );

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
      if (this.wave === 7 && (!this.bossActor || this.bossActor.hp <= 0)) {
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
    // Steer / Rotate (modified by weather traction)
    const turnSpeed = 4.5 * this.currentTurnSpeedMultiplier;
    if (this.inputs.left) {
      this.playerRot += turnSpeed * dt;
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, -0.3, 12, dt);
    } else if (this.inputs.right) {
      this.playerRot -= turnSpeed * dt;
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, 0.3, 12, dt);
    } else {
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, 0, 10, dt);
    }

    // Manual Enemy Target Lock Tracking (توجيه يدوي مباشر ومستمر نحو العدو المحدد)
    if (this.lockedTargetEnemyId !== null) {
      const lockedEnemy = this.enemies.find((e) => e.id === this.lockedTargetEnemyId);
      if (lockedEnemy && lockedEnemy.hp > 0) {
        const dx = lockedEnemy.group.position.x - this.playerGroup.position.x;
        const dz = lockedEnemy.group.position.z - this.playerGroup.position.z;
        const enemyAngle = Math.atan2(dx, dz);
        this.playerRot = THREE.MathUtils.lerp(this.playerRot, enemyAngle, 0.35);
      } else {
        this.lockedTargetEnemyId = null;
      }
    }

    // Smart Auto-Aim towards nearest enemy when firing or pointing
    if (this.inputs.fire && this.enemies.length > 0 && this.lockedTargetEnemyId === null) {
      let nearestEnemy: EnemyActor | null = null;
      let minDist = Infinity;
      for (const enemy of this.enemies) {
        const d = this.playerGroup.position.distanceTo(enemy.group.position);
        if (d < minDist) {
          minDist = d;
          nearestEnemy = enemy;
        }
      }
      if (nearestEnemy && minDist < 60) {
        const targetPos = nearestEnemy.group.position;
        const dx = targetPos.x - this.playerGroup.position.x;
        const dz = targetPos.z - this.playerGroup.position.z;
        const enemyAngle = Math.atan2(dx, dz);
        this.playerRot = THREE.MathUtils.lerp(this.playerRot, enemyAngle, 0.25);
      }
    }

    // Acceleration & Boost (Tactical Sprint)
    let accel = 0;
    const isSoldier = this.playerRigMode === 'SOLDIER';
    let maxSpeed = isSoldier ? 17 : 28;

    // Stance Speed Multiplier & Recoil Stabilization
    if (isSoldier) {
      if (this.playerStance === 'CROUCH') {
        maxSpeed *= 0.7;
        this.crosshairSpread = Math.min(this.crosshairSpread, 0.4);
      } else if (this.playerStance === 'PRONE') {
        maxSpeed *= 0.38; // Crawling speed
        this.crosshairSpread = Math.min(this.crosshairSpread, 0.12); // Rock solid prone sniper stability
      }
    }

    // Weather impact on max speed
    const weatherMaxSpeedMod = this.currentWeather === 'SANDSTORM' ? 0.88 : (this.currentWeather === 'STORMY' ? 1.05 : 1.0);
    maxSpeed *= weatherMaxSpeedMod;

    const isBoosting = this.inputs.boost && this.energy > 8;
    if (isBoosting) {
      maxSpeed = isSoldier ? (this.playerStance === 'PRONE' ? 9 : 25) : 45;
      this.energy = Math.max(0, this.energy - dt * 26);
      if (Math.random() < 0.25) {
        soundManager.playBoost();
      }
    }

    if (this.inputs.forward) {
      accel = (isBoosting ? (isSoldier ? 55 : 75) : (isSoldier ? 36 : 48)) * this.currentAccelMultiplier;
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, 0.1, 10, dt);
    } else if (this.inputs.backward) {
      accel = (isSoldier ? -22 : -26) * this.currentAccelMultiplier;
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, -0.08, 10, dt);
    } else {
      this.playerPitch = THREE.MathUtils.damp(this.playerPitch, 0, 10, dt);
    }

    // Forward direction vector
    _vecA.set(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
    _vecB.copy(_vecA).multiplyScalar(accel * dt);
    this.playerVel.add(_vecB);

    // Weather Wind Push Force
    this.playerVel.addScaledVector(this.currentWindPush, dt);

    // Realistic ground friction modified by weather condition
    const baseDrag = isBoosting ? 2.4 : 3.2;
    const drag = baseDrag * this.currentDragMultiplier;
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

    if (isSoldier && this.soldierGroup) {
      if (this.playerStance === 'PRONE') {
        // Prone Crawling: Lower body down to ground level and pitch horizontal
        this.soldierGroup.position.y = THREE.MathUtils.damp(this.soldierGroup.position.y, 0.22, 12, dt);
        this.soldierGroup.rotation.x = THREE.MathUtils.damp(this.soldierGroup.rotation.x, -Math.PI / 2.25, 12, dt);

        if (speed > 0.1) {
          this.crawlCycle += dt * 7.5;
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = Math.sin(this.crawlCycle) * 0.45;
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = -Math.sin(this.crawlCycle) * 0.45;

          this.footstepTimer -= dt;
          if (this.footstepTimer <= 0) {
            this.footstepTimer = 0.42;
            soundManager.playHumanFootstep(false, true);
          }
        } else {
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = 0;
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = 0;
        }
      } else if (this.playerStance === 'CROUCH') {
        // Low Tactical Crouch
        this.soldierGroup.position.y = THREE.MathUtils.damp(this.soldierGroup.position.y, -0.32, 12, dt);
        this.soldierGroup.rotation.x = THREE.MathUtils.damp(this.soldierGroup.rotation.x, 0.22, 12, dt);

        if (speed > 0.3) {
          this.runCycle += dt * 8;
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = Math.sin(this.runCycle) * 0.55;
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = -Math.sin(this.runCycle) * 0.55;

          this.footstepTimer -= dt;
          if (this.footstepTimer <= 0) {
            this.footstepTimer = 0.36;
            soundManager.playHumanFootstep(false, false);
          }
        } else {
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = 0;
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = 0;
        }
      } else {
        // Standard Standing Stance
        this.soldierGroup.position.y = THREE.MathUtils.damp(this.soldierGroup.position.y, 0, 12, dt);
        this.soldierGroup.rotation.x = THREE.MathUtils.damp(this.soldierGroup.rotation.x, 0, 12, dt);

        if (speed > 0.4) {
          this.runCycle += dt * (isBoosting ? 16 : 10);
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = Math.sin(this.runCycle) * 0.75;
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = -Math.sin(this.runCycle) * 0.75;

          this.footstepTimer -= dt;
          if (this.footstepTimer <= 0) {
            this.footstepTimer = isBoosting ? 0.22 : 0.32;
            soundManager.playHumanFootstep(isBoosting, false);
          }
        } else {
          // Idle human breathing chest sway
          this.soldierGroup.position.y = Math.sin(time * 2.4) * 0.02;
          if (this.soldierLeftLeg) this.soldierLeftLeg.rotation.x = THREE.MathUtils.damp(this.soldierLeftLeg.rotation.x, 0, 10, dt);
          if (this.soldierRightLeg) this.soldierRightLeg.rotation.x = THREE.MathUtils.damp(this.soldierRightLeg.rotation.x, 0, 10, dt);
        }
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

  private updateFloatingDamage(dt: number) {
    for (let i = this.floatingDamageItems.length - 1; i >= 0; i--) {
      const item = this.floatingDamageItems[i];
      item.life -= dt * 1.25;
      item.worldPos.y += dt * 1.8;
      if (item.life <= 0) {
        this.floatingDamageItems.splice(i, 1);
      }
    }
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

    this.lastHitTime = Date.now();
    this.lastHitHeadshot = isHeadshot;
    this.lastHitDamage = amount;

    this.floatingDamageItems.push({
      id: Math.random(),
      worldPos: hitPos ? hitPos.clone() : enemy.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)),
      damage: Math.round(amount),
      isHeadshot,
      life: 1.0,
    });

    this.notifyStats();

    this.logCombat(
      isHeadshot ? `Critical Hit! -${Math.round(amount)} HP` : `Hit: -${Math.round(amount)} HP`,
      isHeadshot ? 'damage' : 'info'
    );

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

    const xpReward = enemy.type === 'boss' ? 1200 : enemy.type === 'tank' ? 350 : 120;
    this.addXp(Math.round(xpReward * (isHeadshot ? 1.5 : 1.0)));

    // Tactical kill feed message
    const headshotTag = isHeadshot ? ' (Headshot 🎯)' : '';
    if (enemy.type === 'soldier') {
      this.killFeed.unshift(`🎖️ Akram eliminated [Enemy Soldier] with ${this.activeWeapon.nameEn}${headshotTag}`);
    } else if (enemy.type === 'tank') {
      this.killFeed.unshift(`💥 Akram destroyed [Armored Battle Tank] with ${this.activeWeapon.nameEn}`);
    } else if (enemy.type === 'apc') {
      this.killFeed.unshift(`🚙 Akram destroyed [Combat Armored APC] with ${this.activeWeapon.nameEn}`);
    } else if (enemy.type === 'boss') {
      this.killFeed.unshift(`🏆 Akram destroyed [Citadel Dreadnought Super Tank]!`);
    }

    if (this.killFeed.length > 5) {
      this.killFeed.pop();
    }

    const targetName =
      enemy.type === 'boss'
        ? 'Citadel Dreadnought'
        : enemy.type === 'tank'
        ? 'Armored Tank'
        : enemy.type === 'apc'
        ? 'Combat APC'
        : 'Enemy Soldier';
    this.logCombat(`Target Destroyed: ${targetName}`, 'kill');

    const victimName =
      enemy.type === 'boss'
        ? 'Citadel Dreadnought 🏆'
        : enemy.type === 'tank'
        ? 'Armored Tank 💥'
        : enemy.type === 'apc'
        ? 'Combat APC 🚙'
        : 'Enemy Soldier 👤';
    this.killEvents.unshift({
      id: Math.random().toString(),
      killer: 'Akram 🎖️',
      victim: victimName,
      weaponName: this.activeWeapon.nameEn,
      isHeadshot,
      time: Date.now(),
    });
    if (this.killEvents.length > 5) {
      this.killEvents.pop();
    }

    // Increase combo & play escalating pitch kill streak audio feedback
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = 5.0;
    soundManager.playKillStreak(this.combo);

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
      } else if (enemy.type === 'apc') {
        // Armored Personnel Carrier: Flank player, rotate autocannon turret, fire 3-round burst
        if (dist > 18) {
          enemy.group.position.addScaledVector(_vecA, enemy.speed * dt);
        }
        enemy.group.lookAt(this.playerPos.x, enemy.group.position.y, this.playerPos.z);
        if (enemy.turret) {
          enemy.turret.lookAt(this.playerPos.x, enemy.turret.position.y + 0.45, this.playerPos.z);
        }

        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 0 && dist < 48) {
          enemy.fireCooldown = 2.8;
          // Rapid autocannon burst
          _vecB.copy(enemy.group.position).add(new THREE.Vector3(0, 1.3, 0));
          this.spawnEnemyLaser(_vecB, this.playerPos, 50, 15);
          soundManager.playLaser(0.8);
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
        this.orbitControls.target.lerp(this.playerPos, dt * 6);
      }
      this.orbitControls.update();
      return;
    }

    // 2. Majestic 360° Panoramic Vista Camera Mode
    if (this.cameraMode === 'PANORAMIC') {
      const panoTargetFov = 92;
      if (Math.abs(this.camera.fov - panoTargetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, panoTargetFov, 10, dt);
        this.camera.updateProjectionMatrix();
      }

      // High vantage pull-back showing mountain horizons, air theater, and ground troops
      _vecA.set(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
      _vecB.copy(this.playerPos).addScaledVector(_vecA, -17.5);
      _vecB.y += 8.2;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _vecB.x, 6, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _vecB.y, 6, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _vecB.z, 6, dt);

      _vecC.copy(this.playerPos).addScaledVector(_vecA, 14.0);
      _vecC.y += 2.2;
      this.camera.lookAt(_vecC);
      return;
    }

    // Dynamic Camera FOV transition for Scoped ADS mode
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 12, dt);
      this.camera.updateProjectionMatrix();
    }

    // 3. Dynamic Chase Camera (Default) with spring follow and roll damping
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
        comboTimer: this.comboTimer,
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
        playerStance: this.playerStance,
        isPanoramic: this.cameraMode === 'PANORAMIC',
        isCinematicLetterbox: this.isCinematicLetterbox,
        jetCooldown: Math.max(0, this.jetCooldownTimer),
        reinforcementsCooldown: Math.max(0, this.reinforcementsCooldownTimer),
        combatBranches: {
          jets: Math.max(2, this.panoramicPatrolJets.length + this.activeJets.length),
          tanks: this.enemies.filter((e) => e.type === 'tank' || e.type === 'boss').length,
          apcs: this.enemies.filter((e) => e.type === 'apc').length,
          soldiers: this.enemies.filter((e) => e.type === 'soldier').length,
        },
        helmetLevel: this.helmetLevel,
        vestLevel: this.vestLevel,
        killFeed: [...this.killFeed],
        weaponHeat: this.weaponHeat,
        isOverheated: this.isOverheated,
        crosshairSpread: this.crosshairSpread,
        killEvents: [...this.killEvents],
        missionTime: this.missionTime,
        missionCountdown: this.missionCountdown,
        xp: this.xp,
        nextLevelXp: this.nextLevelXp,
        playerLevel: this.playerLevel,
        combatIntensity: 0.5,
        combatLog: [...this.combatLogMessages],
        droneActive: this.droneActive,
        droneCooldown: Math.max(0, this.droneCooldownTimer),
        weather: {
          type: this.currentWeather,
          nameAr: WEATHER_CONFIGS[this.currentWeather].nameAr,
          nameEn: WEATHER_CONFIGS[this.currentWeather].nameEn,
          icon: WEATHER_CONFIGS[this.currentWeather].icon,
          visibilityPct: WEATHER_CONFIGS[this.currentWeather].visibilityPct,
          windSpeedKmh: WEATHER_CONFIGS[this.currentWeather].windSpeedKmh,
          windDirection: WEATHER_CONFIGS[this.currentWeather].windDirection,
          physicsEffectAr: WEATHER_CONFIGS[this.currentWeather].physicsEffectAr,
          nextChangeSeconds: Math.max(0, Math.round(this.weatherTimer)),
        },
        lastHitTime: this.lastHitTime,
        lastHitHeadshot: this.lastHitHeadshot,
        lastHitDamage: this.lastHitDamage,
        lockedTargetEnemyId: this.lockedTargetEnemyId,
        enemies: this.enemies.map((e) => {
          const v = _vecB.copy(e.group.position);
          v.y += e.type === 'boss' ? 3.0 : 1.6;
          v.project(this.camera);
          const p2d = new THREE.Vector2(this.playerPos.x, this.playerPos.z);
          const e2d = new THREE.Vector2(e.group.position.x, e.group.position.z);
          const dist = p2d.distanceTo(e2d);
          return {
            id: e.id,
            x: e.group.position.x,
            z: e.group.position.z,
            type: e.type,
            hpRatio: Math.max(0, e.hp / e.maxHp),
            screenX: (v.x * 0.5 + 0.5) * (this.container.clientWidth || window.innerWidth),
            screenY: (-(v.y * 0.5) + 0.5) * (this.container.clientHeight || window.innerHeight),
            isBehind: v.z > 1.0,
            distance: Math.round(dist),
          };
        }),
        floatingDamage: this.floatingDamageItems.map((item) => {
          const v = _vecA.copy(item.worldPos);
          v.project(this.camera);
          return {
            id: item.id,
            damage: item.damage,
            isHeadshot: item.isHeadshot,
            screenX: (v.x * 0.5 + 0.5) * window.innerWidth,
            screenY: (-(v.y * 0.5) + 0.5) * window.innerHeight,
            isBehind: v.z > 1.0,
            life: item.life,
          };
        }),
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

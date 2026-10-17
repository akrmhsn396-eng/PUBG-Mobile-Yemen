import * as THREE from 'three';
import {
  createTechPanelTexture,
  createMilitaryCamoTexture,
  createYemeniStoneTexture,
} from './textures';

/**
 * Procedural 3-12 Part Composite Models conforming to Three.js guidelines:
 * - 3 silhouette scales: Primary silhouette, Secondary read, Accent detail
 * - Roughness varied by >= 0.25 between adjacent parts
 * - Bottom-center pivot flush with terrain
 * - 100% procedural geometries and textures
 */

// Shared reusable materials
export interface ModelMaterials {
  hullDark: THREE.MeshStandardMaterial;
  hullLight: THREE.MeshPhysicalMaterial;
  metalChassis: THREE.MeshStandardMaterial;
  glowCyan: THREE.MeshStandardMaterial;
  glowCrimson: THREE.MeshStandardMaterial;
  glowAmber: THREE.MeshStandardMaterial;
  glassCanopy: THREE.MeshPhysicalMaterial;
  exhaustFlame: THREE.MeshBasicMaterial;
  enemyHull: THREE.MeshStandardMaterial;
  heavyArmor: THREE.MeshStandardMaterial;
  // Realistic PUBG Military Materials
  desertCamo: THREE.MeshStandardMaterial;
  militaryOlive: THREE.MeshStandardMaterial;
  spetsnazSteel: THREE.MeshStandardMaterial;
  gunMetal: THREE.MeshStandardMaterial;
  yemeniStone: THREE.MeshStandardMaterial;
}

export function createModelMaterials(): ModelMaterials {
  const techTexture = createTechPanelTexture('#131d2a', '#0b121b', '#00e5ff');
  const enemyTexture = createTechPanelTexture('#261214', '#17090b', '#ff2255');
  const heavyTexture = createTechPanelTexture('#212328', '#14161a', '#ff9900');
  const desertCamoTex = createMilitaryCamoTexture('desert');
  const yemeniStoneTex = createYemeniStoneTexture();

  return {
    hullDark: new THREE.MeshStandardMaterial({
      map: techTexture,
      roughness: 0.3,
      metalness: 0.85,
    }),
    hullLight: new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      roughness: 0.2,
      metalness: 0.7,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    }),
    metalChassis: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.55,
      metalness: 0.9,
    }),
    glowCyan: new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00c8e6,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.2,
    }),
    glowCrimson: new THREE.MeshStandardMaterial({
      color: 0xff1e56,
      emissive: 0xff003f,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.2,
    }),
    glowAmber: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.2,
    }),
    glassCanopy: new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      ior: 1.5,
      thickness: 1.2,
      transparent: true,
      opacity: 0.9,
    }),
    exhaustFlame: new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }),
    enemyHull: new THREE.MeshStandardMaterial({
      map: enemyTexture,
      roughness: 0.45,
      metalness: 0.8,
    }),
    heavyArmor: new THREE.MeshStandardMaterial({
      map: heavyTexture,
      roughness: 0.6,
      metalness: 0.85,
    }),
    desertCamo: new THREE.MeshStandardMaterial({
      map: desertCamoTex,
      roughness: 0.85,
      metalness: 0.15,
    }),
    militaryOlive: new THREE.MeshStandardMaterial({
      color: 0x384131,
      roughness: 0.75,
      metalness: 0.35,
    }),
    spetsnazSteel: new THREE.MeshStandardMaterial({
      color: 0x22262b,
      roughness: 0.38,
      metalness: 0.9,
    }),
    gunMetal: new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.32,
      metalness: 0.95,
    }),
    yemeniStone: new THREE.MeshStandardMaterial({
      map: yemeniStoneTex,
      roughness: 0.92,
      metalness: 0.08,
    }),
  };
}

/**
 * HERO CRAFT: Vortex Vanguard (10 distinct parts)
 * Silhouette: Aerodynamic high-tech anti-gravity fighter skimmer
 */
export function createPlayerCraft(mats: ModelMaterials): {
  group: THREE.Group;
  thrusterFlames: THREE.Mesh[];
  leftCannon: THREE.Group;
  rightCannon: THREE.Group;
  repulsorRing: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Primary Silhouette: Faceted Main Fuselage
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, 2.4);
  hullShape.lineTo(0.9, 0.6);
  hullShape.lineTo(0.8, -1.8);
  hullShape.lineTo(-0.8, -1.8);
  hullShape.lineTo(-0.9, 0.6);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.6,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.18,
    bevelThickness: 0.18,
  });
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.center();
  const hull = new THREE.Mesh(hullGeo, mats.hullDark);
  hull.position.y = 0.55;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // 2. Secondary Read: Cockpit Canopy (Crystalline Glass)
  const canopyGeo = new THREE.ConeGeometry(0.42, 1.3, 6);
  canopyGeo.rotateX(Math.PI / 2);
  canopyGeo.scale(1, 0.5, 1.8);
  const canopy = new THREE.Mesh(canopyGeo, mats.glassCanopy);
  canopy.position.set(0, 0.88, 0.25);
  canopy.castShadow = true;
  group.add(canopy);

  // 3. Secondary Read: Swept Back Outrigger Wings (Left & Right)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.2, -0.9);
  wingShape.lineTo(2.3, -1.6);
  wingShape.lineTo(0.3, -1.1);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  wingGeo.rotateX(Math.PI / 2);

  const leftWing = new THREE.Mesh(wingGeo, mats.hullLight);
  leftWing.position.set(0.6, 0.5, 0.1);
  leftWing.castShadow = true;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, mats.hullLight);
  rightWing.scale.set(-1, 1, 1);
  rightWing.position.set(-0.6, 0.5, 0.1);
  rightWing.castShadow = true;
  group.add(rightWing);

  // 4. Accent Detail: Vertical Winglet Stabilizers
  const wingletGeo = new THREE.BoxGeometry(0.08, 0.65, 0.9);
  const leftWinglet = new THREE.Mesh(wingletGeo, mats.glowCyan);
  leftWinglet.position.set(2.8, 0.75, -1.2);
  leftWinglet.rotation.z = -0.2;
  group.add(leftWinglet);

  const rightWinglet = new THREE.Mesh(wingletGeo, mats.glowCyan);
  rightWinglet.position.set(-2.8, 0.75, -1.2);
  rightWinglet.rotation.z = 0.2;
  group.add(rightWinglet);

  // 5. Secondary Read: Twin Plasma Pulse Cannons (Pivotable)
  const createCannon = (side: number) => {
    const cannonGroup = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.4, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, mats.metalChassis);
    barrel.position.z = 0.5;
    barrel.castShadow = true;
    cannonGroup.add(barrel);

    // Heat sink ribs
    const ribGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(ribGeo, mats.glowAmber);
      rib.position.z = 0.3 + i * 0.25;
      cannonGroup.add(rib);
    }

    // Muzzle tip
    const muzzleGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.2, 12);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, mats.glowCyan);
    muzzle.position.z = 1.2;
    cannonGroup.add(muzzle);

    cannonGroup.position.set(side * 1.35, 0.42, 0.3);
    return cannonGroup;
  };

  const leftCannon = createCannon(1);
  const rightCannon = createCannon(-1);
  group.add(leftCannon);
  group.add(rightCannon);

  // 6. Secondary Read: Twin Dual-Thruster Nacelles
  const thrusterGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.2, 16);
  thrusterGeo.rotateX(Math.PI / 2);

  const leftThruster = new THREE.Mesh(thrusterGeo, mats.metalChassis);
  leftThruster.position.set(0.5, 0.55, -1.8);
  leftThruster.castShadow = true;
  group.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, mats.metalChassis);
  rightThruster.position.set(-0.5, 0.55, -1.8);
  rightThruster.castShadow = true;
  group.add(rightThruster);

  // 7. Accent Detail: Glowing Thruster Exhaust Cones
  const flameGeo = new THREE.ConeGeometry(0.2, 1.1, 16);
  flameGeo.rotateX(-Math.PI / 2);

  const leftFlame = new THREE.Mesh(flameGeo, mats.exhaustFlame);
  leftFlame.position.set(0.5, 0.55, -2.6);
  group.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeo, mats.exhaustFlame);
  rightFlame.position.set(-0.5, 0.55, -2.6);
  group.add(rightFlame);

  // 8. Accent Detail: Undercarriage Anti-Grav Repulsor Ring
  const repulsorGeo = new THREE.TorusGeometry(0.65, 0.06, 12, 32);
  repulsorGeo.rotateX(Math.PI / 2);
  const repulsorRing = new THREE.Mesh(repulsorGeo, mats.glowCyan);
  repulsorRing.position.set(0, 0.18, 0.1);
  group.add(repulsorRing);

  // 9. Accent Detail: Telemetry Spine & Nav Beacon
  const spineGeo = new THREE.BoxGeometry(0.08, 0.25, 1.0);
  const spine = new THREE.Mesh(spineGeo, mats.metalChassis);
  spine.position.set(0, 0.85, -0.9);
  group.add(spine);

  const beaconGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const beacon = new THREE.Mesh(beaconGeo, mats.glowCyan);
  beacon.position.set(0, 1.0, -1.3);
  group.add(beacon);

  // Scale and pivot flush
  group.scale.set(0.85, 0.85, 0.85);

  return {
    group,
    thrusterFlames: [leftFlame, rightFlame],
    leftCannon,
    rightCannon,
    repulsorRing,
  };
}

/**
 * ENEMY 1: Interceptor Swarmer (Fast agile scout)
 * Silhouette: Aerodynamic tri-blade drone with spinning gyro eye
 */
export function createInterceptorDrone(mats: ModelMaterials): {
  group: THREE.Group;
  eye: THREE.Mesh;
  flame: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Central faceted core
  const coreGeo = new THREE.DodecahedronGeometry(0.48, 0);
  const core = new THREE.Mesh(coreGeo, mats.enemyHull);
  core.position.y = 0.5;
  core.castShadow = true;
  group.add(core);

  // 2. Pulsing Crimson Scanner Eye
  const eyeGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const eye = new THREE.Mesh(eyeGeo, mats.glowCrimson);
  eye.position.set(0, 0.5, 0.42);
  group.add(eye);

  // 3. Tri-blade swept wings
  const wingGeo = new THREE.BoxGeometry(0.12, 0.15, 1.4);
  wingGeo.rotateX(Math.PI / 4);

  const leftBlade = new THREE.Mesh(wingGeo, mats.hullDark);
  leftBlade.position.set(0.65, 0.5, -0.1);
  leftBlade.rotation.y = 0.4;
  leftBlade.castShadow = true;
  group.add(leftBlade);

  const rightBlade = new THREE.Mesh(wingGeo, mats.hullDark);
  rightBlade.position.set(-0.65, 0.5, -0.1);
  rightBlade.rotation.y = -0.4;
  rightBlade.castShadow = true;
  group.add(rightBlade);

  const topBlade = new THREE.Mesh(wingGeo, mats.metalChassis);
  topBlade.position.set(0, 0.95, -0.2);
  topBlade.rotation.x = 0.5;
  group.add(topBlade);

  // 4. Stinger blasters
  const stingerGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8);
  stingerGeo.rotateX(Math.PI / 2);
  const leftStinger = new THREE.Mesh(stingerGeo, mats.metalChassis);
  leftStinger.position.set(0.4, 0.45, 0.6);
  group.add(leftStinger);

  const rightStinger = new THREE.Mesh(stingerGeo, mats.metalChassis);
  rightStinger.position.set(-0.4, 0.45, 0.6);
  group.add(rightStinger);

  // 5. Thruster flame
  const flameGeo = new THREE.ConeGeometry(0.15, 0.6, 12);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.5, -0.7);
  group.add(flame);

  group.scale.set(0.9, 0.9, 0.9);

  return { group, eye, flame };
}

/**
 * ENEMY 2: Goliath Siege Tank (Heavy armor hovercraft)
 * Silhouette: Heavy fortified tank with rotating rail turret and visible telegraph laser
 */
export function createGoliathTank(mats: ModelMaterials): {
  group: THREE.Group;
  turret: THREE.Group;
  aimTelegraph: THREE.Line;
  chargeRings: THREE.Mesh[];
} {
  const group = new THREE.Group();

  // 1. Armored Hexagonal Main Chassis
  const baseShape = new THREE.Shape();
  const r = 1.6;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) baseShape.moveTo(x, y);
    else baseShape.lineTo(x, y);
  }
  baseShape.closePath();

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.7,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.15,
    bevelThickness: 0.15,
  });
  baseGeo.rotateX(Math.PI / 2);
  baseGeo.center();
  const chassis = new THREE.Mesh(baseGeo, mats.heavyArmor);
  chassis.position.y = 0.65;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Four Heavy Repulsor Pods
  const podGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.5, 12);
  const podPositions = [
    [-1.3, 0.4, 1.2],
    [1.3, 0.4, 1.2],
    [-1.3, 0.4, -1.2],
    [1.3, 0.4, -1.2],
  ];

  podPositions.forEach(([x, y, z]) => {
    const pod = new THREE.Mesh(podGeo, mats.metalChassis);
    pod.position.set(x, y, z);
    pod.castShadow = true;
    group.add(pod);

    // Glowing repulsor disc underneath
    const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12);
    const disc = new THREE.Mesh(discGeo, mats.glowAmber);
    disc.position.set(x, y - 0.25, z);
    group.add(disc);
  });

  // 3. Rotating Turret Group
  const turret = new THREE.Group();
  turret.position.set(0, 1.15, 0);

  const turretDomeGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.5, 16);
  const turretDome = new THREE.Mesh(turretDomeGeo, mats.enemyHull);
  turretDome.castShadow = true;
  turret.add(turretDome);

  // Long rail cannon
  const railGeo = new THREE.BoxGeometry(0.35, 0.3, 2.8);
  railGeo.translate(0, 0.15, 1.4);
  const railCannon = new THREE.Mesh(railGeo, mats.metalChassis);
  railCannon.castShadow = true;
  turret.add(railCannon);

  // Induction charge rings along barrel
  const chargeRings: THREE.Mesh[] = [];
  const ringGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(ringGeo, mats.glowAmber);
    ring.position.set(0, 0.15, 0.8 + i * 0.55);
    turret.add(ring);
    chargeRings.push(ring);
  }

  // Optics sensor block
  const opticsGeo = new THREE.BoxGeometry(0.3, 0.25, 0.4);
  const optics = new THREE.Mesh(opticsGeo, mats.glowCrimson);
  optics.position.set(0.4, 0.35, 0.3);
  turret.add(optics);

  // Visible Telegraph Aiming Laser (Line)
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.15, 2.8),
    new THREE.Vector3(0, 0.15, 35.0),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.0, // Fades in during telegraph charge!
    linewidth: 2,
  });
  const aimTelegraph = new THREE.Line(lineGeo, lineMat);
  turret.add(aimTelegraph);

  group.add(turret);
  group.scale.set(1.15, 1.15, 1.15);

  return { group, turret, aimTelegraph, chargeRings };
}

/**
 * BOSS: Chrono Titan (Grand War Dreadnought)
 * Huge 12+ part capital hovercraft with rotating battery pods, central reactor core, shield vanes
 */
export function createChronoTitan(mats: ModelMaterials): {
  group: THREE.Group;
  core: THREE.Mesh;
  turrets: THREE.Group[];
  shieldRings: THREE.Mesh[];
} {
  const group = new THREE.Group();

  // 1. Primary Dreadnought Catamaran Hull
  const hullGeo = new THREE.BoxGeometry(6.5, 1.4, 8.5);
  const mainHull = new THREE.Mesh(hullGeo, mats.heavyArmor);
  mainHull.position.y = 1.8;
  mainHull.castShadow = true;
  mainHull.receiveShadow = true;
  group.add(mainHull);

  // 2. Central Pulsing Chrono Reactor Core
  const coreGeo = new THREE.OctahedronGeometry(1.2, 1);
  const core = new THREE.Mesh(coreGeo, mats.glowCrimson);
  core.position.set(0, 2.8, 0);
  group.add(core);

  // 3. Counter-rotating protective shield rings around core
  const ringGeo = new THREE.TorusGeometry(1.8, 0.1, 12, 32);
  const ring1 = new THREE.Mesh(ringGeo, mats.glowAmber);
  ring1.position.set(0, 2.8, 0);
  group.add(ring1);

  const ring2 = new THREE.Mesh(ringGeo, mats.glowAmber);
  ring2.position.set(0, 2.8, 0);
  ring2.rotation.x = Math.PI / 3;
  group.add(ring2);

  // 4. Command Bridge Citadel
  const bridgeGeo = new THREE.BoxGeometry(2.4, 1.2, 2.2);
  const bridge = new THREE.Mesh(bridgeGeo, mats.hullDark);
  bridge.position.set(0, 3.0, -2.2);
  bridge.castShadow = true;
  group.add(bridge);

  const bridgeVisor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 0.4), mats.glowCrimson);
  bridgeVisor.position.set(0, 3.2, -1.05);
  group.add(bridgeVisor);

  // 5. Four Heavy Rotary Plasma Turrets
  const turrets: THREE.Group[] = [];
  const turretCoords = [
    [-2.2, 2.6, 2.5],
    [2.2, 2.6, 2.5],
    [-2.4, 2.6, -1.5],
    [2.4, 2.6, -1.5],
  ];

  turretCoords.forEach(([x, y, z]) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, y, z);

    const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.4, 12), mats.metalChassis);
    tGroup.add(baseM);

    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.8, 8), mats.enemyHull);
    barrel1.rotateX(Math.PI / 2);
    barrel1.position.set(0.18, 0.1, 0.9);
    tGroup.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.8, 8), mats.enemyHull);
    barrel2.rotateX(Math.PI / 2);
    barrel2.position.set(-0.18, 0.1, 0.9);
    tGroup.add(barrel2);

    group.add(tGroup);
    turrets.push(tGroup);
  });

  // 6. Giant Heavy Thrusters
  const bigThrusterGeo = new THREE.CylinderGeometry(0.7, 0.85, 2.2, 16);
  bigThrusterGeo.rotateX(Math.PI / 2);
  [-1.8, 0, 1.8].forEach((x) => {
    const th = new THREE.Mesh(bigThrusterGeo, mats.metalChassis);
    th.position.set(x, 1.6, -4.6);
    group.add(th);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 16), mats.exhaustFlame);
    inner.rotateX(-Math.PI / 2);
    inner.position.set(x, 1.6, -5.6);
    group.add(inner);
  });

  return {
    group,
    core,
    turrets,
    shieldRings: [ring1, ring2],
  };
}

/**
 * COLLECTIBLES: Nano Repair Capsule, Overdrive Core, Energy Shards
 */
export function createCollectible(type: 'repair' | 'overdrive' | 'shard', mats: ModelMaterials): {
  group: THREE.Group;
  core: THREE.Mesh;
} {
  const group = new THREE.Group();

  if (type === 'repair') {
    // Green / Cyan Healing Capsule
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.3,
    });
    const octaGeo = new THREE.OctahedronGeometry(0.45, 0);
    const core = new THREE.Mesh(octaGeo, mat);
    core.position.y = 0.55;
    group.add(core);

    // Medical cross ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
    const ring = new THREE.Mesh(ringGeo, mats.glowCyan);
    ring.position.y = 0.55;
    group.add(ring);

    return { group, core };
  } else if (type === 'overdrive') {
    // Amber / Gold Overdrive Core
    const octaGeo = new THREE.OctahedronGeometry(0.5, 0);
    const core = new THREE.Mesh(octaGeo, mats.glowAmber);
    core.position.y = 0.55;
    group.add(core);

    const ringGeo = new THREE.TorusGeometry(0.75, 0.05, 8, 24);
    ringGeo.rotateX(Math.PI / 4);
    const ring = new THREE.Mesh(ringGeo, mats.glowAmber);
    ring.position.y = 0.55;
    group.add(ring);

    return { group, core };
  } else {
    // Blue Energy Shard / Scrap
    const shardGeo = new THREE.TetrahedronGeometry(0.35, 0);
    const core = new THREE.Mesh(shardGeo, mats.glowCyan);
    core.position.y = 0.45;
    group.add(core);
    return { group, core };
  }
}

/**
 * ENVIRONMENT ASSETS:
 * Monoliths, Energy Crystal Clusters, Tech Antenna Towers, and Canyon Boundaries
 */
export function createMonolith(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  // Tall tapered tech pillar
  const pillarGeo = new THREE.BoxGeometry(1.6, 9.0, 1.6);
  const pillar = new THREE.Mesh(pillarGeo, mats.hullDark);
  pillar.position.y = 4.5;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Glowing rune inset strip
  const stripGeo = new THREE.BoxGeometry(0.2, 7.5, 1.65);
  const strip = new THREE.Mesh(stripGeo, mats.glowCyan);
  strip.position.y = 4.5;
  group.add(strip);

  // Hovering capstone
  const capGeo = new THREE.OctahedronGeometry(0.9, 0);
  const cap = new THREE.Mesh(capGeo, mats.glowCyan);
  cap.position.y = 10.2;
  group.add(cap);

  return group;
}

export function createCrystalCluster(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  const crystalGeo = new THREE.CylinderGeometry(0.08, 0.45, 3.2, 6);
  crystalGeo.translate(0, 1.6, 0);

  const angles = [0, 1.2, 2.5, 3.8, 5.0];
  const heights = [1.0, 0.8, 1.15, 0.7, 0.9];
  const leans = [0.15, -0.22, 0.18, -0.12, 0.25];

  angles.forEach((ang, idx) => {
    const mesh = new THREE.Mesh(crystalGeo, mats.glowCyan);
    const rad = 0.6;
    mesh.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
    mesh.rotation.z = leans[idx];
    mesh.rotation.y = ang;
    mesh.scale.set(heights[idx], heights[idx], heights[idx]);
    mesh.castShadow = true;
    group.add(mesh);
  });

  return group;
}

export function createCanyonRock(color = 0x1a2130): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(1, 1);
  // Distort vertices slightly for rugged organic rock
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const noise = 1 + (Math.sin(vx * 3) + Math.cos(vy * 3) + Math.sin(vz * 3)) * 0.12;
    pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.15,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * HUMAN COMBATANT: Infantry Soldier (Humanoid Target)
 * 8 distinct procedural parts: Torso vest, helmet, glowing visor, arms, blaster rifle, legs, boots
 */
export function createInfantrySoldier(mats: ModelMaterials): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  rifle: THREE.Group;
  visor: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Tactical Uniform Materials
  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Tactical dark slate
    roughness: 0.85,
    metalness: 0.1,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.3,
  });
  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.6,
    metalness: 0.4,
  });

  // 1. Torso / Armored Vest
  const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.32);
  const torso = new THREE.Mesh(torsoGeo, vestMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // 2. Head & Combat Helmet
  const helmetGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 12);
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.set(0, 1.58, 0);
  helmet.castShadow = true;
  group.add(helmet);

  // 3. Glowing Tactical Visor
  const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.08);
  const visor = new THREE.Mesh(visorGeo, mats.glowCrimson);
  visor.position.set(0, 1.58, 0.12);
  group.add(visor);

  // 4. Tactical Blaster Rifle Assembly
  const rifle = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), mats.metalChassis);
  gunBody.position.set(0, 0, 0.2);
  rifle.add(gunBody);

  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mats.metalChassis);
  gunBarrel.rotateX(Math.PI / 2);
  gunBarrel.position.set(0, 0.02, 0.6);
  rifle.add(gunBarrel);

  const scope = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.18), mats.glowAmber);
  scope.position.set(0, 0.09, 0.2);
  rifle.add(scope);

  rifle.position.set(0.18, 1.05, 0.25);
  group.add(rifle);

  // 5. Left & Right Arms
  const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
  const leftArm = new THREE.Mesh(armGeo, uniformMat);
  leftArm.position.set(-0.32, 1.05, 0.05);
  leftArm.rotation.x = 0.5;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, uniformMat);
  rightArm.position.set(0.32, 1.05, 0.15);
  rightArm.rotation.x = -0.6;
  rightArm.castShadow = true;
  group.add(rightArm);

  // 6. Left & Right Legs with Pivot at Hip
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.75, 8);
  legGeo.translate(0, -0.375, 0);

  const leftLeg = new THREE.Mesh(legGeo, uniformMat);
  leftLeg.position.set(-0.16, 0.75, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, uniformMat);
  rightLeg.position.set(0.16, 0.75, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Scale to human height (~1.8m)
  group.scale.set(0.95, 0.95, 0.95);

  return { group, leftLeg, rightLeg, rifle, visor };
}

/**
 * REALISTIC MILITARY COMBAT TANK
 * 12-part procedural armored main battle tank with rotating turret,
 * dual heavy cannons, track skirts, and laser targeting telegraph
 */
export function createRealisticMilitaryTank(mats: ModelMaterials): {
  group: THREE.Group;
  turret: THREE.Group;
  barrel: THREE.Group;
  aimTelegraph: THREE.Line;
} {
  const group = new THREE.Group();

  const tankArmorMat = new THREE.MeshStandardMaterial({
    color: 0x3f463e, // Military Olive Drab / Camo
    roughness: 0.65,
    metalness: 0.75,
  });
  const treadMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.5,
  });

  // 1. Lower Armored Hull Chassis
  const hullGeo = new THREE.BoxGeometry(2.8, 0.75, 4.4);
  const hull = new THREE.Mesh(hullGeo, tankArmorMat);
  hull.position.y = 0.65;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Sloped front glacis plate
  const glacisGeo = new THREE.BoxGeometry(2.7, 0.35, 1.2);
  glacisGeo.rotateX(Math.PI / 6);
  const glacis = new THREE.Mesh(glacisGeo, tankArmorMat);
  glacis.position.set(0, 0.78, 2.2);
  glacis.castShadow = true;
  group.add(glacis);

  // 2. Heavy Armored Track Assemblies (Left & Right)
  const trackGeo = new THREE.BoxGeometry(0.55, 0.65, 4.8);
  const leftTrack = new THREE.Mesh(trackGeo, treadMat);
  leftTrack.position.set(1.48, 0.45, 0);
  leftTrack.castShadow = true;
  group.add(leftTrack);

  const rightTrack = new THREE.Mesh(trackGeo, treadMat);
  rightTrack.position.set(-1.48, 0.45, 0);
  rightTrack.castShadow = true;
  group.add(rightTrack);

  // Road wheels (5 per side)
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.58, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const wz = -1.8 + i * 0.9;
    const lWheel = new THREE.Mesh(wheelGeo, mats.metalChassis);
    lWheel.position.set(1.48, 0.38, wz);
    group.add(lWheel);

    const rWheel = new THREE.Mesh(wheelGeo, mats.metalChassis);
    rWheel.position.set(-1.48, 0.38, wz);
    group.add(rWheel);
  }

  // 3. Rotating Turret Assembly
  const turret = new THREE.Group();
  turret.position.set(0, 1.25, -0.1);

  // Angular armored turret main block
  const turretShape = new THREE.Shape();
  turretShape.moveTo(-1.1, -1.2);
  turretShape.lineTo(1.1, -1.2);
  turretShape.lineTo(0.9, 1.1);
  turretShape.lineTo(-0.9, 1.1);
  turretShape.closePath();

  const turretGeo = new THREE.ExtrudeGeometry(turretShape, {
    depth: 0.6,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.12,
    bevelThickness: 0.12,
  });
  turretGeo.rotateX(Math.PI / 2);
  turretGeo.center();
  const turretMesh = new THREE.Mesh(turretGeo, tankArmorMat);
  turretMesh.castShadow = true;
  turret.add(turretMesh);

  // Commander hatch cupola
  const cupolaGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.22, 12);
  const cupola = new THREE.Mesh(cupolaGeo, mats.metalChassis);
  cupola.position.set(-0.55, 0.42, -0.4);
  turret.add(cupola);

  // Reactive armor plates on turret sides
  const reactiveGeo = new THREE.BoxGeometry(0.12, 0.25, 0.35);
  for (let r = 0; r < 4; r++) {
    const rPlate = new THREE.Mesh(reactiveGeo, mats.glowAmber);
    rPlate.position.set(1.15, 0.15, -0.6 + r * 0.45);
    turret.add(rPlate);

    const lPlate = new THREE.Mesh(reactiveGeo, mats.glowAmber);
    lPlate.position.set(-1.15, 0.15, -0.6 + r * 0.45);
    turret.add(lPlate);
  }

  // 4. Heavy Cannon Barrel
  const barrel = new THREE.Group();
  barrel.position.set(0, 0.12, 0.8);

  const mainBoreGeo = new THREE.CylinderGeometry(0.14, 0.16, 3.4, 12);
  mainBoreGeo.rotateX(Math.PI / 2);
  mainBoreGeo.translate(0, 0, 1.7);
  const mainBore = new THREE.Mesh(mainBoreGeo, mats.metalChassis);
  mainBore.castShadow = true;
  barrel.add(mainBore);

  // Muzzle brake
  const brakeGeo = new THREE.BoxGeometry(0.36, 0.28, 0.45);
  brakeGeo.translate(0, 0, 3.4);
  const brake = new THREE.Mesh(brakeGeo, mats.metalChassis);
  barrel.add(brake);

  // Visible Aiming Telegraph Laser
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 3.5),
    new THREE.Vector3(0, 0, 45.0),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.0,
    linewidth: 2,
  });
  const aimTelegraph = new THREE.Line(lineGeo, lineMat);
  barrel.add(aimTelegraph);

  turret.add(barrel);
  group.add(turret);

  // Scale and proportion
  group.scale.set(1.1, 1.1, 1.1);

  return { group, turret, barrel, aimTelegraph };
}

/**
 * PUBG-STYLE GREEN MILITARY LOOT CRATE (صندوق الغنائم العسكري)
 * Dropped when enemy soldiers/tanks are defeated
 */
export function createLootCrate(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  // 1. Olive Military Box Base
  const boxGeo = new THREE.BoxGeometry(0.9, 0.65, 0.9);
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x223824, // Iconic PUBG green
    roughness: 0.7,
    metalness: 0.3,
  });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.325;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // 2. Steel Corner Brackets & Straps
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.9,
  });
  const strapH = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), strapMat);
  strapH.position.y = 0.325;
  group.add(strapH);

  // 3. Glowing Green Beacon Light on Top
  const lightGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
  const greenBeacon = new THREE.Mesh(lightGeo, mats.glowCyan);
  greenBeacon.position.y = 0.72;
  group.add(greenBeacon);

  // 4. Subtle Green Upward Flare
  const flareGeo = new THREE.CylinderGeometry(0.04, 0.35, 3.5, 8, 1, true);
  flareGeo.translate(0, 1.75, 0);
  const flareMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flare = new THREE.Mesh(flareGeo, flareMat);
  flare.position.y = 0.65;
  group.add(flare);

  return group;
}

/**
 * PUBG-STYLE AIRDROP CRATE (صندوق الإنزال الجوي المميز)
 * Iconic Red & Blue military crate with red flare smoke
 */
export function createAirdropCrate(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  // 1. Bottom Red Steel Box
  const redBoxGeo = new THREE.BoxGeometry(1.6, 0.9, 1.6);
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Iconic Airdrop Red
    roughness: 0.5,
    metalness: 0.7,
  });
  const redBox = new THREE.Mesh(redBoxGeo, redMat);
  redBox.position.y = 0.45;
  redBox.castShadow = true;
  group.add(redBox);

  // 2. Top Blue Tarp Cover
  const blueTarpGeo = new THREE.BoxGeometry(1.64, 0.35, 1.64);
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Iconic Airdrop Blue
    roughness: 0.9,
    metalness: 0.1,
  });
  const blueTarp = new THREE.Mesh(blueTarpGeo, blueMat);
  blueTarp.position.y = 1.05;
  blueTarp.castShadow = true;
  group.add(blueTarp);

  // 3. Red Flare Smoke Emitter on Corner
  const smokePipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8),
    mats.metalChassis
  );
  smokePipe.position.set(0.65, 1.25, 0.65);
  group.add(smokePipe);

  // Red beacon smoke column
  const smokeColumnGeo = new THREE.CylinderGeometry(0.12, 1.2, 12.0, 12, 1, true);
  smokeColumnGeo.translate(0, 6.0, 0);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const smokeColumn = new THREE.Mesh(smokeColumnGeo, smokeMat);
  smokeColumn.position.set(0.65, 1.25, 0.65);
  group.add(smokeColumn);

  return group;
}

/**
 * MILITARY SANDBAG BARRICADE (حواجز أكياس الرمل التكتيكية)
 */
export function createSandbagBarricade(): THREE.Group {
  const group = new THREE.Group();

  const sandbagMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e, // Sandbag khaki
    roughness: 0.95,
    metalness: 0.05,
  });

  const bagGeo = new THREE.BoxGeometry(1.2, 0.3, 0.5);
  // Layer 1
  [-1.0, 0, 1.0].forEach((x) => {
    const bag = new THREE.Mesh(bagGeo, sandbagMat);
    bag.position.set(x, 0.15, 0);
    bag.castShadow = true;
    bag.receiveShadow = true;
    group.add(bag);
  });
  // Layer 2
  [-0.5, 0.5].forEach((x) => {
    const bag = new THREE.Mesh(bagGeo, sandbagMat);
    bag.position.set(x, 0.45, 0);
    bag.castShadow = true;
    bag.receiveShadow = true;
    group.add(bag);
  });

  return group;
}

/**
 * AUTHENTIC PUBG OPERATOR / SOLDIER (الجندي التكتيكي الواقعي - بوبجي)
 * Features:
 * - Level 3 Spetsnaz Altyn Helmet with steel visor & weld seam
 * - Level 3 Armored Tactical Vest with ammo pouches & radio
 * - Level 3 Tactical Military Backpack
 * - Two-handed tactical weapon stance with M416 / AKM / AWM
 * - Articulated hip pivots for realistic running stride animations
 */
export function createPUBGSoldier(
  mats: ModelMaterials,
  options: {
    isEnemy?: boolean;
    camoType?: 'desert' | 'woodland';
    weaponName?: string;
  } = {}
): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  rifleGroup: THREE.Group;
  muzzleTip: THREE.Group;
  headGroup: THREE.Group;
  aimTelegraph?: THREE.Line;
} {
  const group = new THREE.Group();
  const isEnemy = options.isEnemy || false;

  // Uniform Material
  const uniformMat = isEnemy ? mats.enemyHull : mats.desertCamo;
  const vestMat = isEnemy ? mats.heavyArmor : mats.militaryOlive;
  const helmetMat = mats.spetsnazSteel;

  // 1. Torso & Armored Vest
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.15, 0);

  // Inner torso body
  const bodyGeo = new THREE.BoxGeometry(0.52, 0.68, 0.3);
  const bodyMesh = new THREE.Mesh(bodyGeo, uniformMat);
  bodyMesh.castShadow = true;
  torsoGroup.add(bodyMesh);

  // Level 3 Armored Vest Plate Carrier
  const vestGeo = new THREE.BoxGeometry(0.56, 0.58, 0.36);
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.set(0, 0.02, 0);
  vestMesh.castShadow = true;
  torsoGroup.add(vestMesh);

  // Tactical Magazine Pouches (3 on chest)
  for (let p = -1; p <= 1; p++) {
    const pouchGeo = new THREE.BoxGeometry(0.12, 0.22, 0.1);
    const pouch = new THREE.Mesh(pouchGeo, mats.militaryOlive);
    pouch.position.set(p * 0.16, -0.1, 0.22);
    torsoGroup.add(pouch);
  }

  // Tactical Radio & Antenna on shoulder
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), mats.gunMetal);
  radio.position.set(-0.22, 0.26, 0.12);
  torsoGroup.add(radio);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 4), mats.metalChassis);
  antenna.position.set(-0.22, 0.45, 0.12);
  torsoGroup.add(antenna);

  // Level 3 Military Backpack (Iconic PUBG Spetsnaz Backpack on rear)
  const backpackGeo = new THREE.BoxGeometry(0.44, 0.52, 0.26);
  const backpack = new THREE.Mesh(backpackGeo, mats.desertCamo);
  backpack.position.set(0, 0.04, -0.26);
  backpack.castShadow = true;
  torsoGroup.add(backpack);

  // Tactical roll mat under backpack
  const rollGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.48, 10);
  rollGeo.rotateZ(Math.PI / 2);
  const roll = new THREE.Mesh(rollGeo, mats.militaryOlive);
  roll.position.set(0, -0.26, -0.26);
  torsoGroup.add(roll);

  group.add(torsoGroup);

  // 2. Head & Level 3 Spetsnaz Altyn Helmet (Iconic PUBG Helmet!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.68, 0);

  // Balaclava head base
  const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
  const headMesh = new THREE.Mesh(headGeo, mats.spetsnazSteel);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Steel Altyn helmet dome
  const helmetDomeGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
  const helmetDome = new THREE.Mesh(helmetDomeGeo, helmetMat);
  helmetDome.position.set(0, 0.02, 0);
  helmetDome.castShadow = true;
  headGroup.add(helmetDome);

  // Weld center seam rib on helmet
  const seamGeo = new THREE.BoxGeometry(0.03, 0.35, 0.48);
  const seam = new THREE.Mesh(seamGeo, mats.gunMetal);
  seam.position.set(0, 0.08, 0);
  headGroup.add(seam);

  // Iconic Steel Faceplate Visor (خوذة لفل 3 ببجي الشهيرة)
  const visorPlateGeo = new THREE.BoxGeometry(0.34, 0.22, 0.12);
  const visorPlate = new THREE.Mesh(visorPlateGeo, mats.spetsnazSteel);
  visorPlate.position.set(0, -0.04, 0.18);
  visorPlate.castShadow = true;
  headGroup.add(visorPlate);

  // Narrow horizontal viewing slit
  const slitGeo = new THREE.BoxGeometry(0.24, 0.05, 0.04);
  const slitMat = isEnemy ? mats.glowCrimson : mats.glowAmber;
  const slit = new THREE.Mesh(slitGeo, slitMat);
  slit.position.set(0, 0.01, 0.24);
  headGroup.add(slit);

  group.add(headGroup);

  // 3. Realistic Rifle Assembly (M416 / AKM / AWM)
  const rifleGroup = new THREE.Group();
  rifleGroup.position.set(0.16, 1.15, 0.28);

  // Main Receiver & Handguard
  const receiverGeo = new THREE.BoxGeometry(0.07, 0.12, 0.65);
  const receiver = new THREE.Mesh(receiverGeo, mats.gunMetal);
  receiver.position.set(0, 0, 0.1);
  receiver.castShadow = true;
  rifleGroup.add(receiver);

  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
  barrelGeo.rotateX(Math.PI / 2);
  barrelGeo.translate(0, 0.02, 0.65);
  const barrel = new THREE.Mesh(barrelGeo, mats.gunMetal);
  barrel.castShadow = true;
  rifleGroup.add(barrel);

  // Muzzle Brake / Suppressor
  const muzzleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8);
  muzzleGeo.rotateX(Math.PI / 2);
  muzzleGeo.translate(0, 0.02, 0.95);
  const muzzle = new THREE.Mesh(muzzleGeo, mats.gunMetal);
  rifleGroup.add(muzzle);

  // Muzzle Tip (Point from which bullets spawn)
  const muzzleTip = new THREE.Group();
  muzzleTip.position.set(0, 0.02, 1.05);
  rifleGroup.add(muzzleTip);

  // Curved Magazine Clip (30-round mag)
  const magGeo = new THREE.BoxGeometry(0.06, 0.24, 0.12);
  magGeo.rotateX(0.2);
  const mag = new THREE.Mesh(magGeo, mats.gunMetal);
  mag.position.set(0, -0.14, 0.18);
  rifleGroup.add(mag);

  // Tactical Rifle Stock (Fixed / Collapsible)
  const stockGeo = new THREE.BoxGeometry(0.06, 0.14, 0.32);
  const stock = new THREE.Mesh(stockGeo, mats.spetsnazSteel);
  stock.position.set(0, -0.02, -0.32);
  rifleGroup.add(stock);

  // Tactical Optic Scope on top rail (ACOG / Red Dot)
  const scopeMountGeo = new THREE.BoxGeometry(0.05, 0.04, 0.2);
  const scopeMount = new THREE.Mesh(scopeMountGeo, mats.metalChassis);
  scopeMount.position.set(0, 0.09, 0.1);
  rifleGroup.add(scopeMount);

  const scopeBodyGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.28, 12);
  scopeBodyGeo.rotateX(Math.PI / 2);
  const scopeBody = new THREE.Mesh(scopeBodyGeo, mats.gunMetal);
  scopeBody.position.set(0, 0.14, 0.1);
  rifleGroup.add(scopeBody);

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.04, 12),
    isEnemy ? mats.glowCrimson : mats.glowCyan
  );
  lensGlass.position.set(0, 0.14, 0.24);
  rifleGroup.add(lensGlass);

  group.add(rifleGroup);

  // 4. Arms with Tactical Two-Handed Hold
  // Right Arm (Trigger hand)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 1.45, 0.05);
  const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8), uniformMat);
  rArmMesh.position.set(0, -0.2, 0.08);
  rArmMesh.rotation.x = 0.55;
  rArmMesh.rotation.y = -0.2;
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);
  group.add(rightArm);

  // Left Arm (Handguard support)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 1.45, 0.05);
  const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.52, 8), uniformMat);
  lArmMesh.position.set(0.18, -0.18, 0.24);
  lArmMesh.rotation.x = 0.75;
  lArmMesh.rotation.y = 0.45;
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  group.add(leftArm);

  // 5. Left & Right Legs (Pivoted at Hip for dynamic running strides)
  const legMat = uniformMat;
  const bootMat = mats.gunMetal;

  // Left Leg Group
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.85, 0);

  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8), legMat);
  lThigh.position.y = -0.22;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 8), legMat);
  lShin.position.y = -0.62;
  lShin.castShadow = true;
  leftLeg.add(lShin);

  // Kneepad
  const lKneepad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), mats.militaryOlive);
  lKneepad.position.set(0, -0.42, 0.1);
  leftLeg.add(lKneepad);

  // Combat Boot
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.28), bootMat);
  lBoot.position.set(0, -0.82, 0.04);
  lBoot.castShadow = true;
  leftLeg.add(lBoot);

  group.add(leftLeg);

  // Right Leg Group
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.85, 0);

  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 8), legMat);
  rThigh.position.y = -0.22;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 8), legMat);
  rShin.position.y = -0.62;
  rShin.castShadow = true;
  rightLeg.add(rShin);

  // Kneepad
  const rKneepad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), mats.militaryOlive);
  rKneepad.position.set(0, -0.42, 0.1);
  rightLeg.add(rKneepad);

  // Combat Boot
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.28), bootMat);
  rBoot.position.set(0, -0.82, 0.04);
  rBoot.castShadow = true;
  rightLeg.add(rBoot);

  group.add(rightLeg);

  // 6. Optional Aim Telegraph Laser for Hostile Soldiers
  let aimTelegraph: THREE.Line | undefined;
  if (isEnemy) {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.02, 1.05),
      new THREE.Vector3(0, 0.02, 35.0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.0,
      linewidth: 2,
    });
    aimTelegraph = new THREE.Line(lineGeo, lineMat);
    rifleGroup.add(aimTelegraph);
  }

  // Realistic human soldier height scale (~1.82m)
  group.scale.set(1.0, 1.0, 1.0);

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    rifleGroup,
    muzzleTip,
    headGroup,
    aimTelegraph,
  };
}

/**
 * AUTHENTIC PUBG OFF-ROAD COMBAT BUGGY (المركبة القتالية - بجي ببجي الشهير)
 * 12-part tactical buggy with roll cage, massive all-terrain treaded tires,
 * push bumper, spare rear wheel, and roof-mounted machine gun
 */
export function createTacticalBuggy(mats: ModelMaterials): {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  turret: THREE.Group;
  barrel: THREE.Mesh;
  headlights: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const frameMat = mats.spetsnazSteel;
  const panelMat = mats.desertCamo;
  const tireMat = mats.gunMetal;

  // 1. Lower Chassis Skid Plate
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.35, 3.2);
  const chassis = new THREE.Mesh(chassisGeo, panelMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Tubular Steel Roll Cage
  const cagePipes = [
    // Front pillars
    { pos: [-0.65, 1.15, 0.6], rot: [0.35, 0, 0], len: 1.2 },
    { pos: [0.65, 1.15, 0.6], rot: [0.35, 0, 0], len: 1.2 },
    // Rear pillars
    { pos: [-0.65, 1.15, -0.7], rot: [-0.35, 0, 0], len: 1.2 },
    { pos: [0.65, 1.15, -0.7], rot: [-0.35, 0, 0], len: 1.2 },
    // Roof bars
    { pos: [-0.65, 1.6, 0], rot: [Math.PI / 2, 0, 0], len: 1.3 },
    { pos: [0.65, 1.6, 0], rot: [Math.PI / 2, 0, 0], len: 1.3 },
    // Cross bar
    { pos: [0, 1.6, 0], rot: [0, 0, Math.PI / 2], len: 1.3 },
  ];

  cagePipes.forEach(({ pos, rot, len }) => {
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, len, 8);
    const pipe = new THREE.Mesh(pipeGeo, frameMat);
    pipe.position.set(pos[0], pos[1], pos[2]);
    pipe.rotation.set(rot[0], rot[1], rot[2]);
    pipe.castShadow = true;
    group.add(pipe);
  });

  // 3. Heavy Front Bullbar & Push Bumper
  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.15), frameMat);
  bullbar.position.set(0, 0.55, 1.7);
  group.add(bullbar);

  // Dual High-Intensity LED Headlights
  const headlights: THREE.Mesh[] = [];
  [-0.45, 0.45].forEach((hx) => {
    const lightMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15, 12), mats.metalChassis);
    lightMesh.rotateX(Math.PI / 2);
    lightMesh.position.set(hx, 0.65, 1.72);
    group.add(lightMesh);

    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), mats.glowAmber);
    glow.position.set(hx, 0.65, 1.8);
    group.add(glow);
    headlights.push(glow);
  });

  // 4. Four Chunky Off-Road Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [-0.95, 0.42, 1.1],  // Front Left
    [0.95, 0.42, 1.1],   // Front Right
    [-1.0, 0.45, -1.0],  // Rear Left
    [1.0, 0.45, -1.0],   // Rear Right
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);

    // Rim hubcap
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 8), mats.militaryOlive);
    rim.rotateZ(Math.PI / 2);
    rim.position.set(wx, wy, wz);
    group.add(rim);
  });

  // 5. Spare Wheel Mounted on Sloped Rear
  const spare = new THREE.Mesh(wheelGeo, tireMat);
  spare.position.set(0, 1.05, -1.55);
  spare.rotation.x = Math.PI / 4;
  spare.castShadow = true;
  group.add(spare);

  // 6. Roof-Mounted Tactical Machine Gun Turret
  const turret = new THREE.Group();
  turret.position.set(0, 1.7, 0.1);

  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.25, 8), mats.metalChassis);
  turret.add(mount);

  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.7), mats.gunMetal);
  gunBody.position.set(0, 0.18, 0.2);
  gunBody.castShadow = true;
  turret.add(gunBody);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), mats.gunMetal);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.18, 0.9);
  barrel.castShadow = true;
  turret.add(barrel);

  // Ammo Box on Gun Side
  const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.24), mats.militaryOlive);
  ammoBox.position.set(0.18, 0.18, 0.15);
  turret.add(ammoBox);

  group.add(turret);

  // Scale and proportion
  group.scale.set(1.15, 1.15, 1.15);

  return { group, wheels, turret, barrel, headlights };
}

/**
 * YEMENI TRADITIONAL CITADEL & STONE TOWER (قلعة وحصن يمني تاريخي - مستوحى من قلعة القاهرة بتعز وصنعاء)
 * 3-tier stone mud-brick architecture with traditional white gypsum window crowns
 */
export function createYemeniFortress(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  // 1. Sturdy Multi-Tier Stone Base
  const baseGeo = new THREE.BoxGeometry(10.0, 5.0, 10.0);
  const base = new THREE.Mesh(baseGeo, mats.yemeniStone);
  base.position.y = 2.5;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // 2. Middle Tower Level
  const midGeo = new THREE.BoxGeometry(7.5, 4.5, 7.5);
  const mid = new THREE.Mesh(midGeo, mats.yemeniStone);
  mid.position.y = 7.25;
  mid.castShadow = true;
  mid.receiveShadow = true;
  group.add(mid);

  // 3. Top Citadel Parapet (Crenellated roof battlements)
  const topGeo = new THREE.BoxGeometry(8.2, 0.8, 8.2);
  const top = new THREE.Mesh(topGeo, mats.yemeniStone);
  top.position.y = 9.8;
  top.castShadow = true;
  group.add(top);

  // Traditional Yemen arched window cutouts / frames with white gypsum
  const gypsumMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.1,
  });

  const windowPositions = [
    // Front windows
    [-2.2, 7.5, 3.8],
    [0, 7.5, 3.8],
    [2.2, 7.5, 3.8],
    // Back windows
    [-2.2, 7.5, -3.8],
    [0, 7.5, -3.8],
    [2.2, 7.5, -3.8],
    // Lower level windows
    [-3.0, 3.0, 5.05],
    [3.0, 3.0, 5.05],
  ];

  windowPositions.forEach(([wx, wy, wz]) => {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.15), gypsumMat);
    arch.position.set(wx, wy, wz);
    group.add(arch);

    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.9, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    inner.position.set(wx, wy, wz);
    group.add(inner);
  });

  // 4. Main Fortress Arched Wooden Gate
  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.2, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 })
  );
  gate.position.set(0, 1.6, 5.05);
  gate.castShadow = true;
  group.add(gate);

  // Gate stone arch surround
  const gateSurround = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.8, 0.35), gypsumMat);
  gateSurround.position.set(0, 1.9, 5.0);
  group.add(gateSurround);

  return group;
}

/**
 * MILITARY OBSERVATION WATCHTOWER (برج المراقبة العسكري التكتيكي)
 */
export function createMilitaryWatchtower(mats: ModelMaterials): THREE.Group {
  const group = new THREE.Group();

  // 4 Concrete / Steel corner stilt pillars
  const stiltGeo = new THREE.CylinderGeometry(0.18, 0.22, 9.0, 8);
  [-2.2, 2.2].forEach((x) => {
    [-2.2, 2.2].forEach((z) => {
      const stilt = new THREE.Mesh(stiltGeo, mats.metalChassis);
      stilt.position.set(x, 4.5, z);
      stilt.castShadow = true;
      group.add(stilt);
    });
  });

  // Cross-bracing struts
  const strutMat = mats.gunMetal;
  const strut1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.4), strutMat);
  strut1.position.set(2.2, 4.5, 0);
  group.add(strut1);

  const strut2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.4), strutMat);
  strut2.position.set(-2.2, 4.5, 0);
  group.add(strut2);

  // Top observation deck floor
  const floorGeo = new THREE.BoxGeometry(5.2, 0.4, 5.2);
  const floor = new THREE.Mesh(floorGeo, mats.desertCamo);
  floor.position.set(0, 9.2, 0);
  floor.castShadow = true;
  group.add(floor);

  // Sandbag perimeter barrier
  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95 });
  const railH = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 0.4), sandbagMat);
  railH.position.set(0, 9.8, 2.4);
  railH.castShadow = true;
  group.add(railH);

  const railB = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 0.4), sandbagMat);
  railB.position.set(0, 9.8, -2.4);
  railB.castShadow = true;
  group.add(railB);

  // Roof Canopy
  const roofGeo = new THREE.BoxGeometry(5.8, 0.3, 5.8);
  const roof = new THREE.Mesh(roofGeo, mats.militaryOlive);
  roof.position.set(0, 11.6, 0);
  roof.castShadow = true;
  group.add(roof);

  return group;
}

/**
 * DESERT ACACIA TREE (شجرة السمر / الأكاسيا الصحراوية اليمنية)
 */
export function createDesertAcaciaTree(): THREE.Group {
  const group = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033, // Weathered acacia bark
    roughness: 0.95,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x4d6334, // Desert acacia green
    roughness: 0.85,
    flatShading: true,
  });

  // Gnarled, slightly leaning trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.5, 4.5, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 2.25, 0);
  trunk.rotation.z = 0.08;
  trunk.castShadow = true;
  group.add(trunk);

  // Branches
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.8, 6), trunkMat);
  b1.position.set(0.6, 3.8, 0.2);
  b1.rotation.z = -0.55;
  group.add(b1);

  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 6), trunkMat);
  b2.position.set(-0.6, 3.6, -0.2);
  b2.rotation.z = 0.55;
  group.add(b2);

  // Broad, flat umbrella canopy discs (typical of acacia trees)
  const canopies = [
    { x: 0, y: 5.2, z: 0, r: 2.6, h: 0.65 },
    { x: 1.4, y: 4.8, z: 0.4, r: 2.0, h: 0.55 },
    { x: -1.4, y: 4.6, z: -0.3, r: 1.9, h: 0.55 },
  ];

  canopies.forEach((c) => {
    const leafGeo = new THREE.CylinderGeometry(c.r * 0.9, c.r, c.h, 9);
    const canopy = new THREE.Mesh(leafGeo, leafMat);
    canopy.position.set(c.x, c.y, c.z);
    canopy.castShadow = true;
    group.add(canopy);
  });

  return group;
}

/**
 * TACTICAL MILITARY FUEL DRUM / OIL BARREL (برميل وقود عسكري)
 */
export function createMilitaryOilDrum(): THREE.Group {
  const group = new THREE.Group();

  const drumGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16);
  const drumMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Flammable Red or Military Olive
    roughness: 0.45,
    metalness: 0.85,
  });
  const drum = new THREE.Mesh(drumGeo, drumMat);
  drum.position.y = 0.55;
  drum.castShadow = true;
  drum.receiveShadow = true;
  group.add(drum);

  // Reinforcing ribs
  [-0.25, 0.25].forEach((ry) => {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.02, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 })
    );
    rib.rotateX(Math.PI / 2);
    rib.position.y = 0.55 + ry;
    group.add(rib);
  });

  return group;
}

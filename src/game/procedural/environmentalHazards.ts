import * as THREE from 'three';

export type HazardType = 'ELECTRIC_WATER' | 'RADIOACTIVE_ZONE' | 'THERMAL_FISSURE';

export interface EnvironmentalHazard {
  id: string;
  type: HazardType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  x: number;
  z: number;
  radius: number;
  color: string;
  hexColor: number;
  dps: number; // Damage per second after grace period
  safeGraceSeconds: number; // Time before damage starts ticking
}

export interface PlayerHazardState {
  isInHazard: boolean;
  hazardType?: HazardType;
  hazardNameAr?: string;
  hazardNameEn?: string;
  exposureSeconds: number;
  exposurePct: number; // 0 to 100% until critical
  dangerLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  damageDealtThisFrame: boolean;
  radsLevel?: number; // Geiger counter reading in mSv/h
  dps: number;
}

export interface HazardMeshInstance {
  hazard: EnvironmentalHazard;
  group: THREE.Group;
  waterDisc?: THREE.Mesh;
  outerRing?: THREE.Mesh;
  electricArcs?: THREE.LineSegments[];
  particles?: THREE.Points;
  particlePositions?: Float32Array;
  beaconLight?: THREE.PointLight;
}

// Procedural placement of hazardous zones across Yemen battle sectors
export const PROCEDURAL_HAZARDS: EnvironmentalHazard[] = [
  {
    id: 'hazard-electric-mareb',
    type: 'ELECTRIC_WATER',
    nameAr: 'حوض المياه المكهربة (مأرب)',
    nameEn: 'Electrified Water Basin - Mareb',
    descriptionAr: 'مياه غمرتها كابلات مولدات الطاقة المتفجرة، تطلق صدمات كهربائية مميتة تمزق الدروع!',
    x: -26,
    z: 14,
    radius: 12.0,
    color: '#00f0ff',
    hexColor: 0x00f0ff,
    dps: 24,
    safeGraceSeconds: 1.5,
  },
  {
    id: 'hazard-rad-shabwa',
    type: 'RADIOACTIVE_ZONE',
    nameAr: 'منطقة الصخور المشعة غير المستقرة (شبوة)',
    nameEn: 'Unstable Radioactive Zone - Shabwah',
    descriptionAr: 'حقل إشعاعي متأين من بقايا تجارب أسلحة سرية، يخترق الدروع ويسمم الهيكل مباشرة!',
    x: 25,
    z: -20,
    radius: 13.5,
    color: '#39ff14',
    hexColor: 0x39ff14,
    dps: 28,
    safeGraceSeconds: 1.8,
  },
  {
    id: 'hazard-electric-mukalla',
    type: 'ELECTRIC_WATER',
    nameAr: 'مصب التيارات المكهربة (المكلا)',
    nameEn: 'Electrified Surge Shallows - Mukalla',
    descriptionAr: 'تيارات بحرية مكهربة بأسلاك دفاعية عالية التردد تعطل أنظمة الدفع وتستنزف الطاقة!',
    x: 10,
    z: 38,
    radius: 11.0,
    color: '#00e5ff',
    hexColor: 0x00e5ff,
    dps: 22,
    safeGraceSeconds: 1.5,
  },
  {
    id: 'hazard-rad-hadramout',
    type: 'RADIOACTIVE_ZONE',
    nameAr: 'حفرة النفايات النووية الحرجة (حضرموت)',
    nameEn: 'Critical Radioactive Waste Crater - Hadramout',
    descriptionAr: 'انبعاثات غازات يورانيوم مشعة خانقة، تسبب أضراراً كارثية للمركبات خلال ثوانٍ!',
    x: -24,
    z: -36,
    radius: 12.5,
    color: '#34d399',
    hexColor: 0x34d399,
    dps: 26,
    safeGraceSeconds: 1.6,
  },
  {
    id: 'hazard-thermal-crater',
    type: 'THERMAL_FISSURE',
    nameAr: 'صدع الحمم البركانية المتوهجة (عدن كراتر)',
    nameEn: 'Volcanic Thermal Fissure - Crater Aden',
    descriptionAr: 'صدوع صهارة بركانية منصهرة شديدة الحرارة ترفع حرارة السلاح إلى حد الانفجار!',
    x: 34,
    z: 22,
    radius: 10.5,
    color: '#ff3b00',
    hexColor: 0xff3b00,
    dps: 30,
    safeGraceSeconds: 1.2,
  },
];

/**
 * Creates 3D procedural meshes for an environmental hazard zone
 */
export function createHazardMesh(hazard: EnvironmentalHazard): HazardMeshInstance {
  const group = new THREE.Group();
  group.position.set(hazard.x, 0, hazard.z);

  const instance: HazardMeshInstance = {
    hazard,
    group,
    electricArcs: [],
  };

  const r = hazard.radius;

  if (hazard.type === 'ELECTRIC_WATER') {
    // 1. Shimmering Electrified Water Disc
    const waterGeo = new THREE.CircleGeometry(r, 48);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x003355,
      emissive: 0x005577,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.82,
    });
    const waterDisc = new THREE.Mesh(waterGeo, waterMat);
    waterDisc.position.y = 0.08;
    waterDisc.receiveShadow = true;
    group.add(waterDisc);
    instance.waterDisc = waterDisc;

    // 2. Damp shoreline boundary rim
    const rimGeo = new THREE.RingGeometry(r - 0.4, r + 1.2, 48);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1b2838,
      roughness: 0.9,
      metalness: 0.2,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.06;
    group.add(rim);

    // 3. Pulsing Cyan Perimeter Warning Ring
    const outerRingGeo = new THREE.RingGeometry(r - 0.15, r + 0.35, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.position.y = 0.12;
    group.add(outerRing);
    instance.outerRing = outerRing;

    // 4. Animated High-Voltage Electric Arc Lines
    const numArcs = 4;
    for (let a = 0; a < numArcs; a++) {
      const arcPoints: THREE.Vector3[] = [];
      const segments = 12;
      const angle = (a / numArcs) * Math.PI * 2;
      const startX = Math.cos(angle) * (r * 0.2);
      const startZ = Math.sin(angle) * (r * 0.2);
      const endX = Math.cos(angle + 0.8) * (r * 0.85);
      const endZ = Math.sin(angle + 0.8) * (r * 0.85);

      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const px = startX + (endX - startX) * t + (Math.random() - 0.5) * 1.5;
        const pz = startZ + (endZ - startZ) * t + (Math.random() - 0.5) * 1.5;
        const py = 0.15 + Math.sin(t * Math.PI) * 1.8 + Math.random() * 0.4;
        arcPoints.push(new THREE.Vector3(px, py, pz));
      }

      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat) as unknown as THREE.LineSegments;
      group.add(arcLine);
      instance.electricArcs!.push(arcLine);
    }

    // 5. Electric Sparks Particle Field (140 sparks)
    const sparkCount = 140;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (r * 0.9);
      sparkPositions[i * 3 + 0] = Math.cos(angle) * dist;
      sparkPositions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      sparkPositions[i * 3 + 2] = Math.sin(angle) * dist;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);
    instance.particles = sparks;
    instance.particlePositions = sparkPositions;

    // 6. Warning Buoy at Center
    const buoyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8);
    const buoyMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.4,
      metalness: 0.6,
    });
    const buoy = new THREE.Mesh(buoyGeo, buoyMat);
    buoy.position.y = 0.6;
    group.add(buoy);

    // Flashing light on buoy
    const beaconLight = new THREE.PointLight(0x00f0ff, 1.8, 22);
    beaconLight.position.set(0, 1.4, 0);
    group.add(beaconLight);
    instance.beaconLight = beaconLight;

  } else if (hazard.type === 'RADIOACTIVE_ZONE') {
    // 1. Toxic Radioactive Crater Ground Disc
    const radGeo = new THREE.CircleGeometry(r, 48);
    radGeo.rotateX(-Math.PI / 2);
    const radMat = new THREE.MeshStandardMaterial({
      color: 0x1f2e0e,
      emissive: 0x24420c,
      roughness: 0.75,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const radDisc = new THREE.Mesh(radGeo, radMat);
    radDisc.position.y = 0.08;
    radDisc.receiveShadow = true;
    group.add(radDisc);
    instance.waterDisc = radDisc;

    // 2. Scorched Contamination Border
    const borderGeo = new THREE.RingGeometry(r - 0.6, r + 1.4, 48);
    borderGeo.rotateX(-Math.PI / 2);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x11160a,
      roughness: 0.95,
      metalness: 0.05,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.06;
    group.add(border);

    // 3. Radioactive Warning Lime Perimeter Ring
    const outerRingGeo = new THREE.RingGeometry(r - 0.2, r + 0.35, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.position.y = 0.12;
    group.add(outerRing);
    instance.outerRing = outerRing;

    // 4. Toxic Radioactive Bubbling Mist Particle Column (180 particles)
    const mistCount = 180;
    const mistPositions = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (r * 0.85);
      mistPositions[i * 3 + 0] = Math.cos(angle) * dist;
      mistPositions[i * 3 + 1] = 0.15 + Math.random() * 3.5;
      mistPositions[i * 3 + 2] = Math.sin(angle) * dist;
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
    const mistMat = new THREE.PointsMaterial({
      color: 0x39ff14,
      size: 0.55,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const mist = new THREE.Points(mistGeo, mistMat);
    group.add(mist);
    instance.particles = mist;
    instance.particlePositions = mistPositions;

    // 5. Radiation Waste Drums clustered inside
    const drumPositions = [
      { x: -r * 0.35, z: -r * 0.25, rot: 0.2 },
      { x: r * 0.3, z: r * 0.35, rot: -0.4 },
      { x: -r * 0.15, z: r * 0.4, rot: 0.7 },
    ];
    drumPositions.forEach(({ x, z, rot }) => {
      const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12);
      const drumMat = new THREE.MeshStandardMaterial({
        color: 0xcccc00,
        roughness: 0.5,
        metalness: 0.5,
        emissive: 0x334400,
      });
      const drumMesh = new THREE.Mesh(drumGeo, drumMat);
      drumMesh.position.set(x, 0.55, z);
      drumMesh.rotation.y = rot;
      group.add(drumMesh);
    });

    // Central eerie radioactive green point light
    const beaconLight = new THREE.PointLight(0x39ff14, 2.0, 25);
    beaconLight.position.set(0, 1.5, 0);
    group.add(beaconLight);
    instance.beaconLight = beaconLight;

  } else if (hazard.type === 'THERMAL_FISSURE') {
    // 1. Molten Lava Fissure Disc
    const lavaGeo = new THREE.CircleGeometry(r, 40);
    lavaGeo.rotateX(-Math.PI / 2);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0x991100,
      emissive: 0xff3b00,
      roughness: 0.4,
      metalness: 0.3,
    });
    const lavaDisc = new THREE.Mesh(lavaGeo, lavaMat);
    lavaDisc.position.y = 0.08;
    group.add(lavaDisc);
    instance.waterDisc = lavaDisc;

    // 2. Obsidian crust border
    const crustGeo = new THREE.RingGeometry(r - 0.4, r + 1.2, 40);
    crustGeo.rotateX(-Math.PI / 2);
    const crustMat = new THREE.MeshStandardMaterial({
      color: 0x110c0a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.position.y = 0.06;
    group.add(crust);

    // 3. Fiery Orange Warning Outer Ring
    const outerRingGeo = new THREE.RingGeometry(r - 0.15, r + 0.35, 40);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.position.y = 0.12;
    group.add(outerRing);
    instance.outerRing = outerRing;

    // 4. Rising Thermal Embers (120 particles)
    const emberCount = 120;
    const emberPositions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (r * 0.85);
      emberPositions[i * 3 + 0] = Math.cos(angle) * dist;
      emberPositions[i * 3 + 1] = 0.1 + Math.random() * 2.8;
      emberPositions[i * 3 + 2] = Math.sin(angle) * dist;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    group.add(embers);
    instance.particles = embers;
    instance.particlePositions = emberPositions;

    const beaconLight = new THREE.PointLight(0xff3b00, 2.2, 22);
    beaconLight.position.set(0, 1.2, 0);
    group.add(beaconLight);
    instance.beaconLight = beaconLight;
  }

  return instance;
}

/**
 * Animate environmental hazard visual FX in the frame loop
 */
export function animateHazardInstances(instances: HazardMeshInstance[], time: number, dt: number) {
  instances.forEach((inst, idx) => {
    const { hazard, waterDisc, outerRing, beaconLight, electricArcs, particles, particlePositions } = inst;

    // Pulsing outer warning ring
    if (outerRing) {
      const pulse = 1.0 + Math.sin(time * 3.5 + idx * 1.5) * 0.05;
      outerRing.scale.set(pulse, pulse, pulse);
      const ringMat = outerRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.55 + Math.sin(time * 4.0 + idx) * 0.35;
    }

    // Pulsing beacon light
    if (beaconLight) {
      beaconLight.intensity = 1.4 + Math.sin(time * 5.0 + idx * 2) * 0.8;
    }

    // Dynamic animation for Electric Water
    if (hazard.type === 'ELECTRIC_WATER') {
      if (waterDisc) {
        const mat = waterDisc.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.4 + Math.sin(time * 6.0 + idx) * 0.35;
      }

      // Jitter electric arc lines
      if (electricArcs && electricArcs.length > 0) {
        electricArcs.forEach((arc, aIdx) => {
          arc.rotation.y += dt * (1.2 + aIdx * 0.6);
          const lineMat = arc.material as THREE.LineBasicMaterial;
          lineMat.opacity = 0.4 + Math.random() * 0.6;
        });
      }

      // Floating sparks
      if (particles && particlePositions) {
        const count = particlePositions.length / 3;
        for (let i = 0; i < count; i++) {
          particlePositions[i * 3 + 1] += dt * (1.2 + (i % 3) * 0.5);
          if (particlePositions[i * 3 + 1] > 2.8) {
            particlePositions[i * 3 + 1] = 0.2;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Dynamic animation for Radioactive Zone
    if (hazard.type === 'RADIOACTIVE_ZONE') {
      if (particles && particlePositions) {
        const count = particlePositions.length / 3;
        for (let i = 0; i < count; i++) {
          particlePositions[i * 3 + 1] += dt * (0.8 + (i % 4) * 0.3);
          particlePositions[i * 3 + 0] += Math.sin(time * 2 + i) * dt * 0.5;
          particlePositions[i * 3 + 2] += Math.cos(time * 2 + i) * dt * 0.5;
          if (particlePositions[i * 3 + 1] > 3.8) {
            particlePositions[i * 3 + 1] = 0.15;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Dynamic animation for Thermal Fissure
    if (hazard.type === 'THERMAL_FISSURE') {
      if (waterDisc) {
        const mat = waterDisc.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.8 + Math.sin(time * 4.5 + idx) * 0.3;
      }

      if (particles && particlePositions) {
        const count = particlePositions.length / 3;
        for (let i = 0; i < count; i++) {
          particlePositions[i * 3 + 1] += dt * (2.2 + (i % 3) * 0.7);
          if (particlePositions[i * 3 + 1] > 3.2) {
            particlePositions[i * 3 + 1] = 0.1;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
    }
  });
}

/**
 * Evaluates whether player is inside any hazard, tracks exposure time, and calculates damage
 */
export function evaluatePlayerHazardExposure(
  playerPos: { x: number; z: number },
  hazards: EnvironmentalHazard[],
  currentExposureSeconds: number,
  dt: number
): {
  hazardState: PlayerHazardState;
  activeHazard: EnvironmentalHazard | null;
  newExposureSeconds: number;
} {
  let activeHazard: EnvironmentalHazard | null = null;
  let minHazardDistance = Infinity;

  // Find if player is inside any hazard radius
  for (const h of hazards) {
    const dx = playerPos.x - h.x;
    const dz = playerPos.z - h.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= h.radius && dist < minHazardDistance) {
      minHazardDistance = dist;
      activeHazard = h;
    }
  }

  if (!activeHazard) {
    // Player is safe - cooldown exposure gradually
    const newExposure = Math.max(0, currentExposureSeconds - dt * 2.0);
    return {
      hazardState: {
        isInHazard: false,
        exposureSeconds: newExposure,
        exposurePct: 0,
        dangerLevel: 'SAFE',
        damageDealtThisFrame: false,
        dps: 0,
      },
      activeHazard: null,
      newExposureSeconds: newExposure,
    };
  }

  // Player is inside hazard
  const newExposure = currentExposureSeconds + dt;
  const grace = activeHazard.safeGraceSeconds;
  const criticalThreshold = grace + 2.5;

  let dangerLevel: 'WARNING' | 'DANGER' | 'CRITICAL' = 'WARNING';
  let damageDealtThisFrame = false;

  if (newExposure > criticalThreshold) {
    dangerLevel = 'CRITICAL';
    damageDealtThisFrame = true;
  } else if (newExposure > grace) {
    dangerLevel = 'DANGER';
    damageDealtThisFrame = true;
  } else {
    dangerLevel = 'WARNING';
    damageDealtThisFrame = false; // Still within safe grace period
  }

  const exposurePct = Math.min(100, Math.round((newExposure / criticalThreshold) * 100));
  const radsLevel = activeHazard.type === 'RADIOACTIVE_ZONE' ? Math.round(180 + (newExposure / criticalThreshold) * 720) : undefined;

  return {
    hazardState: {
      isInHazard: true,
      hazardType: activeHazard.type,
      hazardNameAr: activeHazard.nameAr,
      hazardNameEn: activeHazard.nameEn,
      exposureSeconds: newExposure,
      exposurePct,
      dangerLevel,
      damageDealtThisFrame,
      radsLevel,
      dps: activeHazard.dps,
    },
    activeHazard,
    newExposureSeconds: newExposure,
  };
}

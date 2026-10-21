import * as THREE from 'three';

/**
 * 360° PANORAMIC VISTA ENVIRONMENT & SKY DOME SYSTEM
 * نظام المشاهد البانورامية وسلاسل الجبال اليمنية ثلاثية الأبعاد
 * Replaces flat backgrounds with an awe-inspiring 360-degree panoramic vista:
 * - Jagged Yemeni Mountain amphitheater (جبل النبي شعيب، قمم كوكبان وحراز)
 * - Atmospheric panoramic sky hemisphere with procedural cloud strata
 * - Elevated scenic panoramic observation viewpoints (نقاط المراقبة البانورامية)
 */

export interface PanoramicVistaAssets {
  skyDome: THREE.Mesh;
  mountainRing: THREE.Group;
  vantagePoints: THREE.Group;
  sunDisc: THREE.Mesh;
}

/**
 * Generate a 360° Panoramic Atmospheric Sky Dome
 */
export function createPanoramicSkyDome(radius = 320): THREE.Mesh {
  // Canvas texture generating smooth atmospheric vertical gradient with cloud strata
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Vertical sky gradient (Deep atmospheric azure -> Golden amber desert horizon -> Warm ground haze)
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0.0, '#0c2242'); // Deep atmospheric space zenith
  grad.addColorStop(0.35, '#1e4875'); // High desert sky
  grad.addColorStop(0.65, '#568cb8'); // Lower sky
  grad.addColorStop(0.82, '#d69e64'); // Warm golden sunset / desert horizon
  grad.addColorStop(0.92, '#8a5c34'); // Low atmospheric mountain haze
  grad.addColorStop(1.0, '#362112'); // Distant terrain base
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft atmospheric cloud ribbons across the panorama
  ctx.fillStyle = 'rgba(255, 235, 210, 0.14)';
  for (let c = 0; c < 14; c++) {
    const cy = 200 + Math.sin(c * 1.3) * 60 + (c % 3) * 25;
    const cx = (c * 85) % canvas.width;
    const w = 180 + (c * 23) % 140;
    const h = 24 + (c * 7) % 20;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Second layer of wispy cirrus clouds
  ctx.fillStyle = 'rgba(240, 248, 255, 0.08)';
  for (let c = 0; c < 18; c++) {
    const cy = 110 + Math.cos(c * 1.7) * 45;
    const cx = ((c * 120) + 50) % canvas.width;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 14, 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const geo = new THREE.SphereGeometry(radius, 48, 28);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const dome = new THREE.Mesh(geo, mat);
  dome.rotation.y = -Math.PI / 4;
  return dome;
}

/**
 * Procedural 360° Panoramic Mountain Ridge Ring
 * Represents iconic Yemeni mountain ranges surrounding the battlefield
 */
export function createPanoramicMountainRidge(radius = 210): THREE.Group {
  const group = new THREE.Group();

  // Create two concentric rings of panoramic peaks (Outer huge mountains, Inner closer ridges)
  const segments = 64;
  const outerRadius = radius + 35;
  const innerRadius = radius;

  // Mountain ridge shader material with atmospheric distance fog
  const mountainMatOuter = new THREE.MeshStandardMaterial({
    color: 0x4a3627, // Distant hazy brown-purple sandstone
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const mountainMatInner = new THREE.MeshStandardMaterial({
    color: 0x6e4e34, // Warm Yemeni desert mountain rock
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });

  // 1. Outer Majestic High Peaks (Jabal An-Nabi Shu'ayb scale)
  const outerGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, 90, segments, 8, true);
  const outerPos = outerGeo.attributes.position;

  for (let i = 0; i < outerPos.count; i++) {
    const y = outerPos.getY(i);
    const x = outerPos.getX(i);
    const z = outerPos.getZ(i);
    const angle = Math.atan2(z, x);

    // Multi-octave procedural mountain profile
    const mountainWave =
      Math.sin(angle * 4) * 22 +
      Math.sin(angle * 9 + 1.2) * 14 +
      Math.cos(angle * 17) * 8 +
      Math.sin(angle * 31) * 3.5;

    if (y > 0) {
      // Top vertex of the cylinder wall: elevate into jagged peak
      const peakHeight = 45 + mountainWave;
      outerPos.setY(i, peakHeight);
      // Displace radially slightly for rugged ridgeline
      const rOffset = 1 + Math.sin(angle * 12) * 0.08;
      outerPos.setX(i, x * rOffset);
      outerPos.setZ(i, z * rOffset);
    } else {
      // Bottom vertex anchor below ground level
      outerPos.setY(i, -10);
    }
  }
  outerGeo.computeVertexNormals();

  const outerMesh = new THREE.Mesh(outerGeo, mountainMatOuter);
  outerMesh.receiveShadow = false;
  group.add(outerMesh);

  // 2. Inner Sandstone Ridge & Canyons (Taiz & Kawkaban Escarpments)
  const innerGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, 55, segments, 6, true);
  const innerPos = innerGeo.attributes.position;

  for (let i = 0; i < innerPos.count; i++) {
    const y = innerPos.getY(i);
    const x = innerPos.getX(i);
    const z = innerPos.getZ(i);
    const angle = Math.atan2(z, x);

    const ridgeWave =
      Math.sin(angle * 6 + 2.5) * 12 +
      Math.cos(angle * 13) * 7 +
      Math.sin(angle * 27) * 3;

    if (y > 0) {
      const ridgeHeight = 22 + ridgeWave;
      innerPos.setY(i, ridgeHeight);
      const rOffset = 1 + Math.cos(angle * 8) * 0.06;
      innerPos.setX(i, x * rOffset);
      innerPos.setZ(i, z * rOffset);
    } else {
      innerPos.setY(i, -8);
    }
  }
  innerGeo.computeVertexNormals();

  const innerMesh = new THREE.Mesh(innerGeo, mountainMatInner);
  group.add(innerMesh);

  // 3. Iconic Ancient Yemeni Mountain-top Fortress Silhouettes on distant peaks
  const fortressAngles = [0.4, 1.8, 3.2, 4.7];
  fortressAngles.forEach((ang) => {
    const fGroup = new THREE.Group();
    const fx = Math.cos(ang) * (radius + 20);
    const fz = Math.sin(ang) * (radius + 20);

    // Blocky stone tower citadel
    const towerGeo = new THREE.BoxGeometry(10, 16, 10);
    const fortMesh = new THREE.Mesh(towerGeo, mountainMatInner);
    fortMesh.position.y = 8;
    fGroup.add(fortMesh);

    // Battlements
    const battlementGeo = new THREE.BoxGeometry(12, 2.5, 12);
    const battlement = new THREE.Mesh(battlementGeo, mountainMatInner);
    battlement.position.y = 17;
    fGroup.add(battlement);

    fGroup.position.set(fx, 42, fz);
    fGroup.rotation.y = -ang;
    group.add(fGroup);
  });

  return group;
}

/**
 * High-Altitude Panoramic Observation Vantage Points (نقاط المراقبة والاستعراض البانورامي)
 */
export function createPanoramicVantagePoints(): {
  group: THREE.Group;
  viewpoints: Array<{ name: string; position: THREE.Vector3; lookAt: THREE.Vector3 }>;
} {
  const group = new THREE.Group();
  const viewpoints = [
    {
      name: 'مطل جبل نبي شعيب البانورامي',
      position: new THREE.Vector3(0, 36, -75),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
    {
      name: 'برج قلعة القاهرة البانورامي (تعز)',
      position: new THREE.Vector3(-65, 32, 35),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
    {
      name: 'مطل حصن كوكبان الشاهق',
      position: new THREE.Vector3(68, 34, -28),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
    {
      name: 'شرفة صيرة التاريخية المطلة (عدن)',
      position: new THREE.Vector3(-25, 30, 72),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
  ];

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x7c5d42,
    roughness: 0.85,
    metalness: 0.1,
  });

  const bannerMat = new THREE.MeshBasicMaterial({
    color: 0xd97706, // Golden banner
  });

  viewpoints.forEach((vp) => {
    const vpMesh = new THREE.Group();
    vpMesh.position.set(vp.position.x, 0, vp.position.z);

    // Stone scenic lookout base
    const baseGeo = new THREE.CylinderGeometry(4.2, 5.0, 10, 12);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 5;
    vpMesh.add(base);

    // Observation platform railing
    const platformGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.8, 16);
    const platform = new THREE.Mesh(platformGeo, stoneMat);
    platform.position.y = 10.4;
    vpMesh.add(platform);

    // Signal Beacon Torch on top
    const torchGeo = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 8);
    const torch = new THREE.Mesh(torchGeo, stoneMat);
    torch.position.y = 12.0;
    vpMesh.add(torch);

    // Glowing flame / beacon marker
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), flameMat);
    flame.position.y = 13.8;
    vpMesh.add(flame);

    group.add(vpMesh);
  });

  return { group, viewpoints };
}

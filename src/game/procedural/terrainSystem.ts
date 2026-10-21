import * as THREE from 'three';
import { createRealisticTerrainTexture } from './textures';
import { PROCEDURAL_HAZARDS } from './environmentalHazards';

/**
 * 3D Panoramic Battlefield Arena Terrain System (نظام أرضية الملعب البانورامية الحقيقية ثلاثية الأبعاد)
 * - True 360-degree panoramic scale extending into distant mountain horizons
 * - Procedural mathematical elevation field with rolling dunes, central plateau, craters, and mountain basin
 * - Dynamic ground height and surface normal sampling for craft suspension & AI navigation
 * - Vertex-colored terrain mesh with sand, rock, toxic moss, and scorched earth blending
 * - Distant panoramic Yemeni mountain ranges, agricultural terraces, and atmospheric horizon dome
 * - Perimeter cyber energy barrier pylons and trench structures
 */

/**
 * Procedural heightmap calculation for any (x, z) coordinate in the arena
 */
export function getTerrainHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);

  // 1. Distant Panoramic Mountain Range (beyond r = 65 out to 240)
  if (dist > 65) {
    const edgeFactor = (dist - 65) / 85;
    // Layered octaves of procedural peaks
    const mountainHeight =
      Math.pow(edgeFactor, 1.85) * 28 +
      Math.sin(x * 0.08) * Math.cos(z * 0.08) * 6.5 +
      Math.sin(x * 0.16 + 1.2) * Math.cos(z * 0.14) * 3.8 +
      Math.sin(x * 0.35) * 1.8;
    return Math.max(0, mountainHeight);
  }

  let height = 0;

  // 2. Gentle rolling desert dunes and natural terrain swales in combat zone
  height += Math.sin(x * 0.07) * Math.cos(z * 0.07) * 1.6;
  height += Math.sin(x * 0.035 + z * 0.045) * 1.2;
  height += Math.cos(x * 0.14 - z * 0.08) * 0.45;

  // 3. Central Military Outpost Raised Plateau (r < 18)
  if (dist < 18) {
    const plateauFactor = Math.cos((dist / 18) * (Math.PI / 2));
    height += plateauFactor * 0.75;
  }

  // 4. Depressions & Sunken Basins for Environmental Hazards
  for (const h of PROCEDURAL_HAZARDS) {
    const hx = x - h.x;
    const hz = z - h.z;
    const hDist = Math.sqrt(hx * hx + hz * hz);

    if (hDist < h.radius * 1.3) {
      const normDist = hDist / (h.radius * 1.3);

      if (h.type === 'ELECTRIC_WATER') {
        // Natural water basin depression (depth down to -1.35m)
        const basinDepth = (1 - Math.pow(normDist, 2)) * 1.35;
        height -= basinDepth;
      } else if (h.type === 'RADIOACTIVE_ZONE') {
        // Impact crater with raised rim
        if (normDist < 0.75) {
          const craterDepth = (1 - normDist / 0.75) * 1.55;
          height -= craterDepth;
        } else {
          // Raised crater rim
          const rim = Math.sin(((normDist - 0.75) / 0.25) * Math.PI) * 0.75;
          height += rim;
        }
      } else if (h.type === 'THERMAL_FISSURE') {
        // Volcanic rift chasm
        const riftDepth = (1 - Math.pow(normDist, 1.8)) * 1.65;
        height -= riftDepth;
      }
    }
  }

  return height;
}

/**
 * Calculates surface normal of the terrain at (x, z) using finite differences
 */
export function getTerrainNormal(x: number, z: number): THREE.Vector3 {
  const eps = 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU);
  return normal.normalize();
}

/**
 * Creates the complete Panoramic 3D Arena Ground Mesh with vertex coloring & textures
 */
export function createArenaTerrainMesh(): THREE.Mesh {
  const size = 360; // Expansive panoramic battlefield
  const segments = 140; // High resolution 3D terrain grid
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const baseSandColor = new THREE.Color(0xbfa57d);
  const darkRockColor = new THREE.Color(0x6b5740);
  const mountainPeakColor = new THREE.Color(0x4a3a29);
  const wetSandColor = new THREE.Color(0x2f424f);
  const radioactiveGreenColor = new THREE.Color(0x385c18);
  const volcanicSootColor = new THREE.Color(0x26140d);
  const terraceGreenColor = new THREE.Color(0x667744);

  const tempColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = getTerrainHeight(x, z);
    pos.setY(i, h);

    // Compute dynamic vertex colors based on height, slope, and hazard proximity
    tempColor.copy(baseSandColor);

    // Check proximity to hazards
    let inElectricZone = false;
    let inRadZone = false;
    let inThermalZone = false;

    for (const hzd of PROCEDURAL_HAZARDS) {
      const dx = x - hzd.x;
      const dz = z - hzd.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < hzd.radius * 1.25) {
        const factor = Math.max(0, 1 - d / (hzd.radius * 1.25));
        if (hzd.type === 'ELECTRIC_WATER') {
          tempColor.lerp(wetSandColor, factor * 0.88);
          inElectricZone = true;
        } else if (hzd.type === 'RADIOACTIVE_ZONE') {
          tempColor.lerp(radioactiveGreenColor, factor * 0.92);
          inRadZone = true;
        } else if (hzd.type === 'THERMAL_FISSURE') {
          tempColor.lerp(volcanicSootColor, factor * 0.95);
          inThermalZone = true;
        }
      }
    }

    if (!inElectricZone && !inRadZone && !inThermalZone) {
      if (h > 12.0) {
        tempColor.lerp(mountainPeakColor, Math.min(1.0, (h - 12.0) / 16));
      } else if (h > 5.0) {
        // Natural mountain terraces
        const isTerrace = Math.floor(h * 1.2) % 2 === 0;
        tempColor.lerp(isTerrace ? terraceGreenColor : darkRockColor, 0.65);
      } else if (h > 2.0) {
        tempColor.lerp(darkRockColor, (h - 2.0) / 3.5);
      }
    }

    colors[i * 3 + 0] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainTex = createRealisticTerrainTexture();
  terrainTex.repeat.set(20, 20);

  const mat = new THREE.MeshStandardMaterial({
    map: terrainTex,
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.12,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Creates 3D Holographic Arena Boundary Pylons around perimeter (r = 82)
 */
export function createArenaBoundaryPylons(): THREE.Group {
  const group = new THREE.Group();
  const numPylons = 24;
  const radius = 82;

  for (let i = 0; i < numPylons; i++) {
    const angle = (i / numPylons) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z);

    // Pylon structure
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(x, y, z);
    pylonGroup.lookAt(0, y, 0);

    // Concrete base
    const baseGeo = new THREE.BoxGeometry(1.8, 0.9, 1.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x242d38, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.45;
    pylonGroup.add(base);

    // Steel column
    const colGeo = new THREE.CylinderGeometry(0.28, 0.38, 4.5, 6);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x3b4a5a, metalness: 0.8, roughness: 0.3 });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.y = 2.7;
    pylonGroup.add(col);

    // Glowing emitter head
    const headGeo = new THREE.ConeGeometry(0.45, 0.9, 6);
    headGeo.rotateX(Math.PI);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 5.2;
    pylonGroup.add(head);

    // Holographic laser beam connecting to next pylon
    const nextAngle = ((i + 1) / numPylons) * Math.PI * 2;
    const nextX = Math.cos(nextAngle) * radius;
    const nextZ = Math.sin(nextAngle) * radius;
    const nextY = getTerrainHeight(nextX, nextZ);

    const beamPoints = [
      new THREE.Vector3(x, y + 5.0, z),
      new THREE.Vector3(nextX, nextY + 5.0, nextZ),
    ];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Line(beamGeo, beamMat);
    group.add(beam);

    group.add(pylonGroup);
  }

  return group;
}

/**
 * Creates 360-degree Panoramic Mountain Ring & Sky Dome (حزام الجبال البانورامية وقبة الأفق)
 */
export function createPanoramicEnvironment(): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. Distant Panoramic Mountain Range Silhouettes (Iconic jagged Sarawat & Haraz peaks)
  const mountainRingGeo = new THREE.CylinderGeometry(190, 175, 45, 64, 8, true);
  const pos = mountainRingGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(z, x);

    // Sculpt natural jagged mountain crests
    if (y > 0) {
      const peakNoise =
        Math.sin(angle * 14) * 8 +
        Math.sin(angle * 28 + 1.5) * 4 +
        Math.cos(angle * 7) * 12;
      pos.setY(i, y + peakNoise);
    }
  }
  mountainRingGeo.computeVertexNormals();

  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x5c4836,
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.BackSide,
  });
  const mountains = new THREE.Mesh(mountainRingGeo, mountainMat);
  mountains.position.y = 12;
  envGroup.add(mountains);

  // 2. Atmospheric Panoramic Sky & Horizon Dome
  const skyGeo = new THREE.SphereGeometry(220, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x8fc2e8,
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  envGroup.add(skyDome);

  // 3. Warm Golden Desert Horizon Haze Ring
  const hazeGeo = new THREE.CylinderGeometry(215, 215, 28, 48, 1, true);
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0xd6b185,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Mesh(hazeGeo, hazeMat);
  haze.position.y = 10;
  envGroup.add(haze);

  return envGroup;
}

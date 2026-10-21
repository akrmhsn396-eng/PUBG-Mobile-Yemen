import * as THREE from 'three';
import { getTerrainHeight } from './terrainSystem';

/**
 * Procedural Crawling Zones & Stealth Terrain System (أجزاء ومناطق واسعة للزحف والتخفي)
 * - Spacious tall camouflage savanna grass fields
 * - Low-profile military crawl trenches with camouflage netting
 * - Earthen berm culverts for stealth flanking around enemy lines
 */

export type CrawlZoneType = 'TALL_GRASS' | 'CRAWL_TRENCH' | 'CAMO_CULVERT';

export interface CrawlZone {
  id: string;
  type: CrawlZoneType;
  nameAr: string;
  nameEn: string;
  x: number;
  z: number;
  radius: number;
  width?: number;
  depth?: number;
  stealthBonus: number; // Percentage reduction in enemy detection
  descriptionAr: string;
}

export interface CrawlStealthState {
  isInCrawlZone: boolean;
  zoneType?: CrawlZoneType;
  zoneNameAr?: string;
  isProne: boolean;
  stealthPct: number; // 0 to 100% hidden
  detectionRangeMultiplier: number; // e.g. 0.25 (enemies can only see player from 25% distance)
}

// Wide spacious crawling zones positioned across the battlefield
export const PROCEDURAL_CRAWL_ZONES: CrawlZone[] = [
  {
    id: 'zone-grass-west',
    type: 'TALL_GRASS',
    nameAr: 'مروج حشائش السافانا العالية (القطاع الغربي)',
    nameEn: 'Western Tall Grass Savanna',
    x: -36,
    z: -8,
    radius: 18.5,
    stealthBonus: 85,
    descriptionAr: 'حقول شاسعة من الحشائش الكثيفة الطويلة توفر تخفياً تاماً عند الزحف على البطن وتسمح بالتسلل خلف خطوط الأعداء.',
  },
  {
    id: 'zone-trench-east',
    type: 'CRAWL_TRENCH',
    nameAr: 'شبكة خنادق الزحف العسكرية المحصنة (القطاع الشرقي)',
    nameEn: 'Eastern Fortified Crawl Trenches',
    x: 28,
    z: 6,
    radius: 16.0,
    width: 32,
    depth: 10,
    stealthBonus: 90,
    descriptionAr: 'خنادق قتالية منخفضة محصنة بسواتر رملية وشباك تمويه، تسمح بالزحف الآمن تحت وابل نيران دبابات العدو.',
  },
  {
    id: 'zone-reeds-north',
    type: 'TALL_GRASS',
    nameAr: 'حقل قصب الوادي الكثيف (القطاع الشمالي)',
    nameEn: 'Northern Wadi Reedbeds',
    x: 10,
    z: -34,
    radius: 17.0,
    stealthBonus: 80,
    descriptionAr: 'منطقة زحف عريضة من نباتات القصب الطويلة، مثالية للقناصين للتمركز في وضعية الانبطاح التام.',
  },
  {
    id: 'zone-culvert-south',
    type: 'CAMO_CULVERT',
    nameAr: 'ممر السواتر والأنفاق الترابية المنخفضة (القطاع الجنوبي)',
    nameEn: 'Southern Low Culvert Berms',
    x: -12,
    z: 28,
    radius: 15.0,
    width: 26,
    depth: 9,
    stealthBonus: 88,
    descriptionAr: 'سواتر ترابية منخفضة وممرات أنبوبية واسعة مخصصة للزحف التكتيكي وتفادي صواريخ الطائرات والدبابات.',
  },
];

/**
 * Creates 3D visual meshes for the wide crawling fields and trenches
 */
export function createCrawlZones3D(): THREE.Group {
  const masterGroup = new THREE.Group();

  PROCEDURAL_CRAWL_ZONES.forEach((zone) => {
    const zoneGroup = new THREE.Group();

    if (zone.type === 'TALL_GRASS') {
      // 1. Procedural Clusters of Swaying Tall Camo Grass Tuft Blades (280 tufts)
      const numTufts = 280;
      const bladeGeo = new THREE.PlaneGeometry(0.35, 1.8);
      bladeGeo.translate(0, 0.9, 0); // Pivot at ground base
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x7a8a48,
        roughness: 0.9,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
      });

      // Instanced Mesh for high performance
      const instancedGrass = new THREE.InstancedMesh(bladeGeo, bladeMat, numTufts);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < numTufts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.6) * zone.radius;
        const gx = zone.x + Math.cos(angle) * dist;
        const gz = zone.z + Math.sin(angle) * dist;
        const gy = getTerrainHeight(gx, gz);

        dummy.position.set(gx, gy, gz);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.rotation.z = (Math.random() - 0.5) * 0.25; // Random lean
        const scale = 0.8 + Math.random() * 0.55;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        instancedGrass.setMatrixAt(i, dummy.matrix);
      }

      instancedGrass.instanceMatrix.needsUpdate = true;
      instancedGrass.receiveShadow = true;
      zoneGroup.add(instancedGrass);

      // Faint green zone perimeter guide ring
      const guideGeo = new THREE.RingGeometry(zone.radius - 0.2, zone.radius + 0.3, 36);
      guideGeo.rotateX(-Math.PI / 2);
      const guideMat = new THREE.MeshBasicMaterial({
        color: 0x88cc44,
        transparent: true,
        opacity: 0.25,
      });
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.position.set(zone.x, getTerrainHeight(zone.x, zone.z) + 0.05, zone.z);
      zoneGroup.add(guide);

    } else if (zone.type === 'CRAWL_TRENCH') {
      // 2. Low Sunken Trench with Camouflage Netting
      const width = zone.width || 28;
      const depth = zone.depth || 8;

      // Wooden duckboard crawl walkway
      const numPlanks = 16;
      for (let p = 0; p < numPlanks; p++) {
        const px = zone.x - width / 2 + (p / numPlanks) * width;
        const pz = zone.z;
        const py = getTerrainHeight(px, pz);

        const plankGeo = new THREE.BoxGeometry(1.4, 0.08, depth * 0.6);
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95 });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(px, py + 0.04, pz);
        zoneGroup.add(plank);
      }

      // Sandbag banks on sides
      for (let s = 0; s < 12; s++) {
        const sx = zone.x - width / 2 + (s / 12) * width;
        const sy = getTerrainHeight(sx, zone.z);

        const bag1 = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.45, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x8c7456, roughness: 0.9 })
        );
        bag1.position.set(sx, sy + 0.3, zone.z - depth * 0.35);
        zoneGroup.add(bag1);

        const bag2 = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.45, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x8c7456, roughness: 0.9 })
        );
        bag2.position.set(sx, sy + 0.3, zone.z + depth * 0.35);
        zoneGroup.add(bag2);
      }

      // Camouflage overhead canopy netting
      const netGeo = new THREE.PlaneGeometry(width * 0.8, depth * 0.7);
      netGeo.rotateX(-Math.PI / 2);
      const netMat = new THREE.MeshStandardMaterial({
        color: 0x5a6341,
        roughness: 0.95,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const net = new THREE.Mesh(netGeo, netMat);
      net.position.set(zone.x, getTerrainHeight(zone.x, zone.z) + 1.25, zone.z);
      zoneGroup.add(net);

    } else if (zone.type === 'CAMO_CULVERT') {
      // 3. Earthen Berm Culvert Pipe for prone crawling
      const cx = zone.x;
      const cz = zone.z;
      const cy = getTerrainHeight(cx, cz);

      // Low concrete half-pipe tunnel
      const tunnelGeo = new THREE.CylinderGeometry(1.8, 1.8, 18, 16, 1, true, 0, Math.PI);
      tunnelGeo.rotateZ(Math.PI / 2);
      const tunnelMat = new THREE.MeshStandardMaterial({
        color: 0x3d4349,
        roughness: 0.85,
        side: THREE.DoubleSide,
      });
      const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
      tunnel.position.set(cx, cy + 0.2, cz);
      zoneGroup.add(tunnel);

      // Surrounding sand berm
      const bermGeo = new THREE.BoxGeometry(22, 1.2, 4);
      const bermMat = new THREE.MeshStandardMaterial({ color: 0x9c8362, roughness: 0.95 });
      const berm = new THREE.Mesh(bermGeo, bermMat);
      berm.position.set(cx, cy + 0.6, cz + 2.2);
      zoneGroup.add(berm);
    }

    masterGroup.add(zoneGroup);
  });

  return masterGroup;
}

/**
 * Evaluates whether player is inside a crawling zone and calculates stealth bonus
 */
export function evaluatePlayerCrawlStealth(
  playerPos: { x: number; z: number },
  isProne: boolean
): CrawlStealthState {
  let insideZone: CrawlZone | null = null;

  for (const zone of PROCEDURAL_CRAWL_ZONES) {
    const dx = playerPos.x - zone.x;
    const dz = playerPos.z - zone.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= zone.radius) {
      insideZone = zone;
      break;
    }
  }

  if (!insideZone) {
    // Outside crawling zones
    return {
      isInCrawlZone: false,
      isProne,
      stealthPct: isProne ? 50 : 0,
      detectionRangeMultiplier: isProne ? 0.5 : 1.0,
    };
  }

  // Inside a wide crawling zone!
  const baseStealth = insideZone.stealthBonus;
  const stealthPct = isProne ? baseStealth : Math.round(baseStealth * 0.4);
  const detectionRangeMultiplier = isProne ? (100 - baseStealth) / 100 : 0.65;

  return {
    isInCrawlZone: true,
    zoneType: insideZone.type,
    zoneNameAr: insideZone.nameAr,
    isProne,
    stealthPct,
    detectionRangeMultiplier,
  };
}

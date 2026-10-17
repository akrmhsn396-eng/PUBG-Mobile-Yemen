import * as THREE from 'three';
import { YEMEN_GOVERNORATES, YemenCity } from '../../data/yemenGovernorates';

export interface CityBeaconNode {
  city: YemenCity;
  group: THREE.Group;
  lightBeam: THREE.Mesh;
  pulseRing: THREE.Mesh;
  crystal: THREE.Mesh;
}

export function createYemenCityBeacon(city: YemenCity): CityBeaconNode {
  const group = new THREE.Group();
  group.name = `beacon_${city.id}`;
  group.position.set(city.coord3D.x, 0, city.coord3D.z);

  const colorHex = parseInt(city.color.replace('#', '0x'), 16);

  // 1. Base pedestal ring
  const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.4, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111c2e,
    roughness: 0.5,
    metalness: 0.8,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.2;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Glowing inner energy ring
  const ringGeo = new THREE.TorusGeometry(1.3, 0.08, 8, 24);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
  });
  const pulseRing = new THREE.Mesh(ringGeo, ringMat);
  pulseRing.position.y = 0.42;
  group.add(pulseRing);

  // 3. Floating rotating crystal emblem
  const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.3,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 2.2;
  crystal.castShadow = true;
  group.add(crystal);

  // 4. Vertical holographic sky beam
  const beamGeo = new THREE.CylinderGeometry(0.12, 0.4, 24, 12, 1, true);
  beamGeo.translate(0, 12, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lightBeam = new THREE.Mesh(beamGeo, beamMat);
  group.add(lightBeam);

  return {
    city,
    group,
    lightBeam,
    pulseRing,
    crystal,
  };
}

export function createAllYemenBeacons(): CityBeaconNode[] {
  return YEMEN_GOVERNORATES.map((city) => createYemenCityBeacon(city));
}

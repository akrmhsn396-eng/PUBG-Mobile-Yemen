import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export interface ImportedModelInfo {
  name: string;
  vertexCount: number;
  triangleCount: number;
  size: { x: number; y: number; z: number };
  object: THREE.Group;
}

export class ModelLoaderService {
  private objLoader: OBJLoader;

  constructor() {
    this.objLoader = new OBJLoader();
  }

  /**
   * Parse an OBJ format string into a Three.js Group with normalized scale,
   * centered origin, and PBR materials.
   */
  public parseOBJ(
    objText: string,
    modelName = 'Custom Model',
    customColor = 0x00f0ff
  ): ImportedModelInfo {
    const object = this.objLoader.parse(objText);

    let vertexCount = 0;
    let triangleCount = 0;

    // Apply high-end PBR materials, ensure shadows & normal computation
    const defaultMat = new THREE.MeshPhysicalMaterial({
      color: customColor,
      roughness: 0.35,
      metalness: 0.8,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    });

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (!mesh.material || Array.isArray(mesh.material)) {
          mesh.material = defaultMat.clone();
        } else {
          // Upgrade or preserve
          const prevMat = mesh.material as THREE.MeshStandardMaterial;
          mesh.material = new THREE.MeshStandardMaterial({
            color: prevMat.color || customColor,
            roughness: 0.35,
            metalness: 0.8,
          });
        }

        if (mesh.geometry) {
          mesh.geometry.computeVertexNormals();
          const pos = mesh.geometry.attributes.position;
          if (pos) {
            vertexCount += pos.count;
            triangleCount += mesh.geometry.index
              ? mesh.geometry.index.count / 3
              : pos.count / 3;
          }
        }
      }
    });

    // Auto-center and normalize scale to ~3.5 units
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetDim = 3.2;
    const scaleFactor = targetDim / maxDim;
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Wrap in parent group so position offset is clean
    const container = new THREE.Group();
    container.name = modelName;
    container.add(object);

    return {
      name: modelName,
      vertexCount,
      triangleCount: Math.round(triangleCount),
      size: {
        x: parseFloat(size.x.toFixed(2)),
        y: parseFloat(size.y.toFixed(2)),
        z: parseFloat(size.z.toFixed(2)),
      },
      object: container,
    };
  }

  /**
   * Reads a File object from user upload (via <input type="file"> or drag-and-drop)
   */
  public async loadFromFile(
    file: File,
    color = 0x00f0ff
  ): Promise<ImportedModelInfo> {
    const text = await file.text();
    return this.parseOBJ(text, file.name.replace(/\.[^/.]+$/, ''), color);
  }

  /**
   * Built-in Procedural Sample OBJ models for instant testing and demonstration
   */
  public getSampleOBJ(type: 'fighter' | 'mech' | 'speeder'): string {
    if (type === 'fighter') {
      // Sleek Sci-Fi Stealth Interceptor OBJ
      return `# Wavefront OBJ: Stealth Interceptor VX
v 0.0 0.4 2.2
v 1.8 -0.2 -1.4
v 2.0 0.3 -1.6
v 0.4 0.2 -1.2
v -0.4 0.2 -1.2
v -2.0 0.3 -1.6
v -1.8 -0.2 -1.4
v 0.0 -0.4 1.8
v 0.0 1.0 -0.8
v 0.0 0.2 -2.0

# Nose & Top Hull
f 1 2 4
f 1 4 5
f 1 5 7
f 1 4 9
f 1 9 5
f 4 10 9
f 5 9 10

# Wings
f 2 3 4
f 7 5 6

# Undercarriage
f 1 8 2
f 1 7 8
f 2 8 4
f 7 5 8
f 4 8 10
f 5 10 8
`;
    } else if (type === 'mech') {
      // Cybernetic Heavy Sentinel Frame OBJ
      return `# Wavefront OBJ: Sentinel Drone Core
v 0.0 1.6 0.0
v 1.2 0.8 1.2
v -1.2 0.8 1.2
v -1.2 0.8 -1.2
v 1.2 0.8 -1.2
v 1.4 -0.6 1.4
v -1.4 -0.6 1.4
v -1.4 -0.6 -1.4
v 1.4 -0.6 -1.4
v 0.0 -1.4 0.0

# Top pyramid faces
f 1 2 3
f 1 3 4
f 1 4 5
f 1 5 2

# Mid body band
f 2 6 7
f 2 7 3
f 3 7 8
f 3 8 4
f 4 8 9
f 4 9 5
f 5 9 6
f 5 6 2

# Bottom tapered base
f 10 7 6
f 10 8 7
f 10 9 8
f 10 6 9
`;
    } else {
      // High-Velocity Speeder Skiff OBJ
      return `# Wavefront OBJ: Pulse Speeder Skiff
v 0.0 0.2 2.5
v 0.8 0.3 0.2
v -0.8 0.3 0.2
v 1.4 -0.2 -1.8
v -1.4 -0.2 -1.8
v 0.0 0.5 -1.2
v 0.0 -0.3 1.9
v 0.0 -0.4 -1.5

f 1 2 6
f 1 6 3
f 2 4 6
f 3 6 5
f 1 7 2
f 1 3 7
f 2 7 4
f 3 5 7
f 4 7 8
f 5 8 7
f 6 4 8
f 6 8 5
`;
    }
  }
}

export const modelLoaderService = new ModelLoaderService();

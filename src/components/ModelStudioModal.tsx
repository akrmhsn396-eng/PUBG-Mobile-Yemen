import React, { useState } from 'react';
import { modelLoaderService, ImportedModelInfo } from '../game/ModelLoaderService';
import { GameEngine } from '../game/GameEngine';
import { Upload, Box, Circle, Cylinder, Eye, Palette, Code, Check, RefreshCw, X, Shield, Sparkles } from 'lucide-react';

interface ModelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameEngine: GameEngine | null;
}

export const ModelStudioModal: React.FC<ModelStudioModalProps> = ({
  isOpen,
  onClose,
  gameEngine,
}) => {
  const [activeTab, setActiveTab] = useState<'obj' | 'primitives' | 'code'>('obj');
  const [loading, setLoading] = useState(false);
  const [currentModelInfo, setCurrentModelInfo] = useState<ImportedModelInfo | null>(null);
  const [displayMode, setDisplayMode] = useState<'player' | 'showcase' | 'escort'>('player');
  const [modelColor, setModelColor] = useState('#00f0ff');
  const [metalness, setMetalness] = useState(0.8);
  const [roughness, setRoughness] = useState(0.35);
  const [wireframe, setWireframe] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local .obj file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Parsing 3D file: ${file.name}...`);
    try {
      const colorHex = parseInt(modelColor.replace('#', '0x'), 16);
      const info = await modelLoaderService.loadFromFile(file, colorHex);
      setCurrentModelInfo(info);

      if (gameEngine) {
        gameEngine.displayImportedModel(info.object, displayMode);
        gameEngine.updateImportedMaterial({
          color: modelColor,
          metalness,
          roughness,
          wireframe,
        });
      }
      setStatusMessage(`Model "${info.name}" loaded successfully (${info.vertexCount} vertices, ${info.triangleCount} triangles)`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Error parsing OBJ file. Please ensure it is valid Wavefront OBJ format.');
    } finally {
      setLoading(false);
    }
  };

  // Load built-in sample OBJ
  const handleLoadSample = (sampleType: 'fighter' | 'mech' | 'speeder') => {
    setLoading(true);
    try {
      const objText = modelLoaderService.getSampleOBJ(sampleType);
      const colorHex = parseInt(modelColor.replace('#', '0x'), 16);
      const names = {
        fighter: 'Stealth Interceptor VX',
        mech: 'Sentinel Drone Core',
        speeder: 'Pulse Speeder Skiff',
      };
      const info = modelLoaderService.parseOBJ(objText, names[sampleType], colorHex);
      setCurrentModelInfo(info);

      if (gameEngine) {
        gameEngine.displayImportedModel(info.object, displayMode);
        gameEngine.updateImportedMaterial({
          color: modelColor,
          metalness,
          roughness,
          wireframe,
        });
      }
      setStatusMessage(`Loaded sample model: "${info.name}"`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Error loading sample model.');
    } finally {
      setLoading(false);
    }
  };

  // Create and spawn Primitives (Cube, Sphere, Cylinder)
  const handleSpawnPrimitive = (type: 'cube' | 'sphere' | 'cylinder') => {
    const colorHex = parseInt(modelColor.replace('#', '0x'), 16);
    let objText = '';
    let name = '';

    if (type === 'cube') {
      name = 'Procedural Geometric Cube';
      objText = `# Basic Cube
v -1.0 -1.0 1.0
v 1.0 -1.0 1.0
v -1.0 1.0 1.0
v 1.0 1.0 1.0
v -1.0 1.0 -1.0
v 1.0 1.0 -1.0
v -1.0 -1.0 -1.0
v 1.0 -1.0 -1.0
f 1 2 4
f 1 4 3
f 3 4 6
f 3 6 5
f 5 6 8
f 5 8 7
f 7 8 2
f 7 2 1
f 2 8 6
f 2 6 4
f 7 1 3
f 7 3 5
`;
    } else if (type === 'sphere') {
      name = 'Procedural Geometric Sphere';
      objText = modelLoaderService.getSampleOBJ('mech');
    } else {
      name = 'Procedural Geometric Cylinder';
      objText = `# Basic Hexagonal Cylinder
v 0.0 1.5 0.0
v 1.0 1.5 0.0
v 0.5 1.5 0.866
v -0.5 1.5 0.866
v -1.0 1.5 0.0
v -0.5 1.5 -0.866
v 0.5 1.5 -0.866
v 0.0 -1.5 0.0
v 1.0 -1.5 0.0
v 0.5 -1.5 0.866
v -0.5 -1.5 0.866
v -1.0 -1.5 0.0
v -0.5 -1.5 -0.866
v 0.5 -1.5 -0.866
f 1 2 3
f 1 3 4
f 1 4 5
f 1 5 6
f 1 6 7
f 1 7 2
f 8 10 9
f 8 11 10
f 8 12 11
f 8 13 12
f 8 14 13
f 8 9 14
f 2 9 10
f 2 10 3
f 3 10 11
f 3 11 4
f 4 11 12
f 4 12 5
f 5 12 13
f 5 13 6
f 6 13 14
f 6 14 7
f 7 14 9
f 7 9 2
`;
    }

    const info = modelLoaderService.parseOBJ(objText, name, colorHex);
    setCurrentModelInfo(info);
    if (gameEngine) {
      gameEngine.displayImportedModel(info.object, displayMode);
      gameEngine.updateImportedMaterial({
        color: modelColor,
        metalness,
        roughness,
        wireframe,
      });
    }
    setStatusMessage(`Spawned ${type} into scene (${displayMode} mode).`);
  };

  const handleDisplayModeChange = (mode: 'player' | 'showcase' | 'escort') => {
    setDisplayMode(mode);
    if (currentModelInfo && gameEngine) {
      gameEngine.displayImportedModel(currentModelInfo.object, mode);
      setStatusMessage(`Display mode set to: ${mode.toUpperCase()}`);
    }
  };

  const handleColorChange = (newColor: string) => {
    setModelColor(newColor);
    if (gameEngine) {
      gameEngine.updateImportedMaterial({ color: newColor });
    }
  };

  const handleMetalnessChange = (val: number) => {
    setMetalness(val);
    if (gameEngine) {
      gameEngine.updateImportedMaterial({ metalness: val });
    }
  };

  const handleRoughnessChange = (val: number) => {
    setRoughness(val);
    if (gameEngine) {
      gameEngine.updateImportedMaterial({ roughness: val });
    }
  };

  const handleWireframeToggle = () => {
    const nextVal = !wireframe;
    setWireframe(nextVal);
    if (gameEngine) {
      gameEngine.updateImportedMaterial({ wireframe: nextVal });
    }
  };

  const handleResetToDefault = () => {
    if (gameEngine) {
      gameEngine.resetImportedModel();
    }
    setCurrentModelInfo(null);
    setStatusMessage('Restored standard procedural craft hull.');
  };

  const standaloneThreeJsCode = `import * as THREE from 'three';

// 1. Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e17);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 2. Simple Lighting Model (Directional Key Light + Ambient Fill)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Shared PBR Material
const material = new THREE.MeshStandardMaterial({
  color: 0x00f0ff,
  metalness: 0.8,
  roughness: 0.35,
});

// 3. Functions to create and render Cube, Sphere, Cylinder

export function createCube(size = 1.5, x = -3, y = 0, z = 0): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function createSphere(radius = 0.9, x = 0, y = 0, z = 0): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function createCylinder(radius = 0.75, height = 1.8, x = 3, y = 0, z = 0): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Instantiate primitives in scene
const cube = createCube();
const sphere = createSphere();
const cylinder = createCylinder();

// Ground plane
const groundGeo = new THREE.PlaneGeometry(25, 25);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.2;
ground.receiveShadow = true;
scene.add(ground);

// 4. Animation / Render Loop
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.01;
  cube.rotation.x += 0.005;
  sphere.rotation.y += 0.01;
  cylinder.rotation.y += 0.01;
  cylinder.rotation.z += 0.005;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(standaloneThreeJsCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-[#0c121e] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/50 bg-[#080d16]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white font-mono uppercase">
                3D Model Importer & Geometry Studio
              </h2>
              <p className="text-xs text-cyan-400/70 font-mono">
                Load custom OBJ models · Spawn 3D primitives · Inspect lighting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-cyan-900/40 bg-[#090f1a] px-6">
          <button
            onClick={() => setActiveTab('obj')}
            className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'obj'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            OBJ File Importer
          </button>
          <button
            onClick={() => setActiveTab('primitives')}
            className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'primitives'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Basic 3D Primitives
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Three.js Code Reference
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {statusMessage && (
            <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center justify-between">
              <span>{statusMessage}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-cyan-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'obj' && (
            <div className="space-y-5">
              {/* File upload box */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  1. Upload Custom .OBJ File from Disk
                </label>
                <div className="relative border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 rounded-xl p-5 text-center bg-[#070b12] transition cursor-pointer">
                  <input
                    type="file"
                    accept=".obj"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                  <p className="font-medium text-white text-sm">
                    Click to browse or drop an .OBJ 3D file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Wavefront (.obj) geometry format supported
                  </p>
                </div>
              </div>

              {/* Sample Presets */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  Or Select a Pre-Packaged Sci-Fi 3D Model
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleLoadSample('fighter')}
                    className="p-3 rounded-lg bg-[#0e1624] border border-cyan-500/30 hover:border-cyan-400 text-left transition flex flex-col"
                  >
                    <span className="font-semibold text-white text-xs">Stealth Interceptor</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">Swept-wing combat fighter</span>
                  </button>
                  <button
                    onClick={() => handleLoadSample('mech')}
                    className="p-3 rounded-lg bg-[#0e1624] border border-cyan-500/30 hover:border-cyan-400 text-left transition flex flex-col"
                  >
                    <span className="font-semibold text-white text-xs">Sentinel Core</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">Heavy polyhedral drone</span>
                  </button>
                  <button
                    onClick={() => handleLoadSample('speeder')}
                    className="p-3 rounded-lg bg-[#0e1624] border border-cyan-500/30 hover:border-cyan-400 text-left transition flex flex-col"
                  >
                    <span className="font-semibold text-white text-xs">Pulse Speeder</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">Light canyon racer</span>
                  </button>
                </div>
              </div>

              {/* Display Mode Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  2. Scene Display Mechanism
                </label>
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <button
                    onClick={() => handleDisplayModeChange('player')}
                    className={`p-3 rounded-lg border text-left transition ${
                      displayMode === 'player'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-800 bg-[#0e1624] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      Pilot as Player Craft
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Mount onto flight rig with weapons & thrusters
                    </div>
                  </button>

                  <button
                    onClick={() => handleDisplayModeChange('showcase')}
                    className={`p-3 rounded-lg border text-left transition ${
                      displayMode === 'showcase'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-800 bg-[#0e1624] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      Landing Pad Exhibit
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Display on central outpost pedestal
                    </div>
                  </button>

                  <button
                    onClick={() => handleDisplayModeChange('escort')}
                    className={`p-3 rounded-lg border text-left transition ${
                      displayMode === 'escort'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-800 bg-[#0e1624] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Allied Wingman Escort
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Flies alongside your craft in combat
                    </div>
                  </button>
                </div>
              </div>

              {/* Material Customizer */}
              <div className="p-4 rounded-xl bg-[#080d16] border border-cyan-950/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                  <Palette className="w-3.5 h-3.5" />
                  3. PBR Material Finish Tuning
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="text-[11px] text-slate-400 block font-mono mb-1">Color Tint</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={modelColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-xs text-slate-300">{modelColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block font-mono mb-1">
                      Metalness: {metalness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={metalness}
                      onChange={(e) => handleMetalnessChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block font-mono mb-1">
                      Roughness: {roughness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={roughness}
                      onChange={(e) => handleRoughnessChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block font-mono mb-1">Wireframe</label>
                    <button
                      onClick={handleWireframeToggle}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition ${
                        wireframe
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {wireframe ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Model Info Card */}
              {currentModelInfo && (
                <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 font-mono text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400">Current Model: </span>
                    <span className="text-cyan-300 font-bold">{currentModelInfo.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({currentModelInfo.vertexCount} verts · {currentModelInfo.triangleCount} tris)
                    </span>
                  </div>
                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'primitives' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Directly create and render standard 3D primitives (Cube, Sphere, and Cylinder) within the 3D scene using a clean PBR lighting model.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-900/40 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                    <Box className="w-6 h-6" />
                  </div>
                  <h3 className="font-mono font-bold text-white text-xs uppercase mb-1">Box / Cube</h3>
                  <p className="text-[11px] text-slate-400 font-mono mb-4">
                    BoxGeometry(w, h, d)
                  </p>
                  <button
                    onClick={() => handleSpawnPrimitive('cube')}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-semibold transition"
                  >
                    Spawn Cube
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-900/40 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                    <Circle className="w-6 h-6" />
                  </div>
                  <h3 className="font-mono font-bold text-white text-xs uppercase mb-1">Sphere</h3>
                  <p className="text-[11px] text-slate-400 font-mono mb-4">
                    SphereGeometry(radius, segs)
                  </p>
                  <button
                    onClick={() => handleSpawnPrimitive('sphere')}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-semibold transition"
                  >
                    Spawn Sphere
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-900/40 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                    <Cylinder className="w-6 h-6" />
                  </div>
                  <h3 className="font-mono font-bold text-white text-xs uppercase mb-1">Cylinder</h3>
                  <p className="text-[11px] text-slate-400 font-mono mb-4">
                    CylinderGeometry(rTop, rBot, h)
                  </p>
                  <button
                    onClick={() => handleSpawnPrimitive('cylinder')}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-semibold transition"
                  >
                    Spawn Cylinder
                  </button>
                </div>
              </div>

              {/* Display mode selector for primitives */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  Target Display Slot
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {(['player', 'showcase', 'escort'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleDisplayModeChange(m)}
                      className={`p-2 rounded-lg border text-center uppercase tracking-wider font-semibold transition ${
                        displayMode === m
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-[#0c121e] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  Basic 3D Scene + Cube, Sphere, Cylinder Code
                </span>
                <button
                  onClick={copyCodeToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#05080e] border border-cyan-950 font-mono text-xs text-cyan-200 overflow-x-auto max-h-72 select-all leading-relaxed">
                {standaloneThreeJsCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-900/40 bg-[#080d16] flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">
            {currentModelInfo ? `Active: ${currentModelInfo.name} (${displayMode.toUpperCase()})` : 'Default craft active'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition"
          >
            Apply & Return to Game
          </button>
        </div>
      </div>
    </div>
  );
};

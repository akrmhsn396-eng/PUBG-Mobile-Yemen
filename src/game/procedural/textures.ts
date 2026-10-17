import * as THREE from 'three';

/**
 * Procedural Canvas Textures for PBR materials, particles, and environments.
 * Follows Three.js guidelines: sRGB for color maps, explicit disposal helpers.
 */

// Generate a sci-fi panel grid texture for craft hulls and monoliths
export function createTechPanelTexture(color1 = '#131b26', color2 = '#0d131c', gridColor = '#00d2ff'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, size, size);

  // Plating blocks
  const cols = 8;
  const tileSize = size / cols;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < cols; y++) {
      const isAlt = (x + y * 3) % 4 === 0;
      ctx.fillStyle = isAlt ? color2 : color1;
      ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);

      // Subtle rivets
      ctx.fillStyle = '#223348';
      ctx.beginPath();
      ctx.arc(x * tileSize + 4, y * tileSize + 4, 1.5, 0, Math.PI * 2);
      ctx.arc(x * tileSize + tileSize - 4, y * tileSize + 4, 1.5, 0, Math.PI * 2);
      ctx.arc(x * tileSize + 4, y * tileSize + tileSize - 4, 1.5, 0, Math.PI * 2);
      ctx.arc(x * tileSize + tileSize - 4, y * tileSize + tileSize - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Neon accent circuit lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(tileSize * 2, 0);
  ctx.lineTo(tileSize * 2, tileSize * 4);
  ctx.lineTo(tileSize * 5, tileSize * 4);
  ctx.lineTo(tileSize * 5, size);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, tileSize * 6);
  ctx.lineTo(tileSize * 3, tileSize * 6);
  ctx.lineTo(tileSize * 6, tileSize * 2);
  ctx.lineTo(size, tileSize * 2);
  ctx.stroke();

  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate Realistic Desert & Rocky Battleground Terrain (PUBG Yemen style)
export function createRealisticTerrainTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Base desert warm earth tone
  ctx.fillStyle = '#b89b72';
  ctx.fillRect(0, 0, size, size);

  // 2. Graded noise & sand patches
  const numPatches = 600;
  for (let i = 0; i < numPatches; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const rad = 15 + Math.random() * 45;
    const shades = ['#c2a77f', '#a6885f', '#cfb48c', '#987a52', '#8c6e48'];
    ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 3. Realistic sand ripples & dirt track contours
  ctx.strokeStyle = 'rgba(130, 95, 55, 0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const y = i * (size / 40);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 30) {
      const dy = Math.sin(x * 0.02 + i) * 6 + Math.cos(x * 0.01) * 3;
      ctx.lineTo(x, y + dy);
    }
    ctx.stroke();
  }

  // 4. Fine gravel, pebbles, and cracked desert earth specks
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2.2 + 0.4;
    const colors = ['#6e5539', '#54422e', '#e0c9a6', '#4a3b2b', '#8f775c'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Arid soil surface cracks
  ctx.strokeStyle = 'rgba(65, 45, 28, 0.35)';
  ctx.lineWidth = 1.2;
  for (let c = 0; c < 18; c++) {
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const steps = 6 + Math.floor(Math.random() * 8);
    for (let s = 0; s < steps; s++) {
      cx += (Math.random() - 0.5) * 45;
      cy += (Math.random() - 0.5) * 45;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 32);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate Military Camouflage Texture (Iconic PUBG Desert / Woodland tactical camo)
export function createMilitaryCamoTexture(type: 'desert' | 'woodland' = 'desert'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const colors = type === 'desert'
    ? ['#c2a679', '#967951', '#6b5438', '#dfcbab']
    : ['#4b5320', '#2d381e', '#1c2413', '#686b45'];

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, size, size);

  for (let c = 1; c < colors.length; c++) {
    ctx.fillStyle = colors[c];
    for (let i = 0; i < 28; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const points = 5 + Math.floor(Math.random() * 4);
      for (let p = 0; p < points; p++) {
        const ang = (p / points) * Math.PI * 2;
        const rad = 25 + Math.random() * 45;
        ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate Yemeni Traditional Stone Wall Texture (Mud/Stone brick with white gypsum accents)
export function createYemeniStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base mud-brick brown
  ctx.fillStyle = '#8b6946';
  ctx.fillRect(0, 0, size, size);

  // Brick rows
  const rows = 16;
  const rowHeight = size / rows;
  const cols = 8;
  const colWidth = size / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const offset = (r % 2) * (colWidth / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * colWidth + offset;
      const shades = ['#7c5c3c', '#96734e', '#846241', '#6f5032'];
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
    }
    // Mortar lines
    ctx.strokeStyle = '#5a4128';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, y, size, rowHeight);
  }

  // Decorative traditional white gypsum bands (characteristic of Sana'a and Taiz)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, rowHeight * 4, size, 8);
  ctx.fillRect(0, rowHeight * 11, size, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate Terrain Rock / Dust Texture
export function createTerrainTexture(): THREE.CanvasTexture {
  return createRealisticTerrainTexture();
}

// Generate Glow Particle Sprite
export function createGlowSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(0, 240, 255, 0.85)');
  gradient.addColorStop(0.55, 'rgba(0, 150, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 50, 100, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Ring Blast / Shockwave Texture
export function createRingTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  const center = size / 2;
  const radius = size * 0.42;
  const lineWidth = size * 0.08;

  ctx.strokeStyle = '#00f6ff';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Outer glow
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = lineWidth * 2.2;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Landing Pad / Outpost Runway Texture
export function createLandingPadTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark metallic base
  ctx.fillStyle = '#111722';
  ctx.fillRect(0, 0, size, size);

  // Outer yellow/black chevron hazard border
  const border = 36;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(border, border, size - border * 2, size - border * 2);

  // Corner brackets
  ctx.lineWidth = 10;
  const cornerLen = 50;
  // Top left
  ctx.beginPath();
  ctx.moveTo(border - 5, border + cornerLen);
  ctx.lineTo(border - 5, border - 5);
  ctx.lineTo(border + cornerLen, border - 5);
  ctx.stroke();
  // Top right
  ctx.beginPath();
  ctx.moveTo(size - border + 5, border + cornerLen);
  ctx.lineTo(size - border + 5, border - 5);
  ctx.lineTo(size - border - cornerLen, border - 5);
  ctx.stroke();
  // Bottom left
  ctx.beginPath();
  ctx.moveTo(border - 5, size - border - cornerLen);
  ctx.lineTo(border - 5, size - border + 5);
  ctx.lineTo(border + cornerLen, size - border + 5);
  ctx.stroke();
  // Bottom right
  ctx.beginPath();
  ctx.moveTo(size - border + 5, size - border - cornerLen);
  ctx.lineTo(size - border + 5, size - border + 5);
  ctx.lineTo(size - border - cornerLen, size - border + 5);
  ctx.stroke();

  // Central circle
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 130, 0, Math.PI * 2);
  ctx.stroke();

  // Inner crosshair / insignia
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VX-01', size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

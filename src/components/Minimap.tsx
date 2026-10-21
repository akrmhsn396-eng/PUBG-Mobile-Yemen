import React, { useState } from 'react';
import { PlayerStats, RadarBlip } from '../game/GameEngine';
import { Compass, Navigation, ZoomIn, ZoomOut, Eye } from 'lucide-react';

interface MinimapProps {
  stats: PlayerStats;
}

export const Minimap: React.FC<MinimapProps> = ({ stats }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.2); // zoom multiplier
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const playerPos = stats.playerPos || { x: 0, z: 0 };
  const playerHeading = stats.playerHeading || 0;
  const arenaRadius = stats.arenaRadius || 80;
  const enemies = stats.enemies || [];

  // Minimap dimensions in pixels
  const size = isExpanded ? 240 : 130;
  const center = size / 2;
  const mapRadius = center - 12;

  // Scale factor: world units to minimap pixels
  // At zoom 1.0, mapRadius corresponds to arenaRadius * 0.75
  const worldRange = (arenaRadius * 0.8) / zoomLevel;

  const toMapCoord = (worldX: number, worldZ: number) => {
    // Relative to player
    const dx = worldX - playerPos.x;
    const dz = worldZ - playerPos.z; // in Three.js, Z is forward/backward

    // Rotate relative to player heading so 'up' on minimap is player's forward view
    const cos = Math.cos(-playerHeading);
    const sin = Math.sin(-playerHeading);
    const rotX = dx * cos - dz * sin;
    const rotZ = dx * sin + dz * cos;

    // Scale to pixels
    const px = center + (rotX / worldRange) * mapRadius;
    // In screen coordinates, negative Z is up
    const py = center - (rotZ / worldRange) * mapRadius;

    return { px, py };
  };

  return (
    <div className="relative pointer-events-auto flex flex-col items-center">
      {/* Minimap Container */}
      <div 
        className={`relative rounded-full border-2 border-cyan-500/60 bg-[#070b14]/95 shadow-[0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-md overflow-hidden transition-all duration-300 ${
          isExpanded ? 'w-[240px] h-[240px]' : 'w-[130px] h-[130px] sm:w-[150px] sm:h-[150px]'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="انقر لتوسيع أو تصغير الخريطة المصغرة (Minimap)"
      >
        {/* SVG Canvas for Radar Grid & Blips */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="minimapGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#082032" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#040914" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#020408" stopOpacity="1" />
            </radialGradient>
            <clipPath id="circleClip">
              <circle cx={center} cy={center} r={mapRadius} />
            </clipPath>
          </defs>

          {/* Background */}
          <circle cx={center} cy={center} r={mapRadius} fill="url(#minimapGrad)" />

          <g clipPath="url(#circleClip)">
            {/* Concentric Distance Rings */}
            <circle cx={center} cy={center} r={mapRadius * 0.33} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 2" />
            <circle cx={center} cy={center} r={mapRadius * 0.66} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
            <circle cx={center} cy={center} r={mapRadius} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.5" />

            {/* Crosshair grid lines */}
            <line x1={center} y1="0" x2={center} y2={size} stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="0" y1={center} x2={size} y2={center} stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.2" />

            {/* Arena boundary circle */}
            <circle 
              cx={center} 
              cy={center} 
              r={(arenaRadius / worldRange) * mapRadius} 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="1.5" 
              strokeOpacity="0.4" 
            />

            {/* Rotating Radar Sweep Line */}
            <line
              x1={center}
              y1={center}
              x2={center + Math.cos(Date.now() * 0.003) * mapRadius}
              y2={center + Math.sin(Date.now() * 0.003) * mapRadius}
              stroke="#00f0ff"
              strokeWidth="2"
              strokeOpacity="0.8"
            />

            {/* Enemy Blips */}
            {enemies.map((enemy: RadarBlip) => {
              const { px, py } = toMapCoord(enemy.x, enemy.z);
              // Check if within circle bounds
              const distFromCenter = Math.sqrt((px - center) ** 2 + (py - center) ** 2);
              if (distFromCenter > mapRadius - 6) return null; // clamp at edge

              const isBoss = enemy.type === 'boss';
              const isTank = enemy.type === 'tank' || enemy.type === 'goliath';
              const dotColor = isBoss ? '#ef4444' : isTank ? '#f59e0b' : '#ff3344';
              const dotSize = isBoss ? 6 : isTank ? 4.5 : 3;

              return (
                <g key={enemy.id}>
                  <circle
                    cx={px}
                    cy={py}
                    r={dotSize}
                    fill={dotColor}
                    className={isBoss ? 'animate-ping' : ''}
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={dotSize + 1.5}
                    fill="none"
                    stroke={dotColor}
                    strokeWidth="1"
                    strokeOpacity="0.8"
                  />
                </g>
              );
            })}

            {/* Player Center Icon (Facing Up) */}
            <g transform={`translate(${center}, ${center})`}>
              {/* Vision Cone / FOV */}
              <path
                d="M 0 0 L -8 -16 L 8 -16 Z"
                fill="#00f0ff"
                fillOpacity="0.35"
              />
              {/* Player Arrow / Triangle */}
              <polygon
                points="0,-8 -5,6 0,3 5,6"
                fill="#00f0ff"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            </g>
          </g>

          {/* Compass labels around rim */}
          <text x={center} y={10} fill="#00f0ff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">N ش</text>
          <text x={size - 8} y={center + 3} fill="#00f0ff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">E ق</text>
          <text x={center} y={size - 3} fill="#00f0ff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">S ج</text>
          <text x={10} y={center + 3} fill="#00f0ff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">W غ</text>
        </svg>

        {/* Hover / Corner Info Badge */}
        <div className="absolute bottom-1 right-2 left-2 text-center pointer-events-none">
          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 tabular-nums">
            {Math.round(playerPos.x)}, {Math.round(playerPos.z)} | 🎯 {enemies.length} أعداء
          </span>
        </div>
      </div>

      {/* Minimap Quick Zoom Controls */}
      <div className="flex items-center gap-1 mt-1.5 bg-[#0b101b]/90 border border-cyan-500/30 rounded-lg px-2 py-0.5 shadow">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoomLevel((prev) => Math.min(3.0, prev + 0.4));
          }}
          className="text-cyan-400 hover:text-cyan-200 text-xs font-mono font-bold px-1"
          title="تكبير الخريطة (Zoom In)"
        >
          +
        </button>
        <span className="text-[10px] font-mono text-slate-300">{zoomLevel.toFixed(1)}x</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoomLevel((prev) => Math.max(0.5, prev - 0.4));
          }}
          className="text-cyan-400 hover:text-cyan-200 text-xs font-mono font-bold px-1"
          title="تصغير الخريطة (Zoom Out)"
        >
          -
        </button>
      </div>
    </div>
  );
};

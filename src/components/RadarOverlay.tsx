import React, { useMemo } from 'react';
import { RadarBlip } from '../game/GameEngine';
import { YEMEN_GOVERNORATES, YemenCity } from '../data/yemenGovernorates';

interface RadarOverlayProps {
  playerPos?: { x: number; z: number };
  playerHeading?: number;
  arenaRadius?: number;
  enemies?: RadarBlip[];
  selectedCity?: YemenCity;
  compact?: boolean;
}

export const RadarOverlay: React.FC<RadarOverlayProps> = ({
  playerPos = { x: 0, z: 0 },
  playerHeading = 0,
  arenaRadius = 80,
  enemies = [],
  selectedCity,
  compact = false,
}) => {
  // Radar dimension constants (center at 65, 65)
  const size = 130;
  const center = size / 2;
  const radarRadius = 54;
  const scale = radarRadius / arenaRadius;

  // Transform world coordinates (X, Z) into Radar SVG coordinates (px, py)
  const worldToRadar = (wx: number, wz: number) => {
    const rx = center + wx * scale;
    const ry = center + wz * scale; // In Three.js, +Z is down on top-down view
    return { x: rx, y: ry };
  };

  const playerRadar = worldToRadar(playerPos.x, playerPos.z);

  // Compute closest threat distance in meters
  const closestThreatDist = useMemo(() => {
    if (!enemies.length) return null;
    let minDist = Infinity;
    enemies.forEach((e) => {
      const dx = e.x - playerPos.x;
      const dz = e.z - playerPos.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) minDist = d;
    });
    return Math.round(minDist);
  }, [enemies, playerPos.x, playerPos.z]);

  // Compute player heading angle in degrees for SVG rotation
  // In our engine: playerRot is around Y axis, forward is (sin(rot), 0, cos(rot))
  // SVG rotation 0 deg points UP (-Y). cos(rot) is +Z (down), sin(rot) is +X (right).
  // Math.atan2(sin, -cos) maps Three.js heading into SVG rotation degrees
  const headingDeg = (playerHeading * 180) / Math.PI;

  return (
    <div className="flex flex-col items-end pointer-events-auto select-none">
      <div className="relative p-2 rounded-2xl bg-[#080d16]/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Radar Header Label */}
        <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] font-mono tracking-wider text-cyan-400">
          <div className="flex items-center gap-1.5 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>RADAR</span>
          </div>
          <div className="text-slate-400">
            <span className="text-white font-bold tabular-nums">{enemies.length}</span> DETECTED
          </div>
        </div>

        {/* SVG Tactical Radar Scope */}
        <div className="relative w-[130px] h-[130px] rounded-full overflow-hidden bg-[#040810] border border-cyan-900/60 shadow-inner">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            <defs>
              {/* Radial background grid gradient */}
              <radialGradient id="radarGridGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#071220" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#050a14" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#02050a" stopOpacity="1" />
              </radialGradient>

              {/* Sweeping radar scan cone gradient */}
              <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
              </linearGradient>

              {/* Player glow filter */}
              <filter id="playerGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background disc */}
            <circle cx={center} cy={center} r={radarRadius + 4} fill="url(#radarGridGrad)" />

            {/* Rotating Radar Sweep Line */}
            <g className="origin-center animate-[spin_3.5s_linear_infinite]">
              <line
                x1={center}
                y1={center}
                x2={center + radarRadius}
                y2={center}
                stroke="url(#sweepGrad)"
                strokeWidth="2"
              />
              <path
                d={`M ${center} ${center} L ${center + radarRadius} ${center} A ${radarRadius} ${radarRadius} 0 0 0 ${center + radarRadius * 0.7} ${center - radarRadius * 0.7} Z`}
                fill="url(#sweepGrad)"
                opacity="0.4"
              />
            </g>

            {/* Crosshair & Cardinal Reticles */}
            <line
              x1={center - radarRadius}
              y1={center}
              x2={center + radarRadius}
              y2={center}
              stroke="#0e1f36"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
            <line
              x1={center}
              y1={center - radarRadius}
              x2={center}
              y2={center + radarRadius}
              stroke="#0e1f36"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />

            {/* Concentric Range Rings */}
            {/* 25m ring */}
            <circle
              cx={center}
              cy={center}
              r={25 * scale}
              fill="none"
              stroke="#132742"
              strokeWidth="0.75"
              strokeDasharray="1 3"
            />
            {/* 50m ring */}
            <circle
              cx={center}
              cy={center}
              r={50 * scale}
              fill="none"
              stroke="#132742"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />

            {/* ARENA BOUNDARY RING (Canyon Wall Perimeter - 80m) */}
            <circle
              cx={center}
              cy={center}
              r={radarRadius}
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.4"
              strokeDasharray="4 2"
              opacity="0.85"
            />
            {/* Outer buffer ring */}
            <circle
              cx={center}
              cy={center}
              r={radarRadius + 2.5}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="0.6"
              strokeDasharray="1 5"
              opacity="0.6"
            />

            {/* Cardinal Direction Ticks */}
            <text x={center} y={center - radarRadius + 7} fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">N</text>
            <text x={center} y={center + radarRadius - 2} fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="middle">S</text>
            <text x={center + radarRadius - 5} y={center + 2} fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="middle">E</text>
            <text x={center - radarRadius + 5} y={center + 2} fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="middle">W</text>

            {/* Landing Pad Outpost marker in center */}
            <rect
              x={center - 7 * scale}
              y={center - 7 * scale}
              width={14 * scale}
              height={14 * scale}
              fill="rgba(0, 240, 255, 0.08)"
              stroke="#00f0ff"
              strokeWidth="0.6"
              opacity="0.5"
            />

            {/* YEMEN GOVERNORATES / CITIES TACTICAL BEACONS */}
            {YEMEN_GOVERNORATES.map((city) => {
              const pos = worldToRadar(city.coord3D.x, city.coord3D.z);
              const isSelected = selectedCity?.id === city.id;
              const isKeyCity = ['taiz', 'sanaa', 'aden', 'hadhramaut', 'marib', 'socotra', 'ibb', 'hudaydah'].includes(city.id);
              return (
                <g key={`radar-city-${city.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {isSelected && (
                    <circle r="4" fill="none" stroke={city.color} strokeWidth="0.8" opacity="0.9" className="animate-ping" />
                  )}
                  <circle r={isSelected ? "2.4" : "1.6"} fill={city.color} stroke="#050a14" strokeWidth="0.5" />
                  {isKeyCity && (
                    <text
                      x="0"
                      y={city.coord3D.z > 35 ? "-3.5" : "5.5"}
                      fill={city.color}
                      fontSize="5"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity="0.85"
                    >
                      {city.nameAr}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ENEMY BLIPS */}
            {enemies.map((enemy) => {
              // Clamp enemy blips so they remain visible even near edge
              const dx = enemy.x;
              const dz = enemy.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              let bx = dx;
              let bz = dz;
              if (dist > arenaRadius) {
                bx = (dx / dist) * arenaRadius;
                bz = (dz / dist) * arenaRadius;
              }
              const pos = worldToRadar(bx, bz);

              if (enemy.type === 'boss') {
                // Boss Titan: Pulsing Crimson Diamond with Target Ring
                return (
                  <g key={`radar-enemy-${enemy.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle r="6" fill="none" stroke="#ff0055" strokeWidth="0.8" opacity="0.8" className="animate-ping" />
                    <rect x="-3.5" y="-3.5" width="7" height="7" fill="#ff0055" transform="rotate(45)" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                );
              } else if (enemy.type === 'goliath') {
                // Goliath Heavy Tank: Amber Square
                return (
                  <g key={`radar-enemy-${enemy.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <rect x="-2.5" y="-2.5" width="5" height="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.6" />
                  </g>
                );
              } else {
                // Interceptor Drone: Crimson Triangle
                return (
                  <g key={`radar-enemy-${enemy.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <polygon points="0,-3 3,3 -3,3" fill="#ff1e56" stroke="#ffffff" strokeWidth="0.5" />
                  </g>
                );
              }
            })}

            {/* PLAYER BLIP WITH HEADING CONE */}
            <g transform={`translate(${playerRadar.x}, ${playerRadar.y})`}>
              {/* Outer soft glow ring */}
              <circle r="4" fill="#00f0ff" opacity="0.25" filter="url(#playerGlow)" />

              {/* Rotatable Arrow oriented to player heading */}
              <g transform={`rotate(${-headingDeg})`}>
                {/* Vision / Heading forward cone */}
                <polygon
                  points="0,0 -8,-18 8,-18"
                  fill="url(#sweepGrad)"
                  opacity="0.3"
                />
                {/* Player craft arrow */}
                <polygon
                  points="0,-4.5 3.5,3.5 0,1.8 -3.5,3.5"
                  fill="#00f0ff"
                  stroke="#ffffff"
                  strokeWidth="0.75"
                  filter="url(#playerGlow)"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Radar Telemetry Footer with Yemen Sector Readout */}
        <div className="flex items-center justify-between mt-1 px-1 text-[9px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-cyan-400 font-bold">{selectedCity ? selectedCity.nameAr : 'اليمن'}</span>
            <span className="text-slate-500">· Ø160m</span>
          </div>
          {closestThreatDist !== null ? (
            <span className={closestThreatDist < 25 ? 'text-red-400 font-bold' : 'text-amber-300'}>
              PROX: <span className="tabular-nums font-bold">{closestThreatDist}m</span>
            </span>
          ) : (
            <span className="text-emerald-400">CLEAR</span>
          )}
        </div>
      </div>
    </div>
  );
};

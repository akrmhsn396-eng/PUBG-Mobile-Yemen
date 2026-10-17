import React from 'react';

interface ScopeOverlayProps {
  isScoped: boolean;
  onToggleScope: () => void;
  isSniper: boolean;
  weaponName: string;
}

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({
  isScoped,
  onToggleScope,
  isSniper,
  weaponName,
}) => {
  if (!isScoped) return null;

  return (
    <div
      onClick={onToggleScope}
      className="fixed inset-0 z-20 pointer-events-auto cursor-crosshair flex items-center justify-center select-none"
    >
      {/* Outer Black Vignette (Blackout outside scope circle) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Scope Housing Circular Ring */}
      <div className="relative w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full border-[18px] border-[#0c1017] shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex items-center justify-center">
        {/* Scope Optical Lens Glass */}
        <div className="absolute inset-0 bg-cyan-950/20" />

        {/* Outer Circular Scale Ticks */}
        <div className="absolute inset-2 rounded-full border border-cyan-500/30" />
        <div className="absolute inset-6 rounded-full border border-cyan-500/20" />

        {/* Main Reticle SVG */}
        <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
          <defs>
            <filter id="scopeGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Crosshair Horizontal & Vertical Lines */}
          <line x1="0" y1="200" x2="160" y2="200" stroke="#00f0ff" strokeWidth="1.2" opacity="0.8" />
          <line x1="240" y1="200" x2="400" y2="200" stroke="#00f0ff" strokeWidth="1.2" opacity="0.8" />
          <line x1="200" y1="0" x2="200" y2="160" stroke="#00f0ff" strokeWidth="1.2" opacity="0.8" />
          <line x1="200" y1="240" x2="400" y2="240" stroke="#00f0ff" strokeWidth="1.2" opacity="0.8" />

          {/* Central Aiming Red/Green Dot */}
          <circle cx="200" cy="200" r="2.5" fill="#ff0055" filter="url(#scopeGlow)" />
          <circle cx="200" cy="200" r="1.2" fill="#ffffff" />
          <circle cx="200" cy="200" r="8" fill="none" stroke="#ff0055" strokeWidth="0.8" opacity="0.85" />

          {/* Mil-Dots on Axis */}
          {[-80, -50, -25, 25, 50, 80].map((offset) => (
            <React.Fragment key={offset}>
              <line
                x1={200 + offset}
                y1="196"
                x2={200 + offset}
                y2="204"
                stroke="#00f0ff"
                strokeWidth="1"
                opacity="0.7"
              />
              <line
                x1="196"
                y1={200 + offset}
                x2="204"
                y2={200 + offset}
                stroke="#00f0ff"
                strokeWidth="1"
                opacity="0.7"
              />
            </React.Fragment>
          ))}

          {/* Ballistic Bullet Drop Chevrons (Under center dot) */}
          {[15, 32, 52, 75].map((drop, idx) => (
            <path
              key={drop}
              d={`M ${200 - (idx + 1) * 3} ${200 + drop} L 200 ${200 + drop - 3} L ${200 + (idx + 1) * 3} ${200 + drop}`}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.2"
              opacity="0.8"
            />
          ))}

          {/* Stadiametric Rangefinder Scale (Bottom Left) */}
          <path d="M 120 280 L 170 280 L 170 260" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
          <text x="122" y="274" fill="#38bdf8" fontSize="8" fontFamily="monospace">100m</text>
          <path d="M 120 295 L 155 295 L 155 285" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
          <text x="122" y="291" fill="#38bdf8" fontSize="8" fontFamily="monospace">200m</text>
          <path d="M 120 310 L 145 310 L 145 303" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
          <text x="122" y="307" fill="#38bdf8" fontSize="8" fontFamily="monospace">300m</text>
        </svg>

        {/* Scope Optical Glare */}
        <div className="absolute top-4 left-6 w-24 h-24 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />

        {/* Scope Telemetry Pill */}
        <div className="absolute bottom-6 px-3 py-1 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-2">
          <span>{isSniper ? '8X MAGNUM OPTIC' : '4X TACTICAL SCOPE'}</span>
          <span className="text-slate-400">· {weaponName}</span>
        </div>
      </div>

      {/* Exit Scope Hint */}
      <div className="absolute bottom-10 px-4 py-1.5 rounded-full bg-black/80 border border-slate-700 text-xs font-mono text-slate-300">
        Click or press <span className="text-amber-400 font-bold">Right Click / V</span> to exit Scope
      </div>
    </div>
  );
};

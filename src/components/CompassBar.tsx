import React from 'react';

interface CompassBarProps {
  headingRadians: number;
}

export const CompassBar: React.FC<CompassBarProps> = ({ headingRadians }) => {
  // Convert radians to degrees (0 to 360)
  // Ensure positive 0-360
  let deg = ((headingRadians * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;
  const currentDeg = Math.round(deg);

  // Visible field of view around current angle (+- 45 deg)
  const fov = 90;
  const visibleTicks: { deg: number; label: string; isMajor: boolean }[] = [];

  for (let i = -fov / 2; i <= fov / 2; i += 5) {
    const raw = (currentDeg + i + 360) % 360;
    let label = '';
    let isMajor = false;

    if (raw === 0 || raw === 360) {
      label = 'N';
      isMajor = true;
    } else if (raw === 45) {
      label = 'NE';
      isMajor = true;
    } else if (raw === 90) {
      label = 'E';
      isMajor = true;
    } else if (raw === 135) {
      label = 'SE';
      isMajor = true;
    } else if (raw === 180) {
      label = 'S';
      isMajor = true;
    } else if (raw === 225) {
      label = 'SW';
      isMajor = true;
    } else if (raw === 270) {
      label = 'W';
      isMajor = true;
    } else if (raw === 315) {
      label = 'NW';
      isMajor = true;
    } else if (raw % 15 === 0) {
      label = `${raw}`;
      isMajor = false;
    }

    visibleTicks.push({
      deg: i, // Offset from center in degrees
      label,
      isMajor,
    });
  }

  return (
    <div className="relative flex flex-col items-center pointer-events-none select-none">
      {/* Center Heading Marker Arrow */}
      <div className="flex flex-col items-center z-10 -mb-0.5">
        <span className="text-[10px] font-mono font-black text-amber-400 bg-black/75 px-1.5 py-0.5 rounded border border-amber-500/40 tabular-nums shadow-sm">
          {currentDeg}°
        </span>
        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-amber-400 mt-0.5" />
      </div>

      {/* Compass Ribbon Strip */}
      <div className="relative w-64 sm:w-80 h-7 bg-[#070c14]/85 border-y border-cyan-500/30 overflow-hidden shadow-lg flex items-center justify-center">
        {/* Subtle center hairline */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-amber-400/80 -translate-x-1/2 z-10" />

        {/* Dynamic ticks */}
        <div className="relative w-full h-full">
          {visibleTicks.map((t, idx) => {
            // Map offset (-45 to +45) to percentage (0% to 100%)
            const pct = 50 + (t.deg / fov) * 100;
            if (pct < 2 || pct > 98) return null;

            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {/* Tick mark */}
                <div
                  className={`w-[1px] ${
                    t.isMajor
                      ? 'h-3 bg-cyan-300'
                      : t.label
                      ? 'h-2 bg-slate-300'
                      : 'h-1.5 bg-slate-600'
                  }`}
                />
                {/* Degree / Cardinal Label */}
                {t.label && (
                  <span
                    className={`text-[9px] font-mono leading-none mt-1 ${
                      t.isMajor
                        ? 'text-cyan-300 font-extrabold'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {t.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Left/Right Edge Fade Out Gradients */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#070c14] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#070c14] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

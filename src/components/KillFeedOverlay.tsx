import React from 'react';
import { KillEvent } from '../game/GameEngine';
import { Crosshair, Flame, ShieldAlert } from 'lucide-react';

interface KillFeedOverlayProps {
  killEvents: KillEvent[];
}

export const KillFeedOverlay: React.FC<KillFeedOverlayProps> = ({ killEvents }) => {
  if (!killEvents || killEvents.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1.5 pointer-events-none select-none max-w-[340px]">
      {killEvents.slice(0, 4).map((evt, idx) => {
        return (
          <div
            key={evt.id || idx}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090e18]/90 border border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md text-xs font-mono text-slate-200 animate-slide-in transition-all duration-300"
            style={{ animation: 'fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Killer */}
            <span className="font-black text-cyan-400">{evt.killer}</span>

            {/* Weapon / Action Badge */}
            <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[10px] text-amber-400 font-bold">
              <span>🔫</span>
              <span>{evt.weaponName}</span>
            </div>

            {/* Victim */}
            <span className="font-bold text-red-400">{evt.victim}</span>

            {/* Headshot / Critical Tag */}
            {evt.isHeadshot && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-black animate-pulse">
                🎯 CRIT
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

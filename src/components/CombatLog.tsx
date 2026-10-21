import React from 'react';

interface CombatLogMessage {
  id: string;
  text: string;
  type: 'damage' | 'kill' | 'warning' | 'info';
  time: number;
}

interface CombatLogProps {
  messages?: CombatLogMessage[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ messages }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 pointer-events-none select-none max-w-[320px] font-mono text-[11px]">
      <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-0.5 text-right">
        📋 سجل القتال المباشر (Combat Log)
      </div>
      <div className="flex flex-col gap-1 max-h-[140px] overflow-hidden">
        {messages.slice(0, 5).map((msg, idx) => {
          const colorClass =
            msg.type === 'kill'
              ? 'bg-amber-950/85 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : msg.type === 'damage'
              ? 'bg-red-950/85 text-red-300 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)] font-bold'
              : msg.type === 'warning'
              ? 'bg-rose-950/85 text-rose-300 border-rose-500/60'
              : 'bg-[#090d16]/85 text-slate-200 border-slate-700/60';

          return (
            <div
              key={msg.id || idx}
              className={`px-2.5 py-1 rounded-lg border backdrop-blur-sm transition-all duration-200 flex items-center justify-between text-right ${colorClass}`}
              style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
              <span className="truncate">{msg.text}</span>
              <span className="text-[9px] opacity-60 tabular-nums">
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

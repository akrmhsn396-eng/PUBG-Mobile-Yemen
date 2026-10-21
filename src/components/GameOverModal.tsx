import React, { useEffect, useState } from 'react';
import { PlayerStats } from '../game/GameEngine';
import { RotateCcw, Trophy, Skull, Award, Crosshair, MapPin, Medal } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  score: number;
  kills: number;
  cityName: string;
  isVictory: boolean;
  date: string;
}

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  stats: PlayerStats;
  onRestart: () => void;
  onOpenModelStudio: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  stats,
  onRestart,
  onOpenModelStudio,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('yemen_pubg_session_leaderboard');
        const entries: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
        
        if (stats.score > 0) {
          const newEntry: LeaderboardEntry = {
            id: Math.random().toString(),
            score: stats.score,
            kills: stats.kills,
            cityName: stats.selectedCity?.nameAr || 'تعز',
            isVictory,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          
          const updated = [...entries, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // top 5
            
          setLeaderboard(updated);
          localStorage.setItem('yemen_pubg_session_leaderboard', JSON.stringify(updated));
        } else {
          setLeaderboard(entries);
        }
      } catch {
        // Fallback
      }
    }
  }, [isOpen, stats.score, stats.kills, isVictory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto select-none overflow-y-auto">
      <div
        className={`w-full max-w-lg bg-[#0b101c] border-2 ${
          isVictory
            ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]'
            : 'border-red-600/70 shadow-[0_0_50px_rgba(220,38,38,0.4)]'
        } rounded-3xl p-5 sm:p-7 text-center space-y-5 animate-scale-in my-auto`}
      >
        {/* Iconic PUBG Banner Header */}
        <div>
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2.5 text-2xl shadow-xl ${
              isVictory
                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 border-2 border-amber-300'
                : 'bg-gradient-to-br from-red-600 to-rose-900 text-white border-2 border-red-500'
            }`}
          >
            {isVictory ? '🍗' : '💀'}
          </div>

          <h2
            className={`text-xl sm:text-2xl font-black font-mono tracking-wider ${
              isVictory ? 'text-amber-400' : 'text-red-500'
            }`}
          >
            {isVictory ? 'WINNER WINNER CHICKEN DINNER!' : 'BETTER LUCK NEXT TIME!'}
          </h2>

          <p className="text-xs font-bold text-slate-300 mt-1">
            {isVictory
              ? '🏆 لقمة هنية.. عشاء دجاج اليوم! تم تطهير المحافظات وسحق دبابات العدو!'
              : 'تمت تصفيتك في ساحة معركة اليمن.. حظاً أوفر في الجولة القادمة!'}
          </p>
        </div>

        {/* Tactical PUBG Match Stats Report */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#060a14] border border-slate-800 font-mono text-xs">
          <div className="text-right p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">عدد القتلى KILLS</span>
            <span className="text-lg font-black text-amber-400 tabular-nums flex items-center justify-end gap-1">
              <span>🎯</span>
              <span>{stats.kills}</span>
            </span>
          </div>

          <div className="text-right p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">النقاط الكلية SCORE</span>
            <span className="text-lg font-black text-white tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Session Global Leaderboard (Top 5) */}
        <div className="bg-[#070b14] border border-cyan-500/30 rounded-2xl p-3.5 text-right font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>لوحة متصدرين الجلسة (Top 5 Leaderboard)</span>
            </span>
            <span className="text-[10px] text-slate-400">جلسة المتصفح الحالية</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-2 text-xs text-slate-500">لا توجد نتائج مسجلة بعد</div>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((entry, idx) => {
                const isCurrent = entry.score === stats.score;
                const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                return (
                  <div
                    key={entry.id || idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                      isCurrent
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-5">{rankBadge}</span>
                      <span className="text-[11px] text-slate-400">{entry.cityName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[10px]">🎯 {entry.kills} قتلى</span>
                      <span className="font-black text-amber-400 tabular-nums">{entry.score.toLocaleString()} نقطة</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 font-mono">
          <button
            onClick={onRestart}
            className={`w-full py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl cursor-pointer text-xs sm:text-sm ${
              isVictory
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>العب جولة جديدة [مسافة SPACE / إدخال ENTER]</span>
          </button>

          <button
            onClick={onOpenModelStudio}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0e1728] hover:bg-[#15223c] border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Award className="w-4 h-4 text-cyan-400" />
            <span>استوديو النماذج ثلاثية الأبعاد 3D MODEL STUDIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

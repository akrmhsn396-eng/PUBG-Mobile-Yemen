import React from 'react';
import { PlayerStats } from '../game/GameEngine';
import { RotateCcw, Trophy, Skull, Award, Crosshair, MapPin } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto select-none">
      <div
        className={`w-full max-w-lg bg-[#0b101c] border-2 ${
          isVictory
            ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]'
            : 'border-red-600/70 shadow-[0_0_50px_rgba(220,38,38,0.4)]'
        } rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-scale-in`}
      >
        {/* Iconic PUBG Banner Header */}
        <div>
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-3xl shadow-xl ${
              isVictory
                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 border-2 border-amber-300'
                : 'bg-gradient-to-br from-red-600 to-rose-900 text-white border-2 border-red-500'
            }`}
          >
            {isVictory ? '🍗' : '💀'}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${
              isVictory ? 'text-amber-400' : 'text-red-500'
            }`}
          >
            {isVictory ? 'WINNER WINNER CHICKEN DINNER!' : 'BETTER LUCK NEXT TIME!'}
          </h2>

          <p className="text-sm font-bold text-slate-200 mt-1">
            {isVictory
              ? '🏆 لقمة هنية.. عشاء دجاج اليوم! تم تطهير المحافظات وسحق دبابات العدو!'
              : 'تمت تصفيتك في ساحة معركة اليمن.. حظاً أوفر في الجولة القادمة!'}
          </p>
        </div>

        {/* Tactical PUBG Match Stats Report */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#060a14] border border-slate-800 font-mono text-xs">
          <div className="text-right p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">عدد القتلى KILLS</span>
            <span className="text-xl font-black text-amber-400 tabular-nums flex items-center justify-end gap-1">
              <span>🎯</span>
              <span>{stats.kills}</span>
            </span>
          </div>

          <div className="text-right p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">النقاط الكلية SCORE</span>
            <span className="text-xl font-black text-white tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="text-right p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">السلاح المستخدم</span>
            <span className="text-xs font-bold text-cyan-300 truncate block">
              {stats.activeWeapon.nameAr}
            </span>
            <span className="text-[10px] text-slate-500">{stats.activeWeapon.nameEn}</span>
          </div>

          <div className="text-right p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">محافظة الانتشار</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{stats.selectedCity?.nameAr || 'تعز'}</span>
            </span>
            <span className="text-[10px] text-slate-500">{stats.selectedCity?.landmarksAr?.[0] || 'معلم تاريخي'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 font-mono">
          <button
            onClick={onRestart}
            className={`w-full py-4 px-5 rounded-2xl font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl cursor-pointer text-sm ${
              isVictory
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.5)]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>العب جولة جديدة [مسافة SPACE / إدخال ENTER]</span>
          </button>

          <button
            onClick={onOpenModelStudio}
            className="w-full py-3 px-4 rounded-xl bg-[#0e1728] hover:bg-[#15223c] border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Award className="w-4 h-4 text-cyan-400" />
            <span>استوديو النماذج ثلاثية الأبعاد 3D MODEL STUDIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

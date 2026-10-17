import React from 'react';
import { Volume2, VolumeX, Box, Play, Camera, Shield, Crosshair, MapPin } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';
import { CameraMode } from '../game/GameEngine';
import { YEMEN_GOVERNORATES } from '../data/yemenGovernorates';

interface TitleScreenProps {
  onStart: () => void;
  onOpenModelStudio: () => void;
  highScore: number;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenModelStudio,
  highScore,
  cameraMode,
  onCycleCamera,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-none select-none font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0b101c]/90 border border-amber-500/40 text-amber-300 font-mono text-xs shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold">🇾🇪 ساحة معركة اليمن التكتيكية · PUBG BATTLEGROUNDS</span>
        </div>

        <div className="flex items-center gap-2.5">
          {highScore > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0a0f1d]/90 border border-amber-500/40 font-mono text-xs text-amber-300 shadow-md">
              أعلى نتيجة <span className="font-bold tabular-nums ml-1 text-white">{highScore.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={onCycleCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090e1c]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs transition shadow-md"
            title="تبديل وضع الكاميرا ثلاثية الأبعاد (C)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CAM: {cameraMode}</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-[#090e1c]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-white transition shadow-md"
            title="الصوت"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Authentic PUBG Yemen Title Lockup */}
      <div className="my-auto flex flex-col items-center text-center max-w-3xl mx-auto">
        {/* PUBG Military Helmet Badge */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-black/80 border-2 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center justify-center text-3xl sm:text-4xl mb-4 backdrop-blur-sm animate-bounce-slow">
          🪖
        </div>

        {/* Title SVG Graphic */}
        <div className="w-full max-w-xl mb-3 filter drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">
          <svg viewBox="0 0 600 115" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="pubgGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="yemenAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Tactical Stencil Main Header */}
            <text
              x="300"
              y="55"
              textAnchor="middle"
              fill="url(#pubgGoldGrad)"
              fontFamily="monospace"
              fontSize="46"
              fontWeight="900"
              letterSpacing="8"
            >
              PUBG · YEMEN
            </text>

            {/* Subtitle */}
            <text
              x="300"
              y="95"
              textAnchor="middle"
              fill="url(#yemenAccentGrad)"
              fontFamily="sans-serif"
              fontSize="20"
              fontWeight="900"
              letterSpacing="4"
            >
              معركة تحرير المحافظات اليمنية
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-200 font-bold max-w-xl mb-4 leading-relaxed">
          انزل بمظلتك إلى ساحة المعركة الحقيقية، قاتل جنود المشاة ودبابات العدو في قلعة القاهرة بتعز وصنعاء وعدن ومأرب وحضرموت بالأسلحة الأسطورية M416 و AKM و AWM وقاذف RPG!
        </p>

        {/* Provinces Pills Ribbon */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg mb-6">
          {YEMEN_GOVERNORATES.slice(0, 8).map((city) => (
            <span
              key={city.id}
              className="px-2 py-0.5 rounded-md bg-[#0a0f1c]/90 border border-slate-700/80 text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: city.color }} />
              {city.nameAr}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-md bg-[#0a0f1c]/90 border border-slate-700/80 text-[11px] text-amber-400 font-bold">
            + 13 محافظة
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 pointer-events-auto">
          <button
            onClick={onStart}
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black text-base sm:text-lg tracking-wider uppercase transition-all shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:shadow-[0_0_55px_rgba(245,158,11,0.8)] flex items-center gap-3 active:scale-95 cursor-pointer border-2 border-amber-300"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>انزل إلى المعركة DEPLOY</span>
            <span className="text-xs py-0.5 px-2 rounded-lg bg-black/20 text-slate-950 font-mono font-black ml-1">
              مسافة / ENTER
            </span>
          </button>

          <button
            onClick={onOpenModelStudio}
            className="px-6 py-4 rounded-2xl bg-[#0b1322]/90 hover:bg-[#121c2e] border-2 border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase transition flex items-center gap-2 cursor-pointer shadow-xl"
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>استوديو النماذج ثلاثية الأبعاد 3D OBJ</span>
          </button>
        </div>
      </div>

      {/* Realistic PUBG Tactical Controls Hint Bar */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto text-center">
        <div className="px-4 py-2.5 rounded-2xl bg-[#080d18]/90 border border-slate-700/80 font-mono text-[11px] sm:text-xs text-slate-300 tracking-wide shadow-2xl backdrop-blur-md max-w-3xl">
          <span className="text-amber-400 font-bold">WASD / الأسهم</span> حركة وتوجيه ·{' '}
          <span className="text-amber-400 font-bold">الزر الأيسر</span> إطلاق نار ·{' '}
          <span className="text-cyan-400 font-bold">الزر الأيمن أو [V]</span> منظار ADS ·{' '}
          <span className="text-amber-400 font-bold">[R]</span> إعادة تلقيم ·{' '}
          <span className="text-emerald-400 font-bold">[T]</span> جندي / بوجي ·{' '}
          <span className="text-amber-400 font-bold">[1-5]</span> تبديل الأسلحة ·{' '}
          <span className="text-cyan-400 font-bold">[Shift]</span> ركض سريع ·{' '}
          <span className="text-cyan-400 font-bold">[Q]</span> EMP ·{' '}
          <span className="text-cyan-400 font-bold">[C]</span> كاميرا 3D
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          تحكم كامل في الرؤية والإحاطة 360° · تفاعل حركي فيزيائي مع الجنود والدبابات في الجمهورية اليمنية
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PlayerStats, CameraMode, PlayerStance } from '../game/GameEngine';
import { soundManager } from '../audio/SoundManager';
import { YEMEN_GOVERNORATES, YemenCity } from '../data/yemenGovernorates';
import { CompassBar } from './CompassBar';
import { RadarOverlay } from './RadarOverlay';
import { Minimap } from './Minimap';
import { KillFeedOverlay } from './KillFeedOverlay';
import { CombatLog } from './CombatLog';
import { GlobalChatOverlay } from './GlobalChatOverlay';
import { MobileJoystick } from './MobileJoystick';
import { EquipmentControlPanel } from './EquipmentControlPanel';
import {
  Volume2,
  VolumeX,
  Pause,
  Zap,
  Camera,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Box,
  RotateCcw,
  Crosshair,
  Shield,
  ShieldAlert,
  Flame,
  RefreshCw,
  Navigation,
  Car,
  User,
  Sparkles,
  Target,
} from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  onPause: () => void;
  onTriggerEMP: () => void;
  onCycleCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onOpenModelStudio: () => void;
  onVirtualInput: (input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    fire?: boolean;
    boost?: boolean;
  }) => void;
  onReload: () => void;
  onToggleScope: () => void;
  onToggleRigMode: () => void;
  onSelectWeapon: (level: number) => void;
  onUpgradeWeapon: (level?: number) => void;
  onTeleportCity: (cityId: string) => void;
  onDeployDrone: () => void;
  onCycleWeather?: () => void;
  onTargetEnemy?: (enemyId: number) => void;
  onClearTargetLock?: () => void;
  onManualDragDirection?: (angle: number, isMoving: boolean, autoFire?: boolean) => void;
  onManualTouchMoveTowards?: (screenX: number, screenY: number, autoFire?: boolean) => void;
  onStopManualMove?: () => void;
  onStanceChange?: (stance: PlayerStance) => void;
  onCallJetStrike?: () => void;
  onCallReinforcements?: () => void;
  onTogglePanoramic?: () => void;
  onToggleCinematic?: () => void;
  onUseMedkit?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  onPause,
  onTriggerEMP,
  onCycleCamera,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onOpenModelStudio,
  onVirtualInput,
  onReload,
  onToggleScope,
  onToggleRigMode,
  onSelectWeapon,
  onUpgradeWeapon,
  onTeleportCity,
  onDeployDrone,
  onCycleWeather,
  onTargetEnemy,
  onClearTargetLock,
  onManualDragDirection,
  onManualTouchMoveTowards,
  onStopManualMove,
  onStanceChange,
  onCallJetStrike,
  onCallReinforcements,
  onTogglePanoramic,
  onToggleCinematic,
  onUseMedkit,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [controlMode, setControlMode] = useState<'MANUAL_TARGET' | 'BUTTONS'>('MANUAL_TARGET');
  const [isHudHidden, setIsHudHidden] = useState(false);

  const toggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const shieldPct = Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100));
  const energyPct = Math.max(0, Math.min(100, (stats.energy / stats.maxEnergy) * 100));
  const empPct = Math.max(0, Math.min(100, (stats.empCharge / stats.empMax) * 100));

  const cameraMode: CameraMode = stats.cameraMode || 'CHASE';
  const selectedCity: YemenCity = stats.selectedCity || YEMEN_GOVERNORATES[0];
  const activeWeapon = stats.activeWeapon;
  const isSoldier = (stats.playerRigMode || 'SOLDIER') === 'SOLDIER';

  // Visible enemies projected on 2D screen
  const visibleEnemies = (stats.enemies || []).filter(
    (e) =>
      !e.isBehind &&
      e.screenX != null &&
      e.screenY != null &&
      e.screenX > 15 &&
      e.screenX < (typeof window !== 'undefined' ? window.innerWidth - 15 : 1200) &&
      e.screenY > 15 &&
      e.screenY < (typeof window !== 'undefined' ? window.innerHeight - 15 : 800)
  );

  const nearestEnemies = [...(stats.enemies || [])]
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 3);
  const closestEnemy = nearestEnemies[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-hidden font-sans">
      {/* 21:9 Widescreen Anamorphic Cinematic Letterbox Bars */}
      {stats.isCinematicLetterbox && (
        <>
          <div className="fixed top-0 left-0 right-0 h-10 sm:h-16 bg-black z-50 pointer-events-none transition-all duration-300 border-b border-amber-500/30 flex items-center justify-between px-6 text-[10px] sm:text-xs font-mono text-amber-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>🎬 شاشة سينمائية بانورامية 21:9 - مسرح العمليات الحربية</span>
            </span>
            <span className="hidden sm:inline text-slate-400">YEMEN 360° PANORAMIC THEATER</span>
          </div>
          <div className="fixed bottom-0 left-0 right-0 h-10 sm:h-16 bg-black z-50 pointer-events-none transition-all duration-300 border-t border-amber-500/30" />
        </>
      )}

      {/* Animated Combo Multiplier Badge */}
      {stats.combo > 1 && (
        <div className="absolute top-24 left-4 sm:left-8 z-30 pointer-events-none select-none flex flex-col items-start animate-bounce">
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 text-slate-950 font-black font-mono px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.7)] border-2 border-amber-200 flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-slate-950 font-bold">ضربات متتالية COMBO</span>
              <span className="text-2xl font-black tabular-nums">x{stats.combo}</span>
            </div>
          </div>
          {/* Combo Degrade Timer Bar */}
          <div className="w-32 h-2 rounded-full bg-slate-900/90 border border-amber-500/60 overflow-hidden mt-1.5 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-100"
              style={{ width: `${Math.max(0, Math.min(100, ((stats.comboTimer || 3) / 3.5) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP HEADER: PUBG COMPASS BAR & MATCH STATUS BADGES   */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Top-Left: Match Info & Live Elimination Count */}
        {!isHudHidden && (
          <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Match Status Card */}
          <div className="bg-[#0b101b]/90 border border-amber-500/30 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">حي ALIVE</span>
              <span className="text-sm font-mono font-black text-white">1</span>
            </div>

            <div className="h-4 w-px bg-slate-700/80" />

            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-mono text-xs">🎯</span>
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">قتلى KILLS</span>
              <span className="text-sm font-mono font-black text-amber-400 tabular-nums">{stats.kills}</span>
            </div>

            <div className="h-4 w-px bg-slate-700/80" />

            {/* Current Governorate Badge */}
            <button
              onClick={() => setIsCityPickerOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition bg-cyan-950/60 hover:bg-cyan-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/40"
              title="تغيير المحافظة / الموقع"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedCity.nameAr}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({selectedCity.landmarksAr?.[0] || 'معلم تاريخي'})</span>
            </button>
          </div>

          {/* Credits & Wave indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#0b101b]/85 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-2">
              <span className="text-slate-400">الموجة:</span>
              <span className="font-bold text-cyan-400">{stats.wave} / 7</span>
              {stats.wave === 7 && (
                <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500/50 text-red-400 font-bold text-[10px]">
                  دبابة القلعة!
                </span>
              )}
            </div>

            <div className="bg-[#0b101b]/85 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 text-amber-300 font-bold">
              <span>🪙</span>
              <span>{stats.credits} رصيد</span>
            </div>

            {/* Mission Duration & Timed Objective Countdown */}
            <div className="flex items-center gap-2">
              <div className="bg-[#0b101b]/85 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 text-cyan-300">
                <span className="text-slate-400">الوقت:</span>
                <span className="font-bold tabular-nums text-white">
                  {Math.floor((stats.missionTime || 0) / 60).toString().padStart(2, '0')}:
                  {Math.floor((stats.missionTime || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className={`bg-[#0b101b]/85 border px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 ${
                (stats.missionCountdown || 300) < 30 ? 'border-red-500 text-red-400 animate-pulse bg-red-950/40' : 'border-amber-500/40 text-amber-300'
              }`}>
                <span>⏳</span>
                <span className="font-bold tabular-nums">
                  {Math.floor((stats.missionCountdown || 300) / 60).toString().padStart(2, '0')}:
                  {Math.floor((stats.missionCountdown || 300) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Top-Center: Authentic PUBG Compass Bar */}
        {!isHudHidden && (
          <div className="flex flex-col items-center">
            <CompassBar headingRadians={stats.playerHeading || 0} />

            {/* Boss Encounter Bar (If boss active) */}
            {stats.bossHp !== undefined && stats.bossMaxHp !== undefined && (
              <div className="mt-2 w-72 sm:w-96 bg-[#090f1a]/95 border-2 border-red-500/60 p-2 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.4)] pointer-events-auto">
                <div className="flex justify-between items-center text-[11px] font-mono text-red-400 font-black mb-1">
                  <span className="tracking-wider">⚠️ دبابة القلعة الخارقة - CITADEL SUPER DREADNOUGHT</span>
                  <span className="tabular-nums">
                    {stats.bossHp} / {stats.bossMaxHp}
                  </span>
                </div>
                <div className="w-full h-3 rounded bg-slate-900 overflow-hidden border border-red-900">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-100"
                    style={{ width: `${(stats.bossHp / stats.bossMaxHp) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top-Right: Quick Controls & Minimap Radar */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Controls Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setControlMode((prev) => (prev === 'MANUAL_TARGET' ? 'BUTTONS' : 'MANUAL_TARGET'))}
              className={`px-2.5 py-1.5 rounded-xl border font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                controlMode === 'MANUAL_TARGET'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="تبديل وضع التحكم: التوجيه اليدوي على الأعداء أو أزرار التحكم"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black">{controlMode === 'MANUAL_TARGET' ? '🎯 يدوي على العدو' : '🕹️ أزرار'}</span>
            </button>

            <button
              onClick={onCycleCamera}
              className={`px-2.5 py-1.5 rounded-xl border font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                cameraMode === 'ORBIT'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-[#080d16]/90 hover:bg-[#101828] text-cyan-300 border-cyan-500/40'
              }`}
              title="تبديل وضع الكاميرا (C)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="text-[11px]">{cameraMode}</span>
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-[#080d16]/90 hover:bg-[#101828] border border-cyan-500/30 text-cyan-400 hover:text-white transition shadow-lg"
              title="الصوت"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onPause}
              className="p-2 rounded-xl bg-[#080d16]/90 hover:bg-[#101828] border border-cyan-500/30 text-cyan-400 hover:text-white transition shadow-lg"
              title="إيقاف مؤقت (Esc)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsHudHidden((prev) => !prev)}
              className={`px-2.5 py-2 rounded-xl border font-mono text-xs font-bold transition flex items-center gap-1 shadow-lg ${
                isHudHidden
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-pulse'
                  : 'bg-[#080d16]/90 hover:bg-[#101828] text-emerald-400 border-emerald-500/40'
              }`}
              title="إخفاء أو إظهار الواجهة بالكامل لعدم حجب الرؤية"
            >
              <span>{isHudHidden ? '👁️ إظهار' : '👁️‍🗨️ إخفاء'}</span>
            </button>
          </div>

          {/* Professional Sliding Kill Feed Overlay */}
          {!isHudHidden && <KillFeedOverlay killEvents={stats.killEvents} />}

          {/* Tactical Mini-Map Radar Overlay */}
          {!isHudHidden && (
            <RadarOverlay
              playerPos={stats.playerPos}
              playerHeading={stats.playerHeading}
              arenaRadius={stats.arenaRadius || 80}
              enemies={stats.enemies}
              selectedCity={selectedCity}
            />
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE ON-SCREEN ENEMY TARGETING SYSTEM            */}
      {/* (توجيه يدوي مباشر على الأعداء باللمس على الشاشة)          */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {visibleEnemies.map((e) => {
          const isLocked = stats.lockedTargetEnemyId === e.id;
          const enemyLabel =
            e.type === 'boss'
              ? '👑 دبابة القلعة'
              : e.type === 'tank'
              ? '🛡️ دبابة مدرعة'
              : '🪖 جندي مشاة';
          return (
            <div
              key={e.id}
              style={{
                left: `${e.screenX}px`,
                top: `${e.screenY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                if (isLocked) {
                  onClearTargetLock?.();
                } else {
                  onTargetEnemy?.(e.id);
                }
              }}
              className="absolute pointer-events-auto cursor-pointer group flex flex-col items-center select-none transition-transform hover:scale-105 active:scale-95"
              title="انقر لتوجيه الشخصية والتحرك يدويًا نحو هذا الهدف"
            >
              {/* Tactical Lock Reticle */}
              <div
                className={`relative flex items-center justify-center transition-all duration-150 ${
                  isLocked
                    ? 'w-16 h-16 rounded-full border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)] bg-red-950/40 animate-pulse'
                    : 'w-12 h-12 rounded-full border border-cyan-400/80 hover:border-amber-400 shadow-[0_0_12px_rgba(0,240,255,0.5)] bg-black/40 backdrop-blur-[2px]'
                }`}
              >
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />

                <Target
                  className={`w-5 h-5 ${
                    isLocked ? 'text-red-400 animate-spin' : 'text-cyan-300 group-hover:text-amber-300'
                  }`}
                />
              </div>

              {/* Tactical Distance & Enemy Info Badge */}
              <div
                className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg border whitespace-nowrap transition-all ${
                  isLocked
                    ? 'bg-red-950/90 text-red-200 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-105'
                    : 'bg-black/85 text-slate-200 border-slate-700/80 group-hover:border-amber-400 group-hover:text-amber-300'
                }`}
              >
                <span>{enemyLabel}</span>
                <span className="text-amber-400 tabular-nums">{e.distance}م</span>
                {isLocked ? (
                  <span className="text-red-400 animate-pulse">🔒 مُقفل</span>
                ) : (
                  <span className="text-cyan-400 text-[9px]">اضغط للتوجيه</span>
                )}
              </div>

              {/* Mini Health Bar */}
              <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden mt-0.5 border border-slate-700/60">
                <div
                  className={`h-full ${
                    (e.hpRatio || 1) > 0.5
                      ? 'bg-emerald-400'
                      : (e.hpRatio || 1) > 0.25
                      ? 'bg-amber-400'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.round((e.hpRatio || 1) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. NEAREST ENEMIES TACTICAL QUICK-LOCK STRIP             */}
      {/* (شريط استهداف وتوجيه سريع نحو أقرب الأعداء)               */}
      {/* ======================================================== */}
      {nearestEnemies.length > 0 && (
        <div className="w-full flex items-center justify-center pointer-events-auto mb-1.5 px-2">
          <div className="bg-[#0b101b]/92 border border-cyan-500/50 rounded-2xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-xl w-full justify-between overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 shrink-0">
              <Target className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">أهداف الميدان:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {nearestEnemies.map((enemy) => {
                const isLocked = stats.lockedTargetEnemyId === enemy.id;
                const enemyName =
                  enemy.type === 'boss'
                    ? 'دبابة القلعة'
                    : enemy.type === 'tank'
                    ? 'دبابة'
                    : 'مشاة';
                return (
                  <button
                    key={enemy.id}
                    onClick={() => {
                      if (isLocked) {
                        onClearTargetLock?.();
                      } else {
                        onTargetEnemy?.(enemy.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition border shrink-0 ${
                      isLocked
                        ? 'bg-red-600/35 text-red-200 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
                    }`}
                    title="توجيه يدوي مباشر نحو هذا الهدف"
                  >
                    <span>{enemy.type === 'boss' ? '👑' : enemy.type === 'tank' ? '🛡️' : '🪖'}</span>
                    <span>{enemyName}</span>
                    <span className="text-amber-400 tabular-nums">[{enemy.distance}م]</span>
                    <span className="text-cyan-400 font-black">🎯</span>
                  </button>
                );
              })}

              {/* Fast Direct Lock to Closest Enemy */}
              {closestEnemy && (
                <button
                  onClick={() => onTargetEnemy?.(closestEnemy.id)}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 font-mono font-black text-[10px] flex items-center gap-1 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.6)] active:scale-95 transition"
                  title="توجيه يدوي مباشر ومطاردة لأقرب عدو"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>توجيه لأقرب عدو ({closestEnemy.distance}م)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MOBILE TOUCH CONTROLS (Manual Drag vs Classic Buttons) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-[auto_1fr_auto] items-end w-full pointer-events-auto mb-2 px-1 gap-2 [@media(max-aspect-ratio:4/3)]:scale-90 [@media(max-width:380px)]:scale-85 origin-bottom">
        {/* Left Column: Joystick & Target Lock */}
        <div className="flex items-end justify-start">
          {controlMode === 'MANUAL_TARGET' ? (
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <MobileJoystick
                  onMove={onVirtualInput}
                  onDragMove={onManualDragDirection}
                />
                {/* Quick auto-target nearest button */}
                {closestEnemy && (
                  <button
                    onClick={() => onTargetEnemy?.(closestEnemy.id)}
                    className="p-2.5 rounded-2xl bg-amber-500/20 active:bg-amber-500 border-2 border-amber-400 text-amber-200 active:text-slate-950 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] font-mono text-[9px] font-black"
                    title="توجيه يدوي مباشر على أقرب عدو"
                  >
                    <Target className="w-4 h-4 text-amber-400 active:text-slate-950 animate-pulse" />
                    <span>توجيه نحو</span>
                    <span>العدو 🎯</span>
                  </button>
                )}
              </div>
              <span className="text-[8px] font-mono text-cyan-300 font-bold bg-black/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                🎯 سحب 360° نحو الهدف
              </span>
            </div>
          ) : (
            <MobileJoystick onMove={onVirtualInput} />
          )}
        </div>

        {/* Center Column: Empty Space for Dynamic Scaling */}
        <div className="pointer-events-none" />

        {/* Right Column: Action Buttons Grid */}
        <div className="flex flex-col gap-1 items-end justify-end">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full justify-end">
            <button
              onClick={() => {
                const nextStance = stats.playerStance === 'STAND' ? 'CROUCH' : stats.playerStance === 'CROUCH' ? 'PRONE' : 'STAND';
                onStanceChange?.(nextStance);
              }}
              className="px-2 py-1 rounded-lg bg-purple-950/90 active:bg-purple-600 text-purple-200 font-mono font-bold text-[9px] border border-purple-500/50 shadow whitespace-nowrap"
              title="تبديل الوضعية"
            >
              🚼 {stats.playerStance === 'STAND' ? 'وقوف' : stats.playerStance === 'CROUCH' ? 'انحناء' : 'زحف'}
            </button>
            <button
              onClick={() => onUseMedkit?.()}
              className="px-2 py-1 rounded-lg bg-emerald-950/90 active:bg-emerald-600 text-emerald-200 font-mono font-bold text-[9px] border border-emerald-500/50 shadow whitespace-nowrap"
              title="إسعافات أولية"
            >
              ❤️ إسعاف
            </button>
            <button
              onClick={onToggleScope}
              className="px-2 py-1 rounded-lg bg-cyan-950/90 active:bg-cyan-600 text-cyan-200 font-mono font-bold text-[9px] border border-cyan-500/40 shadow whitespace-nowrap"
            >
              ADS منظار
            </button>
            <button
              onClick={onReload}
              className="px-2 py-1 rounded-lg bg-slate-800 active:bg-slate-700 text-white font-mono font-bold text-[9px] border border-slate-600 shadow whitespace-nowrap"
            >
              تلقيم
            </button>
          </div>
          <div className="flex gap-1 items-center mt-0.5">
            <button
              onPointerDown={() => onVirtualInput({ boost: true })}
              onPointerUp={() => onVirtualInput({ boost: false })}
              className="px-2.5 py-2.5 rounded-xl bg-amber-500/40 active:bg-amber-400 text-amber-100 font-mono font-bold text-[10px] border border-amber-400/50 shadow"
            >
              ركض
            </button>
            <button
              onPointerDown={() => onVirtualInput({ fire: true })}
              onPointerUp={() => onVirtualInput({ fire: false })}
              className="w-14 h-14 rounded-full bg-red-600 active:bg-red-400 text-white font-mono font-black text-xs shadow-2xl flex items-center justify-center border-2 border-red-400 animate-pulse"
            >
              إطلاق 💥
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2.5 TACTICAL EQUIPMENT CONTROL PANEL (لوحة تحكم أزرار المعدات) */}
      {/* ======================================================== */}
      {!isHudHidden && (
        <div className="w-full flex justify-center mb-1.5 px-2 pointer-events-auto">
          <EquipmentControlPanel
            stats={stats}
            onStanceChange={onStanceChange || (() => {})}
            onCallJetStrike={onCallJetStrike || (() => {})}
            onDeployDrone={onDeployDrone}
            onCallReinforcements={onCallReinforcements || (() => {})}
            onTogglePanoramic={onTogglePanoramic || (() => {})}
            onToggleCinematic={onToggleCinematic || (() => {})}
            onReload={onReload}
            onToggleScope={onToggleScope}
            onUseMedkit={onUseMedkit || (() => {})}
            onSelectWeapon={onSelectWeapon}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BOTTOM CLUSTER: HEALTH, WEAPONS & TACTICAL DOCK       */}
      {/* ======================================================== */}
      {!isHudHidden && (
        <div className="flex flex-col sm:flex-row items-end justify-between w-full gap-3">
        {/* ---------------------------------------------------- */}
        {/* BOTTOM-LEFT: TACTICAL RIG SWITCH & EMP               */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col gap-2.5 pointer-events-auto items-start">
          {/* Circular Tactical Minimap */}
          <Minimap stats={stats} />

          {/* Character Rig Switcher Button (Soldier / Buggy) */}
          <div className="bg-[#0b101b]/95 border border-cyan-500/40 p-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
            <button
              onClick={onToggleRigMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition border ${
                isSoldier
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
              title="تبديل نمط الشخصية بين جندي المشاة وعربة البوجي الحربية (T)"
            >
              {isSoldier ? <User className="w-4 h-4 text-amber-400" /> : <Car className="w-4 h-4 text-emerald-400" />}
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-mono">وضع الشخصية [T]</span>
                <span className="text-xs font-black">
                  {isSoldier ? '🪖 جندي كوماندوز بوبجي' : '🚙 مركبة بوجي 4x4'}
                </span>
              </div>
            </button>

            {/* EMP Burst */}
            <button
              onClick={onTriggerEMP}
              disabled={empPct < 100}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase transition border ${
                empPct >= 100
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.7)] cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700/60 cursor-not-allowed'
              }`}
              title="نبضة كهرومغناطيسية شالة (Q)"
            >
              <Zap className="w-4 h-4" />
              <span>EMP [Q]</span>
              <span className="text-[10px] tabular-nums font-semibold">
                {empPct >= 100 ? 'جاهز' : `${Math.round(empPct)}%`}
              </span>
            </button>

            {/* UAV Drone Deploy Button */}
            <button
              onClick={onDeployDrone}
              disabled={stats.droneActive || (stats.droneCooldown || 0) > 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase transition border ${
                stats.droneActive
                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                  : (stats.droneCooldown || 0) > 0
                  ? 'bg-slate-800/80 text-slate-500 border-slate-700/60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(0,136,255,0.7)] cursor-pointer'
              }`}
              title="نشر طائرة استطلاع UAV (F)"
            >
              <span>🚁</span>
              <span>UAV [F]</span>
              <span className="text-[10px] tabular-nums font-semibold">
                {stats.droneActive ? 'نشط 🟢' : (stats.droneCooldown || 0) > 0 ? `${Math.ceil(stats.droneCooldown || 0)}s` : 'جاهز'}
              </span>
            </button>
          </div>

          <div className="hidden md:flex flex-col gap-2">
            {/* Global WebSocket-based Real-time Tactical Chat Overlay */}
            <GlobalChatOverlay />

            {/* Scrolling Combat Text Log */}
            <CombatLog messages={stats.combatLog} />
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* BOTTOM-CENTER: AUTHENTIC PUBG HEALTH & ARMOR BAR     */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col items-center pointer-events-auto w-full max-w-md mx-auto">
          {/* Reloading Banner */}
          {stats.isReloading && (
            <div className="mb-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/70 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 animate-pulse shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري إعادة التلقيم... RELOADING</span>
              <span className="tabular-nums font-black">{Math.round((stats.reloadProgress || 0) * 100)}%</span>
            </div>
          )}

          {/* Armor Rig (Helmet Level 3 & Vest Level 3) + HP & Boost */}
          <div className="w-full bg-[#090e18]/95 border-2 border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2">
            {/* Upper row: Helmet & Vest Durability */}
            <div className="flex items-center justify-between gap-4 text-xs font-mono">
              {/* Helmet Level 3 & Shield Bar with Impact Pulse Glow */}
              {(() => {
                const isShieldHit = stats.lastHitTime && Date.now() - stats.lastHitTime < 350;
                return (
                  <div className={`flex items-center gap-2 flex-1 p-1 rounded-lg transition-all duration-150 ${
                    isShieldHit ? 'bg-cyan-500/30 border border-cyan-300 animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.9)]' : ''
                  }`}>
                    <div className="w-6 h-6 rounded bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-black">
                      🪖
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                        <span>خوذة لفل {stats.helmetLevel || 3}</span>
                        <span className="text-cyan-400 font-bold tabular-nums">{stats.shield}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden mt-0.5">
                        <div
                          className={`h-full transition-all duration-150 ${isShieldHit ? 'bg-white shadow-[0_0_10px_rgba(0,240,255,1)]' : 'bg-cyan-400'}`}
                          style={{ width: `${shieldPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Armored Vest Level 3 */}
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded bg-slate-800 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs font-black">
                  🛡️
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                    <span>درع لفل {stats.vestLevel || 3}</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{stats.hp}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Health Bar (Classic Solid PUBG Style) */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-mono mb-1 font-bold">
                <span className="text-slate-300">مستوى الصحة (HP)</span>
                <span
                  className={`tabular-nums text-sm font-black ${
                    hpPct > 50 ? 'text-white' : hpPct > 25 ? 'text-amber-400' : 'text-red-500 animate-pulse'
                  }`}
                >
                  {stats.hp} / {stats.maxHp}
                </span>
              </div>
              <div className="w-full h-3.5 rounded-lg bg-slate-900 border border-slate-700/60 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded transition-all duration-150 ${
                    hpPct > 50
                      ? 'bg-gradient-to-r from-slate-200 to-white'
                      : hpPct > 25
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-600 to-rose-500'
                  }`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* Energy Boost Bar (4-Segment PUBG Energy Drink Gauge) */}
            <div>
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-0.5">
                <span className={`flex items-center gap-1 ${energyPct < 15 ? 'text-red-400 animate-bounce font-black' : 'text-amber-300'}`}>
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>طاقة المعركة (BOOST) {energyPct < 15 && '⚠️ منخفضة!'}</span>
                </span>
                <span className={`font-bold tabular-nums ${energyPct < 15 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>{stats.energy}%</span>
              </div>
              <div className={`grid grid-cols-4 gap-1 w-full h-1.5 ${energyPct < 15 ? 'animate-pulse ring-2 ring-red-500 rounded-sm' : ''}`}>
                {[0, 25, 50, 75].map((threshold, idx) => {
                  const segWidth = Math.max(0, Math.min(100, ((energyPct - threshold) / 25) * 100));
                  return (
                    <div key={idx} className="h-full bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${energyPct < 15 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                        style={{ width: `${segWidth}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Immersive Visor-Crack Overlay when Shield is Depleted */}
        {shieldPct <= 5 && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden opacity-70">
            <div className="w-full h-full bg-[radial-gradient(circle,transparent_40%,rgba(0,240,255,0.15)_80%)] animate-pulse" />
            <div className="absolute inset-0 border-[12px] border-cyan-500/20 rounded-3xl backdrop-invert-[0.1]" />
            <svg className="absolute inset-0 w-full h-full stroke-cyan-400/60 stroke-2 fill-none">
              <path d="M 100,50 L 300,120 L 250,300 M 800,200 L 600,180 L 650,400 M 400,700 L 450,550 L 550,600" />
              <path d="M 200,800 L 350,650 L 300,500 M 1200,300 L 1000,450 L 1050,700" />
            </svg>
            <div className="absolute top-16 px-4 py-1.5 rounded bg-red-950/80 border border-red-500 text-red-400 font-mono text-xs font-black animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.8)]">
              ⚠️ تحذير: تم تدمير الدرع! التشويشات الرقمية تعطل الأنظمة
            </div>
          </div>
        )}

        {/* Precise Circular Targeting Reticle (Expands with recoil & spread for accurate target acquisition) */}
        {!stats.isScoped && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,240,255,1)]" />
              <div 
                className="absolute rounded-full border-2 border-cyan-400/80 shadow-[0_0_12px_rgba(0,240,255,0.6)] transition-all duration-75"
                style={{
                  width: `${Math.max(20, (stats.crosshairSpread || 12) * 2.2)}px`,
                  height: `${Math.max(20, (stats.crosshairSpread || 12) * 2.2)}px`,
                }}
              />
              <div className="absolute w-2.5 h-0.5 bg-cyan-400 -translate-x-4" />
              <div className="absolute w-2.5 h-0.5 bg-cyan-400 translate-x-4" />
              <div className="absolute w-0.5 h-2.5 bg-cyan-400 -translate-y-4" />
              <div className="absolute w-0.5 h-2.5 bg-cyan-400 translate-y-4" />
            </div>
          </div>
        )}

        {/* Crosshair Hit Marker 'X' (Pulsing & Varying Size Based on Damage Dealt) */}
        {stats.lastHitTime && Date.now() - stats.lastHitTime < 280 && (() => {
          const dmg = stats.lastHitDamage || 20;
          const isCrit = stats.lastHitHeadshot;
          const scaleVal = Math.min(2.2, Math.max(0.75, 0.75 + (dmg / 50)));
          const hitColor = isCrit ? 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,1)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]';
          const pingColor = isCrit ? 'bg-amber-500' : 'bg-red-600';
          return (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <div 
                className="relative flex items-center justify-center animate-ping"
                style={{ transform: `scale(${scaleVal * 1.25})` }}
              >
                <div className={`absolute w-7 h-1 ${pingColor} rotate-45 rounded-full`} />
                <div className={`absolute w-7 h-1 ${pingColor} -rotate-45 rounded-full`} />
              </div>
              <div 
                className="absolute flex items-center justify-center"
                style={{ transform: `scale(${scaleVal})` }}
              >
                <div className={`absolute w-6 h-1 ${hitColor} rotate-45 rounded-full`} />
                <div className={`absolute w-6 h-1 ${hitColor} -rotate-45 rounded-full`} />
              </div>
              <div 
                className={`absolute -translate-y-8 font-mono font-black text-xs sm:text-sm px-1.5 py-0.5 rounded shadow-lg ${
                  isCrit ? 'bg-amber-950/90 text-amber-300 border border-amber-500' : 'bg-red-950/90 text-red-300 border border-red-500'
                }`}
              >
                {Math.round(dmg)}{isCrit ? ' CRIT!' : ''}
              </div>
            </div>
          );
        })()}

        {/* ---------------------------------------------------- */}
        {/* BOTTOM-RIGHT: AUTHENTIC PUBG WEAPON EQUIPMENT CARD   */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Active Weapon Card */}
          <div className="bg-[#090e18]/95 border-2 border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md min-w-[260px] sm:min-w-[300px]">
            {/* Header: Caliber & Fire Mode */}
            <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {activeWeapon.caliber}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {activeWeapon.isSniper ? 'مفرد SINGLE' : 'آلي AUTO'}
              </span>
            </div>

            {/* Weapon Title */}
            <div className="text-right mb-2">
              <div className="text-sm font-black text-white">{activeWeapon.nameAr}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {activeWeapon.nameEn}
              </div>
            </div>

            {/* Giant Ammo Counter */}
            <div className="flex items-baseline justify-end gap-2 font-mono mb-3">
              <span
                className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tighter ${
                  stats.ammo <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
                }`}
              >
                {stats.ammo}
              </span>
              <span className="text-lg text-slate-500 font-bold">/</span>
              <span className="text-base text-slate-400 font-bold tabular-nums">
                {stats.reserveAmmo}
              </span>
            </div>

            {/* Interactive Weapon Controls (Reload & Scope ADS) */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={onReload}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-600 shadow"
                title="إعادة تلقيم السلاح (R)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>تلقيم [R]</span>
              </button>

              <button
                onClick={onToggleScope}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 border shadow ${
                  stats.isScoped
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                    : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/40'
                }`}
                title="تشغيل / إيقاف منظار التصويب (الزر الأيمن للفأرة أو V)"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>منظار ADS [V]</span>
              </button>
            </div>

            {/* Quick Weapon Slots (1-5) */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono mb-1 text-right">
                حقيبة الأسلحة (مفاتيح 1-5):
              </div>
              <div className="grid grid-cols-5 gap-1">
                {stats.availableWeapons.map((w) => {
                  const isUnlocked = w.level <= stats.weaponLevel;
                  const isActive = w.level === activeWeapon.level;
                  const canAfford = stats.credits >= w.cost;

                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (isUnlocked) {
                          onSelectWeapon(w.level);
                        } else if (canAfford) {
                          onUpgradeWeapon(w.level);
                        }
                      }}
                      className={`p-1.5 rounded flex flex-col items-center justify-center text-[10px] font-mono transition border ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : isUnlocked
                          ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600'
                          : canAfford
                          ? 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900/80 text-slate-600 border-slate-800 cursor-not-allowed'
                      }`}
                      title={`${w.nameAr} - ${w.nameEn} ${!isUnlocked ? `(تطوير: ${w.cost} رصيد)` : ''}`}
                    >
                      <span className="font-bold">{w.level}</span>
                      <span className="text-[8px] truncate max-w-full font-sans">
                        {w.id === 'm416' ? 'M416' : w.id === 'akm' ? 'AKM' : w.id === 'awm' ? 'AWM' : w.id === 'm249' ? 'M249' : 'RPG-7'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* 4. YEMEN GOVERNORATES TACTICAL DEPLOYMENT MODAL           */}
      {/* ======================================================== */}
      {isCityPickerOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border-2 border-cyan-500/50 rounded-2xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-cyan-900/60 mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  خريطة انتشار محافظات الجمهورية اليمنية (21 محافظة)
                </h2>
              </div>
              <button
                onClick={() => setIsCityPickerOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                ✕ إغلاق
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              اختر المحافظة اليمنية للانتقال فوراً إلى قطاعها التكتيكي ومعلمها التاريخي في ساحة المعركة:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-1">
              {YEMEN_GOVERNORATES.map((city) => {
                const isCurrent = city.id === selectedCity.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => {
                      onTeleportCity(city.id);
                      setIsCityPickerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                        : 'bg-[#0f172a]/70 hover:bg-[#1e293b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black">{city.nameAr}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: city.color }} />
                    </div>
                    <div className="text-[10px] text-cyan-300/90 font-medium mb-1">{city.landmarksAr?.[0] || 'معلم تاريخي'}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      X: {city.coord3D.x} | Z: {city.coord3D.z}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

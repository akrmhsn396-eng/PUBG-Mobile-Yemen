import React, { useState } from 'react';
import { PlayerStats, CameraMode } from '../game/GameEngine';
import { soundManager } from '../audio/SoundManager';
import { YEMEN_GOVERNORATES, YemenCity } from '../data/yemenGovernorates';
import { CompassBar } from './CompassBar';
import { RadarOverlay } from './RadarOverlay';
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
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

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

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER: PUBG COMPASS BAR & MATCH STATUS BADGES   */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Top-Left: Match Info & Live Elimination Count */}
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
          <div className="flex items-center gap-2">
            <div className="bg-[#0b101b]/85 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-2">
              <span className="text-slate-400">الموجة:</span>
              <span className="font-bold text-cyan-400">{stats.wave} / 4</span>
              {stats.wave === 4 && (
                <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500/50 text-red-400 font-bold text-[10px]">
                  دبابة القلعة!
                </span>
              )}
            </div>

            <div className="bg-[#0b101b]/85 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 text-amber-300 font-bold">
              <span>🪙</span>
              <span>{stats.credits} رصيد</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Authentic PUBG Compass Bar */}
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

        {/* Top-Right: Quick Controls & Minimap Radar */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Controls Bar */}
          <div className="flex items-center gap-1.5">
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
          </div>

          {/* Tactical Mini-Map Radar Overlay */}
          <RadarOverlay
            playerPos={stats.playerPos}
            playerHeading={stats.playerHeading}
            arenaRadius={stats.arenaRadius || 80}
            enemies={stats.enemies}
            selectedCity={selectedCity}
          />

          {/* PUBG Live Kill Feed Ticker */}
          {stats.killFeed && stats.killFeed.length > 0 && (
            <div className="flex flex-col items-end gap-1 max-w-[280px]">
              {stats.killFeed.slice(0, 3).map((msg, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded bg-[#090d16]/90 border border-slate-700/60 text-[11px] text-slate-200 font-mono shadow-md backdrop-blur-sm animate-fade-in text-right"
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE TOUCH CONTROLS (Small screens)                */}
      {/* ======================================================== */}
      <div className="sm:hidden flex items-end justify-between w-full pointer-events-auto mb-2 px-1">
        {/* D-Pad touch cluster */}
        <div className="grid grid-cols-3 gap-1 w-28 h-28">
          <div />
          <button
            onPointerDown={() => onVirtualInput({ forward: true })}
            onPointerUp={() => onVirtualInput({ forward: false })}
            className="rounded-lg bg-amber-950/70 border border-amber-600/50 active:bg-amber-500 text-amber-200 flex items-center justify-center font-bold text-sm shadow"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => onVirtualInput({ left: true })}
            onPointerUp={() => onVirtualInput({ left: false })}
            className="rounded-lg bg-amber-950/70 border border-amber-600/50 active:bg-amber-500 text-amber-200 flex items-center justify-center font-bold text-sm shadow"
          >
            ◀
          </button>
          <div className="rounded-lg bg-slate-900/40" />
          <button
            onPointerDown={() => onVirtualInput({ right: true })}
            onPointerUp={() => onVirtualInput({ right: false })}
            className="rounded-lg bg-amber-950/70 border border-amber-600/50 active:bg-amber-500 text-amber-200 flex items-center justify-center font-bold text-sm shadow"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => onVirtualInput({ backward: true })}
            onPointerUp={() => onVirtualInput({ backward: false })}
            className="rounded-lg bg-amber-950/70 border border-amber-600/50 active:bg-amber-500 text-amber-200 flex items-center justify-center font-bold text-sm shadow"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Action Buttons cluster */}
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex gap-1.5">
            <button
              onClick={onToggleScope}
              className="px-3 py-2 rounded-xl bg-cyan-900/80 active:bg-cyan-600 text-cyan-200 font-mono font-bold text-[11px] border border-cyan-500/40 shadow"
            >
              ADS منظار
            </button>
            <button
              onClick={onReload}
              className="px-3 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-white font-mono font-bold text-[11px] border border-slate-600 shadow"
            >
              تلقيم R
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onPointerDown={() => onVirtualInput({ boost: true })}
              onPointerUp={() => onVirtualInput({ boost: false })}
              className="px-4 py-3 rounded-xl bg-amber-500/40 active:bg-amber-400 text-amber-100 font-mono font-bold text-xs border border-amber-400/50"
            >
              ركض سريع
            </button>
            <button
              onPointerDown={() => onVirtualInput({ fire: true })}
              onPointerUp={() => onVirtualInput({ fire: false })}
              className="w-16 h-16 rounded-full bg-red-600 active:bg-red-400 text-white font-mono font-black text-sm shadow-xl flex items-center justify-center border-2 border-red-400"
            >
              إطلاق
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM CLUSTER: HEALTH, WEAPONS & TACTICAL DOCK       */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-end justify-between w-full gap-3">
        {/* ---------------------------------------------------- */}
        {/* BOTTOM-LEFT: TACTICAL RIG SWITCH & EMP               */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col gap-2 pointer-events-auto">
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
              {/* Helmet Level 3 */}
              <div className="flex items-center gap-2 flex-1">
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
                      className="h-full bg-cyan-400 transition-all duration-150"
                      style={{ width: `${shieldPct}%` }}
                    />
                  </div>
                </div>
              </div>

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
                <span className="flex items-center gap-1 text-amber-300">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>طاقة المعركة (BOOST)</span>
                </span>
                <span className="text-amber-400 font-bold tabular-nums">{stats.energy}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1 w-full h-1.5">
                {[0, 25, 50, 75].map((threshold, idx) => {
                  const segWidth = Math.max(0, Math.min(100, ((energyPct - threshold) / 25) * 100));
                  return (
                    <div key={idx} className="h-full bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-75"
                        style={{ width: `${segWidth}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

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

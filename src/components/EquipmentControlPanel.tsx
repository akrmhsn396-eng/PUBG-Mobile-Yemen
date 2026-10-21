import React, { useState } from 'react';
import { PlayerStats, PlayerStance } from '../game/GameEngine';
import {
  Shield,
  Crosshair,
  RefreshCw,
  Zap,
  Radio,
  Eye,
  Film,
  Heart,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Target,
} from 'lucide-react';

interface EquipmentControlPanelProps {
  stats: PlayerStats;
  onStanceChange: (stance: PlayerStance) => void;
  onCallJetStrike: () => void;
  onDeployDrone: () => void;
  onCallReinforcements: () => void;
  onTogglePanoramic: () => void;
  onToggleCinematic: () => void;
  onReload: () => void;
  onToggleScope: () => void;
  onUseMedkit: () => void;
  onSelectWeapon: (level: number) => void;
}

export const EquipmentControlPanel: React.FC<EquipmentControlPanelProps> = ({
  stats,
  onStanceChange,
  onCallJetStrike,
  onDeployDrone,
  onCallReinforcements,
  onTogglePanoramic,
  onToggleCinematic,
  onReload,
  onToggleScope,
  onUseMedkit,
  onSelectWeapon,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'gear' | 'air' | 'weapons'>('all');

  const currentStance = stats.playerStance || 'STAND';
  const isPanoramic = stats.isPanoramic || stats.cameraMode === 'PANORAMIC';
  const isCinematic = stats.isCinematicLetterbox || false;
  const jetCooldown = stats.jetCooldown || 0;
  const droneCooldown = stats.droneCooldown || 0;
  const reinCooldown = stats.reinforcementsCooldown || 0;

  const branches = stats.combatBranches || {
    jets: 2,
    tanks: (stats.enemies || []).filter((e) => e.type === 'tank' || e.type === 'boss').length,
    apcs: (stats.enemies || []).filter((e) => e.type === 'tank').length,
    soldiers: (stats.enemies || []).filter((e) => e.type === 'soldier').length,
  };

  return (
    <div className="pointer-events-auto flex flex-col items-center select-none font-sans z-30">
      {/* Mini Status Bar & Toggle */}
      <div className="mb-1 flex items-center gap-1 bg-[#090f19]/90 border border-cyan-500/40 rounded-lg px-2 py-0.5 backdrop-blur-md shadow-xl text-[9px] font-mono">
        <span className="text-cyan-300 font-bold hidden sm:inline">مسرح الحرب:</span>
        <span className="text-cyan-200">✈️ {branches.jets}</span>
        <span className="text-red-300">🛡️ {branches.tanks}</span>
        <span className="text-amber-300">🚙 {branches.apcs}</span>
        <span className="text-emerald-300">🪖 {branches.soldiers}</span>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-0.5 rounded bg-cyan-950 hover:bg-cyan-800 text-cyan-300 transition ml-1"
          title={isExpanded ? 'طي لوحة التحكم' : 'فتح لوحة التحكم المصغرة'}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Miniature Button Control Panel */}
      {isExpanded && (
        <div className="bg-[#0b121e]/95 border border-cyan-500/50 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl w-[92vw] max-w-md">
          {/* Mini Header / Filters */}
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1 mb-1 px-1">
            <span className="text-[10px] font-black font-mono text-cyan-300">
              لوحة التحكم المصغرة 🎛️
            </span>
            <div className="flex items-center gap-1 text-[9px] font-mono">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-1.5 py-0.5 rounded ${activeTab === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setActiveTab('gear')}
                className={`px-1.5 py-0.5 rounded ${activeTab === 'gear' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
              >
                الوضعيات 🚼
              </button>
              <button
                onClick={() => setActiveTab('air')}
                className={`px-1.5 py-0.5 rounded ${activeTab === 'air' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
              >
                الدعم ✈️
              </button>
            </div>
          </div>

          {/* Compact Mini Grid of Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-[38vh] overflow-y-auto pr-0.5">
            {/* 1. Stand */}
            {(activeTab === 'all' || activeTab === 'gear') && (
              <button
                onClick={() => onStanceChange('STAND')}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  currentStance === 'STAND'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="وقوف قتالي (C)"
              >
                <span className="text-sm">🧍</span>
                <span className="truncate">وقوف</span>
              </button>
            )}

            {/* 2. Crouch */}
            {(activeTab === 'all' || activeTab === 'gear') && (
              <button
                onClick={() => onStanceChange('CROUCH')}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  currentStance === 'CROUCH'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="انحناء تكتيكي (C)"
              >
                <span className="text-sm">🧎</span>
                <span className="truncate">انحناء</span>
              </button>
            )}

            {/* 3. Prone / Crawl */}
            {(activeTab === 'all' || activeTab === 'gear') && (
              <button
                onClick={() => onStanceChange('PRONE')}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  currentStance === 'PRONE'
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold animate-pulse'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="زحف قتالي أرضي (Z)"
              >
                <span className="text-sm">🚼</span>
                <span className="truncate">زحف</span>
              </button>
            )}

            {/* 4. Fighter Jet Strike */}
            {(activeTab === 'all' || activeTab === 'air') && (
              <button
                disabled={jetCooldown > 0}
                onClick={onCallJetStrike}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  jetCooldown > 0
                    ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                    : 'bg-red-950/70 border-red-500 text-red-200 hover:bg-red-900'
                }`}
                title="غارة نفاثة حربية (B)"
              >
                <span className="text-sm">✈️</span>
                <span className="truncate">{jetCooldown > 0 ? `${Math.round(jetCooldown)}ث` : 'غارة'}</span>
              </button>
            )}

            {/* 5. Recon Drone */}
            {(activeTab === 'all' || activeTab === 'air') && (
              <button
                disabled={droneCooldown > 0}
                onClick={onDeployDrone}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  droneCooldown > 0
                    ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                    : 'bg-cyan-950/70 border-cyan-500 text-cyan-200 hover:bg-cyan-900'
                }`}
                title="مسيرة استطلاع (F)"
              >
                <span className="text-sm">🚁</span>
                <span className="truncate">{droneCooldown > 0 ? `${Math.round(droneCooldown)}ث` : 'مسيرة'}</span>
              </button>
            )}

            {/* 6. Airdrop Reinforcements */}
            {(activeTab === 'all' || activeTab === 'air') && (
              <button
                disabled={reinCooldown > 0}
                onClick={onCallReinforcements}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  reinCooldown > 0
                    ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                    : 'bg-amber-950/70 border-amber-500 text-amber-200 hover:bg-amber-900'
                }`}
                title="إمداد دروع عسكرية"
              >
                <span className="text-sm">📦</span>
                <span className="truncate">{reinCooldown > 0 ? `${Math.round(reinCooldown)}ث` : 'إمداد'}</span>
              </button>
            )}

            {/* 7. Panoramic 360 Toggle */}
            {(activeTab === 'all' || activeTab === 'gear') && (
              <button
                onClick={onTogglePanoramic}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  isPanoramic
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                    : 'bg-slate-900/80 border-cyan-500/50 text-cyan-200 hover:bg-slate-800'
                }`}
                title="مشهد بانورامي 360 (X)"
              >
                <Eye className="w-3.5 h-3.5 mb-0.5" />
                <span className="truncate">بانوراما</span>
              </button>
            )}

            {/* 8. Cinematic 21:9 */}
            {(activeTab === 'all' || activeTab === 'gear') && (
              <button
                onClick={onToggleCinematic}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  isCinematic
                    ? 'bg-purple-900 border-purple-400 text-purple-200 font-bold'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="سينما 21:9"
              >
                <Film className="w-3.5 h-3.5 mb-0.5" />
                <span className="truncate">سينما</span>
              </button>
            )}

            {/* 9. Medkit */}
            {activeTab === 'all' && (
              <button
                onClick={onUseMedkit}
                className="p-1 rounded border bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500 text-emerald-200 flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono"
                title="إسعافات أولية (+60 صحة)"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                <span className="truncate">إسعاف</span>
              </button>
            )}

            {/* 10. Scope ADS */}
            {activeTab === 'all' && (
              <button
                onClick={onToggleScope}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  stats.isScoped ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="منظار ADS (V)"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
                <span className="truncate">منظار</span>
              </button>
            )}

            {/* 11. Reload */}
            {activeTab === 'all' && (
              <button
                onClick={onReload}
                disabled={stats.isReloading}
                className="p-1 rounded border bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono"
                title="تلقيم (R)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${stats.isReloading ? 'animate-spin text-amber-400' : 'text-slate-300'} mb-0.5`} />
                <span className="truncate">{stats.isReloading ? 'تلقيم' : `${stats.ammo}`}</span>
              </button>
            )}

            {/* 12. Weapon 1 (AKM) */}
            {activeTab === 'all' && (
              <button
                onClick={() => onSelectWeapon(1)}
                className={`p-1 rounded border flex flex-col items-center justify-center transition active:scale-95 text-[9px] font-mono ${
                  stats.weaponLevel === 1 ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="سلاح AKM [1]"
              >
                <span className="text-xs">🔫</span>
                <span className="truncate">AKM [1]</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

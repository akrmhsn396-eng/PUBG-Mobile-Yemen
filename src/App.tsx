/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GamePhase, PlayerStats } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { ScopeOverlay } from './components/ScopeOverlay';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ModelStudioModal } from './components/ModelStudioModal';
import { WEAPON_UPGRADES } from './data/weapons';

const initialStats: PlayerStats = {
  hp: 100,
  maxHp: 100,
  shield: 100,
  maxShield: 100,
  energy: 100,
  maxEnergy: 100,
  empCharge: 100,
  empMax: 100,
  score: 0,
  combo: 1,
  highScore: 0,
  wave: 1,
  kills: 0,
  cameraMode: 'CHASE',
  credits: 350,
  weaponLevel: 1,
  activeWeapon: WEAPON_UPGRADES[0],
  availableWeapons: WEAPON_UPGRADES,
  ammo: 30,
  maxAmmo: 30,
  reserveAmmo: 180,
  isReloading: false,
  reloadProgress: 0,
  isScoped: false,
  playerRigMode: 'SOLDIER',
  playerStance: 'STAND',
  helmetLevel: 3,
  vestLevel: 3,
  killFeed: ['مرحباً بك في ساحة معركة اليمن - PUBG YEMEN'],
  weaponHeat: 0,
  isOverheated: false,
  crosshairSpread: 12,
  killEvents: [],
  xp: 0,
  nextLevelXp: 400,
  playerLevel: 1,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [stats, setStats] = useState<PlayerStats>(initialStats);
  const [isModelStudioOpen, setIsModelStudioOpen] = useState(false);

  // Initialize WebGL engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, (newStats, newPhase) => {
      setStats((prev) => ({ ...prev, ...newStats }));
      setPhase((prev) => (prev !== newPhase ? newPhase : prev));
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Handlers
  const handleStartGame = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restartGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleTriggerEMP = useCallback(() => {
    engineRef.current?.triggerEMP();
  }, []);

  const handleCycleCamera = useCallback(() => {
    engineRef.current?.cycleCameraMode();
  }, []);

  const handleZoomIn = useCallback(() => {
    engineRef.current?.zoomCamera(-2.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    engineRef.current?.zoomCamera(2.5);
  }, []);

  const handleResetCamera = useCallback(() => {
    engineRef.current?.resetCamera();
  }, []);

  const handleReload = useCallback(() => {
    engineRef.current?.reloadWeapon();
  }, []);

  const handleToggleScope = useCallback(() => {
    engineRef.current?.toggleScope();
  }, []);

  const handleToggleRigMode = useCallback(() => {
    engineRef.current?.togglePlayerRigMode();
  }, []);

  const handleSelectWeapon = useCallback((level: number) => {
    engineRef.current?.selectWeapon(level);
  }, []);

  const handleUpgradeWeapon = useCallback((level?: number) => {
    engineRef.current?.upgradeWeapon(level);
  }, []);

  const handleTeleportCity = useCallback((cityId: string) => {
    engineRef.current?.teleportToYemenCity(cityId);
  }, []);

  const handleVirtualInput = useCallback(
    (input: {
      forward?: boolean;
      backward?: boolean;
      left?: boolean;
      right?: boolean;
      fire?: boolean;
      boost?: boolean;
    }) => {
      engineRef.current?.setVirtualInput(input);
    },
    []
  );

  const handleDeployDrone = useCallback(() => {
    engineRef.current?.deployDrone();
  }, []);

  const handleCycleWeather = useCallback(() => {
    engineRef.current?.cycleWeather();
  }, []);

  const handleTargetEnemy = useCallback((enemyId: number) => {
    engineRef.current?.targetEnemyById(enemyId);
  }, []);

  const handleClearTargetLock = useCallback(() => {
    engineRef.current?.clearTargetLock();
  }, []);

  const handleManualDragDirection = useCallback((angle: number, isMoving: boolean, autoFire?: boolean) => {
    engineRef.current?.setManualDragDirection(angle, isMoving, autoFire);
  }, []);

  const handleManualTouchMoveTowards = useCallback((screenX: number, screenY: number, autoFire?: boolean) => {
    engineRef.current?.manualTouchMoveTowards(screenX, screenY, autoFire);
  }, []);

  const handleStopManualMove = useCallback(() => {
    engineRef.current?.stopManualMove();
  }, []);

  const handleStanceChange = useCallback((stance: any) => {
    engineRef.current?.setPlayerStance(stance);
  }, []);

  const handleCallJetStrike = useCallback(() => {
    engineRef.current?.callFighterJetStrike();
  }, []);

  const handleCallReinforcements = useCallback(() => {
    engineRef.current?.callMilitaryReinforcements();
  }, []);

  const handleTogglePanoramic = useCallback(() => {
    engineRef.current?.togglePanoramicMode();
  }, []);

  const handleToggleCinematic = useCallback(() => {
    engineRef.current?.toggleCinematicLetterbox();
  }, []);

  const handleUseMedkit = useCallback(() => {
    engineRef.current?.useMedkit();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* Isolated Three.js WebGL Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full absolute inset-0 z-0 overflow-hidden cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {phase === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenModelStudio={() => setIsModelStudioOpen(true)}
          highScore={stats.highScore}
          cameraMode={stats.cameraMode || 'CHASE'}
          onCycleCamera={handleCycleCamera}
        />
      )}

      {/* In-Game Realistic PUBG Battleground HUD */}
      {phase === 'PLAYING' && (
        <>
          <GameHUD
            stats={stats}
            onPause={handlePause}
            onTriggerEMP={handleTriggerEMP}
            onCycleCamera={handleCycleCamera}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetCamera={handleResetCamera}
            onOpenModelStudio={() => setIsModelStudioOpen(true)}
            onVirtualInput={handleVirtualInput}
            onReload={handleReload}
            onToggleScope={handleToggleScope}
            onToggleRigMode={handleToggleRigMode}
            onSelectWeapon={handleSelectWeapon}
            onUpgradeWeapon={handleUpgradeWeapon}
            onTeleportCity={handleTeleportCity}
            onDeployDrone={handleDeployDrone}
            onCycleWeather={handleCycleWeather}
            onTargetEnemy={handleTargetEnemy}
            onClearTargetLock={handleClearTargetLock}
            onManualDragDirection={handleManualDragDirection}
            onManualTouchMoveTowards={handleManualTouchMoveTowards}
            onStopManualMove={handleStopManualMove}
            onStanceChange={handleStanceChange}
            onCallJetStrike={handleCallJetStrike}
            onCallReinforcements={handleCallReinforcements}
            onTogglePanoramic={handleTogglePanoramic}
            onToggleCinematic={handleToggleCinematic}
            onUseMedkit={handleUseMedkit}
          />

          {/* Aim-Down-Sights (ADS) Scope Reticle Overlay */}
          <ScopeOverlay
            isScoped={stats.isScoped}
            onToggleScope={handleToggleScope}
            isSniper={!!stats.activeWeapon.isSniper}
            weaponName={stats.activeWeapon.nameEn}
          />
        </>
      )}

      {/* Pause Modal */}
      <PauseModal
        isOpen={phase === 'PAUSED'}
        onResume={handlePause}
        onRestart={handleRestart}
        onOpenModelStudio={() => setIsModelStudioOpen(true)}
        cameraMode={stats.cameraMode || 'CHASE'}
        onCycleCamera={handleCycleCamera}
      />

      {/* Game Over / Chicken Dinner Victory Modal */}
      <GameOverModal
        isOpen={phase === 'GAME_OVER' || phase === 'VICTORY'}
        isVictory={phase === 'VICTORY'}
        stats={stats}
        onRestart={handleRestart}
        onOpenModelStudio={() => setIsModelStudioOpen(true)}
      />

      {/* 3D Model Studio & OBJ Importer Modal */}
      <ModelStudioModal
        isOpen={isModelStudioOpen}
        onClose={() => setIsModelStudioOpen(false)}
        gameEngine={engineRef.current}
      />
    </div>
  );
}

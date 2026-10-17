import React from 'react';
import { Play, RotateCcw, Box, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';
import { CameraMode } from '../game/GameEngine';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenModelStudio: () => void;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenModelStudio,
  cameraMode,
  onCycleCamera,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  if (!isOpen) return null;

  const toggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto select-none">
      <div className="w-full max-w-md bg-[#090e1a] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-6">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-2">
            SIMULATION PAUSED
          </div>
          <h2 className="text-2xl font-black font-mono text-white tracking-wider">
            SYSTEM STANDBY
          </h2>
        </div>

        <div className="space-y-3 font-mono">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME SIMULATION [ESC]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-[#0e1626] hover:bg-[#141e33] border border-slate-700 hover:border-slate-500 text-slate-200 font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART SECTOR [R]</span>
          </button>

          <button
            onClick={onOpenModelStudio}
            className="w-full py-3 px-4 rounded-xl bg-[#0e1626] hover:bg-[#141e33] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>3D MODEL STUDIO & OBJ</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <button
            onClick={onCycleCamera}
            className="hover:text-cyan-300 transition"
          >
            Camera: <span className="text-white font-bold">{cameraMode}</span>
          </button>
          <button
            onClick={toggleMute}
            className="hover:text-cyan-300 transition flex items-center gap-1.5"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Muted' : 'Sound ON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

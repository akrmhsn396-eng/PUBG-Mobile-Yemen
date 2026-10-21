import React, { useRef, useState, useCallback } from 'react';

interface MobileJoystickProps {
  onMove?: (input: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => void;
  onDragMove?: (angle: number, isMoving: boolean, autoFire?: boolean) => void;
  lockedTarget?: string | null;
}

export const MobileJoystick: React.FC<MobileJoystickProps> = ({ onMove, onDragMove, lockedTarget }) => {
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const stickRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    handleTouchMove(e);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging && e.type !== 'touchstart' && e.type !== 'mousedown') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.min(48, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);

    const limitedX = Math.cos(angle) * distance;
    const limitedY = Math.sin(angle) * distance;

    setTouchPos({ x: limitedX, y: limitedY });

    if (distance > 6) {
      // 360-degree analog drag direction in 3D world space (dx -> x, dy -> z)
      const worldRot = Math.atan2(limitedX, -limitedY);
      onDragMove?.(worldRot, true);
    }

    const forward = limitedY < -10;
    const backward = limitedY > 10;
    const left = limitedX < -10;
    const right = limitedX > 10;

    onMove?.({ forward, backward, left, right });
  }, [isDragging, onMove, onDragMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouchPos({ x: 0, y: 0 });
    onDragMove?.(0, false);
    onMove?.({ forward: false, backward: false, left: false, right: false });
  }, [onMove, onDragMove]);

  return (
    <div
      ref={stickRef}
      className="relative w-32 h-32 rounded-full bg-[#0b121e]/85 border-2 border-cyan-500/60 shadow-[0_0_25px_rgba(0,240,255,0.3)] backdrop-blur-md flex items-center justify-center touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="absolute inset-2 rounded-full border border-cyan-500/20 pointer-events-none" />
      <span className="absolute top-2 text-[10px] text-cyan-400 font-mono font-bold pointer-events-none">▲</span>
      <span className="absolute bottom-2 text-[10px] text-cyan-400 font-mono font-bold pointer-events-none">▼</span>
      <span className="absolute left-2 text-[10px] text-cyan-400 font-mono font-bold pointer-events-none">◀</span>
      <span className="absolute right-2 text-[10px] text-cyan-400 font-mono font-bold pointer-events-none">▶</span>

      <div
        className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(0,240,255,0.9)] border-2 border-cyan-200 pointer-events-none transition-transform duration-75 flex items-center justify-center text-slate-950 font-bold text-xs"
        style={{
          transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
        }}
      >
        🕹️
      </div>
    </div>
  );
};

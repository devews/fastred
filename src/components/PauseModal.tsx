import React from 'react';
import { soundManager } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onQuitToMenu }) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());

  const handleMute = () => {
    setIsMuted(soundManager.toggleMute());
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-700/90 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-2xl font-black italic tracking-tight">RACE PAUSED</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
            ESC TO RESUME
          </span>
        </div>

        {/* Quick Driver Controls Reference */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono text-slate-300">
          <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">CONTROLS REMINDER</div>
          <div className="flex justify-between">
            <span className="text-slate-400">THROTTLE / BRAKE:</span>
            <span className="text-white">W / S or &uarr; / &darr;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">STEERING:</span>
            <span className="text-white">A / D or &larr; / &rarr;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">HANDBRAKE / DRIFT:</span>
            <span className="text-amber-400 font-bold">SPACEBAR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">NITRO BOOST:</span>
            <span className="text-cyan-400 font-bold">LEFT SHIFT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">CAMERA VIEW:</span>
            <span className="text-purple-400 font-bold">C KEY</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black italic rounded-xl text-base tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            RESUME RACE
          </button>

          <button
            onClick={handleMute}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            AUDIO: {isMuted ? 'MUTED' : 'ENABLED'}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            RESTART CIRCUIT
          </button>

          <button
            onClick={onQuitToMenu}
            className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            RETURN TO GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CameraView, CarInput, CarPhysics, TrackConfig } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { SpeedometerGauge } from './SpeedometerGauge';

interface GameHUDProps {
  player: CarPhysics;
  aiCars: CarPhysics[];
  trackConfig: TrackConfig;
  cameraView: CameraView;
  onCameraChange: (view: CameraView) => void;
  onPause: () => void;
  onTimeOfDayToggle?: () => void;
  countdown: number; // 3, 2, 1, 0 (GO), -1 (race in progress)
  onInputUpdate?: (input: Partial<CarInput>) => void;
}

function formatLapTime(seconds: number): string {
  if (seconds >= 900 || seconds <= 0) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  aiCars,
  trackConfig,
  cameraView,
  onCameraChange,
  onPause,
  onTimeOfDayToggle,
  countdown,
  onInputUpdate,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Helper for on-screen touch/click control buttons
  const setControl = (key: keyof CarInput, active: boolean) => {
    if (onInputUpdate) {
      soundManager.userGesture();
      onInputUpdate({ [key]: active });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 text-white font-sans overflow-hidden">
      {/* --- TOP CLUSTERS (STATUS & TIMINGS) --- */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Position & Lap Status */}
        <div className="flex items-center gap-3">
          {/* Race Position Cluster */}
          <div className="bg-slate-950/85 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400 leading-tight">POSITION</div>
              <div className="text-3xl md:text-4xl font-black font-mono tracking-tight text-white tabular-nums">
                <span className="text-cyan-400">{player.raceRank}</span>
                <span className="text-slate-500 text-xl font-normal">/6</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            {/* Lap Counter */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 leading-tight">LAP</div>
              <div className="text-2xl md:text-3xl font-black font-mono text-white tabular-nums">
                {Math.min(trackConfig.laps, player.lap)}
                <span className="text-slate-500 text-lg font-normal">/{trackConfig.laps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right: Lap Times */}
        <div className="bg-slate-950/85 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-lg space-y-1 font-mono text-right min-w-[140px]">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">TIME</span>
            <span className="text-cyan-300 font-bold text-sm tabular-nums">
              {formatLapTime(player.currentLapTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs border-t border-slate-800 pt-1">
            <span className="text-slate-500">BEST</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {formatLapTime(player.bestLapTime)}
            </span>
          </div>
        </div>
      </div>

      {/* --- CENTER: COUNTDOWN & DRIFT NOTIFICATIONS --- */}
      <div className="my-auto flex flex-col items-center justify-center gap-2">
        {/* --- PROMINENT FULLSCREEN COUNTDOWN IN FRONT OF SCREEN --- */}
        {countdown >= 0 && (
          <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/45 pointer-events-none animate-in fade-in duration-150">
            <div className="relative flex flex-col items-center">
              {/* 4 Glowing Traffic Light Bulbs */}
              <div className="flex items-center gap-4 bg-slate-950/95 border-2 border-slate-700 px-6 py-3 rounded-2xl shadow-2xl mb-4">
                {[1, 2, 3, 4].map(idx => {
                  const isActive =
                    countdown === 0
                      ? true
                      : countdown === 3
                      ? idx === 1
                      : countdown === 2
                      ? idx <= 2
                      : countdown === 1
                      ? idx <= 3
                      : false;
                  const lightColor =
                    countdown === 0
                      ? 'bg-emerald-400 shadow-[0_0_24px_#10b981]'
                      : idx === 3
                      ? 'bg-amber-400 shadow-[0_0_24px_#f59e0b]'
                      : 'bg-red-500 shadow-[0_0_24px_#ef4444]';
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full border-2 border-black transition-all ${
                        isActive ? lightColor : 'bg-slate-900 border-slate-800 opacity-30'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Giant Glowing Numeral */}
              <div className="relative">
                {countdown === 0 ? (
                  <div className="text-8xl md:text-9xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_50px_rgba(16,185,129,0.95)] animate-in zoom-in-75 duration-200">
                    GO!
                  </div>
                ) : (
                  <div className="text-8xl md:text-9xl font-black italic font-mono text-amber-400 drop-shadow-[0_0_50px_rgba(245,158,11,0.95)] animate-in zoom-in-75 duration-200">
                    {countdown}
                  </div>
                )}
              </div>

              <div className="text-xs md:text-sm font-mono font-black uppercase tracking-widest text-white mt-4 bg-slate-900/90 border border-slate-700 px-5 py-1.5 rounded-full shadow-lg">
                {countdown === 0 ? 'PEDAL TO THE METAL!' : 'HOLD [W] TO REV ENGINE'}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Drift Score Popup with Multiplier Combo */}
        {player.isDrifting && (
          <div className="flex flex-col items-center bg-black/80 border-2 border-amber-500 px-6 py-2.5 rounded-2xl shadow-[0_0_28px_rgba(245,158,11,0.55)]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black font-mono tracking-widest text-amber-400 uppercase">
                DRIFT POWER SLIDE
              </span>
              <span className="text-[10px] font-black font-mono bg-amber-400 text-black px-1.5 py-0.2 rounded font-black">
                {player.driftMultiplier.toFixed(1)}x COMBO
              </span>
            </div>
            <div className="text-3xl font-black font-mono italic text-white tabular-nums">
              +{player.driftScore} <span className="text-xs text-amber-300 font-normal">PTS</span>
            </div>
          </div>
        )}

        {/* Active Aerodynamic Airbrake Badge */}
        {player.activeAeroAngle < -0.35 && (
          <div className="bg-cyan-950/80 border border-cyan-400/80 text-cyan-300 text-[10px] font-mono font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            ACTIVE AIRBRAKE ENGAGED
          </div>
        )}
      </div>

      {/* --- BOTTOM ROW: RADAR + ON-SCREEN CONTROLS + FORZA CIRCULAR SPEEDOMETER --- */}
      <div className="flex items-end justify-between w-full pb-1">
        {/* Bottom-Left: Minimap Radar & On-screen Steering Buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Circuit Radar */}
          <div className="hidden sm:block bg-slate-950/85 border border-slate-700/80 p-3 rounded-2xl shadow-xl w-36 h-36 relative">
            <div className="text-[9px] font-mono uppercase text-slate-400 tracking-wider mb-1">
              CIRCUIT RADAR
            </div>

            <svg className="w-full h-24 overflow-visible" viewBox="-350 -480 750 980">
              <path
                d="M 0 0 C 0 -220 60 -360 160 -450 C 280 -430 370 -310 340 -170 C 240 -80 180 30 210 160 C 280 290 250 420 120 470 C -20 440 -160 340 -250 210 C -280 60 -240 -80 -140 -170 Z"
                fill="none"
                stroke="#2a3547"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 0 0 C 0 -220 60 -360 160 -450 C 280 -430 370 -310 340 -170 C 240 -80 180 30 210 160 C 280 290 250 420 120 470 C -20 440 -160 340 -250 210 C -280 60 -240 -80 -140 -170 Z"
                fill="none"
                stroke="#405069"
                strokeWidth="20"
                strokeDasharray="12 12"
              />

              {/* AI Opponent Blips */}
              {aiCars.map(ai => (
                <circle
                  key={ai.id}
                  cx={ai.position.x}
                  cy={ai.position.z}
                  r="18"
                  fill="#f43f5e"
                />
              ))}

              {/* Player Blip */}
              <circle
                cx={player.position.x}
                cy={player.position.z}
                r="24"
                fill="#00f2ff"
                stroke="#ffffff"
                strokeWidth="6"
              />
            </svg>
          </div>

          {/* On-screen Directional Steering Controls (for clicking or touch!) */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 p-1.5 rounded-xl backdrop-blur shadow-lg">
            <button
              onPointerDown={() => setControl('steerLeft', true)}
              onPointerUp={() => setControl('steerLeft', false)}
              onPointerLeave={() => setControl('steerLeft', false)}
              className="w-12 h-11 bg-slate-900 active:bg-cyan-500 hover:bg-slate-800 text-white active:text-black font-black text-lg rounded-lg border border-slate-700 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Steer Left [A / ◀]"
            >
              ◀
            </button>
            <button
              onPointerDown={() => setControl('steerRight', true)}
              onPointerUp={() => setControl('steerRight', false)}
              onPointerLeave={() => setControl('steerRight', false)}
              className="w-12 h-11 bg-slate-900 active:bg-cyan-500 hover:bg-slate-800 text-white active:text-black font-black text-lg rounded-lg border border-slate-700 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Steer Right [D / ▶]"
            >
              ▶
            </button>
            <button
              onPointerDown={() => setControl('handbrake', true)}
              onPointerUp={() => setControl('handbrake', false)}
              onPointerLeave={() => setControl('handbrake', false)}
              className="px-2.5 h-11 bg-amber-950/80 active:bg-amber-400 hover:bg-amber-900/80 text-amber-300 active:text-black font-mono font-black text-xs rounded-lg border border-amber-600/80 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Drift Handbrake [SPACE]"
            >
              DRIFT
            </button>
          </div>
        </div>

        {/* Bottom-Right: FORZA HORIZON CIRCULAR SPEEDOMETER GAUGE & ON-SCREEN PEDALS */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Gas & Brake On-Screen Buttons */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 p-1.5 rounded-xl backdrop-blur shadow-lg">
            <button
              onPointerDown={() => setControl('throttle', true)}
              onPointerUp={() => setControl('throttle', false)}
              onPointerLeave={() => setControl('throttle', false)}
              className="px-4 h-11 bg-emerald-950/80 active:bg-emerald-400 hover:bg-emerald-900/80 text-emerald-300 active:text-black font-mono font-black text-xs rounded-lg border border-emerald-600/80 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Accelerate / Gas [W / ▲]"
            >
              ▲ GAS
            </button>
            <button
              onPointerDown={() => setControl('brake', true)}
              onPointerUp={() => setControl('brake', false)}
              onPointerLeave={() => setControl('brake', false)}
              className="px-3 h-11 bg-rose-950/80 active:bg-rose-500 hover:bg-rose-900/80 text-rose-300 active:text-white font-mono font-black text-xs rounded-lg border border-rose-600/80 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Brake / Reverse [S / ▼]"
            >
              ▼ BRAKE
            </button>
            <button
              onPointerDown={() => setControl('nitro', true)}
              onPointerUp={() => setControl('nitro', false)}
              onPointerLeave={() => setControl('nitro', false)}
              className="px-3 h-11 bg-cyan-950/80 active:bg-cyan-400 hover:bg-cyan-900/80 text-cyan-300 active:text-black font-mono font-black text-xs rounded-lg border border-cyan-500/80 flex items-center justify-center cursor-pointer transition-colors shadow"
              title="Nitro Thruster [SHIFT]"
            >
              🔥 NITRO
            </button>
          </div>

          {/* Authentic Forza Horizon Circular Speedometer Gauge with Animated Needle */}
          <SpeedometerGauge player={player} />
        </div>
      </div>

      {/* --- COLLAPSIBLE BOTTOM DOCK (ZERO VIEWPORT OCCLUSION) --- */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-mono font-bold px-3 py-1 rounded-t-lg border-t border-x border-slate-700 transition-all cursor-pointer shadow-md"
        >
          {isDockCollapsed ? '▴ SHOW CONTROLS' : '▾ HIDE HUD DOCK'}
        </button>

        {/* Unified Bottom Control Dock */}
        {!isDockCollapsed && (
          <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-2 shadow-2xl flex items-center gap-2 text-xs font-mono max-w-[94vw]">
            {/* Camera View Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
              {(
                [
                  { id: 'chase', label: 'CLOSE' },
                  { id: 'chase_far', label: 'FAR' },
                  { id: 'hood', label: 'HOOD' },
                  { id: 'cinematic', label: 'DRONE' },
                ] as const
              ).map(cam => (
                <button
                  key={cam.id}
                  onClick={() => onCameraChange(cam.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    cameraView === cam.id
                      ? 'bg-cyan-500 text-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-800" />

            {/* Time of Day Switcher */}
            {onTimeOfDayToggle && (
              <button
                onClick={onTimeOfDayToggle}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Switch Time of Day (Day / Sunset / Night)"
              >
                <span>
                  {trackConfig.timeOfDay === 'day'
                    ? '☀️ DAY'
                    : trackConfig.timeOfDay === 'sunset'
                    ? '🌅 SUNSET'
                    : '🌙 NIGHT'}
                </span>
              </button>
            )}

            {/* Audio Mute */}
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Web Audio Mute"
            >
              {isMuted ? 'MUTED' : 'AUDIO ON'}
            </button>

            {/* Pause Button */}
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              PAUSE [ESC]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

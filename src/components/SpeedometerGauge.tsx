import React from 'react';
import { CarPhysics } from '../types/game';

interface SpeedometerGaugeProps {
  player: CarPhysics;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({ player }) => {
  const maxSpeedKmh = 360;
  const speedClamped = Math.min(maxSpeedKmh, Math.max(0, player.speedKmh));
  const speedRatio = speedClamped / maxSpeedKmh;

  // Forza Horizon Style: Needle sweeps from -135deg (0 km/h) to +135deg (360 km/h)
  // At high speed (>280 km/h), add subtle realistic needle jitter vibration
  const jitter = speedClamped > 280 ? (Math.random() - 0.5) * 1.8 : 0;
  const needleAngle = -135 + speedRatio * 270 + jitter;

  // Arc math: Radius 86, center (120, 120), sweep span = 270 deg (75% of circumference)
  const arcRadius = 86;
  const circumference = 2 * Math.PI * arcRadius; // ~540.35
  const maxArcLength = circumference * 0.75; // ~405.26
  const strokeDashoffset = maxArcLength * (1 - speedRatio);

  // Generate 19 tick marks (0 to 360 km/h every 20 km/h)
  const ticks = Array.from({ length: 19 }, (_, i) => {
    const val = i * 20;
    const isMajor = i % 2 === 0; // Major ticks every 40 km/h
    const isRedline = val >= 280;
    const angleDeg = 135 + (val / maxSpeedKmh) * 270;
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const tickLength = isMajor ? 11 : 6;
    const x1 = 120 + arcRadius * cos;
    const y1 = 120 + arcRadius * sin;
    const x2 = 120 + (arcRadius - tickLength) * cos;
    const y2 = 120 + (arcRadius - tickLength) * sin;

    // Numerical label position (major ticks only)
    const labelX = 120 + 64 * cos;
    const labelY = 120 + 64 * sin;

    return {
      val,
      isMajor,
      isRedline,
      x1,
      y1,
      x2,
      y2,
      labelX,
      labelY,
    };
  });

  const rpmPercent = Math.min(100, Math.max(0, player.rpm * 100));
  const nitroPercent = Math.min(100, Math.max(0, (player.nitroRemaining / 6.0) * 100));

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Outer Glow Halo for High Speed / Redline */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-300 pointer-events-none ${
          speedClamped > 280
            ? 'bg-rose-600/35 opacity-100'
            : speedClamped > 160
            ? 'bg-cyan-500/20 opacity-80'
            : 'bg-transparent opacity-0'
        }`}
      />

      {/* Main Gauge Dial Body */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 bg-slate-950/90 rounded-full border-2 border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-1 backdrop-blur-md flex items-center justify-center">
        {/* Subtle Metallic Inner Ring */}
        <div className="absolute inset-2 rounded-full border border-slate-800/80 pointer-events-none" />

        <svg className="w-full h-full overflow-visible" viewBox="0 0 240 240">
          <defs>
            {/* Speed Arc Gradient: Cyan to Amber to Redline */}
            <linearGradient id="speedArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f2ff" />
              <stop offset="55%" stopColor="#38bdf8" />
              <stop offset="78%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Needle Gradient */}
            <linearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff3344" />
              <stop offset="70%" stopColor="#ff6633" />
              <stop offset="100%" stopColor="#ff0022" />
            </linearGradient>

            {/* Metallic Bezel Filter */}
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff2233" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Track Arc (Dark Slate, 270 deg) */}
          <path
            d="M 59.2 180.8 A 86 86 0 1 1 180.8 180.8"
            fill="none"
            stroke="#1c2433"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Redline Zone Track Arc (>280 km/h) */}
          <path
            d="M 166.4 75.8 A 86 86 0 0 1 180.8 180.8"
            fill="none"
            stroke="rgba(239, 68, 68, 0.25)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Active Colored Speed Arc */}
          <path
            d="M 59.2 180.8 A 86 86 0 1 1 180.8 180.8"
            fill="none"
            stroke="url(#speedArcGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${maxArcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-75 ease-out"
          />

          {/* Dial Ticks & Numerical Labels */}
          {ticks.map(t => (
            <g key={t.val}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isRedline ? '#ef4444' : t.isMajor ? '#e2e8f0' : '#64748b'}
                strokeWidth={t.isMajor ? 2.4 : 1.2}
                opacity={t.isRedline ? 1 : t.isMajor ? 0.95 : 0.65}
              />
              {t.isMajor && (
                <text
                  x={t.labelX}
                  y={t.labelY + 3.5}
                  textAnchor="middle"
                  fill={t.isRedline ? '#f87171' : '#cbd5e1'}
                  fontSize="8.5"
                  fontWeight={t.isRedline ? '900' : '700'}
                  fontFamily="monospace"
                  className="select-none"
                >
                  {t.val}
                </text>
              )}
            </g>
          ))}

          {/* Animated Analog Needle (Pivots smoothly from center 120, 120) */}
          <g
            transform={`rotate(${needleAngle}, 120, 120)`}
            className="transition-transform duration-75 ease-out"
          >
            {/* Needle Drop Shadow */}
            <polygon
              points="117,126 123,126 121,34 119,34"
              fill="rgba(0,0,0,0.45)"
              transform="translate(2, 3)"
            />
            {/* Sleek Tapered Needle */}
            <polygon
              points="117.5,124 122.5,124 121,30 119,30"
              fill="url(#needleGrad)"
              filter="url(#needleGlow)"
            />
            {/* Needle Core White Specular Highlight */}
            <line
              x1="120"
              y1="120"
              x2="120"
              y2="34"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.9"
            />
            {/* Counterbalance Tail */}
            <polygon points="117.8,120 122.2,120 121.2,138 118.8,138" fill="#181e28" />
          </g>

          {/* Center Hub / Metal Bezel */}
          <circle cx="120" cy="120" r="28" fill="#0c1017" stroke="#334155" strokeWidth="2.5" />
          <circle cx="120" cy="120" r="23" fill="#141a24" />
          <circle
            cx="120"
            cy="120"
            r="8"
            fill={speedClamped > 280 ? '#ef4444' : '#00f2ff'}
            className="transition-colors duration-200"
          />
        </svg>

        {/* Center Digital Speed & Gear Cluster Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-16">
          {/* Active Gear Badge */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[10px] font-mono font-black px-2 py-0.5 rounded tracking-wider border shadow-sm ${
                player.speedKmh > 0 && player.gear >= 1
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              GEAR {player.gear}
            </span>
          </div>

          {/* High-Impact Digital Speed Number */}
          <div className="flex items-baseline gap-1 leading-none mt-0.5">
            <span className="font-mono text-4xl sm:text-5xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {Math.round(player.speedKmh)}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-black text-slate-400 uppercase tracking-widest">
              KM/H
            </span>
          </div>

          {/* Mini RPM Readout */}
          <div className="mt-1 flex items-center gap-1 text-[9px] font-mono tracking-tight text-slate-400">
            <span>RPM</span>
            <span
              className={`font-bold tabular-nums ${
                rpmPercent > 85 ? 'text-red-400' : 'text-cyan-300'
              }`}
            >
              {Math.round(player.rpm * 8500)}
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Nitro & Airbrake Bar directly docked underneath */}
      <div className="w-56 sm:w-64 mt-2 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-center text-[10px] font-mono mb-1">
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <span>NITRO</span>
            <span className="text-slate-500 font-normal">[SHIFT]</span>
          </span>
          <span className="text-cyan-300 font-mono tabular-nums font-bold">
            {player.nitroRemaining.toFixed(1)}s
          </span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 h-full rounded-full transition-all duration-75"
            style={{ width: `${nitroPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

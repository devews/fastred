import React, { useState, useEffect } from 'react';
import { CarStats, GameMode, TimeOfDay, TrackConfig } from '../types/game';
import { CAR_CATALOG, PAINT_COLORS, ACCENT_COLORS } from '../game/carsData';
import { TRACK_PRESETS } from '../game/trackGenerator';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  onStartRace: (car: CarStats, track: TrackConfig, mode: GameMode) => void;
  selectedCar: CarStats;
  setSelectedCar: (car: CarStats) => void;
  selectedTrack: TrackConfig;
  setSelectedTrack: (track: TrackConfig) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartRace,
  selectedCar,
  setSelectedCar,
  selectedTrack,
  setSelectedTrack,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('grand_prix');
  const [activeTab, setActiveTab] = useState<'garage' | 'track' | 'controls'>('garage');

  // Handle keyboard Enter / Space to start race immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        soundManager.userGesture();
        onStartRace(selectedCar, selectedTrack, selectedMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartRace, selectedCar, selectedTrack, selectedMode]);

  const handleCarSelect = (car: CarStats) => {
    setSelectedCar(car);
  };

  const handleColorChange = (hex: string) => {
    setSelectedCar({
      ...selectedCar,
      color: hex,
    });
  };

  const handleAccentChange = (hex: string) => {
    setSelectedCar({
      ...selectedCar,
      accentColor: hex,
    });
  };

  const handleTimeOfDayChange = (tod: TimeOfDay) => {
    let sky = 0x4aa3f0;
    let fog = 0x82bbee;
    let sun = 2.8;
    let amb = 1.25;

    if (tod === 'sunset') {
      sky = 0x3b1d38;
      fog = 0x5a2d48;
      sun = 2.4;
      amb = 1.05;
    } else if (tod === 'night') {
      sky = 0x090b14;
      fog = 0x0e1322;
      sun = 1.8;
      amb = 0.85;
    }

    setSelectedTrack({
      ...selectedTrack,
      timeOfDay: tod,
      skyColor: sky,
      fogColor: fog,
      sunIntensity: sun,
      ambientIntensity: amb,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-auto flex flex-col justify-between p-6 md:p-10 select-none bg-gradient-to-t from-black/85 via-black/35 to-black/75 text-white overflow-y-auto">
      {/* Top Header / Title Lockup */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10 text-cyan-400 fill-current drop-shadow-[0_0_14px_rgba(0,242,255,0.8)]" viewBox="0 0 24 24">
            <path d="M4 4l16 8-16 8 4-8-4-8z M11 12l9-4.5-9-4.5v9z" />
          </svg>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl md:text-5xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-md">
                APEX VELOCITY
              </span>
              <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm">
                SUPERCAR GT
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
              Supercars &bull; Cyber 4x4 Trucks &bull; MotoGP Bikes &bull; Road Cycles &bull; Downhill Skateboard
            </p>
          </div>
        </div>

        {/* Tab & Lighting Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time of Day Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 text-xs font-bold font-mono">
            <button
              onClick={() => handleTimeOfDayChange('day')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTrack.timeOfDay === 'day'
                  ? 'bg-amber-400 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>☀️ DAY</span>
            </button>
            <button
              onClick={() => handleTimeOfDayChange('sunset')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTrack.timeOfDay === 'sunset'
                  ? 'bg-rose-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌅 SUNSET</span>
            </button>
            <button
              onClick={() => handleTimeOfDayChange('night')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTrack.timeOfDay === 'night'
                  ? 'bg-cyan-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌙 NIGHT</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 text-xs font-bold tracking-wider">
            <button
              onClick={() => setActiveTab('garage')}
              className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'garage' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              VEHICLE GARAGE
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'track' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              CIRCUITS &amp; SKYBRIDGE
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'controls' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              CONTROLS
            </button>
          </div>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="max-w-7xl mx-auto w-full my-auto py-6">
        {activeTab === 'garage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Car Selection */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-black flex items-center justify-between">
                <span>SELECT VEHICLE ({CAR_CATALOG.length} RIDES)</span>
                <span className="text-[10px] text-slate-400 font-mono">CARS &bull; TRUCKS &bull; BIKES &bull; SKATE</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {CAR_CATALOG.map(car => {
                  const isSelected = selectedCar.id === car.id;
                  const typeBadge =
                    car.vehicleType === 'truck' ? '🚚 4x4 TRUCK' :
                    car.vehicleType === 'bike' ? '🏍️ SUPERBIKE' :
                    car.vehicleType === 'cycle' ? '🚴 ROAD BIKE' :
                    car.vehicleType === 'skateboard' ? '🛹 SKATE' : '🏎️ HYPERCAR';
                  return (
                    <button
                      key={car.id}
                      onClick={() => handleCarSelect(car)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_24px_rgba(0,242,255,0.3)] ring-1 ring-cyan-400'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-black text-base text-white italic truncate">{car.name}</div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-mono uppercase bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-bold">
                            {typeBadge}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-slate-700">
                            {car.brand}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{car.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Paint Finish Swatches */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">CUSTOM LIVERY PAINT</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PAINT_COLORS.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => handleColorChange(color.hex)}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedCar.color.toLowerCase() === color.hex.toLowerCase()
                          ? 'border-white scale-125 shadow-lg ring-2 ring-cyan-400'
                          : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-xs uppercase tracking-widest text-slate-300 font-bold pt-2">AERO ACCENT COLOR</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => handleAccentChange(color.hex)}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedCar.accentColor.toLowerCase() === color.hex.toLowerCase()
                          ? 'border-white scale-125 shadow-lg'
                          : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Spec Telemetry */}
            <div className="lg:col-span-7 bg-slate-950/85 border border-slate-800/90 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono text-amber-400 tracking-wider uppercase font-bold">
                    {selectedCar.brand}
                  </div>
                  <h3 className="text-3xl font-black italic text-white">{selectedCar.name}</h3>
                  <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase mt-0.5">
                    {selectedCar.class} &bull; ACTIVE REAR AIRBRAKE
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-black font-mono text-cyan-300 tabular-nums">
                    {selectedCar.topSpeed} <span className="text-sm font-normal text-slate-400">KM/H</span>
                  </div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">RATED TOP SPEED</div>
                </div>
              </div>

              {/* Vehicle Performance Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>ACCELERATION (0-100 KM/H)</span>
                    <span className="text-cyan-400 font-bold">{selectedCar.acceleration.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(selectedCar.acceleration / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>CORNERING &amp; HIGH-G HANDLING</span>
                    <span className="text-emerald-400 font-bold">{selectedCar.handling.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(selectedCar.handling / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>NITRO BOOSTER CAPACITY</span>
                    <span className="text-amber-400 font-bold">{selectedCar.nitroCapacity.toFixed(1)}s TANK</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(selectedCar.nitroCapacity / 8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Game Mode Selector */}
              <div className="pt-2">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">CHAMPIONSHIP FORMAT</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'grand_prix', label: 'GRAND PRIX', desc: '3 Laps vs 5 AI Rivals' },
                    { id: 'time_trial', label: 'TIME TRIAL', desc: 'Ghost Lap Record' },
                    { id: 'free_cruise', label: 'DRIFT ADVENTURE', desc: 'Free Ride & High Drift' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id as GameMode)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedMode === mode.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{mode.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-black flex items-center justify-between">
              <span>CHOOSE CIRCUIT &amp; TIME OF DAY</span>
              <span className="text-[10px] text-amber-400 font-mono">CURRENT: {selectedTrack.timeOfDay.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TRACK_PRESETS.map(track => {
                const isSelected = selectedTrack.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack({ ...track, timeOfDay: selectedTrack.timeOfDay })}
                    className={`text-left p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-80 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_24px_rgba(0,242,255,0.3)] ring-1 ring-cyan-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono tracking-widest uppercase bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-bold">
                          {track.location}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            track.id === 'alpine_skybridge'
                              ? 'bg-amber-950 text-amber-300 border border-amber-600'
                              : 'bg-emerald-950 text-emerald-400'
                          }`}
                        >
                          {track.id === 'alpine_skybridge' ? '⛰️ SKYBRIDGE' : track.difficulty}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-white italic">{track.name}</h4>
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">{track.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-500">LENGTH:</span>{' '}
                        <span className="text-white font-bold">{track.lengthKm} KM</span>
                      </div>
                      <div>
                        <span className="text-slate-500">CLIMB:</span>{' '}
                        <span className="text-amber-400 font-bold">
                          {track.id === 'alpine_skybridge' ? '+26m SKYBRIDGE' : 'ELEVATED'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="max-w-2xl mx-auto bg-slate-950/90 border border-slate-800 p-8 rounded-2xl space-y-6">
            <h3 className="text-xl font-black italic text-white border-b border-slate-800 pb-3">
              DRIVER INPUT &amp; DRIFT GUIDE
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">ACCELERATE / GAS</div>
                <div className="text-slate-200">W or Up Arrow &uarr;</div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">BRAKE / AIRBRAKE</div>
                <div className="text-slate-200">S or Down Arrow &darr; (Spoiler tilts up!)</div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">STEER LEFT &bull; RIGHT</div>
                <div className="text-slate-200">A / D or &larr; / &rarr;</div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">HANDBRAKE &bull; DRIFT</div>
                <div className="text-slate-200">Spacebar (Hold into curves + countersteer)</div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-blue-400 font-bold mb-1">NITRO BOOSTER</div>
                <div className="text-slate-200">Shift Key (Hold for boost impulse)</div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-purple-400 font-bold mb-1">CAMERA VIEW TOGGLE</div>
                <div className="text-slate-200">C Key (Chase Close / Far / Hood / Drone)</div>
              </div>
            </div>
            <div className="text-xs text-slate-300 bg-slate-900/70 p-4 rounded-xl border border-amber-500/30">
              <span className="text-amber-400 font-bold">PRO DRIFT COMBOS:</span> Hold high speed into the turn, tap <kbd className="px-1.5 py-0.5 bg-slate-800 text-white rounded font-mono">Space</kbd> while steering to break rear traction. Counter-steer along the road radius to build your <span className="text-amber-400 font-bold">Drift Multiplier (up to 4.0x)</span>, fill your nitro tank, and billow tire smoke!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Start Action Bar */}
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
          <div>
            CIRCUIT: <span className="text-white font-bold">{selectedTrack.name}</span>
          </div>
          <div>&bull;</div>
          <div>
            TIME: <span className="text-amber-400 font-bold uppercase">{selectedTrack.timeOfDay}</span>
          </div>
          <div>&bull;</div>
          <div>
            CAR: <span className="text-cyan-400 font-bold">{selectedCar.name}</span>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.userGesture();
            onStartRace(selectedCar, selectedTrack, selectedMode);
          }}
          className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black italic text-lg tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>ENTER SUPERCAR RACE</span>
          <span className="text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded text-black">
            ENTER &crarr;
          </span>
        </button>
      </div>
    </div>
  );
};

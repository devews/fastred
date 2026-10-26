import React, { useEffect } from 'react';
import { CarPhysics, TrackConfig } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface PostRaceModalProps {
  player: CarPhysics;
  aiCars: CarPhysics[];
  trackConfig: TrackConfig;
  onRaceAgain: () => void;
  onQuitToMenu: () => void;
}

function formatTime(seconds: number): string {
  if (seconds >= 900 || seconds <= 0) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

export const PostRaceModal: React.FC<PostRaceModalProps> = ({
  player,
  aiCars,
  trackConfig,
  onRaceAgain,
  onQuitToMenu,
}) => {
  useEffect(() => {
    soundManager.playVictoryFanfare();
  }, []);

  const allCars = [player, ...aiCars].sort((a, b) => a.raceRank - b.raceRank);
  const isPodium = player.raceRank <= 3;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4 md:p-8 select-none overflow-y-auto">
      <div className="bg-slate-950 border border-slate-700/90 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl text-white space-y-6">
        {/* Header Ribbon */}
        <div className="text-center space-y-2">
          <div className="inline-block bg-slate-900 border border-slate-700 text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full text-cyan-400">
            {trackConfig.name} &bull; {trackConfig.laps} LAPS COMPLETE
          </div>

          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter">
            {player.raceRank === 1 ? (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow">
                GRAND PRIX CHAMPION!
              </span>
            ) : isPodium ? (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-500">
                PODIUM FINISH: {player.raceRank}RD PLACE
              </span>
            ) : (
              <span className="text-slate-200">
                RACE FINISHED: {player.raceRank}TH PLACE
              </span>
            )}
          </h2>
        </div>

        {/* Player Stats Highlights */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 font-mono text-center">
          <div className="bg-slate-900/90 border border-slate-800 p-3 md:p-4 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">FINAL POSITION</div>
            <div className="text-2xl md:text-3xl font-black text-cyan-400 mt-1 tabular-nums">
              P{player.raceRank}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 md:p-4 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">BEST LAP TIME</div>
            <div className="text-lg md:text-xl font-bold text-amber-400 mt-1 tabular-nums">
              {formatTime(player.bestLapTime)}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 md:p-4 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">DRIFT SCORE</div>
            <div className="text-lg md:text-xl font-bold text-purple-400 mt-1 tabular-nums">
              {player.driftScore} PTS
            </div>
          </div>
        </div>

        {/* Full Grand Prix Standings Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between uppercase">
            <span>CHAMPIONSHIP STANDINGS</span>
            <span>BEST LAP</span>
          </div>
          <div className="divide-y divide-slate-800/80 font-mono text-xs">
            {allCars.map((car, idx) => {
              const isUser = car.isPlayer;
              return (
                <div
                  key={car.id}
                  className={`px-4 py-2.5 flex items-center justify-between ${
                    isUser
                      ? 'bg-cyan-950/60 text-white font-bold border-l-4 border-cyan-400'
                      : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-slate-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: car.color }}
                    />
                    <span>{car.name}</span>
                    {isUser && (
                      <span className="text-[10px] bg-cyan-400 text-black px-1.5 py-0.2 rounded font-black">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="tabular-nums text-slate-400">
                    {formatTime(car.bestLapTime)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={onRaceAgain}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black italic rounded-xl text-base tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            RACE AGAIN
          </button>
          <button
            onClick={onQuitToMenu}
            className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
          >
            RETURN TO GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};

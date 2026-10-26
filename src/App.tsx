/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraView, CarInput, CarPhysics, CarStats, GameMode, GameState, TrackConfig } from './types/game';
import { CAR_CATALOG } from './game/carsData';
import { TRACK_PRESETS } from './game/trackGenerator';
import { RacingGameScene } from './game/racingGameScene';
import { soundManager } from './audio/soundManager';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { PostRaceModal } from './components/PostRaceModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RacingGameScene | null>(null);

  // Game States
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedCar, setSelectedCar] = useState<CarStats>(CAR_CATALOG[0]);
  const [selectedTrack, setSelectedTrack] = useState<TrackConfig>(TRACK_PRESETS[0]);
  const [, setSelectedMode] = useState<GameMode>('grand_prix');
  const [cameraView, setCameraView] = useState<CameraView>('chase');

  // Live Simulation state for HUD
  const [playerState, setPlayerState] = useState<CarPhysics | null>(null);
  const [aiCarsState, setAiCarsState] = useState<CarPhysics[]>([]);
  const [countdown, setCountdown] = useState<number>(-1);

  // Active keyboard inputs
  const inputRef = useRef<CarInput>({
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
  });

  // Initialize Three.js WebGL Scene once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new RacingGameScene(canvasMountRef.current);
    sceneRef.current = scene;

    // Hook simulation state updates to React HUD
    scene.onStateUpdate = state => {
      setPlayerState({ ...state.player });
      setAiCarsState([...state.aiCars]);

      // Check for race victory / finish
      if (state.player.lap > selectedTrack.laps && gameState === 'racing') {
        scene.setRacing(false);
        setGameState('finished');
      }
    };

    // Load initial scene for Title Screen showcase
    scene.setupRace(selectedTrack, selectedCar);
    scene.setCameraView('cinematic');

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update scene when car or track selection changes in title menu
  useEffect(() => {
    if (gameState === 'menu' && sceneRef.current) {
      sceneRef.current.setupRace(selectedTrack, selectedCar);
      sceneRef.current.setCameraView('cinematic');
    }
  }, [selectedCar, selectedTrack, gameState]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on any key
      soundManager.userGesture();

      if (e.key === 'Escape') {
        if (gameState === 'racing') {
          if (sceneRef.current) sceneRef.current.setRacing(false);
          soundManager.stopAll();
          setGameState('paused');
          return;
        } else if (gameState === 'paused') {
          if (sceneRef.current) sceneRef.current.setRacing(true);
          setGameState('racing');
          return;
        }
      }

      if (e.key === 'c' || e.key === 'C') {
        setCameraView(prev => {
          const views: CameraView[] = ['chase', 'chase_far', 'hood', 'cinematic'];
          const nextIdx = (views.indexOf(prev) + 1) % views.length;
          const nextView = views[nextIdx];
          if (sceneRef.current) sceneRef.current.setCameraView(nextView);
          return nextView;
        });
      }

      const inp = inputRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') inp.throttle = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inp.brake = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inp.steerLeft = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inp.steerRight = true;
      if (e.code === 'Space') inp.handbrake = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') inp.nitro = true;

      if (sceneRef.current) {
        sceneRef.current.setInput({ ...inp });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') inp.throttle = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inp.brake = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inp.steerLeft = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inp.steerRight = false;
      if (e.code === 'Space') inp.handbrake = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') inp.nitro = false;

      if (sceneRef.current) {
        sceneRef.current.setInput({ ...inp });
      }
    };

    const handleBlur = () => {
      // Clear held keys on window blur
      inputRef.current = {
        throttle: false,
        brake: false,
        steerLeft: false,
        steerRight: false,
        handbrake: false,
        nitro: false,
      };
      if (sceneRef.current) {
        sceneRef.current.setInput(inputRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Start Race Sequence (Countdown 3, 2, 1, GO!)
  const startRace = useCallback((car: CarStats, track: TrackConfig, mode: GameMode) => {
    setSelectedCar(car);
    setSelectedTrack(track);
    setSelectedMode(mode);

    if (!sceneRef.current) return;

    soundManager.userGesture();
    sceneRef.current.setupRace(track, car);
    sceneRef.current.setCameraView('chase');
    setCameraView('chase');
    sceneRef.current.setRacing(false);
    setGameState('countdown');
    setCountdown(3);

    // Countdown step 3
    soundManager.playCountdownBeep(false);
    sceneRef.current.setCountdownVisual(1);

    setTimeout(() => {
      setCountdown(2);
      soundManager.playCountdownBeep(false);
      sceneRef.current?.setCountdownVisual(2);

      setTimeout(() => {
        setCountdown(1);
        soundManager.playCountdownBeep(false);
        sceneRef.current?.setCountdownVisual(3);

        setTimeout(() => {
          setCountdown(0); // GO!
          soundManager.playCountdownBeep(true);
          sceneRef.current?.setCountdownVisual(4);
          sceneRef.current?.setRacing(true);
          setGameState('racing');

          setTimeout(() => {
            setCountdown(-1);
            sceneRef.current?.setCountdownVisual(0);
          }, 1200);
        }, 1000);
      }, 1000);
    }, 1000);
  }, []);

  const handleResume = () => {
    if (sceneRef.current) sceneRef.current.setRacing(true);
    setGameState('racing');
  };

  const handleRestart = () => {
    startRace(selectedCar, selectedTrack, 'grand_prix');
  };

  const handleQuitToMenu = () => {
    soundManager.stopAll();
    if (sceneRef.current) {
      sceneRef.current.setRacing(false);
      sceneRef.current.setCameraView('cinematic');
      sceneRef.current.setCountdownVisual(0);
    }
    setGameState('menu');
  };

  const handleCameraChange = (view: CameraView) => {
    setCameraView(view);
    if (sceneRef.current) sceneRef.current.setCameraView(view);
  };

  const handleTimeOfDayToggle = () => {
    const nextTod = selectedTrack.timeOfDay === 'day' ? 'sunset' : selectedTrack.timeOfDay === 'sunset' ? 'night' : 'day';
    let sky = 0x4aa3f0;
    let fog = 0x82bbee;
    let sun = 2.8;
    let amb = 1.25;

    if (nextTod === 'sunset') {
      sky = 0x3b1d38;
      fog = 0x5a2d48;
      sun = 2.4;
      amb = 1.05;
    } else if (nextTod === 'night') {
      sky = 0x090b14;
      fog = 0x0e1322;
      sun = 1.8;
      amb = 0.85;
    }

    const updatedTrack: TrackConfig = {
      ...selectedTrack,
      timeOfDay: nextTod,
      skyColor: sky,
      fogColor: fog,
      sunIntensity: sun,
      ambientIntensity: amb,
    };
    setSelectedTrack(updatedTrack);
    if (sceneRef.current) {
      sceneRef.current.setupRace(updatedTrack, selectedCar);
      sceneRef.current.setRacing(gameState === 'racing');
    }
  };

  const handleInputUpdate = useCallback((partial: Partial<CarInput>) => {
    Object.assign(inputRef.current, partial);
    if (sceneRef.current) {
      sceneRef.current.setInput({ ...inputRef.current });
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas Container mounted in isolated ref */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'menu' && (
        <TitleScreen
          onStartRace={startRace}
          selectedCar={selectedCar}
          setSelectedCar={setSelectedCar}
          selectedTrack={selectedTrack}
          setSelectedTrack={setSelectedTrack}
        />
      )}

      {/* In-Game HUD during Countdown and Racing */}
      {(gameState === 'racing' || gameState === 'countdown') && playerState && (
        <GameHUD
          player={playerState}
          aiCars={aiCarsState}
          trackConfig={selectedTrack}
          cameraView={cameraView}
          onCameraChange={handleCameraChange}
          onTimeOfDayToggle={handleTimeOfDayToggle}
          onPause={() => {
            if (sceneRef.current) sceneRef.current.setRacing(false);
            soundManager.stopAll();
            setGameState('paused');
          }}
          countdown={countdown}
          onInputUpdate={handleInputUpdate}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Post-Race Championship Results Modal */}
      {gameState === 'finished' && playerState && (
        <PostRaceModal
          player={playerState}
          aiCars={aiCarsState}
          trackConfig={selectedTrack}
          onRaceAgain={handleRestart}
          onQuitToMenu={handleQuitToMenu}
        />
      )}
    </div>
  );
}

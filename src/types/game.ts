export type GameState = 'menu' | 'countdown' | 'racing' | 'paused' | 'finished';

export type CameraView = 'chase' | 'chase_far' | 'hood' | 'cinematic';

export type GameMode = 'grand_prix' | 'time_trial' | 'free_cruise';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface CarStats {
  id: string;
  name: string;
  brand: string;
  class: string;
  vehicleType?: 'car' | 'truck' | 'bike' | 'cycle' | 'skateboard';
  topSpeed: number; // km/h
  acceleration: number; // 0-100 rating 1-10
  handling: number; // 1-10
  nitroCapacity: number; // seconds of nitro
  color: string;
  accentColor: string;
  description: string;
}

export interface TrackConfig {
  id: string;
  name: string;
  location: string;
  laps: number;
  lengthKm: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skyColor: number;
  fogColor: number;
  groundColor: number;
  curbColorA: number;
  curbColorB: number;
  ambientIntensity: number;
  sunIntensity: number;
  roadWidth: number;
  pointCount: number;
  description: string;
  timeOfDay: TimeOfDay;
}

export interface CarInput {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
  nitro: boolean;
}

export interface CarPhysics {
  id: string;
  isPlayer: boolean;
  name: string;
  brand?: string;
  color: string;
  accentColor: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  speedKmh: number;
  heading: number; // radians around Y
  angularVelocity: number;
  steerAngle: number;
  gear: number;
  rpm: number;
  nitroRemaining: number;
  isDrifting: boolean;
  driftAngle: number;
  driftScore: number;
  driftMultiplier: number;
  wheelRotation: number;
  suspensionPitch: number;
  suspensionRoll: number;
  activeAeroAngle: number; // dynamic wing airbrake
  isAirborne: boolean;
  lap: number;
  trackProgress: number; // 0.0 to 1.0 along spline
  totalDistance: number;
  currentLapTime: number;
  bestLapTime: number;
  raceRank: number;
}

export interface RaceResult {
  rank: number;
  carName: string;
  totalTime: number;
  bestLap: number;
  driftScore: number;
  isPlayer: boolean;
}

import * as THREE from 'three';
import { CarInput, CarPhysics, CarStats, TrackConfig } from '../types/game';
import { ParticleSystem } from './particleSystem';
import { SkidMarkSystem } from './skidMarkSystem';
import { soundManager } from '../audio/soundManager';

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export interface SimulationState {
  player: CarPhysics;
  aiCars: CarPhysics[];
  hitstopRemaining: number;
  cameraShake: number;
}

export class PhysicsEngine {
  private spline: THREE.CatmullRomCurve3;
  private trackConfig: TrackConfig;
  private playerStats: CarStats;
  private particleSystem: ParticleSystem;
  private skidMarkSystem: SkidMarkSystem;

  private player: CarPhysics;
  private aiCars: CarPhysics[] = [];

  private hitstopRemaining = 0;
  private cameraShake = 0;

  // Track progress lookup cache
  private sampledPoints: THREE.Vector3[] = [];
  private sampleCount = 600;

  constructor(
    spline: THREE.CatmullRomCurve3,
    trackConfig: TrackConfig,
    playerStats: CarStats,
    particleSystem: ParticleSystem,
    skidMarkSystem: SkidMarkSystem,
    startPosition: THREE.Vector3,
    startRotation: number
  ) {
    this.spline = spline;
    this.trackConfig = trackConfig;
    this.playerStats = playerStats;
    this.particleSystem = particleSystem;
    this.skidMarkSystem = skidMarkSystem;

    // Cache spline points for fast closest-point projection
    for (let i = 0; i < this.sampleCount; i++) {
      this.sampledPoints.push(this.spline.getPointAt(i / this.sampleCount));
    }

    // Initialize Player
    this.player = {
      id: 'player',
      isPlayer: true,
      name: 'Player 1',
      color: playerStats.color,
      accentColor: playerStats.accentColor,
      position: { x: startPosition.x, y: startPosition.y, z: startPosition.z },
      velocity: { x: 0, y: 0, z: 0 },
      speedKmh: 0,
      heading: startRotation,
      angularVelocity: 0,
      steerAngle: 0,
      gear: 1,
      rpm: 0.1,
      nitroRemaining: playerStats.nitroCapacity,
      isDrifting: false,
      driftAngle: 0,
      driftScore: 0,
      driftMultiplier: 1.0,
      activeAeroAngle: 0,
      isAirborne: false,
      wheelRotation: 0,
      suspensionPitch: 0,
      suspensionRoll: 0,
      lap: 1,
      trackProgress: 0,
      totalDistance: 0,
      currentLapTime: 0,
      bestLapTime: 999.0,
      raceRank: 1,
    };

    // Initialize 5 Distinct AI Rivals
    const aiConfigs = [
      { name: 'Scuderia Red 16', color: '#dc2626', accent: '#fbbf24', speedMod: 0.98, lane: 2.5 },
      { name: 'Stuttgart GT', color: '#0284c7', accent: '#f43f5e', speedMod: 1.02, lane: -2.5 },
      { name: 'Bologna Giallo', color: '#eab308', accent: '#000000', speedMod: 0.96, lane: 4.2 },
      { name: 'Titan Valkyrie', color: '#059669', accent: '#ffffff', speedMod: 0.94, lane: -4.2 },
      { name: 'Shadow Carbon', color: '#18181b', accent: '#00f2ff', speedMod: 1.0, lane: 0.8 },
    ];

    const startTangent = this.spline.getTangentAt(0).normalize();
    const startNormal = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

    aiConfigs.forEach((cfg, idx) => {
      const gridRow = Math.floor((idx + 1) / 2);
      const gridCol = (idx + 1) % 2 === 0 ? 1 : -1;
      const slotPos = new THREE.Vector3()
        .copy(startPosition)
        .addScaledVector(startTangent, -(gridRow + 1) * 8.5)
        .addScaledVector(startNormal, gridCol * 3.8);

      this.aiCars.push({
        id: `ai_${idx}`,
        isPlayer: false,
        name: cfg.name,
        color: cfg.color,
        accentColor: cfg.accent,
        position: { x: slotPos.x, y: slotPos.y, z: slotPos.z },
        velocity: { x: 0, y: 0, z: 0 },
        speedKmh: 0,
        heading: startRotation,
        angularVelocity: 0,
        steerAngle: 0,
        gear: 1,
        rpm: 0.1,
        nitroRemaining: 5.0,
        isDrifting: false,
        driftAngle: 0,
        driftScore: 0,
        driftMultiplier: 1.0,
        activeAeroAngle: 0,
        isAirborne: false,
        wheelRotation: 0,
        suspensionPitch: 0,
        suspensionRoll: 0,
        lap: 1,
        trackProgress: 0,
        totalDistance: -(gridRow + 1) * 8.5,
        currentLapTime: 0,
        bestLapTime: 999.0,
        raceRank: idx + 2,
      });
    });
  }

  public getPlayer(): CarPhysics {
    return this.player;
  }

  public getAiCars(): CarPhysics[] {
    return this.aiCars;
  }

  public getCameraShake(): number {
    return this.cameraShake;
  }

  /**
   * Main simulation tick (rate clamped for 60fps stability)
   */
  public update(dtRaw: number, input: CarInput, isRacing: boolean): SimulationState {
    const dt = Math.min(dtRaw, 0.05);

    // Decay camera shake
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 4.5);
    }

    // Handle brief impact hitstop
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= dt;
      return {
        player: this.player,
        aiCars: this.aiCars,
        hitstopRemaining: this.hitstopRemaining,
        cameraShake: this.cameraShake,
      };
    }

    // Update Player Car Physics (movement, steering, nitro, smoke)
    this.updatePlayerCar(dt, input, isRacing);

    // Update AI Competitor Cars
    this.updateAiCars(dt, isRacing);

    // Handle Collisions: Track Boundary Guardrails & AI Cars
    this.handleCollisions(dt);

    // Update Overall Race Placement & Lap Tracking
    this.updateRaceStandings(dt, isRacing);

    return {
      player: this.player,
      aiCars: this.aiCars,
      hitstopRemaining: this.hitstopRemaining,
      cameraShake: this.cameraShake,
    };
  }

  private updatePlayerCar(dt: number, input: CarInput, isRacing: boolean) {
    const p = this.player;
    if (isRacing) {
      p.currentLapTime += dt;
    }

    // Top speed & acceleration modifiers based on selected car stats
    let maxSpeed = this.playerStats.topSpeed / 3.6; // in m/s (~77 m/s = 280 km/h)
    let accelForce = 18.0 * (this.playerStats.acceleration / 8.0);
    const brakeForce = 34.0;
    const reverseSpeedMax = 14.0;

    // Nitro Thruster System
    const isNitroActive = isRacing && input.nitro && p.nitroRemaining > 0 && (input.throttle || p.speedKmh > 30);
    if (isNitroActive) {
      p.nitroRemaining = Math.max(0, p.nitroRemaining - dt * 1.5);
      accelForce *= 2.2;
      maxSpeed *= 1.22;
      this.cameraShake = Math.max(this.cameraShake, 0.15);

      // Emit nitro flames from dual exhaust
      const pPos = _vec3A.set(p.position.x, p.position.y, p.position.z);
      const fwd = _vec3B.set(Math.sin(p.heading), 0, Math.cos(p.heading));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

      const exL = new THREE.Vector3().copy(pPos).addScaledVector(fwd, -2.1).addScaledVector(right, -0.35);
      const exR = new THREE.Vector3().copy(pPos).addScaledVector(fwd, -2.1).addScaledVector(right, 0.35);
      this.particleSystem.emitNitroFlame(exL, exR, p.heading);
    } else if (p.nitroRemaining < this.playerStats.nitroCapacity) {
      p.nitroRemaining = Math.min(this.playerStats.nitroCapacity, p.nitroRemaining + dt * 0.18);
    }
    soundManager.updateNitro(isNitroActive);

    // Forward speed scalar
    let speed = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.z * p.velocity.z);
    const forwardX = Math.sin(p.heading);
    const forwardZ = Math.cos(p.heading);
    const dotForward = (p.velocity.x * forwardX + p.velocity.z * forwardZ) >= 0 ? 1 : -1;
    let forwardSpeed = speed * dotForward;

    // Throttle & Braking
    const isBrakingHard = isRacing && input.brake && forwardSpeed > 4.5;
    if (isRacing && input.throttle) {
      if (forwardSpeed < 0) {
        forwardSpeed += brakeForce * dt;
      } else {
        const speedRatio = Math.max(0, 1 - forwardSpeed / maxSpeed);
        forwardSpeed += accelForce * Math.pow(speedRatio, 0.6) * dt;
      }
    } else if (isBrakingHard) {
      forwardSpeed -= brakeForce * dt;
      if (forwardSpeed < 0) forwardSpeed = 0;
    } else if (isRacing && input.brake) {
      // Reverse
      forwardSpeed -= accelForce * 0.6 * dt;
      forwardSpeed = Math.max(-reverseSpeedMax, forwardSpeed);
    } else {
      // Natural rolling resistance and aerodynamic drag
      const drag = 0.991;
      forwardSpeed *= Math.pow(drag, dt * 60);
      if (Math.abs(forwardSpeed) < 0.2) forwardSpeed = 0;
    }

    // Steering & Drifting
    const speedFactor = Math.min(1.0, Math.abs(forwardSpeed) / 12.0);
    const highSpeedDamp = 1.0 - Math.min(0.42, (Math.abs(forwardSpeed) / maxSpeed) * 0.55);
    const maxSteer = 0.58 * (this.playerStats.handling / 8.0) * highSpeedDamp;

    let targetSteer = 0;
    if (isRacing && input.steerLeft) targetSteer += maxSteer;
    if (isRacing && input.steerRight) targetSteer -= maxSteer;
    p.steerAngle += (targetSteer - p.steerAngle) * Math.min(1.0, dt * 11);

    // Handbrake / Drift mechanic
    const isDriftKey = isRacing && input.handbrake && Math.abs(forwardSpeed) > 10.0 && Math.abs(p.steerAngle) > 0.06;
    p.isDrifting = isDriftKey;

    // Active aerodynamic airbrake wing angle (tilts up during heavy braking or high-speed DRS)
    const targetAero = isBrakingHard ? -0.58 : (p.speedKmh > 230 ? -0.06 : -0.22);
    p.activeAeroAngle += (targetAero - p.activeAeroAngle) * Math.min(1.0, dt * 12);

    let turnRate = p.steerAngle * (forwardSpeed >= 0 ? speedFactor : -speedFactor) * 1.95;
    if (p.isDrifting) {
      turnRate *= 1.48;
      p.driftAngle += (p.steerAngle * 1.3 - p.driftAngle) * dt * 4.5;
      p.driftMultiplier = Math.min(4.0, 1.0 + Math.floor(p.driftScore / 250) * 0.5);
      const pts = Math.floor(Math.abs(forwardSpeed) * 2.2 * p.driftMultiplier * dt * 10);
      p.driftScore += pts;
      p.nitroRemaining = Math.min(this.playerStats.nitroCapacity, p.nitroRemaining + dt * 0.5);
    } else {
      p.driftAngle *= 0.86;
      p.driftMultiplier = 1.0;
    }

    p.heading += turnRate * dt;

    // Compute velocity vector combining forward push and drift slip
    const moveHeading = p.heading + (p.isDrifting ? p.driftAngle * 0.72 : 0);
    p.velocity.x = Math.sin(moveHeading) * forwardSpeed;
    p.velocity.z = Math.cos(moveHeading) * forwardSpeed;

    // Apply 2D Movement
    p.position.x += p.velocity.x * dt;
    p.position.z += p.velocity.z * dt;

    // --- CRITICAL FIX FOR ELEVATED BRIDGES & ROADS ---
    // Smoothly and reliably track the 3D road surface height and slope at current position
    const closestT = this.getClosestSplineT(_vec3A.set(p.position.x, p.position.y, p.position.z), p.trackProgress);
    p.trackProgress = closestT;

    const roadCenter = this.spline.getPointAt(closestT);
    const roadTangent = this.spline.getTangentAt(closestT).normalize();

    // Road height tracking: car sits flush on top of bridge / road surface
    p.position.y = roadCenter.y + 0.05;

    // Calculate road slope incline angle (pitch) so the car conforms to bridge ramps
    const roadSlopePitch = -Math.atan2(roadTangent.y, Math.hypot(roadTangent.x, roadTangent.z));

    // Update speed in km/h
    p.speedKmh = Math.abs(forwardSpeed) * 3.6;

    // Wheel rotation & steering animation
    const wheelRadius = 0.38;
    p.wheelRotation += (forwardSpeed / wheelRadius) * dt;

    // Suspension dynamics (accel pitch + bridge slope pitch + cornering roll)
    const accelG = isRacing && input.throttle ? 0.08 : (isBrakingHard ? -0.16 : 0);
    const targetPitch = roadSlopePitch + accelG;
    p.suspensionPitch += (targetPitch - p.suspensionPitch) * Math.min(1.0, dt * 10.0);

    const corneringG = -p.steerAngle * (p.speedKmh / 200) * 0.22;
    p.suspensionRoll += (corneringG - p.suspensionRoll) * Math.min(1.0, dt * 8.0);

    // Realistic RPM and Gear Calculation (Gears 1 to 6)
    const gearRatios = [0, 50, 95, 150, 215, 275, 360];
    let currentGear = 1;
    for (let g = 1; g < gearRatios.length; g++) {
      if (p.speedKmh >= gearRatios[g - 1]) {
        currentGear = g;
      }
    }
    p.gear = currentGear;
    const lowerSpeed = gearRatios[currentGear - 1];
    const upperSpeed = gearRatios[currentGear];
    const gearProgress = Math.min(1.0, Math.max(0, (p.speedKmh - lowerSpeed) / (upperSpeed - lowerSpeed + 0.01)));
    p.rpm = 0.2 + gearProgress * 0.8;

    // --- ENHANCED TIRE SMOKE PARTICLE EMISSION ---
    // --- TIRE GEOMETRY & SKID MARK / SMOKE EMISSION ---
    const vType = this.playerStats.vehicleType || 'car';
    const isSingleTrack = vType === 'bike' || vType === 'cycle';
    let wheelBase = 1.35;
    let wheelTrack = 0.94;
    let tireWidth = 0.26;

    if (vType === 'truck') {
      wheelBase = 1.62;
      wheelTrack = 1.18;
      tireWidth = 0.38;
    } else if (vType === 'skateboard') {
      wheelBase = 0.58;
      wheelTrack = 0.26;
      tireWidth = 0.12;
    } else if (isSingleTrack) {
      wheelBase = 1.15;
      wheelTrack = 0.0;
      tireWidth = vType === 'bike' ? 0.20 : 0.08;
    }

    const pPos = _vec3A.set(p.position.x, p.position.y, p.position.z);
    const fwd = _vec3B.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

    const frontL = new THREE.Vector3().copy(pPos).addScaledVector(fwd, wheelBase).addScaledVector(right, -wheelTrack);
    const frontR = new THREE.Vector3().copy(pPos).addScaledVector(fwd, wheelBase).addScaledVector(right, wheelTrack);
    const rearL = new THREE.Vector3().copy(pPos).addScaledVector(fwd, -wheelBase).addScaledVector(right, -wheelTrack);
    const rearR = new THREE.Vector3().copy(pPos).addScaledVector(fwd, -wheelBase).addScaledVector(right, wheelTrack);
    const rearCenter = new THREE.Vector3().copy(pPos).addScaledVector(fwd, -wheelBase);

    // Procedural Skid Mark Decals Trigger Checks
    const driftThreshold = 0.06;
    const hasDriftMark = p.isDrifting || Math.abs(p.driftAngle) > driftThreshold;
    const hasBrakeMark = isBrakingHard && p.speedKmh > 18;
    const hasBurnoutMark = isRacing && input.throttle && input.handbrake && p.speedKmh < 24;

    if (hasDriftMark || hasBrakeMark || hasBurnoutMark) {
      let markAlpha = 0.65;
      if (hasDriftMark) {
        markAlpha = Math.min(0.88, 0.35 + Math.abs(p.driftAngle) * 1.5);
      } else if (hasBrakeMark) {
        markAlpha = Math.min(0.85, 0.3 + (p.speedKmh / 160) * 0.6);
      } else if (hasBurnoutMark) {
        markAlpha = 0.82;
      }

      if (isSingleTrack) {
        this.skidMarkSystem.addSingleSkidMark(rearCenter, p.heading, markAlpha, tireWidth);
      } else {
        this.skidMarkSystem.addSkidMark(rearL, rearR, markAlpha, tireWidth);
        // Under heavy high-speed brake lockup, also leave lighter front wheel marks
        if (hasBrakeMark && p.speedKmh > 65) {
          this.skidMarkSystem.addSkidMark(frontL, frontR, markAlpha * 0.55, tireWidth * 0.8);
        }
      }
    } else {
      // Clear previous tire tracking point so marks don't connect across non-skid gaps
      this.skidMarkSystem.addSkidMark(rearL, rearR, 0, tireWidth);
    }

    if (p.isDrifting) {
      // 1. Drifting Tire Smoke (dense smoke from rear tires + light from front)
      const driftIntensity = Math.min(1.0, Math.abs(p.driftAngle) * 1.5 + (p.speedKmh / 260) * 0.5);
      this.particleSystem.emitDriftSmoke(rearL, rearR, driftIntensity);
      soundManager.updateDrift(true, driftIntensity);
    } else if (isBrakingHard && p.speedKmh > 18) {
      // 2. Heavy Braking Tire Smoke (all wheels smoke on brake lockup)
      const brakeIntensity = Math.min(1.0, (p.speedKmh / 140) * 1.3);
      this.particleSystem.emitBrakingSmoke([frontL, frontR, rearL, rearR], brakeIntensity);
      soundManager.updateDrift(true, brakeIntensity * 0.7);
    } else if (isRacing && input.throttle && p.speedKmh < 24 && input.handbrake) {
      // 3. Burnout launch smoke
      this.particleSystem.emitBurnoutSmoke(rearL, rearR, 0.75);
      soundManager.updateDrift(true, 0.5);
    } else {
      soundManager.updateDrift(false, 0);
    }

    // Audio synthesizer update
    soundManager.updateEngine(p.rpm, p.speedKmh, isRacing && input.throttle);
  }

  private updateAiCars(dt: number, isRacing: boolean) {
    this.aiCars.forEach((ai, idx) => {
      if (isRacing) {
        ai.currentLapTime += dt;
      }

      // Progress along spline
      const aiProgress = (ai.trackProgress + (ai.speedKmh / 3.6 / 3200) * dt) % 1.0;
      ai.trackProgress = aiProgress;

      const trackPt = this.spline.getPointAt(aiProgress);
      const tangent = this.spline.getTangentAt(aiProgress).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // Lane offset
      const laneOffset = ((idx % 3) - 1) * 3.2;
      const targetPos = new THREE.Vector3().copy(trackPt).addScaledVector(normal, laneOffset);

      // AI Target Speed (slow down on sharp corners)
      const lookaheadT = (aiProgress + 0.03) % 1.0;
      const futureTangent = this.spline.getTangentAt(lookaheadT).normalize();
      const turnDot = tangent.dot(futureTangent);

      let targetSpeed = 245 * (0.85 + (idx % 3) * 0.1);
      const isCorneringHard = turnDot < 0.96;
      if (isCorneringHard) {
        targetSpeed *= 0.72;
      }

      const curSpeed = ai.speedKmh;
      if (isRacing) {
        if (curSpeed < targetSpeed) {
          ai.speedKmh = Math.min(targetSpeed, curSpeed + dt * 45);
        } else {
          ai.speedKmh = Math.max(targetSpeed, curSpeed - dt * 65);
        }
      }

      // Smooth AI movement & bridge height following
      const forwardMps = ai.speedKmh / 3.6;
      ai.position.x += (targetPos.x - ai.position.x) * Math.min(1.0, dt * 4.5);
      ai.position.z += (targetPos.z - ai.position.z) * Math.min(1.0, dt * 4.5);
      ai.position.y = trackPt.y + 0.05; // Follow bridge/elevation

      // Align heading with spline tangent
      const targetHeading = Math.atan2(tangent.x, tangent.z);
      let diffHeading = targetHeading - ai.heading;
      while (diffHeading > Math.PI) diffHeading -= Math.PI * 2;
      while (diffHeading < -Math.PI) diffHeading += Math.PI * 2;
      ai.heading += diffHeading * Math.min(1.0, dt * 6.5);

      // AI suspension incline pitch
      const aiSlopePitch = -Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z));
      ai.suspensionPitch = aiSlopePitch;

      // Wheel spin
      ai.wheelRotation += (forwardMps / 0.38) * dt;

      // AI tire smoke when braking hard into a corner
      if (isCorneringHard && ai.speedKmh > 120 && Math.random() < 0.25) {
        const aiPos = new THREE.Vector3(ai.position.x, ai.position.y, ai.position.z);
        const aiFwd = new THREE.Vector3(Math.sin(ai.heading), 0, Math.cos(ai.heading));
        const aiR = new THREE.Vector3(aiFwd.z, 0, -aiFwd.x);
        const aiRearL = new THREE.Vector3().copy(aiPos).addScaledVector(aiFwd, -1.35).addScaledVector(aiR, -0.9);
        const aiRearR = new THREE.Vector3().copy(aiPos).addScaledVector(aiFwd, -1.35).addScaledVector(aiR, 0.9);
        this.particleSystem.emitDriftSmoke(aiRearL, aiRearR, 0.45);
      }
    });
  }

  private handleCollisions(dt: number) {
    const p = this.player;
    const pPos = _vec3A.set(p.position.x, p.position.y, p.position.z);

    // 1. Player <-> Track Boundaries & Bridge Guardrails
    const closestT = this.getClosestSplineT(pPos, p.trackProgress);
    p.trackProgress = closestT;

    const trackCenter = this.spline.getPointAt(closestT);
    const tangent = this.spline.getTangentAt(closestT).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    // Distance vector from centerline
    const offsetVec = new THREE.Vector3().subVectors(pPos, trackCenter);
    const lateralDist = offsetVec.dot(normal);
    const maxAllowedDist = this.trackConfig.roadWidth / 2 + 0.2;

    if (Math.abs(lateralDist) > maxAllowedDist) {
      // Guardrail contact!
      const pushDirection = lateralDist > 0 ? 1 : -1;

      // Clamp position so the vehicle NEVER penetrates or falls through the bridge guardrail
      p.position.x = trackCenter.x + normal.x * pushDirection * (maxAllowedDist - 0.25);
      p.position.z = trackCenter.z + normal.z * pushDirection * (maxAllowedDist - 0.25);
      p.position.y = trackCenter.y + 0.05;

      // Decompose velocity into Tangent (forward along road) and Normal (into the barrier)
      const forwardTangentComp = p.velocity.x * tangent.x + p.velocity.z * tangent.z;
      const lateralNormalComp = p.velocity.x * normal.x + p.velocity.z * normal.z;

      // Preserve forward momentum so car GLIDES along the guardrail instead of getting glued or stopped!
      const slidingForward = forwardTangentComp * 0.91;
      const bounceOff = -Math.abs(lateralNormalComp) * pushDirection * 0.2;

      p.velocity.x = tangent.x * slidingForward + normal.x * bounceOff;
      p.velocity.z = tangent.z * slidingForward + normal.z * bounceOff;
      p.speedKmh = Math.abs(slidingForward) * 3.6;

      // Deflect heading to align with the track tangent so driver slides smoothly
      const trackHeading = Math.atan2(tangent.x, tangent.z);
      let diff = trackHeading - p.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.heading += diff * Math.min(1.0, dt * 9.0);

      // Emit high-speed sparks along guardrail
      const impactPoint = new THREE.Vector3().copy(pPos).addScaledVector(normal, pushDirection * 0.9);
      impactPoint.y = trackCenter.y + 0.4;
      this.particleSystem.emitSparks(impactPoint, 10);
      this.cameraShake = Math.max(this.cameraShake, 0.3);
      soundManager.playCollision(0.45);
    }

    // 2. Player <-> AI Competitor Collisions
    const carRadius = 1.85;
    this.aiCars.forEach(ai => {
      const dx = p.position.x - ai.position.x;
      const dz = p.position.z - ai.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < carRadius * 2) {
        // Elastic impulse
        const overlap = carRadius * 2 - dist;
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);

        p.position.x += nx * overlap * 0.55;
        p.position.z += nz * overlap * 0.55;
        ai.position.x -= nx * overlap * 0.45;
        ai.position.z -= nz * overlap * 0.45;

        // Exchange speed impulses
        p.speedKmh *= 0.88;
        ai.speedKmh *= 0.92;

        const impactPos = new THREE.Vector3(
          (p.position.x + ai.position.x) / 2,
          p.position.y + 0.4,
          (p.position.z + ai.position.z) / 2
        );
        this.particleSystem.emitSparks(impactPos, 14);
        this.cameraShake = Math.max(this.cameraShake, 0.35);
        this.hitstopRemaining = 0.035; // 35ms visceral hitstop
        soundManager.playCollision(0.7);
      }
    });
  }

  private updateRaceStandings(dt: number, isRacing: boolean) {
    const p = this.player;

    if (p.trackProgress > 0.96) {
      (p as unknown as { _nearFinish?: boolean })._nearFinish = true;
    } else if (p.trackProgress < 0.06 && (p as unknown as { _nearFinish?: boolean })._nearFinish) {
      (p as unknown as { _nearFinish?: boolean })._nearFinish = false;
      if (isRacing) {
        if (p.currentLapTime < p.bestLapTime) {
          p.bestLapTime = p.currentLapTime;
        }
        p.lap += 1;
        p.currentLapTime = 0;
        soundManager.playLapChime();
      }
    }

    // Compute continuous total race progress for all cars to determine positions 1 to 6
    const allCars = [p, ...this.aiCars];
    allCars.forEach(car => {
      car.totalDistance = (car.lap - 1) + car.trackProgress;
    });

    allCars.sort((a, b) => b.totalDistance - a.totalDistance);

    allCars.forEach((car, index) => {
      car.raceRank = index + 1;
    });
  }

  /**
   * Localized 3D closest spline lookup centered around current progress.
   * Prevents jumping to underpasses, flyovers, or distant track sections.
   */
  private getClosestSplineT(pos: THREE.Vector3, currentT: number = 0): number {
    const centerIdx = Math.floor(currentT * this.sampleCount);
    const searchRadius = 45; // Search window +/- 45 samples

    let bestDistSq = Infinity;
    let bestIdx = centerIdx;

    for (let offset = -searchRadius; offset <= searchRadius; offset++) {
      let idx = (centerIdx + offset) % this.sampleCount;
      if (idx < 0) idx += this.sampleCount;

      const pt = this.sampledPoints[idx];
      const dx = pos.x - pt.x;
      const dy = (pos.y - pt.y) * 1.5; // Weight vertical distance so elevations match accurately
      const dz = pos.z - pt.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIdx = idx;
      }
    }

    // Fallback to global search if vehicle somehow got displaced
    if (bestDistSq > 900) {
      for (let i = 0; i < this.sampleCount; i++) {
        const pt = this.sampledPoints[i];
        const dx = pos.x - pt.x;
        const dy = (pos.y - pt.y) * 1.5;
        const dz = pos.z - pt.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestIdx = i;
        }
      }
    }

    return bestIdx / this.sampleCount;
  }
}

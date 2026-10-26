import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraView, CarInput, CarPhysics, CarStats, TrackConfig } from '../types/game';
import { createVehicleModel, CarVisualRefs } from './proceduralCar';
import { generateTrack, GeneratedTrack } from './trackGenerator';
import { ParticleSystem } from './particleSystem';
import { SkidMarkSystem } from './skidMarkSystem';
import { PhysicsEngine, SimulationState } from './physicsEngine';

// Pre-allocated scratch math vectors (Zero GC in render loop)
const _camIdealPos = new THREE.Vector3();
const _camIdealLook = new THREE.Vector3();
const _carForward = new THREE.Vector3();
const _shakeOffset = new THREE.Vector3();

export class RacingGameScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private isSoftwareGl: boolean;
  private isDestroyed = false;
  private frameId = 0;
  private lastTime = 0;

  private trackData: GeneratedTrack | null = null;
  private particleSystem: ParticleSystem;
  private skidMarkSystem: SkidMarkSystem;
  private physicsEngine: PhysicsEngine | null = null;

  private playerVisuals: CarVisualRefs | null = null;
  private aiVisuals: Map<string, CarVisualRefs> = new Map();

  private cameraView: CameraView = 'chase';
  private currentInput: CarInput = {
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
  };

  private isRacing = false;
  private countdownStep = -1; // -1: none, 0: 3, 1: 2, 2: 1, 3: GO!

  // Callbacks for React HUD updates
  public onStateUpdate?: (state: SimulationState) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL safely
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, this.container.clientWidth / this.container.clientHeight, 0.2, 2000);
    this.camera.position.set(0, 10, 20);

    // Studio Environment Lighting (RoomEnvironment PMREM)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Particle System
    this.particleSystem = new ParticleSystem();
    this.scene.add(this.particleSystem.getGroup());

    // Procedural Skid Mark Decals System
    this.skidMarkSystem = new SkidMarkSystem();
    this.scene.add(this.skidMarkSystem.getGroup());

    // Window Resize Handling
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.lastTime = performance.now();
    this.startLoop();
  }

  public setupRace(trackConfig: TrackConfig, playerStats: CarStats) {
    // Clean old track & cars
    if (this.trackData) {
      this.scene.remove(this.trackData.group);
      this.trackData = null;
    }
    if (this.playerVisuals) {
      this.scene.remove(this.playerVisuals.root);
      this.playerVisuals = null;
    }
    this.aiVisuals.forEach(vis => {
      this.scene.remove(vis.root);
    });
    this.aiVisuals.clear();

    // Clear lights
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Light) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach(l => this.scene.remove(l));

    // Sky & Fog setup dynamically calibrated for Day, Sunset, and Night
    this.scene.background = new THREE.Color(trackConfig.skyColor);
    const fogDensity = trackConfig.timeOfDay === 'day' ? 0.0011 : 0.0018;
    this.scene.fog = new THREE.FogExp2(trackConfig.fogColor, fogDensity);

    // Sun directional light: bright daytime sun vs golden sunset vs moody night
    const sunColor = trackConfig.timeOfDay === 'day' ? 0xffffff : (trackConfig.timeOfDay === 'sunset' ? 0xffaa66 : 0x7799cc);
    const sunPos = trackConfig.timeOfDay === 'day' ? new THREE.Vector3(50, 180, 40) : new THREE.Vector3(120, 80, 80);
    const sunLight = new THREE.DirectionalLight(sunColor, trackConfig.sunIntensity);
    sunLight.position.copy(sunPos);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 400;
      const d = 45;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    const hemiColor = trackConfig.timeOfDay === 'day' ? 0xbde0fe : 0x7fb8f5;
    const hemiLight = new THREE.HemisphereLight(hemiColor, trackConfig.groundColor, trackConfig.ambientIntensity);
    this.scene.add(hemiLight);

    // Generate Track
    this.trackData = generateTrack(trackConfig);
    this.scene.add(this.trackData.group);

    // Clear old skid marks
    this.skidMarkSystem.clear();

    // Spawn Player Vehicle (Ferrari, Porsche, Lamborghini, Truck, Bike, Cycle, Skateboard)
    this.playerVisuals = createVehicleModel(playerStats.color, playerStats.accentColor, playerStats.id);
    this.scene.add(this.playerVisuals.root);

    // Physics Engine Initialization
    this.physicsEngine = new PhysicsEngine(
      this.trackData.spline,
      trackConfig,
      playerStats,
      this.particleSystem,
      this.skidMarkSystem,
      this.trackData.startPosition,
      this.trackData.startRotation
    );

    // Spawn 5 AI Competitor Vehicles with diverse models
    const aiStyles = ['cyber_truck', 'super_bike', 'porsche_gt3rs', 'lambo_revuelto', 'ferrari_stradale'];
    const aiCars = this.physicsEngine.getAiCars();
    aiCars.forEach((ai, idx) => {
      const aiVis = createVehicleModel(ai.color, ai.accentColor, aiStyles[idx % aiStyles.length]);
      this.scene.add(aiVis.root);
      this.aiVisuals.set(ai.id, aiVis);
    });

    // Reset Lights
    this.setCountdownVisual(0);
  }

  public setInput(input: CarInput) {
    this.currentInput = input;
  }

  public setCameraView(view: CameraView) {
    this.cameraView = view;
  }

  public setCountdownVisual(step: number) {
    this.countdownStep = step;
    if (!this.trackData || !this.trackData.startLights) return;

    const lights = this.trackData.startLights;
    lights.forEach((mesh, idx) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (step === 1 && idx === 0) {
        mat.emissive.setHex(0xff0022);
        mat.emissiveIntensity = 3.0;
      } else if (step === 2 && idx <= 1) {
        mat.emissive.setHex(0xff0022);
        mat.emissiveIntensity = 3.0;
      } else if (step === 3 && idx <= 2) {
        mat.emissive.setHex(0xffaa00);
        mat.emissiveIntensity = 3.0;
      } else if (step === 4) {
        // GO! All lights green
        mat.emissive.setHex(0x00ff44);
        mat.emissiveIntensity = 4.0;
      } else if (step <= 0) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.05;
      }
    });
  }

  public setRacing(racing: boolean) {
    this.isRacing = racing;
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = (now: number) => {
      if (this.isDestroyed) return;

      const rawDt = (now - this.lastTime) * 0.001;
      this.lastTime = now;
      const dt = Math.min(rawDt || 0.016, 0.05);

      this.updateSimulation(dt);
      this.updateCamera(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(() => tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private updateSimulation(dt: number) {
    if (!this.physicsEngine || !this.playerVisuals) return;

    // Run Physics Engine
    const simState = this.physicsEngine.update(dt, this.currentInput, this.isRacing);

    // Update Particles with camera billboard alignment
    this.particleSystem.update(dt, this.camera);

    // Update Procedural Skid Mark Decals decay and fading periodically
    this.skidMarkSystem.update(dt);

    // Update Player Car 3D Transform
    const p = simState.player;
    this.updateCarVisual(this.playerVisuals, p, this.currentInput.brake);

    // Update AI Cars 3D Transforms
    simState.aiCars.forEach(ai => {
      const vis = this.aiVisuals.get(ai.id);
      if (vis) {
        this.updateCarVisual(vis, ai, false);
      }
    });

    // Notify React HUD
    if (this.onStateUpdate) {
      this.onStateUpdate(simState);
    }
  }

  private updateCarVisual(vis: CarVisualRefs, state: CarPhysics, isBraking: boolean) {
    // Position and base heading
    vis.root.position.set(state.position.x, state.position.y, state.position.z);
    vis.root.rotation.y = state.heading + (state.isDrifting ? state.driftAngle * 0.45 : 0);

    // Suspension Body Roll & Pitch (with authentic dynamic motorcycle/cycle leaning and skateboard carving)
    if (vis.vehicleType === 'bike' || vis.vehicleType === 'cycle') {
      vis.bodyMesh.parent!.rotation.z = -state.steerAngle * 0.85 + state.suspensionRoll;
      vis.bodyMesh.parent!.rotation.x = state.suspensionPitch;
      if (vis.riderMesh) {
        vis.riderMesh.rotation.z = -state.steerAngle * 0.45;
      }
    } else if (vis.vehicleType === 'skateboard') {
      vis.bodyMesh.parent!.rotation.z = -state.steerAngle * 0.45;
      vis.bodyMesh.parent!.rotation.x = state.suspensionPitch;
      if (vis.riderMesh) {
        vis.riderMesh.rotation.z = -state.steerAngle * 0.65;
      }
    } else {
      vis.bodyMesh.parent!.rotation.z = state.suspensionRoll;
      vis.bodyMesh.parent!.rotation.x = state.suspensionPitch;
    }

    // Front Wheels Steer Angle (Visibly steer left on left, right on right)
    vis.frontWheelSteerL.rotation.y = -state.steerAngle;
    vis.frontWheelSteerR.rotation.y = -state.steerAngle;

    // 4 Wheels Spinning
    vis.wheelFL.rotation.x = state.wheelRotation;
    vis.wheelFR.rotation.x = state.wheelRotation;
    vis.wheelRL.rotation.x = state.wheelRotation;
    vis.wheelRR.rotation.x = state.wheelRotation;

    // Active Aerodynamic Spoiler Airbrake Animation
    if (vis.activeWing) {
      vis.activeWing.rotation.x = state.activeAeroAngle;
    }

    // Driver Head Turn Animation (looks into apex of the corner)
    if (vis.driverHead) {
      vis.driverHead.rotation.y = -state.steerAngle * 0.75;
    }

    // Interior Steering Wheel Rotation Animation
    if (vis.steeringWheel) {
      vis.steeringWheel.rotation.z = state.steerAngle * 2.4;
    }

    // Brake Lights dynamic glow
    if (vis.tailLightMesh instanceof THREE.Mesh) {
      const tlMat = vis.tailLightMesh.material as THREE.MeshStandardMaterial;
      if (isBraking) {
        tlMat.emissive.setHex(0xff0011);
        tlMat.emissiveIntensity = 4.8;
      } else {
        tlMat.emissive.setHex(0x550000);
        tlMat.emissiveIntensity = 1.2;
      }
    } else if (vis.tailLightMesh instanceof THREE.Group) {
      vis.tailLightMesh.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = isBraking ? 4.8 : 1.2;
        }
      });
    }
  }

  private updateCamera(dt: number) {
    if (!this.physicsEngine || !this.playerVisuals) return;

    const p = this.physicsEngine.getPlayer();
    const pPos = this.playerVisuals.root.position;
    const forwardAngle = p.heading;

    _carForward.set(Math.sin(forwardAngle), 0, Math.cos(forwardAngle));

    // Dynamic FOV widening under high speed / nitro
    const speedRatio = Math.min(1.0, p.speedKmh / 300.0);
    const targetFov = 65 + speedRatio * 15;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 5.0);
    this.camera.updateProjectionMatrix();

    const shake = this.physicsEngine.getCameraShake();
    _shakeOffset.set(
      (Math.random() - 0.5) * shake * 0.8,
      (Math.random() - 0.5) * shake * 0.8,
      (Math.random() - 0.5) * shake * 0.8
    );

    if (this.cameraView === 'chase') {
      // Third Person Chase Close
      _camIdealPos.copy(pPos).addScaledVector(_carForward, -7.2).add(new THREE.Vector3(0, 2.8, 0)).add(_shakeOffset);
      _camIdealLook.copy(pPos).addScaledVector(_carForward, 8.0).add(new THREE.Vector3(0, 1.2, 0));

      // Damped camera smoothing
      this.camera.position.lerp(_camIdealPos, Math.min(1.0, dt * 8.5));
      this.camera.lookAt(_camIdealLook);
    } else if (this.cameraView === 'chase_far') {
      // Third Person Wide Cinematic Chase
      _camIdealPos.copy(pPos).addScaledVector(_carForward, -12.5).add(new THREE.Vector3(0, 5.5, 0)).add(_shakeOffset);
      _camIdealLook.copy(pPos).addScaledVector(_carForward, 6.0).add(new THREE.Vector3(0, 1.2, 0));

      this.camera.position.lerp(_camIdealPos, Math.min(1.0, dt * 6.5));
      this.camera.lookAt(_camIdealLook);
    } else if (this.cameraView === 'hood') {
      // First Person Hood / Bumper View
      _camIdealPos.copy(pPos).addScaledVector(_carForward, 0.4).add(new THREE.Vector3(0, 1.15, 0)).add(_shakeOffset);
      _camIdealLook.copy(pPos).addScaledVector(_carForward, 25.0).add(new THREE.Vector3(0, 1.0, 0));

      this.camera.position.copy(_camIdealPos);
      this.camera.lookAt(_camIdealLook);
    } else {
      // Cinematic Drone Overview
      const t = performance.now() * 0.0006;
      _camIdealPos.copy(pPos).add(new THREE.Vector3(Math.cos(t) * 16, 12, Math.sin(t) * 16));
      _camIdealLook.copy(pPos).add(new THREE.Vector3(0, 1, 0));

      this.camera.position.lerp(_camIdealPos, Math.min(1.0, dt * 3.0));
      this.camera.lookAt(_camIdealLook);
    }
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);

    this.particleSystem.dispose();
    this.skidMarkSystem.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

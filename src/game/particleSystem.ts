import * as THREE from 'three';

// Procedural soft volumetric smoke puff texture
function createSmokePuffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(230, 235, 245, 0.95)');
  gradient.addColorStop(0.35, 'rgba(200, 210, 220, 0.65)');
  gradient.addColorStop(0.7, 'rgba(150, 160, 175, 0.25)');
  gradient.addColorStop(1, 'rgba(120, 130, 145, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const smokeTexture = createSmokePuffTexture();

export class ParticleSystem {
  private group: THREE.Group;

  // Tire Smoke System (Drift, Heavy Braking, Burnout)
  private smokeCount = 240;
  private smokeMesh: THREE.InstancedMesh;
  private smokeData: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    baseScale: number;
    startColor: THREE.Color;
    rotation: number;
    rotSpeed: number;
  }[] = [];
  private smokeIdx = 0;

  // Nitro Flames
  private nitroCount = 70;
  private nitroMesh: THREE.InstancedMesh;
  private nitroData: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; scale: number }[] = [];
  private nitroIdx = 0;

  // Collision Sparks
  private sparkCount = 80;
  private sparkMesh: THREE.InstancedMesh;
  private sparkData: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private sparkIdx = 0;

  private dummy = new THREE.Object3D();
  private scratchColor = new THREE.Color();

  constructor() {
    this.group = new THREE.Group();

    // 1. Soft Volumetric Tire Smoke Setup (Quad billboards or smooth spheres with soft texture)
    const smokeGeo = new THREE.PlaneGeometry(1.0, 1.0);
    const smokeMat = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    this.smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, this.smokeCount);
    this.smokeMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.smokeCount * 3), 3);

    for (let i = 0; i < this.smokeCount; i++) {
      this.smokeData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0,
        baseScale: 0.4,
        startColor: new THREE.Color(0xdde4ec),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0.001, 0.001, 0.001);
      this.dummy.updateMatrix();
      this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
      this.smokeMesh.setColorAt(i, new THREE.Color(0xdde4ec));
    }
    this.smokeMesh.instanceMatrix.needsUpdate = true;
    if (this.smokeMesh.instanceColor) this.smokeMesh.instanceColor.needsUpdate = true;
    this.group.add(this.smokeMesh);

    // 2. Nitro Flames Setup
    const nitroGeo = new THREE.ConeGeometry(0.18, 0.75, 8);
    nitroGeo.rotateX(-Math.PI / 2);
    const nitroMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.nitroMesh = new THREE.InstancedMesh(nitroGeo, nitroMat, this.nitroCount);
    for (let i = 0; i < this.nitroCount; i++) {
      this.nitroData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.3,
        scale: 0.1,
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.nitroMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.nitroMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.nitroMesh);

    // 3. Collision Sparks Setup
    const sparkGeo = new THREE.SphereGeometry(0.09, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      depthWrite: false,
    });
    this.sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, this.sparkCount);
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.45,
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.sparkMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.sparkMesh);
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Generates tire smoke when drifting (rear wheels sliding)
   */
  public emitDriftSmoke(posL: THREE.Vector3, posR: THREE.Vector3, intensity: number) {
    if (intensity < 0.08) return;

    const count = Math.min(3, Math.ceil(intensity * 3));
    for (let c = 0; c < count; c++) {
      this.spawnSmokeParticle(posL, 0.45 * intensity, intensity, true);
      this.spawnSmokeParticle(posR, 0.45 * intensity, intensity, true);
    }
  }

  /**
   * Generates heavy braking tire smoke (from all 4 wheels on brake lockup)
   */
  public emitBrakingSmoke(wheelPositions: THREE.Vector3[], intensity: number) {
    if (intensity < 0.1) return;

    wheelPositions.forEach(wPos => {
      this.spawnSmokeParticle(wPos, 0.35 * intensity, intensity, false);
    });
  }

  /**
   * Generates burnout tire smoke (when spinning tires at launch)
   */
  public emitBurnoutSmoke(posL: THREE.Vector3, posR: THREE.Vector3, intensity: number) {
    this.spawnSmokeParticle(posL, 0.5 * intensity, intensity, true);
    this.spawnSmokeParticle(posR, 0.5 * intensity, intensity, true);
  }

  private spawnSmokeParticle(pos: THREE.Vector3, baseScale: number, intensity: number, isDrift: boolean) {
    const item = this.smokeData[this.smokeIdx % this.smokeCount];
    this.smokeIdx++;

    item.pos.copy(pos);
    item.pos.y = Math.max(item.pos.y, 0.12); // Ground flush

    // Upward plume with horizontal turbulence
    const spread = 0.6;
    item.vel.set(
      (Math.random() - 0.5) * spread,
      0.6 + Math.random() * 0.8 + intensity * 0.4,
      (Math.random() - 0.5) * spread
    );

    item.life = 0.9 + Math.random() * 0.5;
    item.maxLife = item.life;
    item.baseScale = Math.max(0.35, baseScale);
    item.rotation = Math.random() * Math.PI * 2;
    item.rotSpeed = (Math.random() - 0.5) * 1.5;

    // Slight warm tint if heavy friction, otherwise cool grey-white
    if (isDrift && intensity > 0.6) {
      item.startColor.setHex(0xeef2f7);
    } else {
      item.startColor.setHex(0xd6dde6);
    }
  }

  public emitNitroFlame(posL: THREE.Vector3, posR: THREE.Vector3, heading: number) {
    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);

    for (let i = 0; i < 2; i++) {
      const src = i === 0 ? posL : posR;
      const item = this.nitroData[this.nitroIdx % this.nitroCount];
      item.pos.copy(src);
      item.vel.set(
        -forwardX * (5 + Math.random() * 6),
        (Math.random() - 0.5) * 0.5,
        -forwardZ * (5 + Math.random() * 6)
      );
      item.life = 0.28;
      item.maxLife = 0.28;
      item.scale = 0.7 + Math.random() * 0.6;
      this.nitroIdx++;
    }
  }

  public emitSparks(impactPos: THREE.Vector3, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const item = this.sparkData[this.sparkIdx % this.sparkCount];
      item.pos.copy(impactPos);
      item.vel.set((Math.random() - 0.5) * 14, 2 + Math.random() * 9, (Math.random() - 0.5) * 14);
      item.life = 0.38 + Math.random() * 0.16;
      item.maxLife = item.life;
      this.sparkIdx++;
    }
  }

  public update(dt: number, camera?: THREE.Camera) {
    // 1. Update Smoke Particles (Orient towards camera so billboards look 3D and volumetric)
    let smokeNeedsUpdate = false;
    for (let i = 0; i < this.smokeCount; i++) {
      const s = this.smokeData[i];
      if (s.life > 0) {
        s.life -= dt;
        s.pos.addScaledVector(s.vel, dt);
        s.vel.multiplyScalar(0.96); // Air drag slows down puff
        s.rotation += s.rotSpeed * dt;

        const progress = 1 - s.life / s.maxLife; // 0 (birth) -> 1 (dissipated)
        // Volumetric expansion: puff balloons as it rises
        const curScale = s.baseScale * (1.0 + progress * 3.8);

        this.dummy.position.copy(s.pos);
        if (camera) {
          this.dummy.quaternion.copy(camera.quaternion);
        } else {
          this.dummy.rotation.set(0, s.rotation, 0);
        }
        this.dummy.scale.set(curScale, curScale, curScale);
        this.dummy.updateMatrix();
        this.smokeMesh.setMatrixAt(i, this.dummy.matrix);

        // Fade luminance and alpha towards end of life
        const fade = Math.max(0, 1 - progress);
        this.scratchColor.copy(s.startColor).multiplyScalar(fade * 0.95);
        this.smokeMesh.setColorAt(i, this.scratchColor);

        smokeNeedsUpdate = true;
      } else if (s.pos.y > -900) {
        s.pos.set(0, -999, 0);
        this.dummy.position.copy(s.pos);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
        smokeNeedsUpdate = true;
      }
    }
    if (smokeNeedsUpdate) {
      this.smokeMesh.instanceMatrix.needsUpdate = true;
      if (this.smokeMesh.instanceColor) this.smokeMesh.instanceColor.needsUpdate = true;
    }

    // 2. Update Nitro Flames
    let nitroNeedsUpdate = false;
    for (let i = 0; i < this.nitroCount; i++) {
      const n = this.nitroData[i];
      if (n.life > 0) {
        n.life -= dt;
        n.pos.addScaledVector(n.vel, dt);
        const progress = 1 - n.life / n.maxLife;
        const currentScale = n.scale * (1 - progress * 0.8);

        this.dummy.position.copy(n.pos);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.updateMatrix();
        this.nitroMesh.setMatrixAt(i, this.dummy.matrix);
        nitroNeedsUpdate = true;
      } else if (n.pos.y > -900) {
        n.pos.set(0, -999, 0);
        this.dummy.position.copy(n.pos);
        this.dummy.updateMatrix();
        this.nitroMesh.setMatrixAt(i, this.dummy.matrix);
        nitroNeedsUpdate = true;
      }
    }
    if (nitroNeedsUpdate) {
      this.nitroMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Sparks
    let sparksNeedUpdate = false;
    for (let i = 0; i < this.sparkCount; i++) {
      const sp = this.sparkData[i];
      if (sp.life > 0) {
        sp.life -= dt;
        sp.vel.y -= 25 * dt; // Gravity
        sp.pos.addScaledVector(sp.vel, dt);
        if (sp.pos.y < 0.05) {
          sp.pos.y = 0.05;
          sp.vel.y = -sp.vel.y * 0.35; // Bounce
        }

        this.dummy.position.copy(sp.pos);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
        sparksNeedUpdate = true;
      } else if (sp.pos.y > -900) {
        sp.pos.set(0, -999, 0);
        this.dummy.position.copy(sp.pos);
        this.dummy.updateMatrix();
        this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
        sparksNeedUpdate = true;
      }
    }
    if (sparksNeedUpdate) {
      this.sparkMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose() {
    this.smokeMesh.geometry.dispose();
    (this.smokeMesh.material as THREE.Material).dispose();
    this.nitroMesh.geometry.dispose();
    (this.nitroMesh.material as THREE.Material).dispose();
    this.sparkMesh.geometry.dispose();
    (this.sparkMesh.material as THREE.Material).dispose();
  }
}

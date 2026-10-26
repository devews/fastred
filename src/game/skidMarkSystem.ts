import * as THREE from 'three';

interface SkidSegment {
  active: boolean;
  alpha: number;
  decayRate: number;
  vIndex: number; // vertex index in the buffer
}

export class SkidMarkSystem {
  private group: THREE.Group;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private mesh: THREE.Mesh;

  private maxSegments = 900; // 900 quads = 1800 triangles (smooth ring buffer)
  private positions: Float32Array;
  private colors: Float32Array;
  private segments: SkidSegment[];
  private currentSegmentIndex = 0;

  // Track previous tire positions for continuous ribbons
  private prevTirePos: {
    rearL?: THREE.Vector3;
    rearR?: THREE.Vector3;
    frontL?: THREE.Vector3;
    frontR?: THREE.Vector3;
    center?: THREE.Vector3;
  } = {};

  private minDistance = 0.22; // Minimum distance traveled to emit a new skid segment
  private maxSegmentDistance = 3.5; // Discontinuity threshold (e.g. jump or teleport)
  private needsPositionUpdate = false;
  private needsColorUpdate = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SkidMarkSystem';

    // 6 vertices per quad (2 triangles: 0-1-2, 2-1-3)
    const vertexCount = this.maxSegments * 6;
    this.positions = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 4);
    this.segments = [];

    for (let i = 0; i < this.maxSegments; i++) {
      this.segments.push({
        active: false,
        alpha: 0,
        decayRate: 0.075, // Fades completely over ~13 seconds
        vIndex: i * 6,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));

    // Dark rubber tire mark texture look
    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.5,
      polygonOffsetUnits: -1.5,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Records tire contact marks on the track surface.
   * If isSingleTrack is true (e.g. Superbike / Bicycle / Skateboard), emits along the central track.
   * Otherwise emits dual tracks for rear/front left and right tires.
   */
  public addSkidMark(
    leftContact: THREE.Vector3,
    rightContact: THREE.Vector3,
    alphaIntensity: number,
    tireWidth: number = 0.26
  ) {
    if (alphaIntensity <= 0.05) {
      this.prevTirePos.rearL = undefined;
      this.prevTirePos.rearR = undefined;
      return;
    }

    const clampedAlpha = Math.min(0.85, Math.max(0.15, alphaIntensity));

    // Left tire track
    this.emitTireRibbon(
      leftContact,
      'rearL',
      clampedAlpha,
      tireWidth
    );

    // Right tire track
    this.emitTireRibbon(
      rightContact,
      'rearR',
      clampedAlpha,
      tireWidth
    );
  }

  /**
   * Emits single-track skid marks (superbike rear slide, cycle skidding, skateboard slide)
   */
  public addSingleSkidMark(
    centerContact: THREE.Vector3,
    heading: number,
    alphaIntensity: number,
    tireWidth: number = 0.18
  ) {
    if (alphaIntensity <= 0.05) {
      this.prevTirePos.center = undefined;
      return;
    }

    const clampedAlpha = Math.min(0.88, Math.max(0.2, alphaIntensity));
    this.emitTireRibbon(
      centerContact,
      'center',
      clampedAlpha,
      tireWidth
    );
  }

  private emitTireRibbon(
    currentPos: THREE.Vector3,
    tireKey: 'rearL' | 'rearR' | 'frontL' | 'frontR' | 'center',
    alpha: number,
    width: number
  ) {
    const prev = this.prevTirePos[tireKey];

    if (!prev) {
      this.prevTirePos[tireKey] = currentPos.clone();
      return;
    }

    const dist = prev.distanceTo(currentPos);
    if (dist < this.minDistance) {
      return; // Haven't moved enough yet
    }

    if (dist > this.maxSegmentDistance) {
      // Discontinuity (jumped, spun around, reset)
      this.prevTirePos[tireKey] = currentPos.clone();
      return;
    }

    // Direction vector of the tire path
    const dir = new THREE.Vector3().subVectors(currentPos, prev).normalize();
    // Normal to the direction in horizontal plane (perpendicular to track path)
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width * 0.5);

    // Calculate 4 corners of the quad (raised slightly above asphalt by 0.035m to prevent Z-fighting)
    const yOffset = 0.035;
    const p0L = new THREE.Vector3().copy(prev).sub(normal);
    p0L.y += yOffset;
    const p0R = new THREE.Vector3().copy(prev).add(normal);
    p0R.y += yOffset;
    const p1L = new THREE.Vector3().copy(currentPos).sub(normal);
    p1L.y += yOffset;
    const p1R = new THREE.Vector3().copy(currentPos).add(normal);
    p1R.y += yOffset;

    // Write into ring buffer quad
    this.writeQuad(p0L, p0R, p1L, p1R, alpha);

    // Update previous position
    prev.copy(currentPos);
  }

  private writeQuad(
    p0L: THREE.Vector3,
    p0R: THREE.Vector3,
    p1L: THREE.Vector3,
    p1R: THREE.Vector3,
    alpha: number
  ) {
    const seg = this.segments[this.currentSegmentIndex];
    seg.active = true;
    seg.alpha = alpha;
    seg.decayRate = 0.065; // ~15 seconds to fade

    const vBase = seg.vIndex;
    const pBase = vBase * 3;
    const cBase = vBase * 4;

    // Triangle 1: p0L, p0R, p1L
    // Triangle 2: p1L, p0R, p1R
    const quadVerts = [
      p0L, p0R, p1L,
      p1L, p0R, p1R
    ];

    for (let i = 0; i < 6; i++) {
      const v = quadVerts[i];
      const pi = pBase + i * 3;
      this.positions[pi] = v.x;
      this.positions[pi + 1] = v.y;
      this.positions[pi + 2] = v.z;

      // Realistic burnt tire rubber tone: dark slate-charcoal (0.05, 0.05, 0.06)
      const ci = cBase + i * 4;
      this.colors[ci] = 0.05;
      this.colors[ci + 1] = 0.05;
      this.colors[ci + 2] = 0.06;
      this.colors[ci + 3] = alpha;
    }

    this.needsPositionUpdate = true;
    this.needsColorUpdate = true;

    this.currentSegmentIndex = (this.currentSegmentIndex + 1) % this.maxSegments;
  }

  /**
   * Updates fading and decays older skid marks periodically to preserve 60 FPS performance
   */
  public update(dt: number) {
    let anyActive = false;

    for (let i = 0; i < this.maxSegments; i++) {
      const seg = this.segments[i];
      if (!seg.active) continue;

      seg.alpha -= dt * seg.decayRate;
      if (seg.alpha <= 0.01) {
        seg.active = false;
        seg.alpha = 0;

        // Clear alpha in color buffer
        const cBase = seg.vIndex * 4;
        for (let j = 0; j < 6; j++) {
          this.colors[cBase + j * 4 + 3] = 0;
        }
        this.needsColorUpdate = true;
      } else {
        anyActive = true;
        // Update alpha
        const cBase = seg.vIndex * 4;
        for (let j = 0; j < 6; j++) {
          this.colors[cBase + j * 4 + 3] = seg.alpha;
        }
        this.needsColorUpdate = true;
      }
    }

    if (this.needsPositionUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.needsPositionUpdate = false;
    }

    if (this.needsColorUpdate) {
      this.geometry.attributes.color.needsUpdate = true;
      this.needsColorUpdate = false;
    }
  }

  /**
   * Clears all skid marks on race restart
   */
  public clear() {
    this.prevTirePos = {};
    for (let i = 0; i < this.maxSegments; i++) {
      this.segments[i].active = false;
      this.segments[i].alpha = 0;
      const cBase = i * 6 * 4;
      for (let j = 0; j < 6; j++) {
        this.colors[cBase + j * 4 + 3] = 0;
      }
    }
    this.geometry.attributes.color.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

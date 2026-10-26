import * as THREE from 'three';
import { TrackConfig, TimeOfDay } from '../types/game';

export interface GeneratedTrack {
  group: THREE.Group;
  spline: THREE.CatmullRomCurve3;
  checkpoints: THREE.Vector3[];
  startPosition: THREE.Vector3;
  startRotation: number;
  roadWidth: number;
  config: TrackConfig;
  startLights: THREE.Mesh[];
  skybridgeTowers?: THREE.Group;
}

export const TRACK_PRESETS: TrackConfig[] = [
  {
    id: 'alpine_skybridge',
    name: 'Alpine Skybridge & Mountain Pass',
    location: 'Swiss Alpine Valley',
    laps: 3,
    lengthKm: 4.8,
    difficulty: 'Hard',
    skyColor: 0x4aa3f0, // Crisp sunny day sky
    fogColor: 0x82bbee,
    groundColor: 0x1b3820, // Pine forest green
    curbColorA: 0xd40000, // Racing red
    curbColorB: 0xffffff, // Crisp white
    ambientIntensity: 1.25,
    sunIntensity: 2.8,
    roadWidth: 15,
    pointCount: 24,
    description: 'Breathtaking daytime rollercoaster adventure through high Alpine peaks, climbing 25 meters onto a colossal suspension skybridge over the valley.',
    timeOfDay: 'day',
  },
  {
    id: 'sunset_riviera',
    name: 'Sunset Riviera Grand Corniche',
    location: 'Côte d’Azur Coastline',
    laps: 3,
    lengthKm: 4.1,
    difficulty: 'Medium',
    skyColor: 0x3b1d38, // Golden sunset purple-orange
    fogColor: 0x5a2d48,
    groundColor: 0x18241b,
    curbColorA: 0xff4422,
    curbColorB: 0xffffff,
    ambientIntensity: 1.05,
    sunIntensity: 2.4,
    roadWidth: 14,
    pointCount: 22,
    description: 'Challenging seaside cliff pass overlooking a golden twilight ocean, lined with palm groves and sweeping high-speed corners.',
    timeOfDay: 'sunset',
  },
  {
    id: 'neo_metropolis',
    name: 'Neo Metropolis Cyber Ring',
    location: 'Cyber District 07',
    laps: 3,
    lengthKm: 3.4,
    difficulty: 'Medium',
    skyColor: 0x090b14, // Midnight neon
    fogColor: 0x0e1322,
    groundColor: 0x06080d,
    curbColorA: 0x00f2ff, // Neon cyan
    curbColorB: 0xff0055, // Neon magenta
    ambientIntensity: 0.85,
    sunIntensity: 1.8,
    roadWidth: 15,
    pointCount: 20,
    description: 'High-speed night circuit illuminated by holographic banners, towering skyscrapers, and glowing neon barriers.',
    timeOfDay: 'night',
  },
];

// Procedural road asphalt texture
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 0, 512, 512);

  // Grain noise
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(20 + Math.random() * 30);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // White road dashed center line
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(250, 40, 12, 140);
  ctx.fillRect(250, 320, 12, 140);

  // Side yellow edge lines
  ctx.fillStyle = '#e5a820';
  ctx.fillRect(24, 0, 8, 512);
  ctx.fillRect(480, 0, 8, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 140);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural curb texture
function createCurbTexture(colorA: number, colorB: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const hexA = '#' + colorA.toString(16).padStart(6, '0');
  const hexB = '#' + colorB.toString(16).padStart(6, '0');

  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = hexB;
  ctx.fillRect(0, 64, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 220);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates track spline points with roller-coaster style elevation, high mountain climbs, and a 25-meter skybridge
 */
function generateTrackControlPoints(trackId: string): THREE.Vector3[] {
  if (trackId === 'alpine_skybridge') {
    // Spectacular Alpine Adventure: Valley floor -> Rapid uphill climb -> Giant Skybridge at Y=24 -> Mountain hairpin drops
    return [
      new THREE.Vector3(0, 0, 0), // Start/Finish in valley
      new THREE.Vector3(0, 0, -180), // Fast launch straight
      new THREE.Vector3(50, 4, -320), // Climbing foothills
      new THREE.Vector3(120, 11, -440), // Steep uphill ramp
      new THREE.Vector3(220, 19, -520), // Bridge approach summit
      // --- THE GIANT SKYBRIDGE (Y = 24 to 26 meters high above valley) ---
      new THREE.Vector3(340, 24, -480), // Skybridge Entry (Pylon 1)
      new THREE.Vector3(440, 26, -370), // Skybridge Center Span (Crossing high over valley)
      new THREE.Vector3(470, 25, -230), // Skybridge Exit (Pylon 2)
      // --- Downhill Mountain Pass Rollercoaster ---
      new THREE.Vector3(420, 17, -90), // Swooping downhill drop
      new THREE.Vector3(340, 9, 30), // Fast valley sweeping curve
      new THREE.Vector3(380, 5, 170), // Mountain chicane
      new THREE.Vector3(450, 12, 280), // Ridge climb
      new THREE.Vector3(420, 18, 410), // High panoramic crest
      new THREE.Vector3(290, 14, 480), // Downhill S-bend
      new THREE.Vector3(140, 8, 470), // Sweeping left hairpin
      new THREE.Vector3(-10, 3, 420), // Down to valley floor
      new THREE.Vector3(-140, 2, 330), // Valley lake straight
      new THREE.Vector3(-240, 6, 210), // Forest climb
      new THREE.Vector3(-290, 8, 60), // Mountain tunnel curve
      new THREE.Vector3(-260, 4, -80), // High-speed downhill
      new THREE.Vector3(-170, 1, -160), // Return to main straight
      new THREE.Vector3(-70, 0, -80), // Final chicane
    ];
  } else if (trackId === 'sunset_riviera') {
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -180),
      new THREE.Vector3(70, 3, -320),
      new THREE.Vector3(190, 8, -380),
      new THREE.Vector3(320, 14, -330),
      new THREE.Vector3(390, 10, -200),
      new THREE.Vector3(340, 6, -80),
      new THREE.Vector3(260, 4, 30),
      new THREE.Vector3(290, 8, 160),
      new THREE.Vector3(360, 15, 280),
      new THREE.Vector3(300, 12, 410),
      new THREE.Vector3(140, 6, 440),
      new THREE.Vector3(-40, 2, 380),
      new THREE.Vector3(-140, 5, 260),
      new THREE.Vector3(-220, 8, 110),
      new THREE.Vector3(-250, 4, -40),
      new THREE.Vector3(-210, 2, -180),
      new THREE.Vector3(-120, 0, -140),
      new THREE.Vector3(-60, 0, -50),
    ];
  }

  // Default: Neo Metropolis Grand Ring
  return [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -220),
    new THREE.Vector3(60, 2, -360),
    new THREE.Vector3(160, 6, -450),
    new THREE.Vector3(280, 12, -430),
    new THREE.Vector3(370, 8, -310),
    new THREE.Vector3(340, 4, -170),
    new THREE.Vector3(240, 1, -80),
    new THREE.Vector3(180, 0, 30),
    new THREE.Vector3(210, 4, 160),
    new THREE.Vector3(280, 8, 290),
    new THREE.Vector3(250, 6, 420),
    new THREE.Vector3(120, 3, 470),
    new THREE.Vector3(-20, 1, 440),
    new THREE.Vector3(-160, 3, 340),
    new THREE.Vector3(-250, 6, 210),
    new THREE.Vector3(-280, 4, 60),
    new THREE.Vector3(-240, 1, -80),
    new THREE.Vector3(-140, 0, -170),
    new THREE.Vector3(-50, 0, -80),
  ];
}

/**
 * Builds the complete 3D racing track world with support for Day, Sunset, Night and Skybridges
 */
export function generateTrack(trackConfig: TrackConfig): GeneratedTrack {
  const group = new THREE.Group();

  const controlPoints = generateTrackControlPoints(trackConfig.id);
  const spline = new THREE.CatmullRomCurve3(controlPoints, true, 'centripetal');

  const roadWidth = trackConfig.roadWidth;
  const segments = 520;
  const points = spline.getSpacedPoints(segments);

  // Generate Road Ribbon Geometry
  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const leftKerbPositions: number[] = [];
  const rightKerbPositions: number[] = [];
  const kerbIndices: number[] = [];

  const leftRailPositions: number[] = [];
  const rightRailPositions: number[] = [];
  const railIndices: number[] = [];

  const halfWidth = roadWidth / 2;
  const kerbWidth = 1.4;
  const kerbHeight = 0.16;
  const railHeight = 1.15;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = points[i % points.length];
    const tangent = spline.getTangentAt(t % 1.0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Road surface
    const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfWidth);
    const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, halfWidth);

    roadPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
    roadPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

    roadNormals.push(0, 1, 0, 0, 1, 0);
    roadUvs.push(0, t, 1, t);

    // Kerbs (raised rumble strip with banking)
    const leftKerbOuter = new THREE.Vector3().copy(leftPt).addScaledVector(normal, -kerbWidth);
    leftKerbPositions.push(leftPt.x, leftPt.y + 0.08, leftPt.z);
    leftKerbPositions.push(leftKerbOuter.x, leftKerbOuter.y + kerbHeight, leftKerbOuter.z);

    const rightKerbOuter = new THREE.Vector3().copy(rightPt).addScaledVector(normal, kerbWidth);
    rightKerbPositions.push(rightPt.x, rightPt.y + 0.08, rightPt.z);
    rightKerbPositions.push(rightKerbOuter.x, rightKerbOuter.y + kerbHeight, rightKerbOuter.z);

    // Guardrail barriers
    const railOffset = halfWidth + kerbWidth + 0.2;
    const railL_Bot = new THREE.Vector3().copy(pt).addScaledVector(normal, -railOffset);
    const railL_Top = new THREE.Vector3().copy(railL_Bot).add(new THREE.Vector3(0, railHeight, 0));
    leftRailPositions.push(railL_Bot.x, railL_Bot.y, railL_Bot.z);
    leftRailPositions.push(railL_Top.x, railL_Top.y, railL_Top.z);

    const railR_Bot = new THREE.Vector3().copy(pt).addScaledVector(normal, railOffset);
    const railR_Top = new THREE.Vector3().copy(railR_Bot).add(new THREE.Vector3(0, railHeight, 0));
    rightRailPositions.push(railR_Bot.x, railR_Bot.y, railR_Bot.z);
    rightRailPositions.push(railR_Top.x, railR_Top.y, railR_Top.z);

    if (i < segments) {
      const idx = i * 2;
      roadIndices.push(idx, idx + 1, idx + 2);
      roadIndices.push(idx + 1, idx + 3, idx + 2);

      kerbIndices.push(idx, idx + 1, idx + 2);
      kerbIndices.push(idx + 1, idx + 3, idx + 2);

      railIndices.push(idx, idx + 1, idx + 2);
      railIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // Road mesh
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  const asphaltTex = createAsphaltTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.82,
    metalness: 0.12,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Kerb meshes
  const curbTex = createCurbTexture(trackConfig.curbColorA, trackConfig.curbColorB);
  const curbMat = new THREE.MeshStandardMaterial({
    map: curbTex,
    roughness: 0.55,
    metalness: 0.2,
  });

  const leftKerbGeo = new THREE.BufferGeometry();
  leftKerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftKerbPositions, 3));
  leftKerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  leftKerbGeo.computeVertexNormals();
  leftKerbGeo.setIndex(kerbIndices);
  const leftKerbMesh = new THREE.Mesh(leftKerbGeo, curbMat);
  leftKerbMesh.receiveShadow = true;
  group.add(leftKerbMesh);

  const rightKerbGeo = new THREE.BufferGeometry();
  rightKerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightKerbPositions, 3));
  rightKerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  rightKerbGeo.computeVertexNormals();
  rightKerbGeo.setIndex(kerbIndices);
  const rightKerbMesh = new THREE.Mesh(rightKerbGeo, curbMat);
  rightKerbMesh.receiveShadow = true;
  group.add(rightKerbMesh);

  // Guardrail barrier meshes
  const railMat = new THREE.MeshStandardMaterial({
    color: trackConfig.timeOfDay === 'day' ? 0x64748b : 0x242d3d,
    roughness: 0.35,
    metalness: 0.85,
  });

  const leftRailGeo = new THREE.BufferGeometry();
  leftRailGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftRailPositions, 3));
  leftRailGeo.computeVertexNormals();
  leftRailGeo.setIndex(railIndices);
  const leftRailMesh = new THREE.Mesh(leftRailGeo, railMat);
  leftRailMesh.castShadow = true;
  group.add(leftRailMesh);

  const rightRailGeo = new THREE.BufferGeometry();
  rightRailGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightRailPositions, 3));
  rightRailGeo.computeVertexNormals();
  rightRailGeo.setIndex(railIndices);
  const rightRailMesh = new THREE.Mesh(rightRailGeo, railMat);
  rightRailMesh.castShadow = true;
  group.add(rightRailMesh);

  // --- CONCRETE BRIDGE SUPPORT PILLARS FOR ELEVATED ROAD SECTIONS (y > 2.0) ---
  const pillarGeo = new THREE.CylinderGeometry(1.6, 2.0, 1, 14);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: trackConfig.timeOfDay === 'day' ? 0x94a3b8 : 0x242d3d,
    roughness: 0.85,
    metalness: 0.2,
  });

  const elevatedPillars: { pos: THREE.Vector3; height: number }[] = [];
  for (let i = 0; i < segments; i += 6) {
    const pt = points[i];
    if (pt.y > 2.2) {
      elevatedPillars.push({ pos: pt.clone(), height: pt.y });
    }
  }

  if (elevatedPillars.length > 0) {
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, elevatedPillars.length);
    const dummyPillar = new THREE.Object3D();
    elevatedPillars.forEach((p, idx) => {
      dummyPillar.position.set(p.pos.x, p.height / 2, p.pos.z);
      dummyPillar.scale.set(1, p.height, 1);
      dummyPillar.updateMatrix();
      pillarMesh.setMatrixAt(idx, dummyPillar.matrix);
    });
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    pillarMesh.computeBoundingSphere();
    group.add(pillarMesh);
  }

  // --- THE GIANT SUSPENSION SKYBRIDGE ARCHITECTURE (FOR ALPINE SKYBRIDGE) ---
  if (trackConfig.id === 'alpine_skybridge') {
    const skybridgeGroup = new THREE.Group();

    // Twin Suspension Bridge Towers at entry (pylon 1) and exit (pylon 2)
    const towerPoints = [
      new THREE.Vector3(340, 24, -480), // Tower 1
      new THREE.Vector3(470, 25, -230), // Tower 2
    ];

    const towerGeo = new THREE.BoxGeometry(4.5, 48, 4.5);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xd9381e, // Golden Gate / Alpine Red
      roughness: 0.35,
      metalness: 0.8,
    });

    towerPoints.forEach(pos => {
      // Left and Right Tower Columns straddling the road
      const tL = new THREE.Mesh(towerGeo, towerMat);
      tL.position.set(pos.x - 12, pos.y + 12, pos.z);
      tL.castShadow = true;
      skybridgeGroup.add(tL);

      const tR = new THREE.Mesh(towerGeo, towerMat);
      tR.position.set(pos.x + 12, pos.y + 12, pos.z);
      tR.castShadow = true;
      skybridgeGroup.add(tR);

      // Overhead crossbeam arch
      const crossGeo = new THREE.BoxGeometry(26, 3.5, 4.0);
      const crossbeam = new THREE.Mesh(crossGeo, towerMat);
      crossbeam.position.set(pos.x, pos.y + 32, pos.z);
      crossbeam.castShadow = true;
      skybridgeGroup.add(crossbeam);
    });

    // Massive Main Suspension Cables linking the towers
    const cableCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(260, 16, -510),
      new THREE.Vector3(340 - 12, 56, -480),
      new THREE.Vector3(405 - 12, 28, -355), // Sagging center
      new THREE.Vector3(470 - 12, 57, -230),
      new THREE.Vector3(490, 18, -120),
    ]);
    const cableGeoL = new THREE.TubeGeometry(cableCurveL, 32, 0.45, 8, false);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.9, roughness: 0.2 });
    const cableMeshL = new THREE.Mesh(cableGeoL, cableMat);
    skybridgeGroup.add(cableMeshL);

    const cableCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(260, 16, -510),
      new THREE.Vector3(340 + 12, 56, -480),
      new THREE.Vector3(405 + 12, 28, -355),
      new THREE.Vector3(470 + 12, 57, -230),
      new THREE.Vector3(490, 18, -120),
    ]);
    const cableGeoR = new THREE.TubeGeometry(cableCurveR, 32, 0.45, 8, false);
    const cableMeshR = new THREE.Mesh(cableGeoR, cableMat);
    skybridgeGroup.add(cableMeshR);

    group.add(skybridgeGroup);
  }

  // --- EXTENDED NATURAL TERRAIN PLANE ---
  const terrainGeo = new THREE.PlaneGeometry(1800, 1800, 56, 56);
  terrainGeo.rotateX(-Math.PI / 2);
  const posArr = terrainGeo.attributes.position.array as Float32Array;
  for (let k = 0; k < posArr.length; k += 3) {
    const x = posArr[k];
    const z = posArr[k + 2];
    const distFromOrigin = Math.sqrt(x * x + z * z);
    if (distFromOrigin > 320) {
      posArr[k + 1] = Math.sin(x * 0.012) * Math.cos(z * 0.012) * 32 + (trackConfig.id === 'alpine_skybridge' ? Math.cos(x * 0.02) * 24 : 0);
    }
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: trackConfig.groundColor,
    roughness: 0.95,
    metalness: 0.05,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.y = -0.15;
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // --- START / FINISH GANTRY ARCH & WORKING TRAFFIC LIGHTS ---
  const startPt = spline.getPointAt(0);
  const startTangent = spline.getTangentAt(0).normalize();
  const startNormal = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(startPt);
  const gantryAngle = Math.atan2(startTangent.x, startTangent.z);
  gantryGroup.rotation.y = gantryAngle;

  const gantryArchGeo = new THREE.BoxGeometry(roadWidth + 6, 1.2, 2.5);
  const gantryArchMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.3,
    metalness: 0.8,
  });
  const gantryArch = new THREE.Mesh(gantryArchGeo, gantryArchMat);
  gantryArch.position.set(0, 7.5, 0);
  gantryArch.castShadow = true;
  gantryGroup.add(gantryArch);

  const gantryTowerGeo = new THREE.BoxGeometry(1.2, 8.5, 1.8);
  const leftTower = new THREE.Mesh(gantryTowerGeo, gantryArchMat);
  leftTower.position.set(-(roadWidth / 2 + 2.5), 4, 0);
  leftTower.castShadow = true;
  gantryGroup.add(leftTower);

  const rightTower = leftTower.clone();
  rightTower.position.set(roadWidth / 2 + 2.5, 4, 0);
  gantryGroup.add(rightTower);

  // Checkered Start Banner
  const bannerGeo = new THREE.PlaneGeometry(roadWidth + 2, 1.8);
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 64;
  const bCtx = bannerCanvas.getContext('2d')!;
  bCtx.fillStyle = '#111';
  bCtx.fillRect(0, 0, 512, 64);
  bCtx.fillStyle = '#e11d48';
  bCtx.fillRect(0, 0, 16, 64);
  bCtx.fillRect(496, 0, 16, 64);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'bold 28px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText('★ APEX SUPERCAR GRAND PRIX ★', 256, 42);
  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
  const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
  // Banner facing back towards the cars lined up on the grid
  bannerMesh.position.set(0, 7.4, -0.2);
  bannerMesh.rotation.y = 0;
  gantryGroup.add(bannerMesh);

  // 4 Start Lights facing back towards the starting grid
  const startLights: THREE.Mesh[] = [];
  const lightGeo = new THREE.SphereGeometry(0.38, 16, 16);
  for (let li = 0; li < 4; li++) {
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x220000,
      emissive: 0x000000,
      emissiveIntensity: 0.1,
      roughness: 0.2,
    });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.set(-2.4 + li * 1.6, 6.4, -0.3);
    gantryGroup.add(lightMesh);
    startLights.push(lightMesh);
  }

  group.add(gantryGroup);

  // --- CHEERING AUDIENCE GRANDSTANDS & PIT LANE ALONG THE START STRAIGHT (MATCHING USER IMAGE 2) ---
  const grandstandGroup = new THREE.Group();
  grandstandGroup.position.copy(startPt);
  grandstandGroup.rotation.y = gantryAngle;

  const standLength = 150; // Spans entire main straight!
  const standTiers = 7;
  const standDepth = 14;
  const standHeight = 8.5;

  // 1. Right Side: Massive F1 Multi-Tier Grandstand
  const standX = halfWidth + 6.0;

  // Stepped concrete bleachers
  for (let tier = 0; tier < standTiers; tier++) {
    const stepGeo = new THREE.BoxGeometry(1.8, 0.8, standLength);
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const stepMesh = new THREE.Mesh(stepGeo, stepMat);
    stepMesh.position.set(standX + tier * 1.8, tier * 0.8 + 0.4, -standLength / 2 + 10);
    stepMesh.receiveShadow = true;
    grandstandGroup.add(stepMesh);
  }

  // Grandstand Cantilever Stadium Roof
  const roofGeo = new THREE.BoxGeometry(standDepth + 4, 0.6, standLength);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(standX + standDepth / 2, standHeight + 3.2, -standLength / 2 + 10);
  roofMesh.rotation.z = 0.14;
  roofMesh.castShadow = true;
  grandstandGroup.add(roofMesh);

  // Roof Support Pillars
  for (let pz = -standLength + 15; pz <= 15; pz += 25) {
    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, standHeight + 3.0, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 });
    const postMesh = new THREE.Mesh(postGeo, postMat);
    postMesh.position.set(standX + standDepth - 0.5, (standHeight + 3.0) / 2, pz);
    grandstandGroup.add(postMesh);
  }

  // Safety Catch Fence along Track (Vertical Poles + Mesh Screen)
  for (let fz = -standLength + 5; fz <= 15; fz += 8) {
    const fPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8);
    const fPoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const fPole = new THREE.Mesh(fPoleGeo, fPoleMat);
    fPole.position.set(halfWidth + 1.2, 2.1, fz);
    grandstandGroup.add(fPole);
  }

  // Safety Fence Mesh Screen
  const fenceMeshGeo = new THREE.PlaneGeometry(standLength, 3.2);
  const fenceMat = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const fenceMesh = new THREE.Mesh(fenceMeshGeo, fenceMat);
  fenceMesh.position.set(halfWidth + 1.2, 2.1, -standLength / 2 + 10);
  fenceMesh.rotation.y = -Math.PI / 2;
  grandstandGroup.add(fenceMesh);

  // Grand Prix Sponsor Hoardings (Heineken, Aramco, Pirelli, Ferrari Corse)
  const sponsors = [
    { text: '★ HEINEKEN 0.0 ★', bg: '#007a33', fg: '#ffffff' },
    { text: '◆ ARAMCO ◆', bg: '#0085ca', fg: '#ffffff' },
    { text: '★ PIRELLI ★', bg: '#d40000', fg: '#ffee00' },
    { text: '◆ FERRARI CORSE CLIENTE ◆', bg: '#cc0000', fg: '#ffffff' },
    { text: '★ ROLEX ★', bg: '#006039', fg: '#f5c518' },
  ];

  sponsors.forEach((sp, sIdx) => {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 96;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.fillStyle = sp.bg;
    sCtx.fillRect(0, 0, 512, 96);
    sCtx.fillStyle = sp.fg;
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText(sp.text, 256, 62);

    const sTex = new THREE.CanvasTexture(sCanvas);
    sTex.colorSpace = THREE.SRGBColorSpace;
    const sMat = new THREE.MeshBasicMaterial({ map: sTex });

    const boardWidth = standLength / sponsors.length;
    const sBoard = new THREE.Mesh(new THREE.PlaneGeometry(boardWidth - 0.5, 1.4), sMat);
    sBoard.position.set(halfWidth + 1.15, 0.75, -sIdx * boardWidth - boardWidth / 2 + 15);
    sBoard.rotation.y = -Math.PI / 2;
    grandstandGroup.add(sBoard);
  });

  // 2. Left Side: Pit Lane Wall, Pit Garages & Timing Gantries
  const pitWallGeo = new THREE.BoxGeometry(0.8, 1.3, standLength);
  const pitWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const pitWall = new THREE.Mesh(pitWallGeo, pitWallMat);
  pitWall.position.set(-(halfWidth + 2.5), 0.65, -standLength / 2 + 10);
  grandstandGroup.add(pitWall);

  // Pit Garages / Team Paddock
  const pitGarageGeo = new THREE.BoxGeometry(10, 5.5, standLength);
  const pitGarageMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.7 });
  const pitGarage = new THREE.Mesh(pitGarageGeo, pitGarageMat);
  pitGarage.position.set(-(halfWidth + 10.5), 2.75, -standLength / 2 + 10);
  grandstandGroup.add(pitGarage);

  // 3. Dense Instanced Cheering Audience Figures (400+ Spectators)
  const spectatorCount = 380;
  const personGeo = new THREE.CapsuleGeometry(0.25, 0.7, 4, 8);
  const crowdMat = new THREE.MeshStandardMaterial({ roughness: 0.65 });
  const crowdInstanced = new THREE.InstancedMesh(personGeo, crowdMat, spectatorCount);
  crowdInstanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spectatorCount * 3), 3);

  const dummyPerson = new THREE.Object3D();
  const shirtColors = [
    new THREE.Color(0xd40000), // Ferrari Red
    new THREE.Color(0x0284c7), // Racing Blue
    new THREE.Color(0xfacc15), // Modena Yellow
    new THREE.Color(0x22c55e), // Green
    new THREE.Color(0xffffff), // White
    new THREE.Color(0xf97316), // Orange
    new THREE.Color(0x8b5cf6), // Purple
  ];

  for (let si = 0; si < spectatorCount; si++) {
    const tier = si % standTiers;
    const rowProgress = Math.floor(si / standTiers) / Math.floor(spectatorCount / standTiers);
    const rowZ = -rowProgress * (standLength - 10) + 12;

    dummyPerson.position.set(
      standX + tier * 1.8 + 0.4 + (Math.random() - 0.5) * 0.25,
      tier * 0.8 + 0.95,
      rowZ + (Math.random() - 0.5) * 0.35
    );
    dummyPerson.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    dummyPerson.scale.set(0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2);
    dummyPerson.updateMatrix();
    crowdInstanced.setMatrixAt(si, dummyPerson.matrix);
    crowdInstanced.setColorAt(si, shirtColors[si % shirtColors.length]);
  }
  crowdInstanced.computeBoundingSphere();
  if (crowdInstanced.instanceColor) crowdInstanced.instanceColor.needsUpdate = true;
  grandstandGroup.add(crowdInstanced);

  group.add(grandstandGroup);

  // --- SCENERY: ALPINE MOUNTAIN LAKE & AUTUMN TREES (MATCHING USER IMAGE 1) ---
  if (trackConfig.id === 'alpine_skybridge') {
    // 1. Serene Turquoise Alpine Lake in the Valley
    const lakeGeo = new THREE.PlaneGeometry(750, 750, 16, 16);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x16506d, // Beautiful deep turquoise alpine water
      roughness: 0.12,
      metalness: 0.88,
    });
    const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    lakeMesh.position.set(220, -1.8, -120);
    lakeMesh.receiveShadow = true;
    group.add(lakeMesh);

    // 2. Autumn Deciduous Foliage Trees with Vivid Red, Orange & Golden Crowns (Image 1)
    const autumnTreeCount = 130;
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 6.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, autumnTreeCount);

    // Lush Autumn Foliage Canopy (multi-sphere organic crown)
    const foliageGeo = new THREE.DodecahedronGeometry(3.6, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
    const foliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, autumnTreeCount);
    foliageInstanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(autumnTreeCount * 3), 3);

    const autumnColors = [
      new THREE.Color(0xdc2626), // Vivid Scarlet Maple (matching Image 1!)
      new THREE.Color(0xea580c), // Fiery Burnt Orange
      new THREE.Color(0xf59e0b), // Golden Amber
      new THREE.Color(0xb91c1c), // Crimson Oak
      new THREE.Color(0xd97706), // Rich Ochre
      new THREE.Color(0x1e3a24), // Alpine Pine Green for natural contrast
    ];

    const dummyTrunk = new THREE.Object3D();
    const dummyFoliage = new THREE.Object3D();

    for (let ti = 0; ti < autumnTreeCount; ti++) {
      const tNorm = ti / autumnTreeCount;
      const p = spline.getPointAt(tNorm);
      const tang = spline.getTangentAt(tNorm).normalize();
      const norm = new THREE.Vector3().crossVectors(tang, new THREE.Vector3(0, 1, 0)).normalize();
      const side = ti % 2 === 0 ? 1 : -1;
      const distOffset = halfWidth + 6 + (ti % 5) * 4.5;
      const pos = new THREE.Vector3().copy(p).addScaledVector(norm, side * distOffset);

      // Trunk
      dummyTrunk.position.set(pos.x, pos.y + 3.2, pos.z);
      const scaleR = 0.85 + Math.random() * 0.5;
      dummyTrunk.scale.set(scaleR, scaleR, scaleR);
      dummyTrunk.rotation.set((Math.random() - 0.5) * 0.1, Math.random() * Math.PI, (Math.random() - 0.5) * 0.1);
      dummyTrunk.updateMatrix();
      trunkInstanced.setMatrixAt(ti, dummyTrunk.matrix);

      // Foliage Canopy atop trunk
      dummyFoliage.position.set(pos.x, pos.y + 6.8 * scaleR, pos.z);
      dummyFoliage.scale.set(scaleR * 1.1, scaleR * 1.2, scaleR * 1.1);
      dummyFoliage.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
      dummyFoliage.updateMatrix();
      foliageInstanced.setMatrixAt(ti, dummyFoliage.matrix);
      foliageInstanced.setColorAt(ti, autumnColors[ti % autumnColors.length]);
    }

    trunkInstanced.computeBoundingSphere();
    foliageInstanced.computeBoundingSphere();
    if (foliageInstanced.instanceColor) foliageInstanced.instanceColor.needsUpdate = true;

    group.add(trunkInstanced);
    group.add(foliageInstanced);

    // 3. Mountain Rocks & Boulders along road verges (matching Image 1)
    const rockCount = 60;
    const rockGeo = new THREE.DodecahedronGeometry(1.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummyRock = new THREE.Object3D();

    for (let rk = 0; rk < rockCount; rk++) {
      const tNorm = (rk / rockCount + 0.15) % 1.0;
      const p = spline.getPointAt(tNorm);
      const tang = spline.getTangentAt(tNorm).normalize();
      const norm = new THREE.Vector3().crossVectors(tang, new THREE.Vector3(0, 1, 0)).normalize();
      const side = rk % 2 === 0 ? 1 : -1;
      const pos = new THREE.Vector3().copy(p).addScaledVector(norm, side * (halfWidth + 4.5 + (rk % 3) * 2));

      dummyRock.position.set(pos.x, pos.y + 0.6, pos.z);
      dummyRock.scale.set(0.7 + Math.random() * 1.2, 0.5 + Math.random() * 0.9, 0.7 + Math.random() * 1.2);
      dummyRock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummyRock.updateMatrix();
      rockInstanced.setMatrixAt(rk, dummyRock.matrix);
    }
    rockInstanced.computeBoundingSphere();
    group.add(rockInstanced);
  } else if (trackConfig.id === 'sunset_riviera') {
    const palmCount = 75;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 9, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4231, roughness: 0.9 });
    const palmInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);
    const dummy = new THREE.Object3D();
    for (let pi = 0; pi < palmCount; pi++) {
      const tNorm = pi / palmCount;
      const p = spline.getPointAt(tNorm);
      const tang = spline.getTangentAt(tNorm).normalize();
      const norm = new THREE.Vector3().crossVectors(tang, new THREE.Vector3(0, 1, 0)).normalize();
      const side = pi % 2 === 0 ? 1 : -1;
      const pos = new THREE.Vector3().copy(p).addScaledVector(norm, side * (halfWidth + 5 + (pi % 3) * 4));

      dummy.position.set(pos.x, pos.y + 4.5, pos.z);
      dummy.scale.set(1, 0.8 + Math.random() * 0.4, 1);
      dummy.updateMatrix();
      palmInstanced.setMatrixAt(pi, dummy.matrix);
    }
    palmInstanced.computeBoundingSphere();
    group.add(palmInstanced);
  } else {
    const towerCount = 65;
    const towerGeo = new THREE.BoxGeometry(18, 90, 18);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0b101c, roughness: 0.35, metalness: 0.8 });
    const towerInstanced = new THREE.InstancedMesh(towerGeo, towerMat, towerCount);
    const dummy = new THREE.Object3D();
    for (let tIdx = 0; tIdx < towerCount; tIdx++) {
      const angle = (tIdx / towerCount) * Math.PI * 2;
      const radius = 260 + (tIdx % 5) * 55;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const heightScale = 0.6 + Math.random() * 1.5;

      dummy.position.set(tx, (90 * heightScale) / 2 - 5, tz);
      dummy.scale.set(1, heightScale, 1);
      dummy.updateMatrix();
      towerInstanced.setMatrixAt(tIdx, dummy.matrix);
    }
    towerInstanced.computeBoundingSphere();
    group.add(towerInstanced);
  }

  // Pre-calculate 40 evenly spaced checkpoints
  const checkpointCount = 40;
  const checkpoints: THREE.Vector3[] = [];
  for (let c = 0; c < checkpointCount; c++) {
    checkpoints.push(spline.getPointAt(c / checkpointCount));
  }

  // Player starts behind start line, facing FORWARD down the track!
  const startPosition = new THREE.Vector3().copy(startPt)
    .addScaledVector(startTangent, -14.0)
    .addScaledVector(startNormal, -3.2);
  startPosition.y += 0.05;

  // startRotation points directly in direction of startTangent (Forward!)
  const startRotation = Math.atan2(startTangent.x, startTangent.z);

  return {
    group,
    spline,
    checkpoints,
    startPosition,
    startRotation,
    roadWidth,
    config: trackConfig,
    startLights,
  };
}

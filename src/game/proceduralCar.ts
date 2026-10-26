import * as THREE from 'three';

export interface CarVisualRefs {
  root: THREE.Group;
  bodyHub: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Group;
  wheelRR: THREE.Group;
  frontWheelSteerL: THREE.Group;
  frontWheelSteerR: THREE.Group;
  tailLightMesh: THREE.Mesh | THREE.Group;
  exhaustL: THREE.Mesh;
  exhaustR: THREE.Mesh;
  shadowPlane: THREE.Mesh;
  activeWing?: THREE.Group;
  driverHead?: THREE.Mesh | THREE.Group;
  steeringWheel?: THREE.Mesh;
  riderMesh?: THREE.Group;
  vehicleType?: 'car' | 'truck' | 'bike' | 'cycle' | 'skateboard';
}

// Procedural soft radial contact shadow texture
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 25, 128, 128, 122);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const contactShadowTexture = createContactShadowTexture();

/**
 * Builds high-detail 5-spoke star alloy wheel (matching Ferrari / Porsche GT spec)
 */
function createWheelGroup(accentColor: string, isFerrari: boolean = false): { group: THREE.Group; spinGroup: THREE.Group } {
  const group = new THREE.Group();
  const spinGroup = new THREE.Group();
  group.add(spinGroup);

  // Treaded Tire Rubber
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 28);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.9,
    metalness: 0.05,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  spinGroup.add(tireMesh);

  // 5-Spoke Star Alloy Rim (Ferrari Silver Star / Porsche GT Rim)
  const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.33, 18);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xdde2ea, // Bright metallic star alloy
    roughness: 0.18,
    metalness: 0.96,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  spinGroup.add(rimMesh);

  // Center-lock nut with Modena Yellow emblem or accent color
  const centerLockGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10);
  centerLockGeo.rotateZ(Math.PI / 2);
  const centerLockMat = new THREE.MeshStandardMaterial({
    color: isFerrari ? 0xffcc00 : new THREE.Color(accentColor),
    roughness: 0.15,
    metalness: 0.9,
  });
  const centerLockMesh = new THREE.Mesh(centerLockGeo, centerLockMat);
  spinGroup.add(centerLockMesh);

  // Carbon Ceramic brake disc rotor
  const rotorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 18);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x6e7178,
    roughness: 0.35,
    metalness: 0.85,
  });
  const rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
  spinGroup.add(rotorMesh);

  // Brake Caliper (Yellow for Ferrari, Red for Porsche)
  const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.11);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: isFerrari ? 0xffcc00 : 0xd61818,
    roughness: 0.25,
    metalness: 0.5,
  });
  const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
  caliperMesh.position.set(0.12, 0.13, 0);
  group.add(caliperMesh);

  return { group, spinGroup };
}

/**
 * Creates authentic Ferrari, Porsche, or Lamborghini supercar 3D models.
 * COORDINATE SYSTEM: LOCAL +Z IS FRONT (Nose/Headlights/Front Steering Wheels),
 * LOCAL -Z IS REAR (Diffuser/Taillights/Exhaust/Rear Wheels).
 */
export function createSupercarModel(
  bodyColorHex: string,
  accentColorHex: string = '#ffd700',
  carId: string = 'ferrari_stradale'
): CarVisualRefs {
  const root = new THREE.Group();

  const isFerrari = carId.includes('ferrari');
  const isPorsche = carId.includes('porsche');

  // Suspension Body Hub
  const bodyHub = new THREE.Group();
  bodyHub.position.y = 0.38;
  root.add(bodyHub);

  // PBR Materials
  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.12,
    metalness: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 0.9,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.38,
    metalness: 0.45,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a101d,
    roughness: 0.04,
    metalness: 0.2,
    transparent: true,
    opacity: 0.82,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.1,
    metalness: 0.98,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColorHex),
    roughness: 0.2,
    metalness: 0.85,
  });

  const leatherMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.8,
  });

  // --- PART 1: Monocoque Underbody & Aerodynamic Carbon Floor ---
  const underbodyGeo = new THREE.BoxGeometry(1.9, 0.16, 4.35);
  const underbodyMesh = new THREE.Mesh(underbodyGeo, carbonMaterial);
  underbodyMesh.position.set(0, -0.06, 0);
  underbodyMesh.castShadow = true;
  bodyHub.add(underbodyMesh);

  // --- PART 2: Front Aerodynamic Splitter (AT LOCAL +Z) ---
  const splitterShape = new THREE.Shape();
  splitterShape.moveTo(-0.96, 2.15);
  splitterShape.lineTo(0.96, 2.15);
  splitterShape.lineTo(1.02, 2.38);
  splitterShape.lineTo(-1.02, 2.38);
  splitterShape.closePath();

  const splitterExtrude = new THREE.ExtrudeGeometry(splitterShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
  });
  splitterExtrude.rotateX(Math.PI / 2);
  const splitterMesh = new THREE.Mesh(splitterExtrude, carbonMaterial);
  splitterMesh.position.set(0, -0.12, 0);
  splitterMesh.castShadow = true;
  bodyHub.add(splitterMesh);

  let mainHullMesh: THREE.Mesh;
  let tailLightMesh: THREE.Mesh | THREE.Group;
  let activeWingGroup: THREE.Group | undefined;

  if (isFerrari) {
    // ==========================================
    // FERRARI SPIDER / STRADALE (MATCHING USER REFERENCE IMAGE!)
    // Open-top roadster with dual headrest aerodynamic buttress nacelles!
    // ==========================================
    const hullGeo = new THREE.BoxGeometry(1.88, 0.42, 4.3);
    mainHullMesh = new THREE.Mesh(hullGeo, paintMaterial);
    mainHullMesh.position.set(0, 0.15, 0);
    mainHullMesh.castShadow = true;
    mainHullMesh.receiveShadow = true;
    bodyHub.add(mainHullMesh);

    // Sculpted low front nose & hood (sloping down to +Z)
    const hoodGeo = new THREE.BoxGeometry(1.6, 0.22, 1.8);
    const hoodMesh = new THREE.Mesh(hoodGeo, paintMaterial);
    hoodMesh.position.set(0, 0.22, 1.15);
    hoodMesh.rotation.x = 0.11;
    hoodMesh.castShadow = true;
    bodyHub.add(hoodMesh);

    // S-Duct aerodynamic bonnet air extractor scoop
    const sDuctGeo = new THREE.BoxGeometry(0.65, 0.08, 0.9);
    const sDuctMesh = new THREE.Mesh(sDuctGeo, carbonMaterial);
    sDuctMesh.position.set(0, 0.34, 1.05);
    bodyHub.add(sDuctMesh);

    // Ferrari Yellow Prancing Shield Emblems
    const shieldGeo = new THREE.BoxGeometry(0.12, 0.15, 0.02);
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.2, metalness: 0.8 });
    const noseShield = new THREE.Mesh(shieldGeo, shieldMat);
    noseShield.position.set(0, 0.32, 2.12);
    noseShield.rotation.x = -0.22;
    bodyHub.add(noseShield);

    // Fender shields
    const fenderShieldL = new THREE.Mesh(shieldGeo, shieldMat);
    fenderShieldL.position.set(-0.95, 0.4, 0.7);
    fenderShieldL.rotation.y = -Math.PI / 2;
    bodyHub.add(fenderShieldL);
    const fenderShieldR = fenderShieldL.clone();
    fenderShieldR.position.set(0.95, 0.4, 0.7);
    fenderShieldR.rotation.y = Math.PI / 2;
    bodyHub.add(fenderShieldR);

    // Raked Aerodynamic Windshield Frame
    const windshieldGeo = new THREE.BoxGeometry(1.4, 0.42, 0.06);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshieldMesh.position.set(0, 0.62, 0.35);
    windshieldMesh.rotation.x = 0.65;
    windshieldMesh.castShadow = true;
    bodyHub.add(windshieldMesh);

    // Open-Top Cockpit Interior: Dual Bucket Seats
    const seatGeo = new THREE.BoxGeometry(0.48, 0.52, 0.44);
    const seatL = new THREE.Mesh(seatGeo, leatherMaterial);
    seatL.position.set(-0.35, 0.38, -0.15);
    bodyHub.add(seatL);
    const seatR = new THREE.Mesh(seatGeo, leatherMaterial);
    seatR.position.set(0.35, 0.38, -0.15);
    bodyHub.add(seatR);

    // Dual Ferrari Spider Aerodynamic Headrest Fairing Buttresses (iconic speedster styling!)
    const buttressGeo = new THREE.ConeGeometry(0.24, 0.9, 12);
    buttressGeo.rotateX(Math.PI / 2);
    const buttressL = new THREE.Mesh(buttressGeo, paintMaterial);
    buttressL.position.set(-0.35, 0.58, -0.65);
    buttressL.rotation.x = -0.2;
    buttressL.castShadow = true;
    bodyHub.add(buttressL);

    const buttressR = buttressL.clone();
    buttressR.position.set(0.35, 0.58, -0.65);
    bodyHub.add(buttressR);

    // Swept-back LED Headlights (at +Z)
    const fHeadlightGeo = new THREE.BoxGeometry(0.42, 0.09, 0.12);
    const fHeadlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x99ddff,
      emissiveIntensity: 4.5,
      roughness: 0.1,
    });
    const fHeadL = new THREE.Mesh(fHeadlightGeo, fHeadlightMat);
    fHeadL.position.set(-0.64, 0.28, 2.06);
    fHeadL.rotation.y = -0.18;
    bodyHub.add(fHeadL);
    const fHeadR = fHeadL.clone();
    fHeadR.position.set(0.64, 0.28, 2.06);
    fHeadR.rotation.y = 0.18;
    bodyHub.add(fHeadR);

    // Ferrari Signature Quad Round Circular LED Halo Taillights (at -Z)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.32, -2.18);

    const ringGeo = new THREE.TorusGeometry(0.12, 0.035, 12, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0xff0011,
      emissiveIntensity: 3.8,
      roughness: 0.15,
    });

    [-0.68, -0.42, 0.42, 0.68].forEach(xPos => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(xPos, 0, 0);
      tailGroup.add(ring);
    });
    bodyHub.add(tailGroup);
    tailLightMesh = tailGroup;

    // Integrated Active Ducktail Flap Spoiler (at -Z)
    activeWingGroup = new THREE.Group();
    activeWingGroup.position.set(0, 0.52, -1.9);
    const fWingGeo = new THREE.BoxGeometry(1.72, 0.06, 0.32);
    const fWingMesh = new THREE.Mesh(fWingGeo, carbonMaterial);
    activeWingGroup.add(fWingMesh);
    bodyHub.add(activeWingGroup);
  } else if (isPorsche) {
    // ==========================================
    // PORSCHE 911 GT3 RS
    // Rounded teardrop coupe, front at +Z, rear at -Z
    // ==========================================
    const hullGeo = new THREE.BoxGeometry(1.84, 0.44, 4.2);
    mainHullMesh = new THREE.Mesh(hullGeo, paintMaterial);
    mainHullMesh.position.set(0, 0.17, 0);
    mainHullMesh.castShadow = true;
    mainHullMesh.receiveShadow = true;
    bodyHub.add(mainHullMesh);

    // Muscular rear haunches (at -Z)
    const hipGeo = new THREE.BoxGeometry(0.18, 0.38, 1.6);
    const hipL = new THREE.Mesh(hipGeo, paintMaterial);
    hipL.position.set(-0.95, 0.18, -1.15);
    bodyHub.add(hipL);
    const hipR = hipL.clone();
    hipR.position.set(0.95, 0.18, -1.15);
    bodyHub.add(hipR);

    // Front hood sloping down to +Z
    const hoodGeo = new THREE.BoxGeometry(1.5, 0.22, 1.7);
    const hoodMesh = new THREE.Mesh(hoodGeo, paintMaterial);
    hoodMesh.position.set(0, 0.24, 1.15);
    hoodMesh.rotation.x = 0.11;
    hoodMesh.castShadow = true;
    bodyHub.add(hoodMesh);

    // Teardrop Coupe Cabin
    const cabinGeo = new THREE.BoxGeometry(1.26, 0.48, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, 0.58, -0.12);
    cabinMesh.rotation.x = 0.04;
    cabinMesh.castShadow = true;
    bodyHub.add(cabinMesh);

    // Rounded Twin Porsche Teardrop LED Headlights (at +Z)
    const pHeadGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.08, 18);
    pHeadGeo.rotateX(-Math.PI / 2);
    const pHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xddeeff,
      emissiveIntensity: 4.2,
      roughness: 0.1,
    });
    const pHeadL = new THREE.Mesh(pHeadGeo, pHeadMat);
    pHeadL.position.set(-0.62, 0.36, 2.0);
    pHeadL.rotation.x = -0.25;
    bodyHub.add(pHeadL);
    const pHeadR = pHeadL.clone();
    pHeadR.position.set(0.62, 0.36, 2.0);
    bodyHub.add(pHeadR);

    // Full-width continuous LED rear lightbar (at -Z)
    const lightbarGeo = new THREE.BoxGeometry(1.68, 0.05, 0.04);
    const lightbarMat = new THREE.MeshStandardMaterial({
      color: 0x440000,
      emissive: 0xff0022,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
    tailLightMesh = new THREE.Mesh(lightbarGeo, lightbarMat);
    tailLightMesh.position.set(0, 0.38, -2.14);
    bodyHub.add(tailLightMesh);

    // Swan-Neck GT3 RS Active Airbrake Wing (at -Z)
    activeWingGroup = new THREE.Group();
    activeWingGroup.position.set(0, 0.76, -1.75);

    const wingSpan = 1.92;
    const wingGeo = new THREE.BoxGeometry(wingSpan, 0.045, 0.42);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMaterial);
    wingMesh.castShadow = true;
    activeWingGroup.add(wingMesh);

    const endplateGeo = new THREE.BoxGeometry(0.04, 0.26, 0.45);
    const endL = new THREE.Mesh(endplateGeo, accentMaterial);
    endL.position.set(-wingSpan / 2, 0.06, 0);
    activeWingGroup.add(endL);
    const endR = endL.clone();
    endR.position.set(wingSpan / 2, 0.06, 0);
    activeWingGroup.add(endR);

    const strutGeo = new THREE.BoxGeometry(0.04, 0.44, 0.16);
    const strutL = new THREE.Mesh(strutGeo, carbonMaterial);
    strutL.position.set(-0.48, -0.2, 0);
    activeWingGroup.add(strutL);
    const strutR = strutL.clone();
    strutR.position.set(0.48, -0.2, 0);
    activeWingGroup.add(strutR);

    bodyHub.add(activeWingGroup);
  } else {
    // ==========================================
    // LAMBORGHINI STEALTH FIGHTER
    // Front at +Z, rear at -Z
    // ==========================================
    const hullGeo = new THREE.BoxGeometry(1.92, 0.38, 4.4);
    mainHullMesh = new THREE.Mesh(hullGeo, paintMaterial);
    mainHullMesh.position.set(0, 0.14, 0);
    mainHullMesh.castShadow = true;
    mainHullMesh.receiveShadow = true;
    bodyHub.add(mainHullMesh);

    const cabinGeo = new THREE.BoxGeometry(1.24, 0.44, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, 0.52, -0.05);
    cabinMesh.castShadow = true;
    bodyHub.add(cabinMesh);

    // Y-shaped Headlights at +Z
    const yLightGeo = new THREE.BoxGeometry(0.38, 0.08, 0.08);
    const yLightMat = new THREE.MeshStandardMaterial({
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      emissiveIntensity: 4.5,
    });
    const yLightL = new THREE.Mesh(yLightGeo, yLightMat);
    yLightL.position.set(-0.66, 0.22, 2.12);
    yLightL.rotation.z = -0.25;
    bodyHub.add(yLightL);
    const yLightR = yLightL.clone();
    yLightR.position.set(0.66, 0.22, 2.12);
    yLightR.rotation.z = 0.25;
    bodyHub.add(yLightR);

    // Rear Taillights at -Z
    const lamboTailGeo = new THREE.BoxGeometry(1.7, 0.06, 0.05);
    const lamboTailMat = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0xff0033,
      emissiveIntensity: 3.5,
    });
    tailLightMesh = new THREE.Mesh(lamboTailGeo, lamboTailMat);
    tailLightMesh.position.set(0, 0.32, -2.22);
    bodyHub.add(tailLightMesh);

    // High Downforce Rear Wing at -Z
    activeWingGroup = new THREE.Group();
    activeWingGroup.position.set(0, 0.68, -1.82);
    const lWingGeo = new THREE.BoxGeometry(1.88, 0.05, 0.38);
    const lWingMesh = new THREE.Mesh(lWingGeo, carbonMaterial);
    activeWingGroup.add(lWingMesh);
    const lStrut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.15), carbonMaterial);
    lStrut.position.set(-0.5, -0.18, 0);
    activeWingGroup.add(lStrut);
    const rStrut = lStrut.clone();
    rStrut.position.set(0.5, -0.18, 0);
    activeWingGroup.add(rStrut);
    bodyHub.add(activeWingGroup);
  }

  // --- PART 3: Animated Driver Helmet inside Cockpit ---
  const driverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 14),
    new THREE.MeshStandardMaterial({
      color: 0xffdd00, // Racing yellow helmet
      roughness: 0.2,
      metalness: 0.5,
    })
  );
  driverHead.position.set(-0.25, 0.52, -0.05);
  bodyHub.add(driverHead);

  // Animated Steering Wheel (facing driver)
  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.02, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.6 })
  );
  steeringWheel.position.set(-0.25, 0.44, 0.22);
  steeringWheel.rotation.x = -0.55;
  bodyHub.add(steeringWheel);

  // --- PART 4: Dual Chrome/Titanium Exhaust Nozzles (AT REAR LOCAL -Z) ---
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.26, 16);
  exhaustGeo.rotateX(-Math.PI / 2);

  const exhaustX = isPorsche ? 0.18 : 0.42;
  const exhaustL = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustL.position.set(-exhaustX, isPorsche ? 0.16 : 0.04, -2.18);
  bodyHub.add(exhaustL);

  const exhaustR = exhaustL.clone();
  exhaustR.position.set(exhaustX, isPorsche ? 0.16 : 0.04, -2.18);
  bodyHub.add(exhaustR);

  // --- PART 5: 4 High-Spec Alloy Wheels ---
  const wheelTrack = 0.94;
  const wheelBase = 1.35;

  // FRONT WHEELS: LOCATED AT +wheelBase (+Z)! FRONT STEERS LEFT & RIGHT!
  const frontWheelSteerL = new THREE.Group();
  frontWheelSteerL.position.set(-wheelTrack, 0, wheelBase);
  const wFL = createWheelGroup(accentColorHex, isFerrari);
  frontWheelSteerL.add(wFL.group);
  bodyHub.add(frontWheelSteerL);

  const frontWheelSteerR = new THREE.Group();
  frontWheelSteerR.position.set(wheelTrack, 0, wheelBase);
  const wFR = createWheelGroup(accentColorHex, isFerrari);
  wFR.group.rotation.y = Math.PI;
  frontWheelSteerR.add(wFR.group);
  bodyHub.add(frontWheelSteerR);

  // REAR WHEELS: LOCATED AT -wheelBase (-Z)! REAR DRIVES & SLIDES!
  const wheelRLGroup = new THREE.Group();
  wheelRLGroup.position.set(-wheelTrack, 0, -wheelBase);
  const wRL = createWheelGroup(accentColorHex, isFerrari);
  wheelRLGroup.add(wRL.group);
  bodyHub.add(wheelRLGroup);

  const wheelRRGroup = new THREE.Group();
  wheelRRGroup.position.set(wheelTrack, 0, -wheelBase);
  const wRR = createWheelGroup(accentColorHex, isFerrari);
  wRR.group.rotation.y = Math.PI;
  wheelRRGroup.add(wRR.group);
  bodyHub.add(wheelRRGroup);

  // --- PART 6: Ground Contact Shadow Plane ---
  const shadowGeo = new THREE.PlaneGeometry(2.5, 4.9);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  root.add(shadowPlane);

  return {
    root,
    bodyHub,
    bodyMesh: mainHullMesh,
    wheelFL: wFL.spinGroup,
    wheelFR: wFR.spinGroup,
    wheelRL: wRL.spinGroup,
    wheelRR: wRR.spinGroup,
    frontWheelSteerL,
    frontWheelSteerR,
    tailLightMesh,
    exhaustL,
    exhaustR,
    shadowPlane,
    activeWing: activeWingGroup,
    driverHead,
    steeringWheel,
    vehicleType: 'car',
  };
}

/**
 * Procedural Wheel for Offroad Truck (Heavy Deep-Tread Tire with 6-Lug Beadlock Rim)
 */
function createOffroadWheel(accentColorHex: string): { group: THREE.Group; spinGroup: THREE.Group } {
  const group = new THREE.Group();
  const spinGroup = new THREE.Group();
  group.add(spinGroup);

  // Chunky knobby offroad tire
  const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.38, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.95,
    metalness: 0.05,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  spinGroup.add(tireMesh);

  // Outer knobby tread blocks (ring of boxes)
  const treadCount = 14;
  const treadGeo = new THREE.BoxGeometry(0.36, 0.08, 0.12);
  const treadMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
  for (let i = 0; i < treadCount; i++) {
    const angle = (i / treadCount) * Math.PI * 2;
    const block = new THREE.Mesh(treadGeo, treadMat);
    block.position.set(0, Math.sin(angle) * 0.51, Math.cos(angle) * 0.51);
    block.rotation.x = angle;
    spinGroup.add(block);
  }

  // Beadlock Rim
  const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.39, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x2e3440,
    roughness: 0.3,
    metalness: 0.9,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  spinGroup.add(rimMesh);

  // Accent Beadlock Ring
  const ringGeo = new THREE.TorusGeometry(0.31, 0.025, 8, 20);
  ringGeo.rotateY(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColorHex),
    roughness: 0.2,
    metalness: 0.8,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.x = 0.19;
  spinGroup.add(ringMesh);

  return { group, spinGroup };
}

/**
 * Creates Cyber Titan 4x4 Offroad Trophy Truck
 */
export function createTruckModel(bodyColorHex: string, accentColorHex: string = '#38bdf8'): CarVisualRefs {
  const root = new THREE.Group();

  // Raised Trophy Truck Suspension Hub
  const bodyHub = new THREE.Group();
  bodyHub.position.y = 0.55;
  root.add(bodyHub);

  const armorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.32,
    metalness: 0.85,
    clearcoat: 0.5,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.8,
  });

  const tintedGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  // 1. Heavy Armor Chassis & Side Rock Sliders
  const chassisGeo = new THREE.BoxGeometry(2.1, 0.35, 4.8);
  const chassisMesh = new THREE.Mesh(chassisGeo, darkMetalMat);
  chassisMesh.position.set(0, 0.1, 0);
  chassisMesh.castShadow = true;
  bodyHub.add(chassisMesh);

  // 2. Chiseled Hood (+Z front)
  const hoodGeo = new THREE.BoxGeometry(2.0, 0.45, 1.6);
  const hoodMesh = new THREE.Mesh(hoodGeo, armorMat);
  hoodMesh.position.set(0, 0.45, 1.45);
  hoodMesh.castShadow = true;
  bodyHub.add(hoodMesh);

  // 3. Angular Crew Cab
  const cabGeo = new THREE.BoxGeometry(1.95, 0.85, 1.7);
  const cabMesh = new THREE.Mesh(cabGeo, armorMat);
  cabMesh.position.set(0, 0.82, -0.1);
  cabMesh.castShadow = true;
  bodyHub.add(cabMesh);

  // Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(1.85, 0.65, 0.08);
  windshieldGeo.rotateX(Math.PI / 7);
  const windshield = new THREE.Mesh(windshieldGeo, tintedGlassMat);
  windshield.position.set(0, 0.85, 0.78);
  bodyHub.add(windshield);

  // 4. Rooftop LED Floodlight Bar
  const lightBarGeo = new THREE.BoxGeometry(1.7, 0.12, 0.18);
  const lightBarMesh = new THREE.Mesh(lightBarGeo, darkMetalMat);
  lightBarMesh.position.set(0, 1.28, 0.65);
  const ledLensGeo = new THREE.BoxGeometry(1.6, 0.07, 0.05);
  const ledLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(accentColorHex),
    emissiveIntensity: 3.5,
  });
  const ledLens = new THREE.Mesh(ledLensGeo, ledLensMat);
  ledLens.position.set(0, 0, 0.08);
  lightBarMesh.add(ledLens);
  bodyHub.add(lightBarMesh);

  // 5. Open Pickup Bed (-Z rear) with Roll Cage & Mounted Spare Tire
  const bedFloorGeo = new THREE.BoxGeometry(1.9, 0.35, 1.55);
  const bedFloor = new THREE.Mesh(bedFloorGeo, darkMetalMat);
  bedFloor.position.set(0, 0.35, -1.65);
  bodyHub.add(bedFloor);

  // Roll cage tubes
  const rollBarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
  const cageLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6), rollBarMat);
  cageLeft.rotation.x = Math.PI / 4;
  cageLeft.position.set(-0.85, 0.85, -1.5);
  bodyHub.add(cageLeft);

  const cageRight = cageLeft.clone();
  cageRight.position.x = 0.85;
  bodyHub.add(cageRight);

  // Spare 37" Tire mounted slanted in bed
  const spareWheel = createOffroadWheel(accentColorHex);
  spareWheel.group.scale.setScalar(0.9);
  spareWheel.group.rotation.x = -Math.PI / 4;
  spareWheel.group.position.set(0, 0.65, -1.6);
  bodyHub.add(spareWheel.group);

  // 6. Front Bullbar & Skid Plate (+Z)
  const bullbarGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.0);
  bullbarGeo.rotateZ(Math.PI / 2);
  const bullbar = new THREE.Mesh(bullbarGeo, darkMetalMat);
  bullbar.position.set(0, 0.22, 2.45);
  bodyHub.add(bullbar);

  // 7. Dual Vertical Chrome Exhaust Stacks
  const stackGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.1, 12);
  const stackMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.95 });
  const exhaustL = new THREE.Mesh(stackGeo, stackMat);
  exhaustL.position.set(-0.95, 1.15, -0.92);
  bodyHub.add(exhaustL);

  const exhaustR = exhaustL.clone();
  exhaustR.position.x = 0.95;
  bodyHub.add(exhaustR);

  // 8. Vertical Taillight Clusters
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0x660000,
    emissive: 0xff0011,
    emissiveIntensity: 1.5,
  });
  const tailGeo = new THREE.BoxGeometry(0.12, 0.45, 0.08);
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.92, 0.52, -2.42);
  bodyHub.add(tailL);
  const tailR = tailL.clone();
  tailR.position.x = 0.92;
  bodyHub.add(tailR);
  const tailGroup = new THREE.Group();
  tailGroup.add(tailL);
  tailGroup.add(tailR);

  // 9. 4 Oversized Monster Offroad Wheels
  const trackX = 1.18;
  const baseZ = 1.62;

  const frontWheelSteerL = new THREE.Group();
  frontWheelSteerL.position.set(-trackX, 0, baseZ);
  const wFL = createOffroadWheel(accentColorHex);
  frontWheelSteerL.add(wFL.group);
  bodyHub.add(frontWheelSteerL);

  const frontWheelSteerR = new THREE.Group();
  frontWheelSteerR.position.set(trackX, 0, baseZ);
  const wFR = createOffroadWheel(accentColorHex);
  wFR.group.rotation.y = Math.PI;
  frontWheelSteerR.add(wFR.group);
  bodyHub.add(frontWheelSteerR);

  const wheelRLGroup = new THREE.Group();
  wheelRLGroup.position.set(-trackX, 0, -baseZ);
  const wRL = createOffroadWheel(accentColorHex);
  wheelRLGroup.add(wRL.group);
  bodyHub.add(wheelRLGroup);

  const wheelRRGroup = new THREE.Group();
  wheelRRGroup.position.set(trackX, 0, -baseZ);
  const wRR = createOffroadWheel(accentColorHex);
  wRR.group.rotation.y = Math.PI;
  wheelRRGroup.add(wRR.group);
  bodyHub.add(wheelRRGroup);

  // Ground Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(3.0, 5.5);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  root.add(shadowPlane);

  return {
    root,
    bodyHub,
    bodyMesh: cabMesh,
    wheelFL: wFL.spinGroup,
    wheelFR: wFR.spinGroup,
    wheelRL: wRL.spinGroup,
    wheelRR: wRR.spinGroup,
    frontWheelSteerL,
    frontWheelSteerR,
    tailLightMesh: tailGroup,
    exhaustL,
    exhaustR,
    shadowPlane,
    vehicleType: 'truck',
  };
}

/**
 * Creates Ducati GP Corse MotoGP Superbike with Leaning Rider
 */
export function createBikeModel(bodyColorHex: string, accentColorHex: string = '#ffffff'): CarVisualRefs {
  const root = new THREE.Group();

  const bodyHub = new THREE.Group();
  bodyHub.position.y = 0.36;
  root.add(bodyHub);

  const fairingMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.15,
    metalness: 0.88,
    clearcoat: 1.0,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.9,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.5,
  });

  // 1. Aerodynamic Front Fairing (+Z) with Nose Air Intake
  const noseGeo = new THREE.ConeGeometry(0.32, 1.1, 12);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, fairingMat);
  noseMesh.position.set(0, 0.42, 0.95);
  bodyHub.add(noseMesh);

  // Windshield bubble
  const screenGeo = new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI);
  screenGeo.rotateX(Math.PI / 3);
  const screenMat = new THREE.MeshPhysicalMaterial({
    color: 0x050510,
    transparent: true,
    opacity: 0.75,
    roughness: 0.05,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.65, 0.72);
  bodyHub.add(screen);

  // Twin MotoGP Aerodynamic Downforce Winglets
  const wingletMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.22), wingletMat);
  wingL.rotation.z = -0.25;
  wingL.position.set(-0.35, 0.52, 0.85);
  bodyHub.add(wingL);
  const wingR = wingL.clone();
  wingR.rotation.z = 0.25;
  wingR.position.x = 0.35;
  bodyHub.add(wingR);

  // 2. Sculpted Fuel Tank
  const tankGeo = new THREE.BoxGeometry(0.48, 0.4, 0.72);
  const tankMesh = new THREE.Mesh(tankGeo, fairingMat);
  tankMesh.position.set(0, 0.62, 0.2);
  bodyHub.add(tankMesh);

  // 3. Exposed Twin-Spar Aluminum Frame & V4 Engine Block
  const frameGeo = new THREE.BoxGeometry(0.42, 0.48, 0.9);
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, 0.24, 0.0);
  bodyHub.add(frameMesh);

  // 4. Tail Cowl & Solo Racing Seat
  const tailGeo = new THREE.ConeGeometry(0.26, 0.95, 8);
  tailGeo.rotateX(-Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, fairingMat);
  tailMesh.position.set(0, 0.58, -0.65);
  bodyHub.add(tailMesh);

  // Rear Under-Tail Exhaust
  const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.065, 0.6, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.95 });
  const exhaustL = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaustL.position.set(-0.12, 0.38, -1.05);
  bodyHub.add(exhaustL);
  const exhaustR = exhaustL.clone();
  exhaustR.position.x = 0.12;
  bodyHub.add(exhaustR);

  // Rear LED Taillight Strip
  const tailLightGeo = new THREE.BoxGeometry(0.24, 0.04, 0.06);
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0x550000,
    emissive: 0xff0011,
    emissiveIntensity: 2.2,
  });
  const tailLightMesh = new THREE.Mesh(tailLightGeo, tailLightMat);
  tailLightMesh.position.set(0, 0.56, -1.08);
  bodyHub.add(tailLightMesh);

  // 5. MotoGP Rider (Suit, Helmet, Leaning Posture)
  const riderGroup = new THREE.Group();
  riderGroup.position.set(0, 0.55, 0.05);

  // Torso with aerodynamic speed hump
  const suitMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.6,
  });
  const torsoGeo = new THREE.BoxGeometry(0.42, 0.55, 0.36);
  torsoGeo.rotateX(-Math.PI / 6); // Crouched forward over tank
  const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
  torsoMesh.position.set(0, 0.28, -0.05);
  riderGroup.add(torsoMesh);

  // Aerodynamic speed hump on back
  const humpGeo = new THREE.ConeGeometry(0.14, 0.45, 8);
  humpGeo.rotateX(-Math.PI / 3);
  const humpMesh = new THREE.Mesh(humpGeo, carbonMat);
  humpMesh.position.set(0, 0.48, -0.22);
  riderGroup.add(humpMesh);

  // Full-Face Racing Helmet
  const helmetGeo = new THREE.SphereGeometry(0.17, 16, 16);
  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.2,
    metalness: 0.6,
  });
  const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
  helmetMesh.position.set(0, 0.65, 0.22);
  // Visor
  const visorGeo = new THREE.BoxGeometry(0.22, 0.07, 0.14);
  const visorMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0, 0.11);
  helmetMesh.add(visor);
  riderGroup.add(helmetMesh);

  // Clip-on Handlebars
  const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.62);
  barGeo.rotateZ(Math.PI / 2);
  const barMesh = new THREE.Mesh(barGeo, carbonMat);
  barMesh.position.set(0, 0.6, 0.62);
  bodyHub.add(barMesh);

  bodyHub.add(riderGroup);

  // 6. Wheels (Front single-track & Rear single-track)
  function createSuperbikeWheel(width: number): { group: THREE.Group; spinGroup: THREE.Group } {
    const wGroup = new THREE.Group();
    const spin = new THREE.Group();
    wGroup.add(spin);

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, width, 24).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 })
    );
    tire.castShadow = true;
    spin.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, width + 0.01, 16).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 })
    );
    spin.add(rim);

    // Twin wave brake rotors
    const rotorGeo = new THREE.CylinderGeometry(0.22, 0.22, width + 0.03, 16).rotateZ(Math.PI / 2);
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.95 });
    spin.add(new THREE.Mesh(rotorGeo, rotorMat));

    return { group: wGroup, spinGroup: spin };
  }

  // Front Wheel at +1.25 on Z (Steered by frontWheelSteerL)
  const frontWheelSteerL = new THREE.Group();
  frontWheelSteerL.position.set(0, 0, 1.25);
  const wFront = createSuperbikeWheel(0.14);
  frontWheelSteerL.add(wFront.group);
  bodyHub.add(frontWheelSteerL);

  // Dummy steer right for interface compatibility
  const frontWheelSteerR = new THREE.Group();

  // Rear Wheel at -1.25 on Z (Single-sided swingarm)
  const wheelRLGroup = new THREE.Group();
  wheelRLGroup.position.set(0, 0, -1.25);
  const wRear = createSuperbikeWheel(0.22);
  wheelRLGroup.add(wRear.group);
  bodyHub.add(wheelRLGroup);

  const wheelRRGroup = new THREE.Group();

  // Contact Shadow Plane
  const shadowGeo = new THREE.PlaneGeometry(1.6, 3.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  root.add(shadowPlane);

  return {
    root,
    bodyHub,
    bodyMesh: noseMesh,
    wheelFL: wFront.spinGroup,
    wheelFR: new THREE.Group(),
    wheelRL: wRear.spinGroup,
    wheelRR: new THREE.Group(),
    frontWheelSteerL,
    frontWheelSteerR,
    tailLightMesh,
    exhaustL,
    exhaustR,
    shadowPlane,
    riderMesh: riderGroup,
    driverHead: helmetMesh,
    vehicleType: 'bike',
  };
}

/**
 * Creates Tour Aero Velodrome Carbon Road Cycle with Sprinter Cyclist
 */
export function createCycleModel(bodyColorHex: string, accentColorHex: string = '#fbbf24'): CarVisualRefs {
  const root = new THREE.Group();

  const bodyHub = new THREE.Group();
  bodyHub.position.y = 0.42;
  root.add(bodyHub);

  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.25,
    metalness: 0.65,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.5,
  });

  // 1. Carbon Diamond Frame Tubes
  const frameGroup = new THREE.Group();

  // Top Tube
  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1).rotateX(Math.PI / 2), frameMat);
  topTube.position.set(0, 0.35, 0.0);
  frameGroup.add(topTube);

  // Down Tube
  const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25).rotateX(Math.PI / 3.2), frameMat);
  downTube.position.set(0, 0.12, 0.15);
  frameGroup.add(downTube);

  // Seat Tube
  const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65), frameMat);
  seatTube.position.set(0, 0.28, -0.42);
  frameGroup.add(seatTube);

  // Rear Chainstays
  const chainstay = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72).rotateX(Math.PI / 2.2), carbonMat);
  chainstay.position.set(0, 0.02, -0.76);
  frameGroup.add(chainstay);

  // Racing Saddle
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.3), carbonMat);
  saddle.position.set(0, 0.62, -0.45);
  frameGroup.add(saddle);

  // Drop Handlebars
  const bars = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 16, Math.PI), carbonMat);
  bars.rotation.y = Math.PI / 2;
  bars.position.set(0, 0.48, 0.52);
  frameGroup.add(bars);

  bodyHub.add(frameGroup);

  // Tail Safety LED Flasher
  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xff0022, emissiveIntensity: 3.0 })
  );
  tailLight.position.set(0, 0.52, -0.58);
  bodyHub.add(tailLight);

  // 2. Cyclist Rider Athlete (In Sprint Tuck)
  const riderGroup = new THREE.Group();
  riderGroup.position.set(0, 0.5, 0);

  const jerseyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyColorHex), roughness: 0.7 });
  const bibMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  // Cyclist Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.3).rotateX(-Math.PI / 4), jerseyMat);
  torso.position.set(0, 0.22, 0.05);
  riderGroup.add(torso);

  // Aero Helmet (Teardrop Time-Trial)
  const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 12).rotateX(-Math.PI / 2.5), jerseyMat);
  helmet.position.set(0, 0.48, 0.32);
  riderGroup.add(helmet);

  bodyHub.add(riderGroup);

  // 3. Ultra-Slim 700c Aero Disc Wheels
  function createCycleWheel(): { group: THREE.Group; spinGroup: THREE.Group } {
    const wGroup = new THREE.Group();
    const spin = new THREE.Group();
    wGroup.add(spin);

    // Slim Road Tire
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 })
    );
    tire.castShadow = true;
    spin.add(tire);

    // Aero Deep Dish Carbon Rim
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.055, 18).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.7 })
    );
    spin.add(rim);

    return { group: wGroup, spinGroup: spin };
  }

  const frontWheelSteerL = new THREE.Group();
  frontWheelSteerL.position.set(0, 0, 1.08);
  const wFront = createCycleWheel();
  frontWheelSteerL.add(wFront.group);
  bodyHub.add(frontWheelSteerL);

  const frontWheelSteerR = new THREE.Group();

  const wheelRLGroup = new THREE.Group();
  wheelRLGroup.position.set(0, 0, -1.08);
  const wRear = createCycleWheel();
  wheelRLGroup.add(wRear.group);
  bodyHub.add(wheelRLGroup);

  const wheelRRGroup = new THREE.Group();

  // Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(1.2, 3.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  root.add(shadowPlane);

  return {
    root,
    bodyHub,
    bodyMesh: topTube,
    wheelFL: wFront.spinGroup,
    wheelFR: new THREE.Group(),
    wheelRL: wRear.spinGroup,
    wheelRR: new THREE.Group(),
    frontWheelSteerL,
    frontWheelSteerR,
    tailLightMesh: tailLight,
    exhaustL: new THREE.Mesh(),
    exhaustR: new THREE.Mesh(),
    shadowPlane,
    riderMesh: riderGroup,
    driverHead: helmet,
    vehicleType: 'cycle',
  };
}

/**
 * Creates Venice Pro Street Skateboard / Downhill Longboard with Crouching Skater
 */
export function createSkateboardModel(bodyColorHex: string, accentColorHex: string = '#a855f7'): CarVisualRefs {
  const root = new THREE.Group();

  const bodyHub = new THREE.Group();
  bodyHub.position.y = 0.16;
  root.add(bodyHub);

  // 1. Maple Wood Deck with Nose & Tail Kicktails
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-0.25, -0.75);
  deckShape.lineTo(0.25, -0.75);
  deckShape.lineTo(0.27, 0.75);
  deckShape.lineTo(-0.27, 0.75);
  deckShape.closePath();

  // Laminated maple deck
  const deckGeo = new THREE.BoxGeometry(0.54, 0.035, 1.6);
  const deckMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.4,
    metalness: 0.2,
  });
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.position.set(0, 0.06, 0);
  bodyHub.add(deckMesh);

  // Top Surface: Black Grip Tape
  const gripGeo = new THREE.BoxGeometry(0.52, 0.005, 1.56);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.98 });
  const gripMesh = new THREE.Mesh(gripGeo, gripMat);
  gripMesh.position.set(0, 0.08, 0);
  bodyHub.add(gripMesh);

  // Underside Graphic Stripes
  const stripeGeo = new THREE.BoxGeometry(0.48, 0.005, 1.2);
  const stripeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentColorHex), roughness: 0.3 });
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0, 0.04, 0);
  bodyHub.add(stripeMesh);

  // 2. Aluminum Reverse-Kingpin Skateboard Trucks
  const truckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 });
  const truckFront = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52).rotateZ(Math.PI / 2), truckMat);
  truckFront.position.set(0, 0, 0.58);
  bodyHub.add(truckFront);

  const truckRear = truckFront.clone();
  truckRear.position.z = -0.58;
  bodyHub.add(truckRear);

  // 3. Crouching Street Skater in Downhill Carve Stance
  const skaterGroup = new THREE.Group();
  skaterGroup.position.set(0, 0.08, 0);

  const skaterMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyColorHex), roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

  // Legs in wide crouching stance
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.16).rotateX(0.2), pantsMat);
  legL.position.set(-0.06, 0.22, 0.35);
  skaterGroup.add(legL);

  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.16).rotateX(-0.3), pantsMat);
  legR.position.set(0.06, 0.22, -0.35);
  skaterGroup.add(legR);

  // Torso (turned sideways for skate posture)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.24), skaterMat);
  torso.rotation.y = Math.PI / 2.8; // Sideways carve stance
  torso.position.set(0, 0.48, 0.02);
  skaterGroup.add(torso);

  // Arms outstretched for aerodynamic balance
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.1), skaterMat);
  armL.position.set(-0.35, 0.52, 0.08);
  skaterGroup.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.1), skaterMat);
  armR.position.set(0.35, 0.52, -0.08);
  skaterGroup.add(armR);

  // Skater Head with Snapback Hat
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 })
  );
  head.position.set(0, 0.78, 0.04);
  // Snapback hat
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(accentColorHex), roughness: 0.5 })
  );
  hat.position.set(0, 0.1, 0);
  head.add(hat);
  skaterGroup.add(head);

  bodyHub.add(skaterGroup);

  // 4. Four Urethane Downhill Wheels
  function createSkateWheel(): { group: THREE.Group; spinGroup: THREE.Group } {
    const wGroup = new THREE.Group();
    const spin = new THREE.Group();
    wGroup.add(spin);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.11, 16).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 })
    );
    wheel.castShadow = true;
    spin.add(wheel);

    return { group: wGroup, spinGroup: spin };
  }

  const trackX = 0.26;
  const baseZ = 0.58;

  const frontWheelSteerL = new THREE.Group();
  frontWheelSteerL.position.set(-trackX, 0, baseZ);
  const wFL = createSkateWheel();
  frontWheelSteerL.add(wFL.group);
  bodyHub.add(frontWheelSteerL);

  const frontWheelSteerR = new THREE.Group();
  frontWheelSteerR.position.set(trackX, 0, baseZ);
  const wFR = createSkateWheel();
  frontWheelSteerR.add(wFR.group);
  bodyHub.add(frontWheelSteerR);

  const wheelRLGroup = new THREE.Group();
  wheelRLGroup.position.set(-trackX, 0, -baseZ);
  const wRL = createSkateWheel();
  wheelRLGroup.add(wRL.group);
  bodyHub.add(wheelRLGroup);

  const wheelRRGroup = new THREE.Group();
  wheelRRGroup.position.set(trackX, 0, -baseZ);
  const wRR = createSkateWheel();
  wheelRRGroup.add(wRR.group);
  bodyHub.add(wheelRRGroup);

  // Spark tail brake flasher / tail light
  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.02, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff3300, emissiveIntensity: 2.5 })
  );
  tailLight.position.set(0, 0.07, -0.78);
  bodyHub.add(tailLight);

  // Shadow Plane
  const shadowGeo = new THREE.PlaneGeometry(1.4, 2.4);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  root.add(shadowPlane);

  return {
    root,
    bodyHub,
    bodyMesh: deckMesh,
    wheelFL: wFL.spinGroup,
    wheelFR: wFR.spinGroup,
    wheelRL: wRL.spinGroup,
    wheelRR: wRR.spinGroup,
    frontWheelSteerL,
    frontWheelSteerR,
    tailLightMesh: tailLight,
    exhaustL: new THREE.Mesh(),
    exhaustR: new THREE.Mesh(),
    shadowPlane,
    riderMesh: skaterGroup,
    driverHead: head,
    vehicleType: 'skateboard',
  };
}

/**
 * Universal Vehicle Model Factory
 */
export function createVehicleModel(
  bodyColorHex: string,
  accentColorHex: string = '#ffd700',
  vehicleId: string = 'ferrari_stradale'
): CarVisualRefs {
  const id = vehicleId.toLowerCase();
  if (id.includes('truck')) {
    return createTruckModel(bodyColorHex, accentColorHex);
  }
  if (id.includes('bike')) {
    return createBikeModel(bodyColorHex, accentColorHex);
  }
  if (id.includes('cycle')) {
    return createCycleModel(bodyColorHex, accentColorHex);
  }
  if (id.includes('skateboard')) {
    return createSkateboardModel(bodyColorHex, accentColorHex);
  }
  return createSupercarModel(bodyColorHex, accentColorHex, vehicleId);
}


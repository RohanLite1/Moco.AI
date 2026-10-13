import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural Texture Generator Helpers
 */

// 1. Procedural OLED Iris Texture
function createAiboEyeCanvas(status = 'idle', lookX = 0, lookY = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background dark socket
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const irisRadius = 190;

  // Outer dark rim
  ctx.fillStyle = '#082f49';
  ctx.beginPath();
  ctx.arc(cx, cy, irisRadius + 8, 0, Math.PI * 2);
  ctx.fill();

  // Vibrant radial OLED Iris Gradient
  let coreColor = '#e0f2fe';
  let midColor = '#38bdf8';
  let outerColor = '#0284c7';

  if (status === 'thinking') {
    coreColor = '#f3e8ff';
    midColor = '#c084fc';
    outerColor = '#7e22ce';
  } else if (status === 'happy') {
    coreColor = '#ecfdf5';
    midColor = '#34d399';
    outerColor = '#059669';
  }

  const irisGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, irisRadius);
  irisGrad.addColorStop(0, coreColor);
  irisGrad.addColorStop(0.35, midColor);
  irisGrad.addColorStop(0.75, outerColor);
  irisGrad.addColorStop(1, '#0c4a6e');

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, irisRadius, 0, Math.PI * 2);
  ctx.fill();

  // Radial micro-iris striations (Makes the eye look like an ultra-detailed OLED display)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * 70;
    const y1 = cy + Math.sin(angle) * 70;
    const x2 = cx + Math.cos(angle) * (irisRadius - 6);
    const y2 = cy + Math.sin(angle) * (irisRadius - 6);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Deep Obsidian Pupil in center
  const pupilRadius = 78;
  const pX = cx + lookX * 18;
  const pY = cy + lookY * 18;

  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(pX, pY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Concentric OLED aperture rings inside pupil
  ctx.strokeStyle = midColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = midColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(pX, pY, pupilRadius * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Specular Catchlight Glints (Vital for giving Aibo its charming, alive look)
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(pX - 32, pY - 32, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(pX + 28, pY + 28, 12, 0, Math.PI * 2);
  ctx.fill();

  // Micro-pixel grid overlay (True OLED look)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < 512; y += 4) {
    ctx.fillRect(0, y, 512, 1.2);
  }

  return canvas;
}

// 2. Procedural Pearlescent Chassis Texture with Dalmatian Cyber-Spots
function createChassisTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base pearlescent white
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-speckles
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // --- DISTINCTIVE DALMATIAN / PUPPY SPOTS ON SKIN ---
  const spots = [
    { x: 155, y: 175, rx: 72, ry: 58, rot: 0.25 }, // Left eye / temple patch
    { x: 335, y: 110, rx: 55, ry: 48, rot: -0.2 },  // Top crown spot
    { x: 235, y: 85,  rx: 40, ry: 32, rot: 0.1 },   // Forehead central spot
    { x: 390, y: 310, rx: 62, ry: 52, rot: 0.35 }, // Right rear skull spot
    { x: 125, y: 350, rx: 48, ry: 42, rot: -0.15 },// Left rear skull spot
    { x: 260, y: 415, rx: 42, ry: 36, rot: 0.1 },   // Lower neck spot
    { x: 420, y: 175, rx: 46, ry: 38, rot: -0.28 }, // Right temple spot
    { x: 185, y: 275, rx: 34, ry: 28, rot: 0.18 }   // Cheek flank spot
  ];

  spots.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);

    // Organic spot fill (Dark chocolate / charcoal)
    ctx.fillStyle = '#3a2b23';
    ctx.beginPath();
    ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  return new THREE.CanvasTexture(canvas);
}

// 3. Procedural Champagne Ceramic Faceplate Texture
function createFaceplateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ded8d0';
  ctx.fillRect(0, 0, 512, 512);

  // Soft ceramic noise
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(180, 165, 150, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Soft Dalmatian Eye Patch Spot over right brow on faceplate
  ctx.save();
  ctx.translate(340, 205);
  ctx.rotate(0.28);
  ctx.fillStyle = '#3a2b23';
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle contour highlight
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}

// 4. Procedural Leather / Matte Texture for Ears
function createEarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a2b25';
  ctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(20, 14, 10, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * Main RobotAvatar Component
 */
export default function RobotAvatar({
  status = 'idle',
  compact = false,
  theme = 'dark',
  onRobotClick,
  className = ''
}) {
  const mountRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || (compact ? 80 : 300);
    const height = mount.clientHeight || (compact ? 80 : 300);

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.06, compact ? 4.9 : 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Head Group (Smooth mouse tracking & puppy tilts)
    const headGroup = new THREE.Group();
    rootGroup.add(headGroup);

    // -------------------------------------------------------------------------
    // PROCEDURAL TEXTURES & MATERIALS
    // -------------------------------------------------------------------------
    const chassisTex = createChassisTexture();
    const faceTex = createFaceplateTexture();
    const earTex = createEarTexture();

    // 1. Glossy White Pearlescent Skull
    const whiteSkullMat = new THREE.MeshStandardMaterial({
      map: chassisTex,
      color: 0xf8fafc,
      metalness: 0.15,
      roughness: 0.18,
      envMapIntensity: 1.2
    });

    // 2. Champagne Faceplate Material
    const beigeFaceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      color: 0xd8d3cb,
      metalness: 0.08,
      roughness: 0.28
    });

    // 3. Dark Chocolate Floppy Ear Material
    const brownEarMat = new THREE.MeshStandardMaterial({
      map: earTex,
      color: 0x3d2c25,
      metalness: 0.18,
      roughness: 0.32
    });

    // 4. Black Sensor Nose & Socket Rims
    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.65,
      roughness: 0.2
    });

    // 5. Eye Material with Dynamic Canvas Texture
    const eyeCanvasObj = createAiboEyeCanvas('idle', 0, 0);
    const eyeTexture = new THREE.CanvasTexture(eyeCanvasObj);
    eyeTexture.minFilter = THREE.LinearFilter;
    eyeTexture.magFilter = THREE.LinearFilter;

    const eyeballMat = new THREE.MeshStandardMaterial({
      map: eyeTexture,
      roughness: 0.05,
      metalness: 0.1,
      emissive: new THREE.Color(0x0284c7),
      emissiveMap: eyeTexture,
      emissiveIntensity: 0.65
    });

    // -------------------------------------------------------------------------
    // 2. HEAD & MUZZLE SCULPTURE
    // -------------------------------------------------------------------------
    // Rear Skull
    const skullGeo = new THREE.SphereGeometry(1.02, 36, 36);
    skullGeo.scale(1.12, 1.05, 1.18);
    skullGeo.translate(0, 0.05, -0.15);
    const skullMesh = new THREE.Mesh(skullGeo, whiteSkullMat);
    headGroup.add(skullMesh);

    // Front Beige Faceplate
    const faceGeo = new THREE.SphereGeometry(0.96, 36, 36);
    faceGeo.scale(1.08, 0.98, 1.15);
    faceGeo.translate(0, 0.02, 0.18);
    const faceMesh = new THREE.Mesh(faceGeo, beigeFaceMat);
    headGroup.add(faceMesh);

    // Muzzle / Snout
    const snoutGeo = new THREE.SphereGeometry(0.58, 32, 32);
    snoutGeo.scale(1.22, 0.88, 1.25);
    snoutGeo.translate(0, -0.22, 0.82);
    const snoutMesh = new THREE.Mesh(snoutGeo, beigeFaceMat);
    headGroup.add(snoutMesh);


    // -------------------------------------------------------------------------
    // 2. CANINE SNOUT, WHISKER PADS & NOSE SCULPTURE (MATCHING REFERENCE IMAGE)
    // -------------------------------------------------------------------------
    // Dual Rounded Whisker Pad Pillows (Left & Right cheeks flanking the nose)
    const whiskerPadGeo = new THREE.SphereGeometry(0.28, 24, 24);
    whiskerPadGeo.scale(1.22, 0.90, 1.08);

    const leftPadMesh = new THREE.Mesh(whiskerPadGeo, beigeFaceMat);
    leftPadMesh.position.set(-0.20, -0.19, 1.18);
    leftPadMesh.rotation.set(-0.06, 0.14, -0.04);
    headGroup.add(leftPadMesh);

    const rightPadMesh = new THREE.Mesh(whiskerPadGeo, beigeFaceMat);
    rightPadMesh.position.set(0.20, -0.19, 1.18);
    rightPadMesh.rotation.set(-0.06, -0.14, 0.04);
    headGroup.add(rightPadMesh);

    // Sculpted Canine Button Nose
    const noseGeo = new THREE.SphereGeometry(0.18, 24, 24);
    noseGeo.scale(1.25, 0.88, 0.95);
    noseGeo.translate(0, -0.05, 1.38);
    const noseMesh = new THREE.Mesh(noseGeo, darkTrimMat);
    headGroup.add(noseMesh);

    // Canine Nostril Cavities (Left and Right)
    const nostrilGeo = new THREE.SphereGeometry(0.042, 16, 16);
    nostrilGeo.scale(1.18, 0.72, 0.82);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });

    const leftNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    leftNostril.position.set(-0.07, -0.075, 1.48);
    headGroup.add(leftNostril);

    const rightNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    rightNostril.position.set(0.07, -0.075, 1.48);
    headGroup.add(rightNostril);

    // -------------------------------------------------------------------------
    // 3. WHISKER FOLLICLE DOTS & THIN HAIR-LIKE WHISKERS (ON BOTH SIDES AT DISTANCE)
    // -------------------------------------------------------------------------
    // Follicle Pores / Dots Pattern on both sides of the nose (as in reference image)
    const follicleDotGeo = new THREE.SphereGeometry(0.015, 8, 8);
    follicleDotGeo.scale(1.0, 1.0, 0.35);

    // Distinct dot pattern on left cheek pad (at distance from center nose)
    const leftFollicleDots = [
      // Top row (3 dots)
      { x: -0.18, y: -0.14, z: 1.35 },
      { x: -0.26, y: -0.16, z: 1.31 },
      { x: -0.34, y: -0.19, z: 1.26 },
      // Lower row (4 dots cluster)
      { x: -0.20, y: -0.22, z: 1.32 },
      { x: -0.28, y: -0.24, z: 1.28 },
      { x: -0.36, y: -0.26, z: 1.22 },
      { x: -0.42, y: -0.27, z: 1.16 }
    ];

    leftFollicleDots.forEach((pos) => {
      // Left dot
      const dotL = new THREE.Mesh(follicleDotGeo, darkTrimMat);
      dotL.position.set(pos.x, pos.y, pos.z);
      headGroup.add(dotL);

      // Right dot (mirrored)
      const dotR = new THREE.Mesh(follicleDotGeo, darkTrimMat);
      dotR.position.set(-pos.x, pos.y, pos.z);
      headGroup.add(dotR);
    });

    // Thin Hair-like Moustache Whiskers sprouting from both sides at distance
    const whiskerHairMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.45,
      roughness: 0.25
    });

    const whiskerConfigs = [
      {
        pos: { x: -0.22, y: -0.15, z: 1.33 },
        length: 0.52,
        rot: [0.12, 0.72, -0.22]
      },
      {
        pos: { x: -0.30, y: -0.17, z: 1.29 },
        length: 0.62,
        rot: [0.04, 0.88, -0.08]
      },
      {
        pos: { x: -0.24, y: -0.22, z: 1.30 },
        length: 0.68,
        rot: [-0.05, 0.82, 0.12]
      },
      {
        pos: { x: -0.32, y: -0.24, z: 1.25 },
        length: 0.58,
        rot: [-0.15, 0.76, 0.26]
      },
      {
        pos: { x: -0.38, y: -0.26, z: 1.19 },
        length: 0.48,
        rot: [-0.22, 0.68, 0.38]
      }
    ];

    const whiskerHairGeos = [];
    whiskerConfigs.forEach(({ pos, length, rot }) => {
      // Ultra-thin tapered whisker hair: base 0.003, tip 0.001
      const hairGeo = new THREE.CylinderGeometry(0.001, 0.0032, length, 8);
      hairGeo.translate(0, length / 2, 0); // Origin at root
      whiskerHairGeos.push(hairGeo);

      // Left whisker hair
      const hairL = new THREE.Mesh(hairGeo, whiskerHairMat);
      hairL.position.set(pos.x, pos.y, pos.z);
      hairL.rotation.set(rot[0], rot[1], rot[2]);
      headGroup.add(hairL);

      // Right whisker hair (mirrored)
      const hairR = new THREE.Mesh(hairGeo, whiskerHairMat);
      hairR.position.set(-pos.x, pos.y, pos.z);
      hairR.rotation.set(rot[0], -rot[1], -rot[2]);
      headGroup.add(hairR);
    });

    // --- ARTICULATED LOWER JAW & PUPPY CHIN ---
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.32, 0.78);

    // Sculpted Chin / Lower Jaw
    const chinGeo = new THREE.SphereGeometry(0.44, 24, 24);
    chinGeo.scale(1.12, 0.62, 1.25);
    chinGeo.translate(0, -0.06, 0.26);
    const chinMesh = new THREE.Mesh(chinGeo, beigeFaceMat);
    jawPivot.add(chinMesh);

    // Sculpted Lower Lip Rim on Jaw
    const lowerLipGeo = new THREE.TorusGeometry(0.22, 0.024, 16, 32, Math.PI);
    lowerLipGeo.rotateX(-Math.PI * 0.42);
    lowerLipGeo.translate(0, 0.12, 0.38);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, darkTrimMat);
    jawPivot.add(lowerLipMesh);

    // Dark Inner Mouth Cavity
    const mouthInteriorGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.16, 24);
    mouthInteriorGeo.translate(0, 0.02, 0.26);
    const mouthInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.45
    });
    const mouthInteriorMesh = new THREE.Mesh(mouthInteriorGeo, mouthInteriorMat);
    jawPivot.add(mouthInteriorMesh);

    // --- SCULPTED ADORABLE PUPPY PINK TONGUE ---
    const tonguePivot = new THREE.Group();
    tonguePivot.position.set(0, 0.04, 0.32);

    const tongueShape = new THREE.Shape();
    tongueShape.moveTo(-0.12, 0);
    tongueShape.lineTo(-0.12, 0.28);
    tongueShape.bezierCurveTo(-0.12, 0.42, 0.12, 0.42, 0.12, 0.28);
    tongueShape.lineTo(0.12, 0);
    tongueShape.closePath();

    const tongueGeo = new THREE.ExtrudeGeometry(tongueShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    tongueGeo.center();
    tongueGeo.rotateX(-Math.PI * 0.45);

    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Sweet puppy pink
      roughness: 0.35,
      metalness: 0.04
    });

    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tonguePivot.add(tongueMesh);

    // Tongue Center Groove / Cleft Line
    const tongueGrooveGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.32, 8);
    tongueGrooveGeo.rotateX(-Math.PI * 0.45);
    tongueGrooveGeo.translate(0, 0.03, 0);
    const tongueGrooveMat = new THREE.MeshBasicMaterial({ color: 0xdb2777 });
    const tongueGroove = new THREE.Mesh(tongueGrooveGeo, tongueGrooveMat);
    tonguePivot.add(tongueGroove);

    jawPivot.add(tonguePivot);

    headGroup.add(jawPivot);

    // -------------------------------------------------------------------------
    // 3. TRUE 3D EMBEDDED OLED EYEBALLS & 3D BLINKING EYELIDS
    // -------------------------------------------------------------------------
    const eyeRadius = 0.26;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 32, 32);
    // Rotate so canvas texture faces forward on the sphere
    eyeGeo.rotateY(-Math.PI / 2);

    // Left Eyeball
    const leftEyePivot = new THREE.Group();
    leftEyePivot.position.set(-0.46, 0.22, 0.92);
    const leftEyeball = new THREE.Mesh(eyeGeo, eyeballMat);
    leftEyePivot.add(leftEyeball);
    headGroup.add(leftEyePivot);

    // Right Eyeball
    const rightEyePivot = new THREE.Group();
    rightEyePivot.position.set(0.46, 0.22, 0.92);
    const rightEyeball = new THREE.Mesh(eyeGeo, eyeballMat);
    rightEyePivot.add(rightEyeball);
    headGroup.add(rightEyePivot);

    // 3D Eye Socket Recess Rims (Contoured black ring around each eye)
    const socketRimGeo = new THREE.TorusGeometry(eyeRadius + 0.02, 0.035, 16, 32);
    const leftRim = new THREE.Mesh(socketRimGeo, darkTrimMat);
    leftRim.position.set(-0.46, 0.22, 0.94);
    leftRim.rotation.y = Math.PI * 0.12;
    headGroup.add(leftRim);

    const rightRim = new THREE.Mesh(socketRimGeo, darkTrimMat);
    rightRim.position.set(0.46, 0.22, 0.94);
    rightRim.rotation.y = -Math.PI * 0.12;
    headGroup.add(rightRim);

    // -------------------------------------------------------------------------
    // 4. TRUE 3D BLINKING EYELIDS (Mechanical robotic eyelids that close over eyes)
    // -------------------------------------------------------------------------
    // Eyelid is a half-sphere shell that rotates down over the eyeball
    const eyelidGeo = new THREE.SphereGeometry(
      eyeRadius + 0.015,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52
    );

    // Left Upper Eyelid
    const leftEyelid = new THREE.Mesh(eyelidGeo, beigeFaceMat);
    leftEyelid.position.set(-0.46, 0.22, 0.92);
    leftEyelid.rotation.x = -Math.PI * 0.5; // Start open (retracted above eye)
    headGroup.add(leftEyelid);

    // Right Upper Eyelid
    const rightEyelid = new THREE.Mesh(eyelidGeo, beigeFaceMat);
    rightEyelid.position.set(0.46, 0.22, 0.92);
    rightEyelid.rotation.x = -Math.PI * 0.5; // Start open
    headGroup.add(rightEyelid);

    // -------------------------------------------------------------------------
    // 5. FLOPPY CHOCOLATE-BROWN EARS (Paddle Shape with Hinges)
    // -------------------------------------------------------------------------
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.bezierCurveTo(0.2, -0.3, 0.38, -0.85, 0.22, -1.25);
    earShape.bezierCurveTo(0.12, -1.45, -0.18, -1.45, -0.26, -1.25);
    earShape.bezierCurveTo(-0.35, -0.85, -0.22, -0.3, 0, 0);
    earShape.closePath();

    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    });
    earGeo.center();
    earGeo.translate(0, -0.55, 0);

    const jointGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 24);
    jointGeo.rotateZ(Math.PI / 2);

    // Left Ear Unit
    const leftEarPivot = new THREE.Group();
    leftEarPivot.position.set(-0.95, 0.72, -0.05);
    leftEarPivot.rotation.set(-0.15, 0.25, 0.32);

    const leftJointMesh = new THREE.Mesh(jointGeo, darkTrimMat);
    leftEarPivot.add(leftJointMesh);

    const leftEarMesh = new THREE.Mesh(earGeo, brownEarMat);
    leftEarPivot.add(leftEarMesh);
    headGroup.add(leftEarPivot);

    // Right Ear Unit
    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(0.95, 0.72, -0.05);
    rightEarPivot.rotation.set(-0.15, -0.25, -0.32);

    const rightJointMesh = new THREE.Mesh(jointGeo, darkTrimMat);
    rightEarPivot.add(rightJointMesh);

    const rightEarMesh = new THREE.Mesh(earGeo, brownEarMat);
    rightEarMesh.scale.x = -1;
    rightEarPivot.add(rightEarMesh);
    headGroup.add(rightEarPivot);

    // -------------------------------------------------------------------------
    // 6. BACK-HALO CELESTIAL RINGS & AURA PARTICLES (BEHIND HEAD - ZERO LINES OVER NOSE)
    // -------------------------------------------------------------------------
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.05, -0.65); // Safely positioned behind skull and ears
    headGroup.add(haloGroup);

    const ring1Geo = new THREE.TorusGeometry(1.65, 0.012, 16, 80);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    haloGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.85, 0.010, 16, 80);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.3
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    haloGroup.add(ring2);

    // Particles
    const particleCount = compact ? 80 : 220;
    const particleGeo = new THREE.BufferGeometry();
    const particleCoords = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.45 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particleCoords[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particleCoords[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particleCoords[i * 3 + 2] = radius * Math.cos(phi);

      particleVelocities.push({
        orbitSpeed: 0.005 + Math.random() * 0.012,
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: compact ? 0.038 : 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    headGroup.add(particles);

    // -------------------------------------------------------------------------
    // 7. LIGHTING SETUP
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3.5, 8);
    rimLight.position.set(-3, -2, -1.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xa855f7, 2.0, 8);
    fillLight.position.set(3, -2, 2);
    scene.add(fillLight);

    // -------------------------------------------------------------------------
    // 8. MOUSE LOOK-AT TRACKING
    // -------------------------------------------------------------------------
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // -------------------------------------------------------------------------
    // 9. ANIMATION LOOP & SMOOTH 3D BLINK ENGINE
    // -------------------------------------------------------------------------
    let animationFrameId;
    const clock = new THREE.Clock();

    let blinkTime = 0;
    let nextBlinkDuration = 3.2; // Next blink in 3.2s
    let blinkPhase = 0; // 0 = open, >0 = in blink motion

    let lastStatus = 'idle';

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const currentStatus = statusRef.current;
      const currentTheme = themeRef.current;

      // Update Iris Texture if status changed
      if (currentStatus !== lastStatus) {
        lastStatus = currentStatus;
        const newEyeCanvas = createAiboEyeCanvas(currentStatus, 0, 0);
        eyeTexture.image = newEyeCanvas;
        eyeTexture.needsUpdate = true;
      }

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.055;
      mouse.y += (mouse.targetY - mouse.y) * 0.055;

      // 1. Natural Gentle Hovering
      const hoverSpeed = currentStatus === 'thinking' ? 2.8 : 1.5;
      const hoverAmp = compact ? 0.03 : 0.07;
      rootGroup.position.y = Math.sin(elapsedTime * hoverSpeed) * hoverAmp;

      // 2. Head Tilts & Look-At Mouse
      const maxRotX = 0.3;
      const maxRotY = 0.48;
      const headTilt = Math.sin(elapsedTime * 0.6) * 0.06;
      headGroup.rotation.y = mouse.x * maxRotY + Math.sin(elapsedTime * 0.4) * 0.03;
      headGroup.rotation.x = -mouse.y * maxRotX + Math.sin(elapsedTime * 0.6) * 0.025;
      headGroup.rotation.z = -mouse.x * 0.12 + headTilt;

      // 3. Eyeballs Smooth Gaze Look-At (Eyes track cursor within their sockets)
      const maxEyeGazeX = 0.35;
      const maxEyeGazeY = 0.25;
      leftEyePivot.rotation.y = mouse.x * maxEyeGazeX;
      leftEyePivot.rotation.x = -mouse.y * maxEyeGazeY;
      rightEyePivot.rotation.y = mouse.x * maxEyeGazeX;
      rightEyePivot.rotation.x = -mouse.y * maxEyeGazeY;

      // 4. Realistic 3D Eyelid Blink Animation
      blinkTime += delta;
      if (blinkTime >= nextBlinkDuration) {
        blinkPhase += delta * 14; // Quick smooth blink speed
        if (blinkPhase >= Math.PI) {
          // Blink finished
          blinkPhase = 0;
          blinkTime = 0;
          nextBlinkDuration = 2.5 + Math.random() * 2.0; // Random natural interval
        }
      }

      // Sine wave blink: 0 (open: -PI/2) -> 1 (closed: 0) -> 0 (open: -PI/2)
      let blinkAmount = Math.sin(blinkPhase);
      if (blinkPhase === 0) blinkAmount = 0;

      // Eyelid rotation interpolates from -Math.PI * 0.5 (open) to 0.08 (fully closed)
      const openAngle = -Math.PI * 0.5;
      const closedAngle = 0.08;
      const currentEyelidAngle = openAngle + (closedAngle - openAngle) * blinkAmount;

      leftEyelid.rotation.x = currentEyelidAngle;
      rightEyelid.rotation.x = currentEyelidAngle;

      // 5. Floppy Ear Sway & Waggle
      let earSwayL = 0;
      let earSwayR = 0;

      if (currentStatus === 'happy') {
        earSwayL = Math.sin(elapsedTime * 10) * 0.22;
        earSwayR = Math.cos(elapsedTime * 10) * 0.22;
      } else if (currentStatus === 'listening') {
        earSwayL = 0.16 + Math.sin(elapsedTime * 4) * 0.06;
        earSwayR = 0.16 + Math.sin(elapsedTime * 4 + 0.4) * 0.06;
      } else {
        earSwayL = Math.sin(elapsedTime * 1.5) * 0.06 - mouse.x * 0.08;
        earSwayR = Math.sin(elapsedTime * 1.5 + 0.2) * 0.06 + mouse.x * 0.08;
      }

      leftEarPivot.rotation.x = -0.15 + earSwayL;
      rightEarPivot.rotation.x = -0.15 + earSwayR;

      // 6. Articulated 3D Mouth, Lips & Tongue Movement (Speech Reactive & Panting)
      let targetJawOpen = 0;
      if (currentStatus === 'speaking') {
        // Talking/barking speech articulation
        targetJawOpen = Math.abs(Math.sin(elapsedTime * 14)) * 0.22 + Math.abs(Math.sin(elapsedTime * 9)) * 0.1;
        tonguePivot.position.z = 0.35 + Math.sin(elapsedTime * 14) * 0.03;
        tonguePivot.rotation.x = -0.08 + Math.sin(elapsedTime * 12) * 0.04;
        tonguePivot.rotation.z = 0;
      } else if (currentStatus === 'happy') {
        // Happy panting puppy smile with tongue extended & lolling
        targetJawOpen = 0.22 + Math.sin(elapsedTime * 6) * 0.04;
        tonguePivot.position.z = 0.44 + Math.sin(elapsedTime * 8) * 0.04;
        tonguePivot.rotation.x = -0.22 + Math.sin(elapsedTime * 8) * 0.06;
        tonguePivot.rotation.z = Math.sin(elapsedTime * 10) * 0.08;
      } else if (currentStatus === 'listening') {
        // Attentive slightly parted jaw
        targetJawOpen = 0.06;
        tonguePivot.position.z = 0.31;
        tonguePivot.rotation.set(0, 0, 0);
      } else {
        // Subtle natural breathing with occasional cute yawn
        if (Math.sin(elapsedTime * 0.5) > 0.95) {
          targetJawOpen = Math.sin(elapsedTime * 8) * 0.14;
          tonguePivot.position.z = 0.39;
          tonguePivot.rotation.x = -0.16;
          tonguePivot.rotation.z = 0;
        } else {
          targetJawOpen = 0;
          tonguePivot.position.z = 0.28;
          tonguePivot.rotation.set(0, 0, 0);
        }
      }
      jawPivot.rotation.x = targetJawOpen;

      // 7. Gyroscopic Rings
      let ringSpeed = 0.015;
      let targetGlow = 0x38bdf8;

      if (currentStatus === 'thinking') {
        ringSpeed = 0.05;
        targetGlow = 0xc084fc;
      } else if (currentStatus === 'happy') {
        ringSpeed = 0.04;
        targetGlow = 0x34d399;
      }

      ring1.rotation.z += ringSpeed;
      ring1.rotation.x += ringSpeed * 0.3;
      ring2.rotation.z -= ringSpeed * 1.2;
      ring2.rotation.y += ringSpeed * 0.4;

      const targetCol = new THREE.Color(targetGlow);
      ring1Mat.color.lerp(targetCol, 0.08);
      particleMat.color.lerp(targetCol, 0.08);

      // 7. Aura Particles
      const positions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const vel = particleVelocities[i];
        const v = new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        );
        v.applyAxisAngle(vel.axis, vel.orbitSpeed * (currentStatus === 'thinking' ? 2.5 : 1.0));
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // 8. Theme Lighting
      if (currentTheme === 'light') {
        ambientLight.intensity = 1.35;
        keyLight.intensity = 1.6;
        rimLight.intensity = 2.0;
        renderer.toneMappingExposure = 1.15;
      } else {
        ambientLight.intensity = 0.8;
        keyLight.intensity = 1.3;
        rimLight.intensity = 3.6;
        renderer.toneMappingExposure = 1.25;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth || width;
      const newH = mount.clientHeight || height;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      skullGeo.dispose();
      faceGeo.dispose();
      snoutGeo.dispose();
      whiskerPadGeo.dispose();
      noseGeo.dispose();
      nostrilGeo.dispose();
      follicleDotGeo.dispose();
      whiskerHairGeos.forEach((g) => g.dispose());
      chinGeo.dispose();
      lowerLipGeo.dispose();
      mouthInteriorGeo.dispose();
      tongueGeo.dispose();
      tongueGrooveGeo.dispose();
      eyeGeo.dispose();
      socketRimGeo.dispose();
      eyelidGeo.dispose();
      earGeo.dispose();
      jointGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      particleGeo.dispose();
      chassisTex.dispose();
      faceTex.dispose();
      earTex.dispose();
      eyeTexture.dispose();
    };
  }, [compact]);

  return (
    <div
      ref={mountRef}
      onClick={onRobotClick}
      className={`relative select-none flex items-center justify-center overflow-hidden ${className}`}
      style={{
        cursor: onRobotClick ? 'pointer' : 'default',
        width: '100%',
        height: '100%'
      }}
    />
  );
}

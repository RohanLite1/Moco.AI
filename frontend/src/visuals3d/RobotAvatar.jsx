import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

// 2. Procedural Pearlescent Ceramic Chassis Texture (Pristine Sony Aibo White)
function createChassisTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base pearlescent white
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-pearlescent metallic flake shimmer
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.035;
    ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  return new THREE.CanvasTexture(canvas);
}

// 3. Procedural Champagne Ceramic Faceplate Texture (Signature Aibo Warm Mask)
function createFaceplateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ded8d0';
  ctx.fillRect(0, 0, 512, 512);

  // Soft satin ceramic micro-sheen
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.035;
    ctx.fillStyle = `rgba(180, 165, 150, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle natural light gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
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

    // Procedural Model Group (Falls back automatically if no Blender model is present)
    const proceduralGroup = new THREE.Group();
    headGroup.add(proceduralGroup);

    // Model state tracking for procedural multi-joint robotics rig
    const modelState = {
      isLoaded: false,
      joints: {},
      initialRotations: {},
      initialPositions: {},
      eyeMaterials: [],
      antennaMaterials: []
    };

    // Auto-load Blender / Sketchfab .glb model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/aibo.glb',
      (gltf) => {
        const loaded = gltf.scene;

        // Traverse and upgrade materials
        loaded.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mat = child.material;
              mat.needsUpdate = true;
              // Reactive glowing eyes
              if (child.name.includes('Eyes') || mat.name === 'Eyes') {
                mat.emissive = new THREE.Color(0x38bdf8);
                mat.emissiveIntensity = 1.6;
                modelState.eyeMaterials.push(mat);
              }
              // Reactive antenna indicator bulb
              if (child.name.includes('light') || mat.name === 'light') {
                mat.emissive = new THREE.Color(0x38bdf8);
                mat.emissiveIntensity = 2.2;
                modelState.antennaMaterials.push(mat);
              }
              // Pearlescent cyber chassis enhancement
              if (mat.name === 'Head' || mat.name === 'chestMat' || mat.name === 'ForeArmMat') {
                mat.metalness = 0.28;
                mat.roughness = 0.22;
              }
              if (mat.name === 'Ears' || mat.name === 'Antenna' || mat.name === 'Neck') {
                mat.metalness = 0.6;
                mat.roughness = 0.32;
              }
            }
          }
        });

        // Map robot joints for procedural animation
        const joints = {
          head: loaded.getObjectByName('Head'),
          antenna: loaded.getObjectByName('Antenna'),
          antennaLight: loaded.getObjectByName('Antenna_light_0'),
          ears: loaded.getObjectByName('Head_Ears_0'),
          eyes: loaded.getObjectByName('Head_Eyes_0'),
          neck: loaded.getObjectByName('Neck'),
          chest: loaded.getObjectByName('Chest'),
          midSpine: loaded.getObjectByName('MidSpine'),
          hips: loaded.getObjectByName('Hips'),
          leftArm: loaded.getObjectByName('LeftArm'),
          rightArm: loaded.getObjectByName('RightArm'),
          leftWheel: loaded.getObjectByName('LeftWheel'),
          rightWheel: loaded.getObjectByName('RightWheel')
        };
        modelState.joints = joints;

        for (const [key, obj] of Object.entries(joints)) {
          if (obj) {
            modelState.initialRotations[key] = obj.rotation.clone();
            modelState.initialPositions[key] = obj.position.clone();
          }
        }

        // Frame and scale cleanly inside viewport
        const box = new THREE.Box3().setFromObject(loaded);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const s = (compact ? 2.5 : 2.9) / maxDim;
          loaded.scale.setScalar(s);
          const yAdjust = compact ? -(size.y * s * 0.14) : 0;
          loaded.position.set(-center.x * s, -center.y * s + yAdjust, -center.z * s);
        }

        proceduralGroup.visible = false;
        rootGroup.add(loaded);
        modelState.isLoaded = true;
      },
      undefined,
      () => {
        // Fallback procedural model stays active
      }
    );

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
    proceduralGroup.add(skullMesh);

    // Front Beige Faceplate
    const faceGeo = new THREE.SphereGeometry(0.96, 36, 36);
    faceGeo.scale(1.08, 0.98, 1.15);
    faceGeo.translate(0, 0.02, 0.18);
    const faceMesh = new THREE.Mesh(faceGeo, beigeFaceMat);
    proceduralGroup.add(faceMesh);

    // -------------------------------------------------------------------------
    // 2. SONY AIBO SNOUT & CAMERA BUTTON NOSE (OFFICIAL REPLICA)
    // -------------------------------------------------------------------------
    // Seamless Champagne Muzzle / Snout
    const snoutGeo = new THREE.SphereGeometry(0.60, 36, 36);
    snoutGeo.scale(1.15, 0.84, 1.28);
    snoutGeo.translate(0, -0.19, 0.84);
    const snoutMesh = new THREE.Mesh(snoutGeo, beigeFaceMat);
    proceduralGroup.add(snoutMesh);

    // Sony Aibo Sensor Button Nose
    const noseGeo = new THREE.SphereGeometry(0.18, 24, 24);
    noseGeo.scale(1.22, 0.88, 0.92);
    noseGeo.translate(0, -0.05, 1.38);
    const noseMesh = new THREE.Mesh(noseGeo, darkTrimMat);
    proceduralGroup.add(noseMesh);

    // Front Camera Lens Element inside Aibo's nose
    const lensRimGeo = new THREE.TorusGeometry(0.045, 0.012, 16, 24);
    const lensRim = new THREE.Mesh(lensRimGeo, darkTrimMat);
    lensRim.position.set(0, -0.05, 1.48);
    proceduralGroup.add(lensRim);

    const lensGlassGeo = new THREE.SphereGeometry(0.038, 16, 16);
    lensGlassGeo.scale(1, 1, 0.35);
    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      emissive: new THREE.Color(0x0369a1),
      emissiveIntensity: 0.4
    });
    const lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
    lensGlass.position.set(0, -0.05, 1.485);
    proceduralGroup.add(lensGlass);

    // Clean Horizontal Mouth Seam
    const mouthSeamGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.46, 16);
    mouthSeamGeo.rotateZ(Math.PI / 2);
    mouthSeamGeo.translate(0, -0.28, 1.14);
    const mouthSeam = new THREE.Mesh(mouthSeamGeo, darkTrimMat);
    proceduralGroup.add(mouthSeam);


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

    proceduralGroup.add(jawPivot);

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
    proceduralGroup.add(leftEyePivot);

    // Right Eyeball
    const rightEyePivot = new THREE.Group();
    rightEyePivot.position.set(0.46, 0.22, 0.92);
    const rightEyeball = new THREE.Mesh(eyeGeo, eyeballMat);
    rightEyePivot.add(rightEyeball);
    proceduralGroup.add(rightEyePivot);

    // 3D Eye Socket Recess Rims (Contoured black ring around each eye)
    const socketRimGeo = new THREE.TorusGeometry(eyeRadius + 0.02, 0.035, 16, 32);
    const leftRim = new THREE.Mesh(socketRimGeo, darkTrimMat);
    leftRim.position.set(-0.46, 0.22, 0.94);
    leftRim.rotation.y = Math.PI * 0.12;
    proceduralGroup.add(leftRim);

    const rightRim = new THREE.Mesh(socketRimGeo, darkTrimMat);
    rightRim.position.set(0.46, 0.22, 0.94);
    rightRim.rotation.y = -Math.PI * 0.12;
    proceduralGroup.add(rightRim);

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
    proceduralGroup.add(leftEyelid);

    // Right Upper Eyelid
    const rightEyelid = new THREE.Mesh(eyelidGeo, beigeFaceMat);
    rightEyelid.position.set(0.46, 0.22, 0.92);
    rightEyelid.rotation.x = -Math.PI * 0.5; // Start open
    proceduralGroup.add(rightEyelid);

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
    proceduralGroup.add(leftEarPivot);

    // Right Ear Unit
    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(0.95, 0.72, -0.05);
    rightEarPivot.rotation.set(-0.15, -0.25, -0.32);

    const rightJointMesh = new THREE.Mesh(jointGeo, darkTrimMat);
    rightEarPivot.add(rightJointMesh);

    const rightEarMesh = new THREE.Mesh(earGeo, brownEarMat);
    rightEarMesh.scale.x = -1;
    rightEarPivot.add(rightEarMesh);
    proceduralGroup.add(rightEarPivot);

    // -------------------------------------------------------------------------
    // 6. BACK-HALO CELESTIAL RINGS & AURA PARTICLES (BEHIND HEAD - ZERO LINES OVER NOSE)
    // -------------------------------------------------------------------------
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.05, -0.65); // Safely positioned behind skull and ears
    proceduralGroup.add(haloGroup);

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
    proceduralGroup.add(particles);

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

    const eyeFill = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    eyeFill.position.set(0, 0.5, 4.5);
    scene.add(eyeFill);

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

    // Wave timers for random periodic waving & answering gestures
    let waveTimer = 0;
    let nextWaveInterval = 6.0; // Next wave in 6-14s
    const waveDuration = 2.4; // Wave animation lasts 2.4s

    let lastStatus = 'idle';

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const currentStatus = statusRef.current;
      const currentTheme = themeRef.current;

      // Update wave timer logic
      waveTimer += delta;
      if (waveTimer >= nextWaveInterval + waveDuration) {
        waveTimer = 0;
        nextWaveInterval = 7.0 + Math.random() * 8.0; // Random interval between 7s and 15s
      }
      const isPeriodicWaving = waveTimer >= nextWaveInterval && waveTimer < nextWaveInterval + waveDuration;
      const isAnswering = currentStatus === 'speaking';

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

      if (modelState.isLoaded) {
        const { joints, initialRotations, initialPositions, eyeMaterials, antennaMaterials } = modelState;

        // 1. Gentle body hover & respiration
        const hoverSpeed = currentStatus === 'thinking' ? 2.6 : currentStatus === 'speaking' ? 3.0 : 1.6;
        const hoverAmp = compact ? 0.025 : 0.055;
        rootGroup.position.y = Math.sin(elapsedTime * hoverSpeed) * hoverAmp;
        rootGroup.position.x = Math.sin(elapsedTime * 0.8) * 0.01;

        // 2. Head look-at cursor with expressive puppy tilts (Inverted horizontal sign to track cursor correctly)
        if (joints.head && initialRotations.head) {
          const init = initialRotations.head;
          const headTilt = Math.sin(elapsedTime * 0.6) * 0.05;
          let statusTiltX = 0;
          let statusTiltY = 0;
          let statusTiltZ = 0;

          if (currentStatus === 'thinking') {
            statusTiltX = -0.15; // Inquisitive look up
            statusTiltZ = 0.12;  // Curious puppy head cock
          } else if (currentStatus === 'happy') {
            statusTiltX = Math.sin(elapsedTime * 8) * 0.08; // Happy rhythmic nodding
            statusTiltZ = Math.sin(elapsedTime * 4) * 0.06;
          } else if (currentStatus === 'speaking') {
            statusTiltX = Math.sin(elapsedTime * 12) * 0.06; // Speech nodding
          } else if (currentStatus === 'listening') {
            statusTiltZ = -0.10; // Attentive ear cock
            statusTiltX = 0.05;
          }

          joints.head.rotation.y = init.y - mouse.x * 0.45 + Math.sin(elapsedTime * 0.4) * 0.02 + statusTiltY;
          joints.head.rotation.x = init.x - mouse.y * 0.35 + Math.sin(elapsedTime * 0.6) * 0.02 + statusTiltX;
          joints.head.rotation.z = init.z + mouse.x * 0.12 + headTilt + statusTiltZ;
        }

        // 3. Antenna spring physics, waggle & bobble
        if (joints.antenna && initialRotations.antenna) {
          const init = initialRotations.antenna;
          const waggleSpeed = currentStatus === 'thinking' ? 12 : currentStatus === 'happy' ? 10 : 3.5;
          const waggleAmp = currentStatus === 'thinking' ? 0.22 : currentStatus === 'happy' ? 0.18 : 0.06;
          const inertiaX = mouse.y * 0.15;
          const inertiaZ = mouse.x * 0.2;
          joints.antenna.rotation.z = init.z + Math.sin(elapsedTime * waggleSpeed) * waggleAmp + inertiaZ;
          joints.antenna.rotation.x = init.x + Math.cos(elapsedTime * (waggleSpeed * 0.8)) * (waggleAmp * 0.6) + inertiaX;
        }

        // 4. Ears twitching & expressive reaction
        if (joints.ears && initialRotations.ears) {
          const init = initialRotations.ears;
          let earWiggle = 0;
          if (currentStatus === 'happy') {
            earWiggle = Math.sin(elapsedTime * 14) * 0.12;
          } else if (currentStatus === 'listening') {
            earWiggle = 0.08 + Math.sin(elapsedTime * 5) * 0.03;
          } else {
            earWiggle = Math.sin(elapsedTime * 1.5) * 0.025;
          }
          joints.ears.rotation.x = init.x + earWiggle;
          joints.ears.rotation.z = init.z - (mouse.x * 0.04);
        }

        // 5. Left and Right Arms: Interactive Waving & Conversational Gestures
        if (joints.leftArm && initialRotations.leftArm && joints.rightArm && initialRotations.rightArm) {
          const initL = initialRotations.leftArm;
          const initR = initialRotations.rightArm;

          if (isAnswering) {
            // Conversational arm gestures while answering speech/questions
            joints.rightArm.rotation.x = initR.x - 0.75 + Math.sin(elapsedTime * 9) * 0.22;
            joints.rightArm.rotation.y = initR.y + Math.cos(elapsedTime * 7) * 0.25;
            joints.rightArm.rotation.z = initR.z + 0.25 + Math.sin(elapsedTime * 6) * 0.12;

            joints.leftArm.rotation.x = initL.x - 0.45 + Math.cos(elapsedTime * 8) * 0.18;
            joints.leftArm.rotation.y = initL.y - Math.sin(elapsedTime * 6) * 0.15;
            joints.leftArm.rotation.z = initL.z - 0.18;
          } else if (isPeriodicWaving) {
            // Cute periodic waving at random intervals
            const wavePhase = (waveTimer - nextWaveInterval) / waveDuration; // 0 to 1
            const waveEnvelope = Math.sin(wavePhase * Math.PI); // Smooth rise and fall

            // Lift right arm up into high wave
            joints.rightArm.rotation.x = initR.x - (1.25 * waveEnvelope);
            joints.rightArm.rotation.z = initR.z + (0.35 * waveEnvelope);
            // Quick friendly paw wave oscillation
            joints.rightArm.rotation.y = initR.y + (Math.sin(elapsedTime * 14) * 0.38 * waveEnvelope);

            // Left arm subtle balancing lean
            joints.leftArm.rotation.x = initL.x - (0.15 * waveEnvelope);
            joints.leftArm.rotation.z = initL.z - (0.1 * waveEnvelope);
          } else if (currentStatus === 'happy') {
            // Excited celebratory double arm wave
            joints.leftArm.rotation.x = initL.x - 0.55 + Math.sin(elapsedTime * 9) * 0.25;
            joints.rightArm.rotation.x = initR.x - 0.55 + Math.cos(elapsedTime * 9) * 0.25;
            joints.leftArm.rotation.z = initL.z - 0.22;
            joints.rightArm.rotation.z = initR.z + 0.22;
            joints.rightArm.rotation.y = initR.y + Math.sin(elapsedTime * 12) * 0.2;
          } else if (currentStatus === 'thinking') {
            // Pondering pose: right arm raises toward chin
            joints.rightArm.rotation.x = initR.x - 0.62 + Math.sin(elapsedTime * 3) * 0.04;
            joints.rightArm.rotation.y = initR.y + 0.18;
            joints.leftArm.rotation.x = initL.x + Math.sin(elapsedTime * 2) * 0.04;
          } else {
            // Idle gentle resting swing
            joints.leftArm.rotation.x = initL.x + Math.sin(elapsedTime * 1.8) * 0.06;
            joints.rightArm.rotation.x = initR.x - Math.sin(elapsedTime * 1.8) * 0.06;
            joints.leftArm.rotation.z = initL.z;
            joints.rightArm.rotation.z = initR.z;
            joints.rightArm.rotation.y = initR.y;
            joints.leftArm.rotation.y = initL.y;
          }
        }

        // 6. Chest, Spine & Neck natural breathing
        if (joints.chest && initialPositions.chest) {
          joints.chest.position.y = initialPositions.chest.y + Math.sin(elapsedTime * 2.2) * 0.003;
        }
        if (joints.neck && initialRotations.neck) {
          joints.neck.rotation.x = initialRotations.neck.x - mouse.y * 0.08 + Math.sin(elapsedTime * 1.2) * 0.015;
          joints.neck.rotation.y = initialRotations.neck.y - mouse.x * 0.1;
        }

        // 7. Wheels subtle roll with body motion
        if (joints.leftWheel && joints.rightWheel) {
          const wheelRoll = (-mouse.x * 0.04) + Math.sin(elapsedTime * 2) * 0.015;
          joints.leftWheel.rotation.x += wheelRoll;
          joints.rightWheel.rotation.x += wheelRoll;
        }

        // 8. Dynamic OLED Eyes & Antenna Light Emissive Pulsing
        let targetColor = new THREE.Color(0x38bdf8); // Cyan
        let targetIntensity = 1.3;

        if (currentStatus === 'thinking') {
          targetColor = new THREE.Color(0xc084fc); // Electric Purple
          targetIntensity = 1.7 + Math.sin(elapsedTime * 8) * 0.5;
        } else if (currentStatus === 'happy') {
          targetColor = new THREE.Color(0x34d399); // Emerald Green
          targetIntensity = 1.9 + Math.sin(elapsedTime * 10) * 0.4;
        } else if (currentStatus === 'listening') {
          targetColor = new THREE.Color(0x38bdf8); // Pulsing Cyan
          targetIntensity = 1.6 + Math.sin(elapsedTime * 6) * 0.5;
        } else if (currentStatus === 'speaking') {
          targetColor = new THREE.Color(0x60a5fa); // Bright Blue audio pulse
          targetIntensity = 1.5 + Math.abs(Math.sin(elapsedTime * 12)) * 0.8;
        }

        for (const mat of eyeMaterials) {
          mat.emissive.lerp(targetColor, 0.1);
          mat.emissiveIntensity = targetIntensity;
        }
        for (const mat of antennaMaterials) {
          mat.emissive.lerp(targetColor, 0.1);
          mat.emissiveIntensity = targetIntensity * 1.4;
        }
      } else {
        // Fallback: 1. Natural Gentle Hovering
        const hoverSpeed = currentStatus === 'thinking' ? 2.8 : 1.5;
        const hoverAmp = compact ? 0.03 : 0.07;
        rootGroup.position.y = Math.sin(elapsedTime * hoverSpeed) * hoverAmp;

        // Fallback: 2. Head Tilts & Look-At Mouse
        const maxRotX = 0.3;
        const maxRotY = 0.48;
        const headTilt = Math.sin(elapsedTime * 0.6) * 0.06;
        headGroup.rotation.y = mouse.x * maxRotY + Math.sin(elapsedTime * 0.4) * 0.03;
        headGroup.rotation.x = -mouse.y * maxRotX + Math.sin(elapsedTime * 0.6) * 0.025;
        headGroup.rotation.z = -mouse.x * 0.12 + headTilt;

        // Fallback: 3. Eyeballs Smooth Gaze Look-At
        const maxEyeGazeX = 0.35;
        const maxEyeGazeY = 0.25;
        leftEyePivot.rotation.y = mouse.x * maxEyeGazeX;
        leftEyePivot.rotation.x = -mouse.y * maxEyeGazeY;
        rightEyePivot.rotation.y = mouse.x * maxEyeGazeX;
        rightEyePivot.rotation.x = -mouse.y * maxEyeGazeY;

        // Fallback: 4. Realistic 3D Eyelid Blink Animation
        blinkTime += delta;
        if (blinkTime >= nextBlinkDuration) {
          blinkPhase += delta * 14;
          if (blinkPhase >= Math.PI) {
            blinkPhase = 0;
            blinkTime = 0;
            nextBlinkDuration = 2.5 + Math.random() * 2.0;
          }
        }

        let blinkAmount = Math.sin(blinkPhase);
        if (blinkPhase === 0) blinkAmount = 0;
        const openAngle = -Math.PI * 0.5;
        const closedAngle = 0.08;
        const currentEyelidAngle = openAngle + (closedAngle - openAngle) * blinkAmount;
        leftEyelid.rotation.x = currentEyelidAngle;
        rightEyelid.rotation.x = currentEyelidAngle;

        // Fallback: 5. Floppy Ear Sway & Waggle
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

        // Fallback: 6. Articulated 3D Mouth
        let targetJawOpen = 0;
        if (currentStatus === 'speaking') {
          targetJawOpen = Math.abs(Math.sin(elapsedTime * 14)) * 0.22 + Math.abs(Math.sin(elapsedTime * 9)) * 0.1;
          tonguePivot.position.z = 0.35 + Math.sin(elapsedTime * 14) * 0.03;
          tonguePivot.rotation.x = -0.08 + Math.sin(elapsedTime * 12) * 0.04;
          tonguePivot.rotation.z = 0;
        } else if (currentStatus === 'happy') {
          targetJawOpen = 0.22 + Math.sin(elapsedTime * 6) * 0.04;
          tonguePivot.position.z = 0.44 + Math.sin(elapsedTime * 8) * 0.04;
          tonguePivot.rotation.x = -0.22 + Math.sin(elapsedTime * 8) * 0.06;
          tonguePivot.rotation.z = Math.sin(elapsedTime * 10) * 0.08;
        } else if (currentStatus === 'listening') {
          targetJawOpen = 0.06;
          tonguePivot.position.z = 0.31;
          tonguePivot.rotation.set(0, 0, 0);
        } else {
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
      }

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
      noseGeo.dispose();
      lensRimGeo.dispose();
      lensGlassGeo.dispose();
      lensGlassMat.dispose();
      mouthSeamGeo.dispose();
      chinGeo.dispose();
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

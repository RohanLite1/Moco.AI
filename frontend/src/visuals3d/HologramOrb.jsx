import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HologramOrb({ status = 'idle' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Group for all rotating elements
    const group = new THREE.Group();
    scene.add(group);

    // 1. Inner Core Icosahedron Wireframe
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 2. Surrounding Particle Cloud
    const particleCount = 700;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.6 + Math.random() * 0.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x7000ff,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    group.add(particleSystem);

    // 3. Orbital Ring
    const ringGeo = new THREE.TorusGeometry(2.1, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // State-based animation speeds
      let rotSpeed = 0.008;
      let pulseAmp = 0.05;
      let targetColor = 0x00f0ff;

      if (status === 'thinking') {
        rotSpeed = 0.035;
        pulseAmp = 0.15;
        targetColor = 0xa855f7; // Purple
      } else if (status === 'speaking') {
        rotSpeed = 0.02;
        pulseAmp = 0.25;
        targetColor = 0x06b6d4; // Cyan Glow
      }

      group.rotation.y += rotSpeed;
      group.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15;
      ringMesh.rotation.z -= rotSpeed * 0.5;

      // Pulse scaling
      const scale = 1 + Math.sin(elapsedTime * (status === 'speaking' ? 8 : 2)) * pulseAmp;
      coreMesh.scale.set(scale, scale, scale);

      // Dynamic color shift
      coreMat.color.lerp(new THREE.Color(targetColor), 0.05);
      particleMat.color.lerp(new THREE.Color(status === 'speaking' ? 0x38bdf8 : 0x8b5cf6), 0.05);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [status]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-[260px]">
      <div ref={mountRef} className="w-full h-full flex items-center justify-center cursor-pointer" />
      <div className="absolute bottom-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest backdrop-blur-md bg-black/40 border border-cyan-500/30 text-cyan-300">
        Status: <span className="text-white font-semibold">{status}</span>
      </div>
    </div>
  );
}

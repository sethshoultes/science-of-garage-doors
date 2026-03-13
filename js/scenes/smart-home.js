/**
 * smart-home.js — IoT ecosystem with hub, devices, signal rings, IR beams.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matGreen } from '../core/materials.js';

export const descriptor = {
  id: 'smart-openers',
  canvasId: 'smartCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    addLights(scene);

    // Central hub (opener with Wi-Fi)
    const hub = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), matDarkSteel);
    scene.add(hub);

    // Wi-Fi antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), matSteel);
    antenna.position.set(0.4, 0.5, 0);
    scene.add(antenna);

    // Signal rings
    const rings = [];
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1 + i * 0.8, 0.02, 8, 32),
        new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.3 - i * 0.06,
          emissive: 0x22d3ee,
          emissiveIntensity: 0.3,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.5;
      scene.add(ring);
      rings.push(ring);
    }

    // Connected devices
    const devicePositions = [
      { x: -3, z: -2, label: 'Phone', color: 0xffffff },
      { x: 3, z: -2, label: 'Router', color: 0x22c55e },
      { x: -3, z: 2, label: 'HomeKit', color: 0xff6b2b },
      { x: 3, z: 2, label: 'Remote', color: 0xffa733 },
      { x: 0, z: -3.5, label: 'Cloud', color: 0x22d3ee },
    ];

    devicePositions.forEach((d) => {
      const device = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: d.color, metalness: 0.3, roughness: 0.5 })
      );
      device.position.set(d.x, 0, d.z);
      scene.add(device);

      // Connection line
      const linePts = [new THREE.Vector3(d.x, 0.15, d.z), new THREE.Vector3(0, 0.25, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.3 }));
      scene.add(line);
    });

    // Sensor beams at bottom
    const irL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matGreen);
    irL.position.set(-2, -1, 1);
    scene.add(irL);
    const irR = irL.clone();
    irR.position.set(2, -1, 1);
    scene.add(irR);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, transparent: true, opacity: 0.4, emissive: 0x22c55e, emissiveIntensity: 0.5 })
    );
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0, -1, 1);
    scene.add(beam);

    let active = false;
    let rafId = null;
    let time = 0;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      time += 0.016;

      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      rings.forEach((r, i) => {
        const scale = 1 + Math.sin(time * 2 - i * 0.5) * 0.1;
        r.scale.set(scale, scale, scale);
        r.material.opacity = (0.3 - i * 0.06) * (0.7 + Math.sin(time * 2 - i * 0.5) * 0.3);
      });

      renderer.render(scene, camera);
    }

    return {
      resume() { active = true; animate(); },
      pause() { active = false; cancelAnimationFrame(rafId); },
      dispose() {
        this.pause();
        renderer.dispose();
      },
    };
  },
};

/**
 * motor-internals.js — PSC motor exploded view with all components.
 * Actions: toggle-motor-explode, toggle-motor-run
 * Explode animation with userData.explodeOffset.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matOrange, matWire } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';
import { ActionRegistry } from '../core/scene-manager.js';

export const descriptor = {
  id: 'motor-internals',
  canvasId: 'motorCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(5, 3, 7);
    camera.lookAt(0, 0, 0);

    addLights(scene);
    makeOrbitLike(camera, canvas);

    // Motor casing (split for exploded view)
    const casingTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.8, 20, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    casingTop.position.y = 0.4;
    casingTop.userData.explodeOffset = new THREE.Vector3(0, 2, 0);
    scene.add(casingTop);

    const casingBot = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.8, 20, 1, false, Math.PI, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    casingBot.position.y = 0.4;
    casingBot.userData.explodeOffset = new THREE.Vector3(0, -1.5, 0);
    scene.add(casingBot);

    // Stator windings (copper coils)
    const statorGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.04, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xdd8833, metalness: 0.8, roughness: 0.3 })
      );
      coil.position.set(Math.cos(angle) * 0.65, 0.4, Math.sin(angle) * 0.65);
      coil.rotation.x = Math.PI / 2;
      coil.lookAt(0, 0.4, 0);
      statorGroup.add(coil);
    }
    statorGroup.userData.explodeOffset = new THREE.Vector3(2, 0, 0);
    scene.add(statorGroup);

    // Rotor (squirrel cage)
    const rotor = new THREE.Group();
    const rotorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16), matDarkSteel);
    rotor.add(rotorCore);
    // Rotor bars
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 4), matSteel);
      bar.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
      rotor.add(bar);
    }
    // Rotor shaft
    const rotorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), matSteel);
    rotor.add(rotorShaft);
    rotor.position.y = 0.4;
    rotor.userData.explodeOffset = new THREE.Vector3(0, 0, 0);
    scene.add(rotor);

    // Worm gear
    const wormGroup = new THREE.Group();
    // Worm (on motor shaft)
    const wormPts = [];
    for (let t = 0; t < Math.PI * 8; t += 0.15) {
      wormPts.push(new THREE.Vector3(0, t * 0.025 - 0.5, 0).add(
        new THREE.Vector3(Math.cos(t) * 0.12, 0, Math.sin(t) * 0.12)
      ));
    }
    const wormCurve = new THREE.CatmullRomCurve3(wormPts);
    const worm = new THREE.Mesh(new THREE.TubeGeometry(wormCurve, 50, 0.025, 6, false), matSteel);
    wormGroup.add(worm);

    // Worm wheel (large gear)
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 24), matOrange);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0.55, 0, 0);
    wormGroup.add(wheel);
    // Gear teeth on wheel
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), matOrange);
      tooth.position.set(0.55 + Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0);
      wormGroup.add(tooth);
    }

    wormGroup.position.set(0, -0.8, 0);
    wormGroup.userData.explodeOffset = new THREE.Vector3(-2, -1, 0);
    scene.add(wormGroup);

    // Capacitor
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x2255aa, metalness: 0.3, roughness: 0.6 })
    );
    cap.position.set(1.3, 0.4, 0.5);
    cap.userData.explodeOffset = new THREE.Vector3(3, 1, 1);
    scene.add(cap);
    // Cap leads
    const capLeads = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), matWire);
    capLeads.position.set(1.3, 0.7, 0.5);
    cap.add(capLeads);

    // Circuit board
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x116633, roughness: 0.7 })
    );
    pcb.position.set(0, 1.3, 0);
    pcb.userData.explodeOffset = new THREE.Vector3(0, 3.5, 0);
    scene.add(pcb);
    // Components on PCB
    for (let i = 0; i < 8; i++) {
      const comp = new THREE.Mesh(
        new THREE.BoxGeometry(0.06 + Math.random() * 0.1, 0.04, 0.04 + Math.random() * 0.06),
        new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x222222 : 0xaa3333 })
      );
      comp.position.set((Math.random() - 0.5) * 0.8, 0.04, (Math.random() - 0.5) * 0.5);
      pcb.add(comp);
    }

    // Limit switch
    const limitSw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), matOrange);
    limitSw.position.set(-1.2, -0.5, 0.5);
    limitSw.userData.explodeOffset = new THREE.Vector3(-3, -1, 2);
    scene.add(limitSw);

    const explodables = [casingTop, casingBot, statorGroup, wormGroup, cap, pcb, limitSw];

    // State
    let motorExploded = false;
    let motorRunning = false;
    let motorExplodeT = 0;

    // Register actions
    ActionRegistry.register('toggle-motor-explode', () => { motorExploded = !motorExploded; });
    ActionRegistry.register('toggle-motor-run', () => { motorRunning = !motorRunning; });

    let active = false;
    let rafId = null;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Explode animation
      const targetT = motorExploded ? 1 : 0;
      motorExplodeT += (targetT - motorExplodeT) * 0.04;

      explodables.forEach((obj) => {
        if (obj.userData.explodeOffset) {
          const off = obj.userData.explodeOffset;
          const basePos = obj.userData.basePos || obj.position.clone();
          if (!obj.userData.basePos) obj.userData.basePos = basePos.clone();
          obj.position.lerpVectors(basePos, basePos.clone().add(off), motorExplodeT);
        }
      });

      // Motor rotation
      if (motorRunning) {
        rotor.rotation.y += 0.15;
        wormGroup.children.forEach((c, i) => {
          if (i === 0) c.rotation.y += 0.15; // worm
        });
        wheel.rotation.z += 0.15 / 40; // gear reduction
      }

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

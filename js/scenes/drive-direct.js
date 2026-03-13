/**
 * drive-direct.js — Direct drive with stationary chain, motor-as-trolley, internal gear.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matOrange } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';

export const descriptor = {
  id: 'tab-direct',
  canvasId: 'directCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);

    addLights(scene);
    makeOrbitLike(camera, canvas);

    // Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 0.15), matDarkSteel);
    scene.add(rail);

    // Stationary chain in rail
    for (let i = -3.5; i < 3.5; i += 0.12) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), matDarkSteel);
      link.position.set(i, -0.05, 0);
      scene.add(link);
    }

    // Motor IS the trolley
    const trolley = new THREE.Group();
    const motorBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), matOrange);
    trolley.add(motorBody);

    // Internal gear indicator
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), matSteel);
    gear.position.y = -0.15;
    trolley.add(gear);

    trolley.position.set(0, 0.3, 0);
    scene.add(trolley);

    // Power cable (flexible)
    const cablePts = [
      new THREE.Vector3(-4, 1.5, 0),
      new THREE.Vector3(-3, 0.8, 0),
      new THREE.Vector3(-1, 0.5, 0),
      new THREE.Vector3(0, 0.3, 0),
    ];
    const cableCurve = new THREE.CatmullRomCurve3(cablePts);
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(cableCurve, 20, 0.02, 6, false),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85 })
    );
    scene.add(cable);

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

      trolley.position.x = Math.sin(time * 0.5) * 2.5;
      gear.rotation.z += 0.05;

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

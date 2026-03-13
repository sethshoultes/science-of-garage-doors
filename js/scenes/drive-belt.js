/**
 * drive-belt.js — Belt drive with rubber belt, reinforcement lines, pulley.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matRubber, matOrange } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';

export const descriptor = {
  id: 'tab-belt',
  canvasId: 'beltCanvas',

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

    // Motor housing
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.8), matDarkSteel);
    housing.position.x = -3.5;
    scene.add(housing);

    // Belt (smooth rubber)
    const belt = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.03, 0.25), matRubber);
    belt.position.set(-0.25, 0.1, 0);
    scene.add(belt);

    // Reinforcement lines
    for (let i = 0; i < 3; i++) {
      const rLine = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.005, 0.005),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 })
      );
      rLine.position.set(-0.25, 0.1, (i - 1) * 0.08);
      scene.add(rLine);
    }

    // Pulley
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 16), matSteel);
    pulley.position.set(-3.5, 0.1, 0);
    scene.add(pulley);

    // Trolley
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), matOrange);
    trolley.position.set(1, 0.2, 0);
    scene.add(trolley);

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
      pulley.rotation.z += 0.03;

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

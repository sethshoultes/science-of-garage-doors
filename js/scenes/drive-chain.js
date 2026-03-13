/**
 * drive-chain.js — Chain drive scene with chain links, sprocket, trolley.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matOrange } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';

export const descriptor = {
  id: 'tab-chain',
  canvasId: 'chainCanvas',

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

    // Chain links along rail
    for (let i = -3; i < 3.5; i += 0.15) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.06), matSteel);
      link.position.set(i, 0.1, 0);
      scene.add(link);
    }

    // Sprocket
    const sprocket = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 12), matOrange);
    sprocket.position.set(-3.5, 0.1, 0);
    scene.add(sprocket);

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
      sprocket.rotation.z += 0.03;

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

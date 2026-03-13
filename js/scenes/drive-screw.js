/**
 * drive-screw.js — Screw drive with threaded rod helix, coupling.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matOrange } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';

export const descriptor = {
  id: 'tab-screw',
  canvasId: 'screwCanvas',

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

    // Threaded rod (helix)
    const rodPts = [];
    for (let t = 0; t < Math.PI * 80; t += 0.3) {
      const x = (t / (Math.PI * 80)) * 7 - 3.5;
      rodPts.push(new THREE.Vector3(x, 0.06 * Math.cos(t), 0.06 * Math.sin(t)));
    }
    const rodCurve = new THREE.CatmullRomCurve3(rodPts);
    const rod = new THREE.Mesh(new THREE.TubeGeometry(rodCurve, 300, 0.025, 6, false), matSteel);
    scene.add(rod);

    // Core rod
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7, 8), matDarkSteel);
    core.rotation.z = Math.PI / 2;
    scene.add(core);

    // Trolley
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), matOrange);
    trolley.position.set(1, 0.15, 0);
    scene.add(trolley);

    // Threaded coupling inside trolley
    const coupling = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xdddd44, metalness: 0.4, roughness: 0.5 })
    );
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(1, 0.15, 0);
    scene.add(coupling);

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
      coupling.position.x = trolley.position.x;
      rod.rotation.x += 0.02;

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

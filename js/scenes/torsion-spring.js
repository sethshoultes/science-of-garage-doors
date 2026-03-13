/**
 * torsion-spring.js — Spring winding/unwinding with dynamic mesh rebuild.
 * Actions: wind-spring, unwind-spring
 * Slider: door weight (80-400 lbs)
 * Readout: turns, energy, torque, wire stress
 * Color changes based on stress level.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel, matOrange } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';
import { ActionRegistry } from '../core/scene-manager.js';

/**
 * Safely update a readout element's display value and unit.
 */
function setReadout(elementId, value, unit) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.appendChild(document.createTextNode(value));
  const span = document.createElement('span');
  span.className = 'readout-unit';
  span.textContent = unit;
  el.appendChild(span);
}

export const descriptor = {
  id: 'torsion-springs',
  canvasId: 'springCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(4, 2, 6);
    camera.lookAt(0, 0, 0);

    addLights(scene);
    makeOrbitLike(camera, canvas);

    // Central shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 12), matDarkSteel);
    shaft.rotation.z = Math.PI / 2;
    scene.add(shaft);

    // Spring coils — rebuilt dynamically
    let springMesh = null;
    const springMat = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.8, roughness: 0.2 });

    function buildSpring(windAngle) {
      if (springMesh) {
        springMesh.geometry.dispose();
        scene.remove(springMesh);
      }
      const pts = [];
      const coils = 30;
      const baseLen = 3;
      // As spring winds, it compresses slightly
      const compression = 1 - windAngle * 0.01;
      const len = baseLen * Math.max(0.7, compression);

      for (let t = 0; t < Math.PI * 2 * coils; t += 0.12) {
        const progress = t / (Math.PI * 2 * coils);
        const radius = 0.35;
        pts.push(new THREE.Vector3(
          (progress - 0.5) * len,
          Math.cos(t + windAngle * 0.5) * radius,
          Math.sin(t + windAngle * 0.5) * radius
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      springMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.04, 8, false), springMat);
      scene.add(springMesh);

      // Color based on stress
      const stress = windAngle / 7.5;
      const r = Math.min(1, 0.5 + stress * 0.5);
      const g = Math.max(0, 0.3 - stress * 0.3);
      springMat.color.setRGB(r, g, 0.1);
      springMat.emissive.setRGB(r * 0.1, 0, 0);
    }

    // End plates
    const plate1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), matSteel);
    plate1.rotation.z = Math.PI / 2;
    plate1.position.x = -1.6;
    scene.add(plate1);
    const plate2 = plate1.clone();
    plate2.position.x = 1.6;
    scene.add(plate2);

    // Cable drums
    for (let s = -1; s <= 1; s += 2) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.2, 16), matSteel);
      drum.rotation.z = Math.PI / 2;
      drum.position.x = s * 2.5;
      scene.add(drum);
    }

    // Winding cone
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.15, 16), matOrange);
    cone.rotation.z = Math.PI / 2;
    cone.position.x = 1.55;
    scene.add(cone);

    // State
    let springTurns = 0;
    let springDirection = 0;

    buildSpring(0);

    function updateSpringReadouts() {
      const weightSlider = document.getElementById('weightSlider');
      const weight = weightSlider ? parseInt(weightSlider.value) : 150;

      setReadout('turnsVal', springTurns.toFixed(1), ' turns');

      const energy = (springTurns / 7.5) * (weight * 0.7);
      setReadout('energyVal', Math.round(energy), ' ft\u00B7lb');

      const torque = (springTurns / 7.5) * (weight * 1.3);
      setReadout('torqueVal', Math.round(torque), ' in\u00B7lb');

      const stress = (springTurns / 7.5) * 145000;
      setReadout('stressVal', Math.round(stress).toLocaleString(), ' psi');
    }

    // Register actions
    ActionRegistry.register('wind-spring', () => { springDirection = 1; });
    ActionRegistry.register('unwind-spring', () => { springDirection = -1; });

    // Slider handler — update weight display and readouts
    const weightSlider = document.getElementById('weightSlider');
    const weightDisplay = document.getElementById('weightDisplay');
    if (weightSlider) {
      weightSlider.addEventListener('input', () => {
        if (weightDisplay) weightDisplay.textContent = weightSlider.value;
        updateSpringReadouts();
      });
    }

    // Initial readout
    updateSpringReadouts();

    let active = false;
    let rafId = null;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (springDirection !== 0) {
        springTurns = Math.max(0, Math.min(7.5, springTurns + springDirection * 0.02));
        if (springTurns <= 0 || springTurns >= 7.5) springDirection = 0;
        buildSpring(springTurns);
        updateSpringReadouts();
      }

      renderer.render(scene, camera);
    }

    return {
      resume() { active = true; animate(); },
      pause() { active = false; cancelAnimationFrame(rafId); },
      dispose() {
        this.pause();
        renderer.dispose();
        if (springMesh) springMesh.geometry.dispose();
        springMat.dispose();
      },
    };
  },
};

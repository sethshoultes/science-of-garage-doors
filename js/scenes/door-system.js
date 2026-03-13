/**
 * door-system.js — Sectional garage door with 5 panels, tracks, spring, motor.
 * Actions: toggle-door
 * Readouts: door position %, panel angle, cable tension, spring torque
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matDarkSteel, matSteel } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';
import { ActionRegistry } from '../core/scene-manager.js';

/**
 * Safely update a readout element's display value and unit.
 * Uses textContent on child nodes to avoid innerHTML/XSS risks.
 */
function setReadout(elementId, value, unit) {
  const el = document.getElementById(elementId);
  if (!el) return;
  // Clear existing content and rebuild with safe DOM methods
  el.textContent = '';
  const textNode = document.createTextNode(value);
  el.appendChild(textNode);
  const span = document.createElement('span');
  span.className = 'readout-unit';
  span.textContent = unit;
  el.appendChild(span);
}

export const descriptor = {
  id: 'door-system',
  canvasId: 'doorCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 40);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(7, 4.5, 11);
    camera.lookAt(0, 2.5, 0);

    addLights(scene);
    makeOrbitLike(camera, canvas);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
    // Left post
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 0.15), frameMat);
    lp.position.set(-2.5, 2.5, 0);
    scene.add(lp);
    // Right post
    const rp = lp.clone();
    rp.position.set(2.5, 2.5, 0);
    scene.add(rp);
    // Header
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.15, 0.15), frameMat);
    hdr.position.set(0, 5.05, 0);
    scene.add(hdr);

    // Horizontal track rails
    const trackRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 8), frameMat);
    trackRail.position.set(2.4, 5, -4);
    scene.add(trackRail);
    const trackRail2 = trackRail.clone();
    trackRail2.position.set(-2.4, 5, -4);
    scene.add(trackRail2);

    // Torsion spring above door
    const springPts = [];
    for (let t = 0; t < Math.PI * 20; t += 0.15) {
      springPts.push(new THREE.Vector3(t * 0.04 - 1.2, 0, Math.sin(t) * 0.08));
    }
    const springCurve = new THREE.CatmullRomCurve3(springPts);
    const springMesh = new THREE.Mesh(
      new THREE.TubeGeometry(springCurve, 100, 0.015, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.8, roughness: 0.2 })
    );
    springMesh.position.set(0, 5.5, 0);
    scene.add(springMesh);

    // Torsion shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.5, 8), matDarkSteel);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(0, 5.5, 0);
    scene.add(shaft);

    // Door panels (5 panels)
    const panels = [];
    const panelCount = 5;
    const panelH = 0.9;
    const doorW = 4.8;

    for (let i = 0; i < panelCount; i++) {
      const panelGroup = new THREE.Group();
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, panelH, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.7 })
      );
      pMesh.castShadow = true;

      // Panel line detail
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.01, 0.02, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.1, roughness: 0.8 })
      );
      line.position.y = panelH / 2 - 0.02;
      panelGroup.add(pMesh);
      panelGroup.add(line);

      // Hinge dots
      for (let s = -1; s <= 1; s += 2) {
        const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), matDarkSteel);
        hinge.rotation.x = Math.PI / 2;
        hinge.position.set(s * 2.2, panelH / 2, 0.06);
        panelGroup.add(hinge);
      }

      panelGroup.position.set(0, panelH / 2 + i * panelH, 0);
      scene.add(panelGroup);
      panels.push(panelGroup);
    }

    // Motor unit on ceiling
    const motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.2), matDarkSteel);
    motorBox.position.set(0, 5.3, -5);
    scene.add(motorBox);
    // Motor light
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.5 })
    );
    bulb.position.set(0, 5.05, -5);
    scene.add(bulb);

    // Rail from motor
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 9), matSteel);
    rail.position.set(0, 5.1, -0.5);
    scene.add(rail);

    // Door state
    let doorProgress = 0;
    let doorTarget = 0;

    function updateDoor(t) {
      for (let i = 0; i < panelCount; i++) {
        const panel = panels[i];
        const panelT = Math.max(0, Math.min(1, (t * panelCount - (panelCount - 1 - i)) * 1.0));

        if (panelT <= 0) {
          panel.position.set(0, panelH / 2 + i * panelH, 0);
          panel.rotation.x = 0;
        } else if (panelT < 0.5) {
          const a = panelT * 2;
          const angle = a * Math.PI / 2;
          const radius = 1.0;
          panel.position.set(0, 5 - panelH / 2 + radius * Math.cos(angle) - radius, -radius * Math.sin(angle));
          panel.rotation.x = -angle;
        } else {
          const slide = (panelT - 0.5) * 2;
          panel.position.set(0, 5 - panelH / 2, -1.0 - slide * 2.5);
          panel.rotation.x = -Math.PI / 2;
        }
      }

      // Update readouts
      setReadout('doorPosVal', Math.round(t * 100), '%');
      setReadout('panelAngleVal', Math.round(t * 90), '\u00B0');
      setReadout('cableTensionVal', Math.round(42 + t * 30), 'lbs');
      setReadout('springTorqueVal', Math.round((1 - t) * 85), 'ft\u00B7lb');
    }

    // Register action
    ActionRegistry.register('toggle-door', () => {
      doorTarget = doorTarget < 0.5 ? 1 : 0;
    });

    let active = false;
    let rafId = null;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Animate door
      if (Math.abs(doorProgress - doorTarget) > 0.002) {
        doorProgress += (doorTarget - doorProgress) * 0.02;
      }
      updateDoor(doorProgress);

      // Rotate spring slightly when moving
      if (Math.abs(doorProgress - doorTarget) > 0.01) {
        springMesh.rotation.x += 0.02 * Math.sign(doorTarget - doorProgress);
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

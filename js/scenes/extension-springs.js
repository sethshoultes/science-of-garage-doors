/**
 * extension-springs.js — Extension spring system with stretching animation,
 * pulley/cable routing, safety cables, and physics readouts.
 * Actions: stretch-extension, release-extension
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';
import { matSteel, matDarkSteel, matWire } from '../core/materials.js';
import { makeOrbitLike } from '../core/orbit.js';
import { ActionRegistry } from '../core/scene-manager.js';

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
  id: 'extension-springs',
  canvasId: 'extensionCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 40);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(6, 4, 10);
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

    // Door frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 0.15), frameMat);
    lp.position.set(-2.5, 2.5, 0);
    scene.add(lp);
    const rp = lp.clone();
    rp.position.set(2.5, 2.5, 0);
    scene.add(rp);
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.15, 0.15), frameMat);
    hdr.position.set(0, 5.05, 0);
    scene.add(hdr);

    // Horizontal tracks
    const trackR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 8), frameMat);
    trackR.position.set(2.4, 5, -4);
    scene.add(trackR);
    const trackL = trackR.clone();
    trackL.position.set(-2.4, 5, -4);
    scene.add(trackL);

    // Track angle supports
    const sides = [-1, 1];
    sides.forEach(s => {
      const sup1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), frameMat);
      sup1.position.set(s * 2.4, 5.3, -2);
      scene.add(sup1);
      const sup2 = sup1.clone();
      sup2.position.z = -6;
      scene.add(sup2);
    });

    // Door panels
    const panels = [];
    const panelCount = 4, panelH = 1.1, doorW = 4.8;
    for (let i = 0; i < panelCount; i++) {
      const pg = new THREE.Group();
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, panelH, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.7 })
      );
      pMesh.castShadow = true;
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.01, 0.02, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.1, roughness: 0.8 })
      );
      line.position.y = panelH / 2 - 0.02;
      pg.add(pMesh);
      pg.add(line);
      pg.position.set(0, panelH / 2 + i * panelH, 0);
      scene.add(pg);
      panels.push(pg);
    }

    // Pulleys at track junctions
    sides.forEach(s => {
      const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), matSteel);
      pulley.position.set(s * 2.6, 4.9, 0);
      pulley.rotation.y = Math.PI / 2;
      scene.add(pulley);
      const anchor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.15), matDarkSteel);
      anchor.position.set(s * 2.6, 4.9, -7);
      scene.add(anchor);
    });

    // Safety cables
    let safetyCableVisible = true;
    const safetyCables = [];
    sides.forEach(s => {
      const sc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 7, 4),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6, roughness: 0.4 })
      );
      sc.rotation.x = Math.PI / 2;
      sc.position.set(s * 2.6, 4.9, -3.5);
      scene.add(sc);
      safetyCables.push(sc);
    });

    // Extension spring geometry
    let springMeshes = [];
    function buildExtSprings(stretch) {
      springMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
      springMeshes = [];
      sides.forEach(s => {
        const restLen = 2.5;
        const len = restLen + stretch * 3.5;
        const pts = [];
        const coils = 25;
        for (let t = 0; t < Math.PI * 2 * coils; t += 0.15) {
          const progress = t / (Math.PI * 2 * coils);
          const radius = 0.12;
          pts.push(new THREE.Vector3(
            s * 2.6,
            4.9 + Math.cos(t) * radius,
            -7 + progress * len + Math.sin(t) * radius * 0.3
          ));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const springMat = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.8, roughness: 0.2 });
        springMat.color.setRGB(Math.min(1, 0.6 + stretch * 0.4), Math.max(0, 0.3 - stretch * 0.3), 0.1);
        springMat.emissive.setRGB(stretch * 0.15, 0, 0);
        const sm = new THREE.Mesh(new THREE.TubeGeometry(curve, 150, 0.02, 6, false), springMat);
        scene.add(sm);
        springMeshes.push(sm);
      });
    }

    // Cables from spring to bottom bracket
    let cableMeshes = [];
    function buildCables(t) {
      cableMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); });
      cableMeshes = [];
      sides.forEach(s => {
        const bottomY = 0.3 + t * 4.2;
        const pts = [
          new THREE.Vector3(s * 2.6, 4.9, -7 + 2.5 + t * 3.5),
          new THREE.Vector3(s * 2.6, 4.9, 0),
          new THREE.Vector3(s * 2.3, bottomY, 0.05)
        ];
        const curve = new THREE.CatmullRomCurve3(pts);
        const cMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.01, 4, false), matWire);
        scene.add(cMesh);
        cableMeshes.push(cMesh);
      });
    }

    buildExtSprings(0);
    buildCables(0);

    // State
    let doorProgress = 0, doorTarget = 0;

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
          const rad = 1.0;
          panel.position.set(0, 5 - panelH / 2 + rad * Math.cos(angle) - rad, -rad * Math.sin(angle));
          panel.rotation.x = -angle;
        } else {
          const slide = (panelT - 0.5) * 2;
          panel.position.set(0, 5 - panelH / 2, -1.0 - slide * 2.5);
          panel.rotation.x = -Math.PI / 2;
        }
      }
      buildExtSprings(t);
      buildCables(t);

      // Readouts
      const extension = t * 28;
      const k = 25; // spring constant
      const force = k * (t * 5.6);
      const energy = 0.5 * k * Math.pow(t * 5.6, 2) / 12; // ft·lb

      setReadout('extStretchVal', extension.toFixed(1), ' in');
      setReadout('extForceVal', Math.round(force), ' lbs');
      setReadout('extEnergyVal', energy.toFixed(1), ' ft·lb');
    }

    // Actions
    ActionRegistry.register('stretch-extension', () => { doorTarget = doorTarget < 0.5 ? 1 : 0; });
    ActionRegistry.register('release-extension', () => { doorTarget = 0; });

    // Animation loop
    let active = false;
    let rafId = null;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (Math.abs(doorProgress - doorTarget) > 0.002) {
        doorProgress += (doorTarget - doorProgress) * 0.02;
      }
      updateDoor(doorProgress);
      safetyCables.forEach(sc => { sc.visible = safetyCableVisible; });
      renderer.render(scene, camera);
    }

    return {
      resume() { active = true; animate(); },
      pause() { active = false; cancelAnimationFrame(rafId); },
      dispose() {
        this.pause();
        renderer.dispose();
      }
    };
  }
};

/**
 * hero.js — Hero background scene with floating gears and springs.
 * Purely visual, no user interaction.
 */
import * as THREE from 'three';
import { makeRenderer, fitRenderer } from '../core/renderer.js';
import { addLights } from '../core/lights.js';

export const descriptor = {
  id: 'hero',
  canvasId: 'heroCanvas',

  init(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    addLights(scene);

    // Floating gears and springs
    const objects = [];
    for (let i = 0; i < 25; i++) {
      const isGear = Math.random() > 0.5;
      let mesh;
      if (isGear) {
        mesh = new THREE.Mesh(
          new THREE.TorusGeometry(0.3 + Math.random() * 0.5, 0.08, 8, 20),
          new THREE.MeshStandardMaterial({
            color: 0xff6b2b,
            metalness: 0.8,
            roughness: 0.3,
            transparent: true,
            opacity: 0.15 + Math.random() * 0.15,
          })
        );
      } else {
        const pts = [];
        for (let t = 0; t < Math.PI * 6; t += 0.2) {
          pts.push(new THREE.Vector3(Math.cos(t) * 0.3, t * 0.05, Math.sin(t) * 0.3));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        mesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 30, 0.03, 8, false),
          new THREE.MeshStandardMaterial({
            color: 0xffa733,
            metalness: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 0.12 + Math.random() * 0.12,
          })
        );
      }
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - 5
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.userData.speed = {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.003,
      };
      scene.add(mesh);
      objects.push(mesh);
    }

    let active = false;
    let rafId = null;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const { width, height } = fitRenderer(renderer, canvas);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      objects.forEach((o) => {
        o.rotation.x += o.userData.speed.x;
        o.rotation.y += o.userData.speed.y;
        o.position.y += o.userData.speed.z;
        if (o.position.y > 12) o.position.y = -12;
        if (o.position.y < -12) o.position.y = 12;
      });

      renderer.render(scene, camera);
    }

    return {
      resume() { active = true; animate(); },
      pause() { active = false; cancelAnimationFrame(rafId); },
      dispose() {
        this.pause();
        renderer.dispose();
        objects.forEach((o) => {
          o.geometry.dispose();
          o.material.dispose();
        });
      },
    };
  },
};

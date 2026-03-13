/**
 * lights.js — Standard three-light rig used by every scene.
 *
 * Matches the original app:
 *   - AmbientLight  white @ 0.4 intensity
 *   - DirectionalLight  white @ 0.8, position (5, 8, 6), casts shadows
 *   - DirectionalLight  blue fill @ 0.2, position (-3, 2, -4)
 *
 * Usage:
 *   import { addLights } from './lights.js';
 *   addLights(scene);
 */
import * as THREE from 'three';

/**
 * Add the standard ambient + key + fill light rig to a scene.
 *
 * @param {THREE.Scene} scene
 */
export function addLights(scene) {
  // Ambient — soft overall illumination
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  // Key light — directional with shadows
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(5, 8, 6);
  key.castShadow = true;
  scene.add(key);

  // Fill light — cool blue from opposite side
  const fill = new THREE.DirectionalLight(0xaaaaff, 0.4);
  fill.position.set(-3, 2, -4);
  scene.add(fill);
}

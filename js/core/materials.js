/**
 * materials.js — Shared Three.js materials used across all scenes.
 *
 * Every named export matches the exact color, metalness, and roughness
 * values from the original monolithic app.
 *
 * Usage:
 *   import { matOrange, matSteel } from './materials.js';
 */
import * as THREE from 'three';

/** Accent orange — buttons, highlights, winding cones. */
export const matOrange = new THREE.MeshStandardMaterial({
  color: 0xff6b2b,
  metalness: 0.4,
  roughness: 0.5,
});

/** Polished steel — shafts, pulleys, cable drums. */
export const matSteel = new THREE.MeshStandardMaterial({
  color: 0x888888,
  metalness: 0.85,
  roughness: 0.2,
});

/** Dark steel — motor casings, track hardware. */
export const matDarkSteel = new THREE.MeshStandardMaterial({
  color: 0x606060,
  metalness: 0.85,
  roughness: 0.2,
});

/** Wire / lead material — capacitor leads, misc wiring. */
export const matWire = new THREE.MeshStandardMaterial({
  color: 0x777777,
  metalness: 0.7,
  roughness: 0.3,
});

/** Door panel surface — light gray, low metalness. */
export const matPanel = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.1,
  roughness: 0.7,
});

/** Rubber — belt drive material, weatherstripping. */
export const matRubber = new THREE.MeshStandardMaterial({
  color: 0x3a3a3a,
  metalness: 0.05,
  roughness: 0.9,
});

/** Green indicator — safety sensors, status LEDs. */
export const matGreen = new THREE.MeshStandardMaterial({
  color: 0x22c55e,
  metalness: 0.3,
  roughness: 0.5,
});

/** Cyan emissive — signal rings, smart-home accents. */
export const matCyan = new THREE.MeshStandardMaterial({
  color: 0x22d3ee,
  metalness: 0.3,
  roughness: 0.5,
  emissive: 0x22d3ee,
  emissiveIntensity: 0.3,
});

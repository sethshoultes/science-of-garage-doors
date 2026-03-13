/**
 * renderer.js — WebGL renderer creation and sizing utilities.
 *
 * Usage:
 *   import { makeRenderer, fitRenderer } from './renderer.js';
 *   const renderer = makeRenderer(canvasElement);
 *   const { width, height } = fitRenderer(renderer, canvasElement);
 */
import * as THREE from 'three';

/**
 * Create a WebGLRenderer attached to the given <canvas> element.
 * Matches the original app: antialias, alpha, shadow mapping enabled,
 * pixel ratio capped at 2, clear color #0c0c0e.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {THREE.WebGLRenderer}
 */
export function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x1a1a2e, 1);
  renderer.shadowMap.enabled = true;
  return renderer;
}

/**
 * Resize a renderer to fill its canvas's parent element.
 * Call this every frame (or on resize) before rendering.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {HTMLCanvasElement} canvas
 * @returns {{ width: number, height: number }}
 */
export function fitRenderer(renderer, canvas) {
  const width = canvas.parentElement.clientWidth;
  const height = canvas.parentElement.clientHeight;
  renderer.setSize(width, height, false);
  return { width, height };
}

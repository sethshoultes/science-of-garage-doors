/**
 * labels.js — Floating HTML labels positioned over 3D scene components.
 *
 * Labels track a THREE.Vector3 world position, project it to screen
 * coordinates, and auto-hide when the target is behind the camera.
 *
 * Usage:
 *   import { LabelSystem } from './labels.js';
 *   const labels = new LabelSystem();
 *   labels.addLabel(new THREE.Vector3(1, 2, 0), 'STATOR', camera, renderer);
 *   // in render loop:
 *   labels.update();
 *   // cleanup:
 *   labels.dispose();
 */
import * as THREE from 'three';

/**
 * Manages a set of floating HTML labels anchored to 3D positions.
 */
export class LabelSystem {
  constructor() {
    /** @type {Array<{el: HTMLElement, position: THREE.Vector3, camera: THREE.Camera, renderer: THREE.WebGLRenderer}>} */
    this._labels = [];
  }

  /**
   * Create a floating label element and begin tracking a 3D position.
   *
   * @param {THREE.Vector3} position3D - World-space anchor point.
   * @param {string} text - Label text content.
   * @param {THREE.Camera} camera - Camera used for projection.
   * @param {THREE.WebGLRenderer} renderer - Renderer (used to get canvas bounds).
   * @returns {HTMLElement} The created label DOM element.
   */
  addLabel(position3D, text, camera, renderer) {
    const el = document.createElement('div');
    el.className = 'scene-label';
    el.textContent = text;

    // Styling: floating label with leader-line border
    Object.assign(el.style, {
      position: 'absolute',
      pointerEvents: 'none',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#e8e6e3',
      background: 'rgba(12, 12, 14, 0.85)',
      padding: '0.3rem 0.6rem',
      borderRadius: '3px',
      borderLeft: '2px solid var(--accent, #ff6b2b)',
      whiteSpace: 'nowrap',
      zIndex: '10',
      transition: 'opacity 0.2s',
    });

    // Append inside the renderer's canvas parent so positioning is relative
    const container = renderer.domElement.parentElement;
    if (container) {
      container.style.position = container.style.position || 'relative';
      container.appendChild(el);
    }

    const entry = {
      el,
      position: position3D.clone(),
      camera,
      renderer,
    };
    this._labels.push(entry);
    return el;
  }

  /**
   * Reposition all labels to match current camera/projection.
   * Call once per frame.
   */
  update() {
    const projected = new THREE.Vector3();

    for (const label of this._labels) {
      projected.copy(label.position);
      projected.project(label.camera);

      // Dot product check: hide when behind camera
      const cameraDir = new THREE.Vector3();
      label.camera.getWorldDirection(cameraDir);
      const toLabel = new THREE.Vector3()
        .subVectors(label.position, label.camera.position)
        .normalize();
      const dot = cameraDir.dot(toLabel);

      if (dot < 0) {
        label.el.style.opacity = '0';
        continue;
      }

      label.el.style.opacity = '1';

      const canvas = label.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;

      // Convert NDC (-1..1) to pixel coordinates relative to parent
      const x = (projected.x * halfW) + halfW;
      const y = -(projected.y * halfH) + halfH;

      label.el.style.left = `${x}px`;
      label.el.style.top = `${y}px`;
    }
  }

  /**
   * Remove all label DOM elements and clear internal state.
   */
  dispose() {
    for (const label of this._labels) {
      label.el.remove();
    }
    this._labels.length = 0;
  }
}

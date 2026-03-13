/**
 * orbit.js — Lightweight drag-to-rotate camera control.
 *
 * Replicates the original app's pointer-based orbit with added
 * touch support (single-finger rotate, two-finger pinch-to-zoom).
 *
 * The camera orbits at a fixed radius around the origin. Vertical
 * rotation is clamped to +/- ~69 degrees to prevent flipping.
 *
 * Usage:
 *   import { makeOrbitLike } from './orbit.js';
 *   makeOrbitLike(camera, canvasElement);
 */

/**
 * Attach drag-to-rotate and pinch-to-zoom listeners to a canvas.
 *
 * @param {THREE.PerspectiveCamera} camera  — must already be positioned
 * @param {HTMLCanvasElement} canvas
 */
export function makeOrbitLike(camera, canvas) {
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;

  // Spherical coordinates derived from initial camera position
  let rotY = 0.3;
  let rotX = 0.3;
  let radius = camera.position.length();

  // --- Pinch-to-zoom state ---
  let pinchStartDist = 0;
  let pinchStartRadius = 0;

  const ROTATE_SPEED = 0.005;
  const CLAMP = 1.2;           // ~69 degrees vertical
  const MIN_RADIUS = 1;
  const MAX_RADIUS = 50;

  // ---- Pointer (mouse) events ----

  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * ROTATE_SPEED;
    rotX += (e.clientY - prevY) * ROTATE_SPEED;
    rotX = Math.max(-CLAMP, Math.min(CLAMP, rotX));
    prevX = e.clientX;
    prevY = e.clientY;
    applyPosition();
  });

  canvas.addEventListener('pointerup', () => { isDragging = false; });
  canvas.addEventListener('pointerleave', () => { isDragging = false; });

  // ---- Touch events (rotate + pinch zoom) ----

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // Single finger — start rotate
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Two fingers — start pinch zoom
      isDragging = false;
      pinchStartDist = touchDistance(e.touches);
      pinchStartRadius = radius;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      // Single finger rotate
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      rotY += (x - prevX) * ROTATE_SPEED;
      rotX += (y - prevY) * ROTATE_SPEED;
      rotX = Math.max(-CLAMP, Math.min(CLAMP, rotX));
      prevX = x;
      prevY = y;
      applyPosition();
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dist = touchDistance(e.touches);
      const scale = pinchStartDist / dist;
      radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, pinchStartRadius * scale));
      applyPosition();
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => { isDragging = false; }, { passive: true });

  // ---- Helpers ----

  /** Compute distance between two touch points. */
  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Update camera position on the orbit sphere and look at origin. */
  function applyPosition() {
    camera.position.x = radius * Math.sin(rotY) * Math.cos(rotX);
    camera.position.y = radius * Math.sin(rotX);
    camera.position.z = radius * Math.cos(rotY) * Math.cos(rotX);
    camera.lookAt(0, 0, 0);
  }
}

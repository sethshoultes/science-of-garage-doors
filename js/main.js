/**
 * main.js — Application entry point.
 *
 * Imported by index.html via:
 *   <script type="module" src="js/main.js">
 *
 * Bootstraps all UI modules, registers scenes and tools with
 * the SceneManager, and sets up document-level event delegation.
 */

// ─── Core ───
import { SceneManager, ActionRegistry } from './core/scene-manager.js';
import { AudioEngine } from './core/audio.js';

// ─── UI ───
import { initNav } from './ui/nav.js';
import { initTabs } from './ui/tabs.js';
import { initKeyboard } from './ui/keyboard.js';
import { initPrint } from './ui/print.js';

// ─── Scene descriptors ───
import { descriptor as heroScene } from './scenes/hero.js';
import { descriptor as doorScene } from './scenes/door-system.js';
import { descriptor as springScene } from './scenes/torsion-spring.js';
import { descriptor as motorScene } from './scenes/motor-internals.js';
import { descriptor as smartScene } from './scenes/smart-home.js';
import { descriptor as chainDriveScene } from './scenes/drive-chain.js';
import { descriptor as beltDriveScene } from './scenes/drive-belt.js';
import { descriptor as screwDriveScene } from './scenes/drive-screw.js';
import { descriptor as directDriveScene } from './scenes/drive-direct.js';

/**
 * All scene descriptors to register with SceneManager.
 */
const SCENES = [
  heroScene,
  doorScene,
  springScene,
  motorScene,
  smartScene,
  chainDriveScene,
  beltDriveScene,
  screwDriveScene,
  directDriveScene,
];

/**
 * Drive type scenes that are lazy-loaded on tab activation.
 * Maps tab name to scene descriptor id (matches id in scene files).
 */
const DRIVE_TAB_MAP = {
  chain: 'tab-chain',
  belt: 'tab-belt',
  screw: 'tab-screw',
  direct: 'tab-direct',
};

/**
 * Bootstrap the application once the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  const audioEngine = new AudioEngine();

  // Register all scenes with the SceneManager (observer-based lazy init)
  SCENES.forEach(descriptor => {
    if (descriptor) SceneManager.register(descriptor);
  });

  // Initialize UI modules
  initNav();
  initTabs();
  initKeyboard();
  initPrint();

  // ─── Register action handlers ───
  ActionRegistry.register('toggleMute', () => {
    audioEngine.toggleMute();
  });

  // ─── Lazy-load drive type scenes on tab switch ───
  document.addEventListener('tab:activated', (e) => {
    const { group, tab } = e.detail;

    // Only handle the drive-types tab group
    if (group !== 'drive-types') return;

    const sceneId = DRIVE_TAB_MAP[tab];
    if (!sceneId) return;

    // SceneManager handles lazy init via IntersectionObserver.
    // When a tab becomes active, its canvas-wrap becomes visible,
    // triggering the observer. No explicit init call needed.
  });
});

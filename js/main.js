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
import { descriptor as doorScene } from './scenes/door.js';
import { descriptor as springScene } from './scenes/spring.js';
import { descriptor as motorScene } from './scenes/motor.js';
import { descriptor as smartScene } from './scenes/smart.js';
import { descriptor as chainDriveScene } from './scenes/chain-drive.js';
import { descriptor as beltDriveScene } from './scenes/belt-drive.js';
import { descriptor as screwDriveScene } from './scenes/screw-drive.js';
import { descriptor as directDriveScene } from './scenes/direct-drive.js';

// ─── Tool descriptors ───
import { descriptor as ledInterferenceTool } from './tools/led-interference.js';
import { descriptor as springCalculatorTool } from './tools/spring-calculator.js';

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
 * All tool descriptors to register with SceneManager.
 */
const TOOLS = [
  ledInterferenceTool,
  springCalculatorTool,
];

/**
 * Drive type scenes that are lazy-loaded on tab activation.
 * Maps tab name to scene descriptor id.
 */
const DRIVE_TAB_MAP = {
  chain: 'chain-drive',
  belt: 'belt-drive',
  screw: 'screw-drive',
  direct: 'direct-drive',
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

  // Register tool descriptors (same lifecycle as scenes)
  TOOLS.forEach(descriptor => {
    if (descriptor) SceneManager.register(descriptor);
  });

  // Initialize UI modules
  initNav();
  initTabs();
  initKeyboard();
  initPrint();

  // ─── Register action handlers ───
  // The ActionRegistry's delegated click handler is installed automatically
  // on first register() call. Scene-specific actions will be registered
  // by each scene's init() function. Here we register global actions.

  ActionRegistry.register('toggleMute', () => {
    audioEngine.toggleMute();
  });

  // ─── Lazy-load drive type scenes on tab switch ───
  document.addEventListener('tab:activated', (e) => {
    const { group, tab } = e.detail;

    // Only handle the motor-types tab group
    if (group !== 'motor-types') return;

    const sceneId = DRIVE_TAB_MAP[tab];
    if (!sceneId) return;

    // SceneManager handles lazy init via IntersectionObserver.
    // When a tab becomes active, its canvas-wrap becomes visible,
    // triggering the observer. No explicit init call needed.
  });
});

/**
 * scene-manager.js — Lazy scene lifecycle and action delegation.
 *
 * SceneManager watches .canvas-wrap elements via IntersectionObserver,
 * lazily initialises scenes on first viewport entry, and pauses/resumes
 * them as they enter/leave view. A pool of max 3 active scenes disposes
 * the oldest off-screen scene when a 4th would activate.
 *
 * ActionRegistry provides document-level delegated click handling for
 * any element with a [data-action] attribute.
 *
 * Usage:
 *   import { SceneManager, ActionRegistry } from './scene-manager.js';
 *
 *   SceneManager.register({
 *     id: 'door',
 *     canvasId: 'doorCanvas',
 *     init(canvas) { ... return { pause(), resume(), dispose() }; }
 *   });
 *
 *   ActionRegistry.register('toggleDoor', (event) => { ... });
 */

// ─── SceneManager ────────────────────────────────────────────────

const MAX_ACTIVE = 3;

/** @type {Map<string, SceneDescriptor>} */
const descriptors = new Map();

/**
 * @typedef {Object} SceneDescriptor
 * @property {string}   id        — unique scene identifier
 * @property {string}   canvasId  — id of the <canvas> element
 * @property {function} init      — called once with (canvas), must return SceneHandle
 */

/**
 * @typedef {Object} SceneHandle
 * @property {function} pause    — stop the render loop
 * @property {function} resume   — restart the render loop
 * @property {function} dispose  — tear down renderer, geometries, textures
 */

/** @type {Map<string, SceneHandle>} Initialised scenes keyed by id. */
const handles = new Map();

/** @type {string[]} LRU order of visible scene ids (most-recent at end). */
const activeQueue = [];

/** @type {Set<string>} Scenes currently in the viewport. */
const visibleSet = new Set();

/** @type {IntersectionObserver|null} */
let observer = null;

/**
 * Ensure the IntersectionObserver is running.
 * Called automatically on first register().
 */
function ensureObserver() {
  if (observer) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.dataset.sceneId;
        if (!id) continue;

        if (entry.isIntersecting) {
          onEnter(id);
        } else {
          onLeave(id);
        }
      }
    },
    { rootMargin: '100px 0px', threshold: 0 }
  );
}

/**
 * Scene enters viewport — lazy-init if needed, then resume.
 * Enforces the max-active pool: if a 4th scene would activate,
 * the oldest off-screen scene is disposed.
 *
 * @param {string} id
 */
function onEnter(id) {
  visibleSet.add(id);
  const desc = descriptors.get(id);
  if (!desc) return;

  // Lazy initialisation
  if (!handles.has(id)) {
    const canvas = document.getElementById(desc.canvasId);
    if (!canvas) return;
    const handle = desc.init(canvas);
    handles.set(id, handle);
  }

  // Resume this scene
  const handle = handles.get(id);
  if (handle && handle.resume) handle.resume();

  // Update LRU queue (move to end)
  const idx = activeQueue.indexOf(id);
  if (idx !== -1) activeQueue.splice(idx, 1);
  activeQueue.push(id);

  // Enforce pool limit — dispose oldest off-screen scene
  while (activeQueue.length > MAX_ACTIVE) {
    const oldest = activeQueue.shift();
    if (visibleSet.has(oldest)) {
      // Still visible; put it back and try the next
      activeQueue.push(oldest);
      // Safety: if everything is visible we can't evict
      if (activeQueue.length <= MAX_ACTIVE + 1) break;
      continue;
    }
    disposeScene(oldest);
  }
}

/**
 * Scene leaves viewport — pause it.
 *
 * @param {string} id
 */
function onLeave(id) {
  visibleSet.delete(id);
  const handle = handles.get(id);
  if (handle && handle.pause) handle.pause();
}

/**
 * Fully dispose a scene and remove its handle.
 *
 * @param {string} id
 */
function disposeScene(id) {
  const handle = handles.get(id);
  if (handle && handle.dispose) handle.dispose();
  handles.delete(id);

  const qIdx = activeQueue.indexOf(id);
  if (qIdx !== -1) activeQueue.splice(qIdx, 1);
}

export const SceneManager = {
  /**
   * Register a scene descriptor. The scene's .canvas-wrap parent must
   * exist in the DOM (it will be observed immediately).
   *
   * @param {SceneDescriptor} descriptor
   */
  register(descriptor) {
    const { id, canvasId } = descriptor;
    descriptors.set(id, descriptor);

    ensureObserver();

    // Find the .canvas-wrap that contains this canvas
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const wrap = canvas.closest('.canvas-wrap') || canvas.parentElement;
    wrap.dataset.sceneId = id;
    observer.observe(wrap);
  },
};

// ─── ActionRegistry ──────────────────────────────────────────────

/** @type {Map<string, function>} */
const actions = new Map();

/** Install the single document-level delegated click handler once. */
let delegateInstalled = false;

function installDelegate() {
  if (delegateInstalled) return;
  delegateInstalled = true;

  document.addEventListener('click', (event) => {
    // Walk up from target to find nearest [data-action]
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const name = el.dataset.action;
    const handler = actions.get(name);
    if (handler) handler(event);
  });
}

export const ActionRegistry = {
  /**
   * Register a named action handler.
   *
   * @param {string}   actionName — matches [data-action="actionName"]
   * @param {function} handler    — receives the click Event
   */
  register(actionName, handler) {
    installDelegate();
    actions.set(actionName, handler);
  },

  /**
   * Programmatically dispatch an action by name.
   *
   * @param {string} actionName
   * @param {Event}  [event]
   */
  dispatch(actionName, event) {
    const handler = actions.get(actionName);
    if (handler) handler(event);
  },
};

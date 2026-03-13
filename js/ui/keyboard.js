/**
 * keyboard.js — Keyboard navigation and accessibility enhancements.
 *
 * - Arrow Up/Down: navigate between sections (smooth scroll)
 * - Space/Enter: activate focused control buttons
 * - Tab: standard focus traversal (enhanced with ARIA)
 * - Escape: close any open overlays
 *
 * Also applies ARIA labels and roles to interactive elements.
 *
 * Usage:
 *   import { initKeyboard } from './keyboard.js';
 *   initKeyboard();
 */

/**
 * Initialize keyboard navigation and apply ARIA attributes.
 */
export function initKeyboard() {
  const sections = Array.from(document.querySelectorAll('.section[id]'));

  applyAriaAttributes();

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        handleSectionNavigation(e, sections);
        break;

      case 'Escape':
        handleEscape();
        break;

      case ' ':
      case 'Enter':
        handleActivation(e);
        break;

      default:
        break;
    }
  });
}

/**
 * Navigate between sections with arrow keys.
 * @param {KeyboardEvent} e
 * @param {HTMLElement[]} sections
 */
function handleSectionNavigation(e, sections) {
  if (!sections.length) return;

  // Don't hijack arrows when user is in an input/textarea
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  e.preventDefault();

  const currentIndex = findCurrentSectionIndex(sections);
  let nextIndex;

  if (e.key === 'ArrowDown') {
    nextIndex = Math.min(currentIndex + 1, sections.length - 1);
  } else {
    nextIndex = Math.max(currentIndex - 1, 0);
  }

  sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
}

/**
 * Determine which section is closest to the viewport center.
 * @param {HTMLElement[]} sections
 * @returns {number}
 */
function findCurrentSectionIndex(sections) {
  const viewportCenter = window.scrollY + window.innerHeight / 2;
  let closest = 0;
  let minDist = Infinity;

  sections.forEach((section, i) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const dist = Math.abs(sectionCenter - viewportCenter);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  });

  return closest;
}

/**
 * Close overlays or deselect active states on Escape.
 */
function handleEscape() {
  // Close any element with [data-overlay].open
  document.querySelectorAll('[data-overlay]').forEach(overlay => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  });

  // Blur the currently focused element
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/**
 * Allow Space/Enter to trigger focused .ctrl-btn or .tab-btn elements.
 * Prevents default scroll on Space.
 * @param {KeyboardEvent} e
 */
function handleActivation(e) {
  const el = document.activeElement;
  if (!el) return;

  const isButton = el.matches('.ctrl-btn, .tab-btn, [data-action]');
  if (!isButton) return;

  e.preventDefault();
  el.click();
}

/**
 * Apply ARIA roles and labels to interactive elements for screen readers.
 */
function applyAriaAttributes() {
  // Nav links
  const nav = document.querySelector('.nav');
  if (nav) {
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Section navigation');
  }

  // Control buttons
  document.querySelectorAll('.ctrl-btn').forEach(btn => {
    btn.setAttribute('role', 'button');
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.textContent.trim());
    }
    // Ensure focusable
    if (!btn.getAttribute('tabindex')) {
      btn.setAttribute('tabindex', '0');
    }
  });

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.setAttribute('role', 'tab');
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.textContent.trim());
    }
  });

  // Tab panels
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
  });

  // Canvas containers
  document.querySelectorAll('.canvas-wrap').forEach(wrap => {
    wrap.setAttribute('role', 'img');
    const label = wrap.querySelector('.canvas-label');
    if (label) {
      wrap.setAttribute('aria-label', label.textContent.trim());
    }
  });

  // Sections
  document.querySelectorAll('.section[id]').forEach(section => {
    section.setAttribute('role', 'region');
    const title = section.querySelector('.section-title');
    if (title) {
      section.setAttribute('aria-label', title.textContent.trim());
    }
  });
}

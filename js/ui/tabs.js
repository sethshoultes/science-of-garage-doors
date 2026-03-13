/**
 * tabs.js — Generic tab system driven by [data-tab-group] attributes.
 *
 * HTML contract:
 *   <div data-tab-group="motor-types">
 *     <div class="tabs">
 *       <button class="tab-btn active" data-tab="chain">Chain Drive</button>
 *       <button class="tab-btn" data-tab="belt">Belt Drive</button>
 *     </div>
 *     <div class="tab-content active" id="tab-chain">...</div>
 *     <div class="tab-content" id="tab-belt">...</div>
 *   </div>
 *
 * Dispatches a custom 'tab:activated' event on the group element (and
 * on document for convenience) with detail: { group, tab }.
 *
 * Usage:
 *   import { initTabs } from './tabs.js';
 *   initTabs();
 */

/**
 * Initialize all tab groups found on the page.
 */
export function initTabs() {
  const groups = document.querySelectorAll('[data-tab-group]');

  groups.forEach(group => {
    const groupName = group.dataset.tabGroup;
    const buttons = group.querySelectorAll('.tab-btn[data-tab]');
    const panels = group.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Toggle active class on buttons
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle active class on panels
        panels.forEach(panel => {
          panel.classList.toggle('active', panel.id === `tab-${tabName}`);
        });

        // Dispatch custom event for lazy initialization (e.g. scene-manager)
        const detail = { group: groupName, tab: tabName };

        group.dispatchEvent(
          new CustomEvent('tab:activated', { detail, bubbles: true })
        );
        document.dispatchEvent(
          new CustomEvent('tab:activated', { detail })
        );
      });
    });
  });
}

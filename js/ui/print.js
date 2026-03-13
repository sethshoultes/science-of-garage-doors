/**
 * print.js — Print-friendly summary generation.
 *
 * Listens for Ctrl+P / Cmd+P and populates .print-diagram elements
 * with static spec tables derived from the current scene/readout state.
 *
 * Usage:
 *   import { initPrint } from './print.js';
 *   initPrint();
 */

/**
 * Initialize print support: intercept print shortcut and
 * populate static content before the browser print dialog opens.
 */
export function initPrint() {
  document.addEventListener('keydown', (e) => {
    const isPrintShortcut =
      (e.key === 'p' || e.key === 'P') &&
      (e.ctrlKey || e.metaKey);

    if (!isPrintShortcut) return;

    preparePrintContent();
  });

  // Also handle window.onbeforeprint (covers File > Print and window.print())
  window.addEventListener('beforeprint', preparePrintContent);
}

/**
 * Gather current readout values and generate static summary content
 * inside any .print-diagram containers.
 */
function preparePrintContent() {
  const diagrams = document.querySelectorAll('.print-diagram');
  if (!diagrams.length) return;

  const specs = gatherSpecs();

  diagrams.forEach(diagram => {
    // Clear existing content safely
    while (diagram.firstChild) {
      diagram.removeChild(diagram.firstChild);
    }

    diagram.appendChild(buildSpecTable(specs));
  });
}

/**
 * Read current values from all .readout-item elements on the page.
 * @returns {Array<{label: string, value: string}>}
 */
function gatherSpecs() {
  const specs = [];

  document.querySelectorAll('.readout-item').forEach(item => {
    const labelEl = item.querySelector('.readout-label');
    const valueEl = item.querySelector('.readout-value');
    if (!labelEl || !valueEl) return;

    specs.push({
      label: labelEl.textContent.trim(),
      value: valueEl.textContent.trim(),
    });
  });

  // Capture slider states
  document.querySelectorAll('.slider-group').forEach(group => {
    const labelEl = group.querySelector('label');
    const input = group.querySelector('input[type="range"]');
    if (!labelEl || !input) return;

    specs.push({
      label: labelEl.textContent.trim(),
      value: input.value,
    });
  });

  // Capture active tab info
  document.querySelectorAll('.tab-btn.active').forEach(btn => {
    specs.push({
      label: 'Active View',
      value: btn.textContent.trim(),
    });
  });

  return specs;
}

/**
 * Build a DOM table element from spec entries.
 * @param {Array<{label: string, value: string}>} specs
 * @returns {HTMLElement}
 */
function buildSpecTable(specs) {
  if (!specs.length) {
    const p = document.createElement('p');
    p.textContent = 'No data available for print summary.';
    return p;
  }

  const table = document.createElement('table');
  table.className = 'specs-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const thParam = document.createElement('th');
  thParam.textContent = 'Parameter';
  const thValue = document.createElement('th');
  thValue.textContent = 'Current Value';
  headerRow.appendChild(thParam);
  headerRow.appendChild(thValue);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  specs.forEach(spec => {
    const row = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.textContent = spec.label;
    const tdValue = document.createElement('td');
    tdValue.textContent = spec.value;
    row.appendChild(tdLabel);
    row.appendChild(tdValue);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  return table;
}

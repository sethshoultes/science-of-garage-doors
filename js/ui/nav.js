/**
 * nav.js — Sticky navigation with IntersectionObserver-based active state.
 *
 * Replaces the monolithic scroll event listener with a more performant
 * IntersectionObserver pattern. Also handles smooth-scroll on nav link clicks.
 *
 * Usage:
 *   import { initNav } from './nav.js';
 *   initNav();
 */

/**
 * Initialize navigation: observe sections for active-link highlighting
 * and attach smooth-scroll click handlers to nav links.
 */
export function initNav() {
  const navLinks = document.querySelectorAll('.nav a');
  const sections = document.querySelectorAll('.section[id]');

  if (!navLinks.length || !sections.length) return;

  // Build a map from section id to its nav link for fast lookup
  const linkMap = new Map();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      linkMap.set(href.slice(1), link);
    }
  });

  // IntersectionObserver fires when a section crosses the viewport center band
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.id;
        navLinks.forEach(link => link.classList.remove('active'));

        const activeLink = linkMap.get(id);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -60% 0px' }
  );

  sections.forEach(section => observer.observe(section));

  // Smooth scroll on nav link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

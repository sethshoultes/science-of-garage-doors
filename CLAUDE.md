# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"The Science of Garage Doors" is a single-page interactive 3D educational website for A Plus Garage Doors. It explains garage door mechanics, physics, and technology through animated Three.js scenes with real-time data readouts.

## Architecture

The entire application is a single `index.html` file (~1870 lines) containing all HTML, CSS, and JavaScript inline. There is no build system, no dependencies to install, and no package manager.

### External Dependencies (CDN-loaded)
- **Three.js r128** — all 3D rendering
- **Google Fonts** — Oswald, Source Sans Pro, JetBrains Mono

### File Structure

The HTML file is organized in this order:
1. **CSS** (lines ~9–520) — CSS custom properties on `:root`, responsive breakpoints at bottom
2. **HTML sections** (lines ~520–950) — hero, nav, content sections with canvas elements
3. **JavaScript** (lines ~953–1868) — shared utilities, then IIFE-wrapped Three.js scenes

### Three.js Scenes (6 scenes)
Each scene is a self-contained IIFE that creates its own renderer, scene, camera, and animation loop, bound to a specific `<canvas>` element:

| Scene | Canvas ID | Purpose |
|-------|-----------|---------|
| 0 — Hero | `heroCanvas` | Floating gears/springs background |
| 1 — Door System | `doorCanvas` | Interactive sectional door with open/close button |
| 2 — Torsion Spring | `springCanvas` | Spring physics with weight slider |
| 3 — Drive Types | `chainCanvas`, `beltCanvas`, `screwCanvas` | Three sub-scenes for motor drive types |
| 4 — Motor Internals | `motorCanvas` | Motor components visualization |
| 5 — Smart Home | `smartCanvas` | IoT/smart garage integration |

### Shared Resources
- **Utility functions**: `makeRenderer()`, `fitRenderer()`, `addLights()`, `makeOrbitLike()` — defined once before all scenes
- **Shared materials**: `matOrange`, `matSteel`, `matDarkSteel`, `matWire`, `matPanel`, `matRubber`, `matGreen`, `matCyan`
- **Global state**: `doorProgress`, `doorTarget`, `doorOpening` (Scene 1 door animation)

### Interactive Features
- Drag-to-orbit camera on 3D scenes (custom `makeOrbitLike` handler)
- Open/Close door button with animated readouts (position %, panel angle, cable tension, spring torque)
- Spring physics slider (door weight 80–400 lbs) updates turns, energy, torque, stress
- LED interference demo (bulb wattage vs. signal range)
- Sticky nav with scroll-based active state

## Development

**To preview**: Open `index.html` directly in a browser, or use any static file server (e.g., `python3 -m http.server`).

**No build step required.** All changes are made directly in `index.html`.

### Design System
- Dark theme with CSS custom properties (`--bg`, `--accent`, `--text`, etc.)
- Color palette: dark backgrounds (#0c0c0e), orange accent (#ff6b2b / #ffa733), cyan accent (#22d3ee)
- Typography: Oswald (headings), Source Sans Pro (body), JetBrains Mono (data/labels)
- Responsive: mobile breakpoints at 768px and 600px

### Key Conventions
- Each 3D scene is wrapped in an IIFE to avoid polluting global scope
- Canvas elements are sized to their parent container via `fitRenderer()`
- All scenes use the same lighting setup via `addLights()`
- Section numbering follows a consistent pattern: tag ("01 / Mechanics"), title, canvas, readouts, explanation text

# Garage Door Science Hub

A collection of interactive educational presentations about garage door engineering, physics, and technology — built by A Plus Garage Doors.

**[Try it live](https://sethshoultes.com/garage-door-science-hub/)**

## What's Inside

### 1. Science of Garage Doors
Interactive 3D explorer with six animated Three.js scenes: door system mechanics, torsion spring physics, drive type comparison (chain, belt, screw, direct), motor internals, smart home integration, and LED radio interference.

### 2. Science of Garage Door Springs
Torsion spring physics deep-dive with interactive winding simulation, energy comparison (fastball vs. spring vs. bullet), wire stress visualization, and four documented failure scenarios.

### 3. Rolling Steel Doors Lab
Commercial rolling door engineering — coiling mechanism animation, five slat profile comparisons (flat, curved, insulated, perforated, grille), rolling steel vs. sectional head-to-head, and five application scenes.

### 4. Garage Door ROI Calculator
Interactive return-on-investment calculator for new garage door installations. Compares costs, energy savings, home value impact, and payback periods.

### 5. Energy Efficiency Lab
Insulation types, R-values, climate zone analysis, and energy savings calculations for garage door upgrades.

### 6. Spring Fatigue & Cold Weather
How temperature swings and metal fatigue cause spring failures — with cycle life modeling, cold weather stress analysis, and maintenance guidance.

### 7. Spring-Powered Catapult
Fun physics demo using garage door spring mechanics to launch projectiles. Demonstrates stored energy, release mechanics, and trajectory physics.

### 8. Installation Training Simulator
Step-by-step garage door installation training with interactive decision points and safety checkpoints.

### 9. Safety Systems Lab
Interactive exploration of garage door safety mechanisms — auto-reverse, photo eyes, manual release, and entrapment protection systems.

## WordPress Plugin (A Plus Garage Door Science)

Six of the presentations are bundled as a WordPress plugin with Gutenberg blocks and shortcodes.

### Install

1. Go to the [Latest Release](https://github.com/sethshoultes/science-of-garage-doors/releases/latest)
2. Download the `.zip` file
3. In WordPress: Plugins → Add New → Upload Plugin → upload the zip
4. Activate the plugin

### Blocks & Shortcodes

| Presentation | Shortcode |
|---|---|
| Science of Garage Doors | `[aplus_garage_door_science]` |
| Science of Garage Door Springs | `[aplus_spring_science]` |
| Rolling Steel Doors Lab | `[aplus_rolling_steel]` |
| Garage Door ROI Calculator | `[aplus_garage_door_roi]` |
| Energy Efficiency Lab | `[aplus_energy_efficiency]` |
| Spring Fatigue & Cold Weather | `[aplus_spring_fatigue]` |

All shortcodes accept an optional `height` attribute: `[aplus_rolling_steel height="600px"]`

Gutenberg blocks are available by searching for any presentation name in the block inserter.

### Auto-Updates

The plugin checks GitHub for new releases automatically. When a new version is available, you'll see the update in your WordPress dashboard — one-click install.

## Tech

Each presentation is a self-contained single HTML file with inline CSS and JavaScript. No build system, no dependencies to install, no package manager. The Science of Garage Doors presentation uses [Three.js r128](https://threejs.org/) via CDN for 3D rendering.

## Running Locally

Open any presentation HTML file directly in a browser.

# The Science of Garage Doors — Interactive 3D Explorer

A comprehensive interactive educational experience covering garage door physics, spring engineering, drive system mechanics, motor internals, smart home integration, and electromagnetic interference.

**[Try it live](https://sethshoultes.github.io/science-of-garage-doors/)**

## What's Inside

### 1. Door System Mechanics
Interactive 3D sectional door with 5 panels that open and close along tracked rails. Real-time readouts for door position, panel angle, cable tension, and spring torque.

### 2. Torsion Spring Physics
Animated spring winding/unwinding with dynamic mesh that changes color based on wire stress. Adjustable door weight slider (80–400 lbs) with live energy, torque, and stress calculations.

### 3. Drive Type Comparison
Four tabbed 3D scenes showing how each opener drive works:
- **Chain Drive** — Sprocket and chain link animation
- **Belt Drive** — Rubber belt with steel reinforcement
- **Screw Drive** — Threaded rod helix with coupling
- **Direct Drive** — Motor-as-trolley with internal gear

### 4. Motor Internals
Exploded view of a PSC (Permanent Split Capacitor) AC motor with stator coils, squirrel cage rotor, worm gear reduction (60:1), capacitor, circuit board, and limit switch. Toggle between assembled and exploded views; run the motor to see rotor and gear animation.

### 5. Smart Home Integration
3D visualization of the IoT ecosystem: Wi-Fi hub, phone, router, HomeKit, remote, and cloud connections with animated signal rings and IR safety sensor beams.

### 6. LED Radio Interference
Interactive demonstration of how LED bulb wattage affects garage door remote range. Select different bulb wattages (5W–15W) to see signal strength drop from 50ft to 3ft, with frequency spectrum diagram showing 315 MHz signal overlap.

## WordPress Plugin (A Plus Garage Door Science)

This repo also contains a unified WordPress plugin bundling six interactive presentations as Gutenberg blocks:

1. Science of Garage Doors
2. Science of Garage Door Springs
3. Rolling Steel Doors Lab
4. Garage Door ROI Calculator
5. Energy Efficiency Lab
6. Spring Fatigue & Cold Weather

### Install

1. Go to the [Latest Release](https://github.com/sethshoultes/science-of-garage-doors/releases/latest)
2. Download the `.zip` file
3. In WordPress: Plugins → Add New → Upload Plugin → upload the zip
4. Activate the plugin

### Usage

**Gutenberg Blocks:** Search for any presentation name in the block inserter.

**Shortcodes:** `[aplus_garage_door_science]`, `[aplus_spring_science]`, `[aplus_rolling_steel]`, `[aplus_garage_door_roi]`, `[aplus_energy_efficiency]`, `[aplus_spring_fatigue]`

All shortcodes accept an optional `height` attribute: `[aplus_rolling_steel height="600px"]`

### Auto-Updates

The plugin checks GitHub for new releases automatically. When a new version is available, you'll see the update in your WordPress dashboard — one-click install.

## Tech

Single `index.html` file — no build step, no server required. Uses [Three.js r128](https://threejs.org/) via CDN for 3D rendering.

## Running Locally

Open `index.html` in any modern browser.

## Fonts

- **Oswald** — Section titles and headings
- **Source Sans Pro** — Body text
- **JetBrains Mono** — Physics readouts and technical labels

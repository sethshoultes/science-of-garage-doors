

**PROJECT PLAN**

**The Science of Garage Doors**

Interactive 3D Explorer

A comprehensive plan for building the definitive interactive educational experience covering garage door physics, spring engineering, drive system mechanics, motor internals, smart home integration, and electromagnetic interference.

| Version | 2.0 — Full Enhancement Plan |
| :---- | :---- |
| **Author** | Seth (Product Lead, Caseproof) |
| **Date** | March 12, 2026 |
| **Status** | Planning |
| **Platform** | Single-page HTML / Three.js r128 |

# **Executive Summary**

This project enhances the Garage Door Science Interactive 3D Explorer from a solid v1 prototype into a polished, comprehensive educational tool. The plan is organized into 7 phases, progressing from high-impact visual upgrades through new content sections, advanced physics simulations, and final polish.

**Total scope:** 42 distinct tasks across 7 phases. Estimated effort: 30–40 hours of implementation. Each phase is independently shippable, so improvements are visible incrementally.

| Architecture Note The entire project remains a single self-contained HTML file with inline Three.js. No build tools, no dependencies beyond the Three.js CDN. This keeps it dead simple to host, share, and embed anywhere. All scenes use the same renderer pattern with lazy initialization for performance. |
| :---- |

| PHASE 1 3D Scene Upgrades |
| :---- |

Upgrade the existing 3D scenes from functional prototypes to visually detailed, mechanically accurate representations. This phase has the highest visual ROI — it transforms “this is a demo” into “this is a professional tool.”

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Panel Roller Wheels** | **P0** | **Med** | Add visible steel rollers (cylinder \+ axle) at each hinge point. Rollers rotate as panels move through the track curve. Use a small TorusGeometry for the wheel with a CylinderGeometry axle. Rotation speed derived from panel linear velocity / roller circumference. |
| **Cable Drum Animation** | **P0** | **High** | Model the cable drum with visible spiral grooves (use a custom lathe geometry or extruded helix). Cable wraps/unwraps as door opens/closes. Cable is a TubeGeometry along a calculated path from drum to bottom bracket. Drum diameter increase shows mechanical advantage. |
| **J-Arm / Straight Arm Linkage** | **P1** | **Med** | Add the arm connecting trolley to door bracket. Model both J-arm (curved, standard) and straight-arm (commercial) variants. The arm pivots at the bracket as the door transitions through the curve. IK solver or simple trigonometric positioning based on trolley X and door pivot Y. |
| **Track Radius Detail** | **P1** | **Low** | Replace the simple box track with a proper curved channel cross-section (extruded C-shape along the vertical, radius, and horizontal segments). Add track brackets/supports hanging from ceiling at intervals. |
| **Weatherseal & Bottom Bracket** | **P2** | **Low** | Add bottom rubber seal (extruded rectangle along door width), bottom brackets (where cables attach), and bracket detail at each corner. Adds visual authenticity. |
| **Motor Current Flow Animation** | **P1** | **High** | In the motor internals scene, add animated glowing paths showing AC current flow through stator windings. Use a custom ShaderMaterial with animated UV offset to create a “flowing energy” effect along the copper coils. Phase shift between coil pairs visualized. |
| **Stator Field Visualization** | **P2** | **Med** | Add an optional magnetic field overlay showing the rotating magnetic field produced by the stator. Use instanced arrow meshes or line segments that rotate with the field. Toggle-able via a button to avoid visual clutter. |

### **Technical Notes**

* Roller rotation: angular velocity \= linear panel speed / (2π × roller radius). Track a cumulative angle per roller.

* Cable path: parametric curve from drum tangent point, through a series of waypoints, to the bottom bracket. Recalculate each frame during door motion.

* J-arm pivot: two-link IK. Given trolley position (on rail) and bracket position (on door), solve for the elbow angle. The arm naturally bends more as the door starts to open.

* Current flow shader: uniform float uTime drives a sin() wave along the UV.x of the tube geometry. Use additive blending for glow effect.

| PHASE 2 Interactive Physics Simulations |
| :---- |

Add the simulation and calculation tools that turn this from a visual tour into a genuinely useful engineering reference. These are the sections that garage door techs and engineers will bookmark.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Spring Calculator Tool** | **P0** | **High** | Full interactive calculator: input wire gauge (0.177–0.312”), coil inside diameter (1.75–2.5”), and number of coils (50–300). Computes IPPT, max turns, cycle life estimate, and recommended door weight range. Renders the calculated spring to scale in 3D, color-coded by stress level. Add presets for common spring sizes. |
| **Force Balance Diagram** | **P0** | **High** | Side-by-side animated chart: spring counterbalance force curve vs. door effective weight curve across 0–100% travel. Shows the “balance zone” where forces match and the “dead spots” where the door feels heavy or light. Slider to adjust spring tension (turns) and see curves shift. This is THE core engineering concept. |
| **Worm Gear Ratio Interactive** | **P1** | **Med** | Adjustable gear ratio slider (20:1 to 80:1). 3D worm gear spins at motor RPM, output shaft shows resulting RPM and torque. Real-time readout of input RPM, output RPM, torque multiplication, and efficiency loss. Visual “self-locking” demo showing how back-driving fails. |
| **Cycle Life Estimator** | **P1** | **Med** | Input cycles/day (1–10), spring rating (10K, 25K, 50K, 100K). Outputs expected years of life, total open/close cycles, and a degradation curve showing how spring force decreases over time. Animated timeline visualization. |
| **Safety Force Calculator** | **P2** | **Med** | UL 325 compliance tool: given door weight and speed, calculate the force exerted at bottom edge during closing. Show the 15 lb·ft reversal threshold. Slider for motor force setting and door weight. Green/red indicator for compliance. |

| Engineering Accuracy All calculations use real spring engineering formulas. Wire stress: S \= (8 × K × D × F) / (π × d³) where K is the Wahl correction factor. IPPT \= d⁴G / (10.8DN). Cycle life based on Goodman diagram / SN curve for oil-tempered wire (ASTM A229). These aren’t toy numbers — they should match what a spring supplier’s calculator produces. |
| :---- |

| PHASE 3 New Content Sections |
| :---- |

Expand the content coverage to address the full landscape of garage door technology. Each section follows the same template: 3D scene, interactive elements, physics readouts, and info cards.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Extension Springs Section** | **P0** | **High** | Full section on extension springs (the older style). 3D model showing spring stretching as door opens, pulley/cable routing, and safety cables running through the center. Explain why torsion replaced them (uneven force, catastrophic failure mode, limited cycle life). Include the physics: F \= kx for linear springs vs. τ \= κθ for torsion. |
| **Jackshaft / Wall-Mount Openers** | **P1** | **Med** | Fifth drive type section. 3D model of the motor mounting beside the torsion shaft and directly driving it via gear reduction. Show how this eliminates the ceiling-mounted rail entirely. Explain use cases: high ceilings, cathedral ceilings, storage optimization. Include LiftMaster 8500W and direct competitors. |
| **Battery Backup & DC Motors** | **P1** | **Med** | Section covering the shift from AC to DC motors in modern openers. 3D comparison of AC induction motor vs. DC motor with permanent magnets. Explain advantages: variable speed control, soft start/stop native, battery backup capability. Show the battery system and automatic transfer switching. |
| **Troubleshooting Flowchart** | **P0** | **High** | Interactive decision-tree diagram: start with symptom (“door won’t open,” “door reverses,” “motor runs but door doesn’t move,” “remote doesn’t work,” etc.). Each node is clickable, expanding to the next diagnostic step. Leaf nodes give the fix. Rendered as a 3D or SVG flowchart with animated path highlighting. |
| **Safety Systems Deep Dive** | **P1** | **Med** | Dedicated section on UL 325 requirements: photoelectric sensors (IR beam, modulated frequency, alignment), mechanical force sensing (motor current threshold), manual release (red cord mechanism), and entrapment protection. 3D scene showing sensor beam path with obstruction detection animation. |
| **Commercial vs. Residential** | **P2** | **Med** | Comparison section: hoist operators (jackshaft, trolley, hoist), rolling steel doors, fire-rated doors, high-cycle springs (100K+), 3-phase motors, and commercial control systems. Brief 3D models of each type. |

### **Extension Spring Physics Detail**

The extension spring section deserves special attention because it’s the most dangerous configuration still in active use. Key content:

* Linear force characteristic (F \= kx) vs. the door’s non-linear weight curve creates inherent imbalance at partial-open positions

* Safety cable routing: cable threads through the center of the coil, anchored at both ends, so a broken spring is captured rather than becoming a projectile

* Pulley system: shows how the cable routes from the spring to the bottom bracket via pulleys on the horizontal track support, creating a 2:1 mechanical advantage

* Failure mode comparison: extension spring snaps and whips (contained by safety cable if present) vs. torsion spring unwinds violently on the shaft (contained by the shaft itself)

| PHASE 4 LED & EMI Enhancements |
| :---- |

The LED interference section is one of the most practically useful parts of the entire project. Most homeowners and even some technicians don’t understand WHY their LED bulbs kill their remotes. These upgrades make the invisible visible.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Oscilloscope Waveform Display** | **P0** | **High** | Animated real-time oscilloscope showing: (1) Clean 315 MHz signal from remote transmitter, (2) LED noise floor rising as wattage increases, (3) Signal-to-noise ratio degrading until the signal is buried. Use Canvas 2D or SVG for the waveform. Synced to the wattage selector so changing bulb type immediately shows the impact on the scope. |
| **3D LED Bulb Cutaway** | **P1** | **Med** | 3D model of an LED bulb showing internal components: LED array, heat sink, driver PCB with switching MOSFET, inductor, capacitor. Cutaway view. Animated EMI radiation rings emanating from the driver board area when the bulb is “on.” Intensity of radiation proportional to wattage. |
| **EMI Radiation Pattern** | **P1** | **Med** | 3D visualization of the electromagnetic interference pattern radiating from the opener housing when cheap LEDs are installed. Show the near-field pattern (strongest close to the bulb) dissipating with distance. Overlay the remote control signal path from outside the garage to the opener’s antenna. |
| **Antenna Wire Demo** | **P2** | **Low** | Interactive 3D showing proper vs. improper antenna placement. Full-length wire hanging straight down (good) vs. coiled up, cut short, or tucked behind the housing (bad). Signal reception strength indicator changes in real-time as you drag the antenna into different positions. |
| **FCC Part 15 Explainer** | **P2** | **Low** | Info section explaining FCC Part 15 limits for unintentional radiators, why cheap imported LED bulbs violate these limits, and how to identify compliant bulbs (FCC ID lookup). Include a comparison of EMI test results between a compliant bulb and a cheap Amazon bulb. |

| Real-World Impact This is the section that A+ Garage Door customers would actually use. A homeowner searching “why won’t my garage door remote work” would find this immensely helpful. The oscilloscope visualization makes the invisible RF problem tangible. Consider this section as potential standalone content that could be linked from service calls. |
| :---- |

| PHASE 5 Smart Home & Security Deep Dive |
| :---- |

Expand the smart opener section into a comprehensive reference covering security protocols, integration ecosystems, and common failure modes.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Rolling Code Animation** | **P0** | **High** | Animated visualization of rolling code encryption: show a remote transmitting a code, the opener’s counter incrementing, and the synchronization between them. Then show a replay attack failing because the captured code has already been used. Compare Security+ 1.0 (fixed+rolling) vs Security+ 2.0 (fully encrypted). This is a concept most people don’t understand. |
| **Wi-Fi Architecture Diagram** | **P1** | **Med** | Interactive 3D network diagram showing the full command path: Phone → Cloud Server (AWS) → Home Router → Opener Wi-Fi Module → Motor Controller. Show latency at each hop. Compare cloud-dependent (myQ) vs. local-only (Z-Wave/Zigbee) vs. Matter (local \+ cloud) architectures. |
| **Retrofit Comparison Tool** | **P1** | **Med** | Interactive comparison matrix for retrofit smart devices: Meross, Tailwind iQ3, myQ Smart Hub, Ratgdo, GoControl, Zooz. Filterable by: protocol (Wi-Fi/Z-Wave/Zigbee), local control support, price, HomeKit/Google/Alexa support. Rendered as an interactive table with filter toggles. |
| **Ratgdo / Local Control** | **P1** | **Low** | Section on the ratgdo project and the movement toward local-only control without cloud dependency. Explain how it taps into the Security+ 2.0 serial bus on the motor head, providing MQTT/ESPHome control. Diagram the wiring and communication protocol. |
| **Matter Protocol Future** | **P2** | **Low** | Forward-looking section on Matter over Thread and what it means for garage door openers: local control, no cloud required, cross-platform, and potential for a single standard across manufacturers. Timeline of announced Matter garage door products. |

| PHASE 6 Performance & UX Polish |
| :---- |

Make the experience buttery smooth, accessible, and delightful. This phase transforms a good technical demo into a memorable interactive experience.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Scroll-Triggered Activation** | **P0** | **Med** | Use IntersectionObserver to pause/resume Three.js render loops when scenes are off-screen. Currently all scenes render all the time, wasting GPU. Only the hero and the currently-visible scene should be animating. Add smooth fade-in when scenes enter the viewport. |
| **3D Annotation Labels** | **P0** | **High** | Floating HTML labels positioned via 3D→2D projection (THREE.Vector3.project()). Labels point to specific components with leader lines. Auto-hide when component is behind camera. Use for motor internals exploded view: label each component (stator, rotor, worm gear, etc.) with name \+ key spec. |
| **Sound Design** | **P1** | **Med** | Web Audio API for: door rumble during open/close (filtered noise), spring winding clicks (short impulses), motor hum (oscillator at 60Hz harmonic), chain drive rattle (randomized clicks), belt drive whisper (filtered white noise). All sounds spatial (panner node) and volume-controlled. Mute toggle in UI. |
| **Progressive Loading** | **P1** | **Med** | Lazy-load scenes as the user scrolls toward them. Show a skeleton/wireframe placeholder during initialization. Preload the next section while the user reads the current one. Target: initial page load under 2 seconds with only the hero scene active. |
| **Mobile Optimization** | **P1** | **Med** | Touch gesture handling for 3D scenes (pinch zoom, single-finger rotate, two-finger pan). Reduce geometry complexity on mobile (lower segment counts). Test on iPhone Safari and Chrome Android. Ensure all interactive elements have 44px+ touch targets. |
| **Print Summary Mode** | **P2** | **Med** | A print-friendly view that generates a clean reference sheet: key specs tables, spring formula cheat sheet, troubleshooting flowchart, LED bulb compatibility list. Uses @media print CSS to hide 3D scenes and show static diagrams. Exportable as PDF via window.print(). |
| **Keyboard Navigation** | **P2** | **Low** | Arrow keys to navigate between sections, Space/Enter to trigger scene controls, Tab for focus management, Escape to close overlays. ARIA labels on all interactive elements. Screen reader announcements for physics readouts. |

| Performance Target Goal: 60fps on mid-range devices (iPhone 12, 3-year-old laptops) with at most 2 scenes active simultaneously. GPU memory budget: \~200MB total. Use dispose() aggressively on off-screen scene geometries and textures. SharedArrayBuffer for geometry reuse between scenes where possible. |
| :---- |

| PHASE 7 Advanced Visualizations & Bonus |
| :---- |

Stretch goals that push the experience into territory that would make this genuinely best-in-class. These are “wow factor” items that aren’t essential but would make this unforgettable.

## **Task Breakdown**

| Task | Priority | Complexity | Description |
| :---- | :---- | :---- | :---- |
| **Full Garage Cutaway** | **P2** | **High** | A single comprehensive 3D scene showing an entire garage: walls, ceiling, door, tracks, springs, motor, sensors, wiring — all visible in a cutaway view. User can rotate around the whole assembly. Individual components highlight on hover with tooltip info. This becomes the “hero” scene at the top of the page. |
| **Real-Time Spring Stress Map** | **P2** | **High** | Vertex-colored spring mesh where color represents wire stress at each point along the coil. Red at high-stress zones (inner coil surface), blue at low-stress. Animates as spring winds/unwinds. Uses custom vertex shader with stress calculation per vertex based on Wahl correction factor. |
| **Motor Electromagnetic Sim** | **P2** | **High** | Particle-based visualization of the rotating magnetic field inside the motor. Iron filings style: thousands of small instanced cylinders that align with the computed B-field vectors. Field rotates at synchronous speed. Shows slip when load is applied. Toggle between no-load and loaded states. |
| **AR Mode (Experimental)** | **P3** | **High** | WebXR integration for AR-capable devices. Place a virtual garage door assembly in the real world via phone camera. Primarily a tech demo but incredibly compelling for training scenarios. Progressive enhancement: only shows the AR button on compatible devices. |
| **Narrated Tour Mode** | **P2** | **Med** | Auto-scrolling guided tour with Web Speech API narration. Camera auto-positions for each scene, controls animate automatically, and text narration explains what’s happening. Useful for hands-free learning or presentation mode. Pause/resume controls. |
| **Quiz / Assessment Mode** | **P3** | **Med** | End-of-section knowledge checks: “Which drive type has only one moving part?” “What happens to remote range when LED wattage exceeds 8W?” Score tracking and a completion certificate. Useful if this becomes a training tool. |

# **Implementation Strategy**

## **Phase Dependencies**

The phases are designed to be largely independent, but there are some logical dependencies:

* Phase 1 (3D Upgrades) should come first — it establishes the visual quality bar for everything else

* Phase 2 (Physics Sims) depends on Phase 1 for the spring and motor scenes being in their final form

* Phase 3 (New Content) can start in parallel with Phase 1 since they’re new sections

* Phase 4 (LED/EMI) is independent and can be done anytime

* Phase 5 (Smart Home) is independent

* Phase 6 (Polish) should come after Phases 1–5 so it optimizes the final content

* Phase 7 (Advanced) requires all other phases to be stable

## **Suggested Build Order**

Optimized for maximum visible progress and shippable increments:

1. **Sprint 1 (Week 1–2):** Phase 1 core (roller wheels, cable drums, J-arm) \+ Phase 6 scroll activation. Immediate visual upgrade \+ performance fix.

2. **Sprint 2 (Week 3–4):** Phase 2 (spring calculator \+ force balance diagram). The two highest-value interactive tools.

3. **Sprint 3 (Week 5–6):** Phase 3 (extension springs \+ troubleshooting flowchart) \+ Phase 4 (oscilloscope waveform). High-value new content.

4. **Sprint 4 (Week 7–8):** Phase 3 (jackshaft, battery backup) \+ Phase 5 (rolling code animation, Wi-Fi architecture). Completing content coverage.

1. **Sprint 5 (Week 9–10):** Phase 6 remaining (3D labels, sound, mobile, print) \+ Phase 4 remaining (LED cutaway, antenna demo).

2. **Sprint 6 (Week 11–12):** Phase 7 selectively (full garage cutaway \+ narrated tour). Ship the advanced features that made the cut.

## **Technical Architecture**

Key architectural decisions for the v2 implementation:

### **Scene Management**

* Singleton renderer pattern: one WebGLRenderer shared across all scenes, switching render targets. Saves GPU memory vs. one renderer per canvas.

* Scene pool: maximum 2 active scenes at any time. When a new scene enters viewport, the oldest off-screen scene is disposed (geometries, materials, textures).

* Shared geometry/material cache: common shapes (cylinders, boxes, torus) and materials instantiated once and reused via clone().

### **Physics Engine**

* No external physics library needed. All physics are analytical (closed-form equations), not simulated.

* Spring calculations: standalone module with pure functions. Input: wire diameter, coil diameter, number of coils, material grade. Output: IPPT, max turns, energy, torque, stress, cycle life.

* Force balance: precomputed lookup table for door weight vs. position (based on door geometry), compared against spring torque vs. position curve.

### **Audio System**

* Web Audio API with a single AudioContext. Sound nodes created on first user interaction (Chrome autoplay policy).

* Spatial audio: each scene has a PannerNode positioned at the scene’s center. Volume attenuates as user scrolls away.

* Sound library: 6–8 procedurally generated sounds (no audio file downloads). OscillatorNode \+ BiquadFilterNode \+ GainNode chains.

## **Complete Task Summary**

All 42 tasks across 7 phases, with priority and complexity at a glance:

| Phase | Tasks | P0/P1 | Est. Hours |
| :---- | :---- | ----- | ----- |
| **1\. 3D Upgrades** | 7 tasks: rollers, cable drums, J-arm, track detail, weatherseal, current flow, field viz | **4** | 8–10 |
| **2\. Physics Sims** | 5 tasks: spring calc, force balance, worm gear, cycle life, safety force | **3** | 6–8 |
| **3\. New Content** | 6 tasks: extension springs, jackshaft, battery/DC, troubleshooting, safety, commercial | **3** | 8–10 |
| **4\. LED/EMI** | 5 tasks: oscilloscope, LED cutaway, EMI pattern, antenna demo, FCC explainer | **2** | 4–6 |
| **5\. Smart Home** | 5 tasks: rolling code, Wi-Fi arch, retrofit tool, ratgdo, Matter | **3** | 4–5 |
| **6\. UX Polish** | 7 tasks: scroll activation, 3D labels, sound, loading, mobile, print, keyboard | **4** | 6–8 |
| **7\. Advanced** | 6 tasks: full cutaway, stress map, EM sim, AR, narrated tour, quiz | **0** | 6–10 |
| **TOTAL** | **42 tasks across 7 phases** | **19** | **42–57** |

| Next Step Pick a sprint to start with and we’ll build it. Each sprint produces a shippable increment. Recommend starting with Sprint 1 (Phase 1 core \+ scroll activation) for immediate visual impact. |
| :---- |


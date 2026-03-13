// ═══════════════════════════════════════════════════════════════
// PHASE 1: 3D SCENE UPGRADES
// Enhanced Scene 1 (Door System) and Scene 4 (Motor Internals)
//
// Drop-in replacement for the corresponding IIFEs in index.html.
// Uses the same globals: makeRenderer, fitRenderer, addLights,
// makeOrbitLike, matOrange, matSteel, matDarkSteel, matWire,
// matPanel, matRubber, matGreen, matCyan.
//
// New materials added below for Phase 1 features.
// ═══════════════════════════════════════════════════════════════


// ─── PHASE 1 ADDITIONAL MATERIALS ───
const matCopper = new THREE.MeshStandardMaterial({ color: 0xdd8833, metalness: 0.85, roughness: 0.25 });
const matRollerSteel = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.15 });
const matCableSteel = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.25 });
const matWeatherseal = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.02, roughness: 0.98 });
const matBracket = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });


// ═══════════════════════════════════════════════════════════════
// SCENE 1: GARAGE DOOR SYSTEM (ENHANCED)
// ═══════════════════════════════════════════════════════════════
//
// Upgrades integrated:
//   1. Panel Roller Wheels — steel rollers at each hinge point
//   2. Cable Drum Animation — grooved drums + wrapping cable
//   3. J-Arm / Straight Arm Linkage — trolley-to-door connector
//   4. Track Radius Detail — curved C-channel cross-section
//   5. Weatherseal & Bottom Bracket — rubber seal + cable brackets
// ═══════════════════════════════════════════════════════════════

let doorProgress = 0, doorTarget = 0, doorOpening = false;

(function() {
  const canvas = document.getElementById('doorCanvas');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0c0e, 15, 30);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(6, 3, 8);
  camera.lookAt(0, 2, 0);

  addLights(scene);
  makeOrbitLike(camera, canvas);

  // ─── Floor ───
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ─── Frame ───
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });
  const lp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 0.15), frameMat);
  lp.position.set(-2.5, 2.5, 0);
  scene.add(lp);
  const rp = lp.clone();
  rp.position.set(2.5, 2.5, 0);
  scene.add(rp);
  const hdr = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.15, 0.15), frameMat);
  hdr.position.set(0, 5.05, 0);
  scene.add(hdr);


  // ═══════════════════════════════════════════
  // UPGRADE 4: Track Radius Detail
  // Curved C-channel cross-section tracks with
  // proper vertical, radius, and horizontal segments
  // ═══════════════════════════════════════════

  function createCChannelTrack(side) {
    var trackGroup = new THREE.Group();
    var xPos = side * 2.4;
    var channelDepth = 0.08;
    var channelWidth = 0.12;
    var wallThick = 0.015;

    // --- Vertical track segment (floor to curve start) ---
    var vertHeight = 4.5;
    // Back wall
    var vBack = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, vertHeight, channelDepth),
      frameMat
    );
    vBack.position.set(xPos, vertHeight / 2, 0);
    trackGroup.add(vBack);
    // Front wall
    var vFront = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, vertHeight, channelDepth),
      frameMat
    );
    vFront.position.set(xPos, vertHeight / 2, channelWidth);
    trackGroup.add(vFront);
    // Inner face (the bottom of the C)
    var vInner = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, vertHeight, channelWidth),
      frameMat
    );
    vInner.position.set(xPos + side * (wallThick / 2 + 0.01), vertHeight / 2, channelWidth / 2);
    trackGroup.add(vInner);

    // --- Curved radius section ---
    var radiusCenterY = 4.5;
    var radiusCenterZ = -1.0;
    var trackRadius = 1.0;
    var curveSegments = 16;

    for (var i = 0; i < curveSegments; i++) {
      var a0 = (i / curveSegments) * (Math.PI / 2);
      var a1 = ((i + 1) / curveSegments) * (Math.PI / 2);
      var midA = (a0 + a1) / 2;
      var segLen = trackRadius * (Math.PI / 2) / curveSegments;

      var cSeg = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, segLen * 1.1, channelDepth),
        frameMat
      );
      cSeg.position.set(
        xPos,
        radiusCenterY + Math.cos(midA) * trackRadius,
        radiusCenterZ + Math.sin(midA) * trackRadius
      );
      cSeg.rotation.x = -midA;
      trackGroup.add(cSeg);
    }

    // --- Horizontal track segment ---
    var horizLen = 8;
    var hBack = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, channelDepth, horizLen),
      frameMat
    );
    hBack.position.set(xPos, 5.0 + channelDepth / 2, -1.0 - horizLen / 2);
    trackGroup.add(hBack);
    var hFront = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, channelDepth, horizLen),
      frameMat
    );
    hFront.position.set(xPos, 5.0 - channelDepth / 2, -1.0 - horizLen / 2);
    trackGroup.add(hFront);
    // Bottom face of horizontal C
    var hBottom = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, channelWidth, horizLen),
      frameMat
    );
    hBottom.position.set(xPos + side * (wallThick / 2 + 0.01), 5.0, -1.0 - horizLen / 2);
    trackGroup.add(hBottom);

    // --- Track brackets / ceiling supports ---
    for (var b = 0; b < 3; b++) {
      var zPos = -2 - b * 2.5;
      var bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.6, 0.04),
        matBracket
      );
      bracket.position.set(xPos, 5.3, zPos);
      trackGroup.add(bracket);

      var angleBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.04, 0.04),
        matBracket
      );
      angleBar.position.set(xPos, 5.0 + 0.02, zPos);
      trackGroup.add(angleBar);
    }

    scene.add(trackGroup);
    return trackGroup;
  }

  createCChannelTrack(1);   // Right track
  createCChannelTrack(-1);  // Left track


  // ─── Torsion Spring above door ───
  var springPts = [];
  for (var st = 0; st < Math.PI * 20; st += 0.15) {
    springPts.push(new THREE.Vector3(st * 0.04 - 1.2, 0, Math.sin(st) * 0.08));
  }
  var springCurve = new THREE.CatmullRomCurve3(springPts);
  var springMesh = new THREE.Mesh(
    new THREE.TubeGeometry(springCurve, 100, 0.015, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.8, roughness: 0.2 })
  );
  springMesh.position.set(0, 5.5, 0);
  scene.add(springMesh);

  // Torsion shaft
  var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.5, 8), matDarkSteel);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(0, 5.5, 0);
  scene.add(shaft);


  // ═══════════════════════════════════════════
  // UPGRADE 2: Cable Drum Animation
  // Grooved drums at each end of torsion shaft.
  // Cable wraps/unwraps as door opens/closes.
  // ═══════════════════════════════════════════

  var cableDrums = [];
  var cables = [];

  for (var ds = -1; ds <= 1; ds += 2) {
    var drumGroup = new THREE.Group();

    // Main drum body
    var drumBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.22, 0.25, 24),
      matSteel
    );
    drumBody.rotation.z = Math.PI / 2;
    drumGroup.add(drumBody);

    // Spiral grooves on drum (visual detail)
    for (var g = 0; g < 8; g++) {
      var grooveAngle = (g / 8) * Math.PI * 2;
      var grooveR = 0.22 + (g / 8) * 0.06;
      var groove = new THREE.Mesh(
        new THREE.TorusGeometry(grooveR, 0.008, 4, 16, Math.PI * 1.8),
        matDarkSteel
      );
      groove.rotation.y = Math.PI / 2;
      groove.rotation.z = grooveAngle;
      groove.position.x = (g / 8 - 0.4) * 0.25;
      drumGroup.add(groove);
    }

    // Flange plates
    var flange1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.02, 16),
      matDarkSteel
    );
    flange1.rotation.z = Math.PI / 2;
    flange1.position.x = 0.13;
    drumGroup.add(flange1);
    var flange2 = flange1.clone();
    flange2.position.x = -0.13;
    drumGroup.add(flange2);

    drumGroup.position.set(ds * 2.6, 5.5, 0);
    scene.add(drumGroup);
    cableDrums.push(drumGroup);

    cables.push({ side: ds, mesh: null });
  }

  function updateCables(t) {
    cables.forEach(function(cableData) {
      if (cableData.mesh) {
        scene.remove(cableData.mesh);
        cableData.mesh.geometry.dispose();
      }

      var side = cableData.side;
      var drumX = side * 2.6;
      var drumY = 5.5;
      var drumZ = 0;

      // Cable wraps on drum proportional to (1 - t)
      // t=0 (closed): cable fully wound; t=1 (open): cable unwound
      var wraps = (1 - t) * 3;
      var pts = [];

      // Wrap portion on the drum
      var wrapSegs = Math.max(1, Math.floor(wraps * 12));
      for (var wi = 0; wi <= wrapSegs; wi++) {
        var frac = wi / wrapSegs;
        var wAngle = frac * wraps * Math.PI * 2;
        var r = 0.22 + frac * 0.06;
        pts.push(new THREE.Vector3(
          drumX + (frac * 0.15 - 0.075),
          drumY + Math.sin(wAngle) * r,
          drumZ + Math.cos(wAngle) * r
        ));
      }

      // Cable runs down from drum to bottom bracket
      var bottomY = 0.15;
      var bottomZ = 0.06;

      pts.push(new THREE.Vector3(side * 2.35, drumY - 0.3, 0.2));
      pts.push(new THREE.Vector3(side * 2.35, bottomY + 2, 0.1));
      pts.push(new THREE.Vector3(side * 2.35, bottomY, bottomZ));

      if (pts.length >= 2) {
        var curve = new THREE.CatmullRomCurve3(pts);
        var tubeGeo = new THREE.TubeGeometry(curve, 32, 0.012, 6, false);
        cableData.mesh = new THREE.Mesh(tubeGeo, matCableSteel);
        scene.add(cableData.mesh);
      }
    });

    // Rotate drums with door motion
    cableDrums.forEach(function(drum) {
      drum.rotation.x = t * Math.PI * 3;
    });
  }


  // ─── Door Panels (5 panels) ───
  var panels = [];
  var panelCount = 5;
  var panelH = 0.9;
  var doorW = 4.8;
  var allRollers = [];

  for (var pi = 0; pi < panelCount; pi++) {
    var panelGroup = new THREE.Group();

    // Main panel body
    var pMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, panelH, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.7 })
    );
    pMesh.castShadow = true;
    panelGroup.add(pMesh);

    // Panel line detail
    var pLine = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.01, 0.02, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.1, roughness: 0.8 })
    );
    pLine.position.y = panelH / 2 - 0.02;
    panelGroup.add(pLine);


    // ═══════════════════════════════════════════
    // UPGRADE 1: Panel Roller Wheels
    // Steel rollers (wheel + axle) at each hinge
    // Rollers rotate based on panel linear velocity.
    // angular velocity = linear speed / (2pi * radius)
    // ═══════════════════════════════════════════

    for (var rs = -1; rs <= 1; rs += 2) {
      var rollerGroup = new THREE.Group();

      // Roller wheel (TorusGeometry for tire profile)
      var rWheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.025, 8, 16),
        matRollerSteel
      );
      rWheel.rotation.y = Math.PI / 2;
      rollerGroup.add(rWheel);

      // Roller hub (center disc)
      var rHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8),
        matDarkSteel
      );
      rHub.rotation.x = Math.PI / 2;
      rollerGroup.add(rHub);

      // Axle extending through hinge into track
      var rAxle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.15, 6),
        matDarkSteel
      );
      rAxle.rotation.x = Math.PI / 2;
      rAxle.position.z = 0.06;
      rollerGroup.add(rAxle);

      // Hinge plate (connects roller to panel)
      var hingePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.02),
        matBracket
      );
      hingePlate.position.z = 0.06;
      rollerGroup.add(hingePlate);

      rollerGroup.position.set(rs * 2.2, panelH / 2, 0.06);
      panelGroup.add(rollerGroup);

      allRollers.push({ wheel: rWheel, panelIndex: pi, cumulativeAngle: 0 });
    }

    panelGroup.position.set(0, panelH / 2 + pi * panelH, 0);
    scene.add(panelGroup);
    panels.push(panelGroup);
  }


  // ═══════════════════════════════════════════
  // UPGRADE 5: Weatherseal & Bottom Bracket
  // Bottom rubber seal on the lowest panel,
  // bottom brackets where cables attach.
  // ═══════════════════════════════════════════

  // Bottom rubber weatherseal (attached to panel 0)
  var weatherseal = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + 0.1, 0.08, 0.14),
    matWeatherseal
  );
  weatherseal.position.set(0, -panelH / 2 + 0.02, 0.02);
  panels[0].add(weatherseal);

  // Rounded front lip for realistic seal profile
  var sealLip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, doorW + 0.1, 8),
    matWeatherseal
  );
  sealLip.rotation.z = Math.PI / 2;
  sealLip.position.set(0, -panelH / 2 - 0.01, 0.07);
  panels[0].add(sealLip);

  // Bottom brackets (cable attachment points) on each side
  for (var bs = -1; bs <= 1; bs += 2) {
    var bracketGroup = new THREE.Group();

    // L-shaped bracket
    var bracketVert = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.04),
      matBracket
    );
    bracketGroup.add(bracketVert);

    var bracketHoriz = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.1),
      matBracket
    );
    bracketHoriz.position.set(0, -0.08, 0.07);
    bracketGroup.add(bracketHoriz);

    // Cable attachment bolt
    var bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6),
      matDarkSteel
    );
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0, -0.08, 0.12);
    bracketGroup.add(bolt);

    bracketGroup.position.set(bs * 2.35, -panelH / 2 + 0.12, 0.06);
    panels[0].add(bracketGroup);
  }


  // ─── Motor unit on ceiling ───
  var motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.2), matDarkSteel);
  motorBox.position.set(0, 5.3, -5);
  scene.add(motorBox);

  var motorBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.5 })
  );
  motorBulb.position.set(0, 5.05, -5);
  scene.add(motorBulb);

  // Rail from motor
  var motorRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 9), matSteel);
  motorRail.position.set(0, 5.1, -0.5);
  scene.add(motorRail);


  // ═══════════════════════════════════════════
  // UPGRADE 3: J-Arm / Straight Arm Linkage
  // Arm connecting trolley to door bracket.
  // J-arm (curved) pivots as door transitions.
  // Uses trigonometric positioning based on
  // trolley X and door pivot Y.
  // ═══════════════════════════════════════════

  // Trolley on the rail
  var trolley = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.15, 0.3),
    matOrange
  );
  trolley.position.set(0, 5.05, -1);
  scene.add(trolley);

  // Door bracket (attaches to top panel)
  var doorBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.06),
    matBracket
  );

  // J-arm mesh rebuilt each frame
  var jArmMesh = null;
  var jArmMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });

  function updateJArm(t) {
    // Trolley position along the rail
    var trolleyZ = -0.8 - t * 4.0;
    trolley.position.z = trolleyZ;

    // Door bracket at the top of the topmost panel
    var topPanel = panels[panelCount - 1];
    var bracketWorldPos = new THREE.Vector3();
    topPanel.getWorldPosition(bracketWorldPos);
    bracketWorldPos.y += panelH / 2;

    doorBracket.position.copy(bracketWorldPos);
    doorBracket.position.z += 0.08;

    // Remove old arm mesh
    if (jArmMesh) {
      scene.remove(jArmMesh);
      jArmMesh.geometry.dispose();
    }

    // Build J-arm curve from trolley to door bracket
    var trolleyPos = new THREE.Vector3(0, 5.05, trolleyZ);
    var bracketPos = doorBracket.position.clone();

    // J-arm characteristic curve (bends down then forward)
    var midY = (trolleyPos.y + bracketPos.y) / 2 - 0.3;
    var midZ = (trolleyPos.z + bracketPos.z) / 2;

    var armPts = [
      trolleyPos.clone(),
      new THREE.Vector3(0, trolleyPos.y - 0.15, trolleyPos.z + 0.2),
      new THREE.Vector3(0, midY, midZ),
      new THREE.Vector3(0, bracketPos.y + 0.2, bracketPos.z - 0.1),
      bracketPos.clone()
    ];

    var armCurve = new THREE.CatmullRomCurve3(armPts);
    var armGeo = new THREE.TubeGeometry(armCurve, 20, 0.025, 6, false);
    jArmMesh = new THREE.Mesh(armGeo, jArmMat);
    scene.add(jArmMesh);

    doorBracket.lookAt(trolleyPos);
  }


  // ─── Roller angle tracking ───
  var prevDoorProgress = 0;

  function updateDoor(t) {
    for (var i = 0; i < panelCount; i++) {
      var panel = panels[i];
      var panelT = Math.max(0, Math.min(1, (t * panelCount - (panelCount - 1 - i)) * 1.0));

      if (panelT <= 0) {
        panel.position.set(0, panelH / 2 + i * panelH, 0);
        panel.rotation.x = 0;
      } else if (panelT < 0.5) {
        var a = panelT * 2;
        var curveAngle = a * Math.PI / 2;
        var radius = 1.0;
        panel.position.set(0, 5 - panelH / 2 + radius * Math.cos(curveAngle) - radius, -radius * Math.sin(curveAngle));
        panel.rotation.x = -curveAngle;
      } else {
        var slide = (panelT - 0.5) * 2;
        panel.position.set(0, 5 - panelH / 2, -1.0 - slide * 2.5);
        panel.rotation.x = -Math.PI / 2;
      }
    }

    // ─── Roller rotation (Upgrade 1) ───
    var rollerRadius = 0.06;
    var deltaT = t - prevDoorProgress;
    var linearSpeed = deltaT * panelH * panelCount;
    var angularDelta = linearSpeed / rollerRadius;

    allRollers.forEach(function(r) {
      r.cumulativeAngle += angularDelta;
      r.wheel.rotation.x = r.cumulativeAngle;
    });
    prevDoorProgress = t;

    // ─── Cable drum animation (Upgrade 2) ───
    updateCables(t);

    // ─── J-arm update (Upgrade 3) ───
    updateJArm(t);

    // ─── Readouts ───
    var posEl = document.getElementById('doorPosVal');
    posEl.textContent = Math.round(t * 100);
    var posUnit = document.createElement('span');
    posUnit.className = 'readout-unit';
    posUnit.textContent = '%';
    posEl.appendChild(posUnit);

    var angleVal = Math.round(t * 90);
    var angleEl = document.getElementById('panelAngleVal');
    angleEl.textContent = angleVal;
    var angleUnit = document.createElement('span');
    angleUnit.className = 'readout-unit';
    angleUnit.textContent = '\u00b0';
    angleEl.appendChild(angleUnit);

    var tension = Math.round(42 + t * 30);
    var tensionEl = document.getElementById('cableTensionVal');
    tensionEl.textContent = tension;
    var tensionUnit = document.createElement('span');
    tensionUnit.className = 'readout-unit';
    tensionUnit.textContent = 'lbs';
    tensionEl.appendChild(tensionUnit);

    var torque = Math.round((1 - t) * 85);
    var torqueEl = document.getElementById('springTorqueVal');
    torqueEl.textContent = torque;
    var torqueUnit = document.createElement('span');
    torqueUnit.className = 'readout-unit';
    torqueUnit.textContent = 'ft\u00b7lb';
    torqueEl.appendChild(torqueUnit);
  }

  function animate() {
    requestAnimationFrame(animate);
    var fSize = fitRenderer(renderer, canvas);
    camera.aspect = fSize.w / fSize.h;
    camera.updateProjectionMatrix();

    if (Math.abs(doorProgress - doorTarget) > 0.002) {
      doorProgress += (doorTarget - doorProgress) * 0.02;
    }
    updateDoor(doorProgress);

    // Rotate spring slightly when moving
    if (Math.abs(doorProgress - doorTarget) > 0.01) {
      springMesh.rotation.x += 0.02 * Math.sign(doorTarget - doorProgress);
    }

    renderer.render(scene, camera);
  }
  animate();
})();

function toggleDoor() {
  doorTarget = doorTarget < 0.5 ? 1 : 0;
}


// ═══════════════════════════════════════════════════════════════
// SCENE 4: MOTOR INTERNALS (ENHANCED)
// ═══════════════════════════════════════════════════════════════
//
// Upgrades integrated:
//   6. Motor Current Flow Animation — glowing current paths
//      through stator windings using ShaderMaterial
//   7. Stator Field Visualization — rotating magnetic field
//      overlay with instanced arrow meshes (toggle-able)
// ═══════════════════════════════════════════════════════════════

var motorExploded = false, motorRunning = false, motorExplodeT = 0;
var showFieldViz = false;

(function() {
  var canvas = document.getElementById('motorCanvas');
  var renderer = makeRenderer(canvas);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(5, 3, 7);
  camera.lookAt(0, 0, 0);
  addLights(scene);
  makeOrbitLike(camera, canvas);

  var time = 0;

  // ─── Motor casing (split for exploded view) ───
  var casingTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.8, 20, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85 })
  );
  casingTop.position.y = 0.4;
  casingTop.userData.explodeOffset = new THREE.Vector3(0, 2, 0);
  scene.add(casingTop);

  var casingBot = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.8, 20, 1, false, Math.PI, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.85 })
  );
  casingBot.position.y = 0.4;
  casingBot.userData.explodeOffset = new THREE.Vector3(0, -1.5, 0);
  scene.add(casingBot);


  // ═══════════════════════════════════════════
  // UPGRADE 6: Motor Current Flow Animation
  // Animated glowing paths showing AC current
  // flow through stator windings.
  // Custom ShaderMaterial with animated UV offset
  // for "flowing energy" effect along copper coils.
  // Phase shift between coil pairs visualized.
  // ═══════════════════════════════════════════

  var currentFlowVertexShader = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var currentFlowFragmentShader = [
    'uniform float uTime;',
    'uniform float uPhase;',
    'uniform float uRunning;',
    'varying vec2 vUv;',
    '',
    'void main() {',
    '  vec3 copper = vec3(0.87, 0.53, 0.2);',
    '  vec3 glow = vec3(0.3, 0.7, 1.0);',
    '',
    '  float wave = sin(vUv.x * 20.0 - uTime * 6.0 + uPhase) * 0.5 + 0.5;',
    '  wave = pow(wave, 3.0);',
    '',
    '  float acCycle = abs(sin(uTime * 3.14159 + uPhase));',
    '',
    '  float intensity = wave * acCycle * uRunning;',
    '  vec3 color = mix(copper, glow, intensity * 0.8);',
    '',
    '  float emissive = intensity * 0.6;',
    '',
    '  gl_FragColor = vec4(color + glow * emissive, 1.0);',
    '}'
  ].join('\n');

  // Stator windings with current flow material
  var statorGroup = new THREE.Group();
  var coilMaterials = [];

  for (var ci = 0; ci < 6; ci++) {
    var cAngle = (ci / 6) * Math.PI * 2;
    var phaseShift = (ci % 3) * (Math.PI * 2 / 3); // 3-phase: 0, 120, 240 deg

    var coilShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uPhase: { value: phaseShift },
        uRunning: { value: 0.0 }
      },
      vertexShader: currentFlowVertexShader,
      fragmentShader: currentFlowFragmentShader,
      side: THREE.DoubleSide
    });
    coilMaterials.push(coilShaderMat);

    var coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.04, 8, 24),
      coilShaderMat
    );
    coil.position.set(Math.cos(cAngle) * 0.65, 0.4, Math.sin(cAngle) * 0.65);
    coil.rotation.x = Math.PI / 2;
    coil.lookAt(0, 0.4, 0);
    statorGroup.add(coil);

    // Winding wire connections between paired coils
    if (ci > 0 && ci % 2 === 0) {
      var prevA = ((ci - 1) / 6) * Math.PI * 2;
      var wirePts = [
        new THREE.Vector3(Math.cos(prevA) * 0.65, 0.55, Math.sin(prevA) * 0.65),
        new THREE.Vector3(Math.cos(prevA) * 0.8, 0.65, Math.sin(prevA) * 0.8),
        new THREE.Vector3(Math.cos(cAngle) * 0.8, 0.65, Math.sin(cAngle) * 0.8),
        new THREE.Vector3(Math.cos(cAngle) * 0.65, 0.55, Math.sin(cAngle) * 0.65)
      ];
      var wireCurve = new THREE.CatmullRomCurve3(wirePts);
      var wireConn = new THREE.Mesh(
        new THREE.TubeGeometry(wireCurve, 12, 0.008, 4, false),
        coilShaderMat
      );
      statorGroup.add(wireConn);
    }
  }
  statorGroup.userData.explodeOffset = new THREE.Vector3(2, 0, 0);
  scene.add(statorGroup);


  // ═══════════════════════════════════════════
  // UPGRADE 7: Stator Field Visualization
  // Rotating magnetic field overlay using
  // instanced arrow meshes. Toggle-able via button.
  // ═══════════════════════════════════════════

  var fieldGroup = new THREE.Group();
  fieldGroup.visible = false;
  var fieldArrows = [];
  var fieldArrowCount = 24;
  var fieldRadius = 0.9;

  var arrowShaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4);
  var arrowTipGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
  var fieldMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.7
  });

  for (var fi = 0; fi < fieldArrowCount; fi++) {
    var fTheta = (fi / fieldArrowCount) * Math.PI * 2;
    var arrowGroup = new THREE.Group();

    var shaftM = new THREE.Mesh(arrowShaftGeo, fieldMat.clone());
    shaftM.position.y = 0.1;
    arrowGroup.add(shaftM);

    var tipM = new THREE.Mesh(arrowTipGeo, fieldMat.clone());
    tipM.position.y = 0.23;
    arrowGroup.add(tipM);

    arrowGroup.position.set(
      Math.cos(fTheta) * fieldRadius,
      0.4,
      Math.sin(fTheta) * fieldRadius
    );

    fieldGroup.add(arrowGroup);
    fieldArrows.push({ group: arrowGroup, baseTheta: fTheta });
  }
  scene.add(fieldGroup);

  // Field lines (concentric rings showing field direction)
  for (var fr = 0; fr < 3; fr++) {
    var ringR = 0.3 + fr * 0.25;
    var fieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, 0.004, 4, 32),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.3 - fr * 0.08
      })
    );
    fieldRing.position.y = 0.4;
    fieldRing.userData.isFieldRing = true;
    fieldGroup.add(fieldRing);
  }


  // ─── Rotor (squirrel cage) ───
  var rotor = new THREE.Group();
  var rotorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16), matDarkSteel);
  rotor.add(rotorCore);
  for (var ri = 0; ri < 12; ri++) {
    var rAngle = (ri / 12) * Math.PI * 2;
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 4), matSteel);
    bar.position.set(Math.cos(rAngle) * 0.28, 0, Math.sin(rAngle) * 0.28);
    rotor.add(bar);
  }
  var rotorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), matSteel);
  rotor.add(rotorShaft);
  rotor.position.y = 0.4;
  rotor.userData.explodeOffset = new THREE.Vector3(0, 0, 0);
  scene.add(rotor);

  // ─── Worm gear ───
  var wormGroup = new THREE.Group();
  var wormPts = [];
  for (var wt = 0; wt < Math.PI * 8; wt += 0.15) {
    wormPts.push(new THREE.Vector3(0, wt * 0.025 - 0.5, 0).add(
      new THREE.Vector3(Math.cos(wt) * 0.12, 0, Math.sin(wt) * 0.12)
    ));
  }
  var wormCurve = new THREE.CatmullRomCurve3(wormPts);
  var wormMesh = new THREE.Mesh(new THREE.TubeGeometry(wormCurve, 50, 0.025, 6, false), matSteel);
  wormGroup.add(wormMesh);

  var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 24), matOrange);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(0.55, 0, 0);
  wormGroup.add(wheel);
  for (var ti = 0; ti < 24; ti++) {
    var tAngle = (ti / 24) * Math.PI * 2;
    var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), matOrange);
    tooth.position.set(0.55 + Math.cos(tAngle) * 0.45, Math.sin(tAngle) * 0.45, 0);
    wormGroup.add(tooth);
  }
  wormGroup.position.set(0, -0.8, 0);
  wormGroup.userData.explodeOffset = new THREE.Vector3(-2, -1, 0);
  scene.add(wormGroup);

  // ─── Capacitor ───
  var cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x2255aa, metalness: 0.3, roughness: 0.6 })
  );
  cap.position.set(1.3, 0.4, 0.5);
  cap.userData.explodeOffset = new THREE.Vector3(3, 1, 1);
  scene.add(cap);
  var capLeads = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), matWire);
  capLeads.position.set(1.3, 0.7, 0.5);
  cap.add(capLeads);

  // ─── Circuit board ───
  var pcb = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.05, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x116633, roughness: 0.7 })
  );
  pcb.position.set(0, 1.3, 0);
  pcb.userData.explodeOffset = new THREE.Vector3(0, 3.5, 0);
  scene.add(pcb);
  for (var ci2 = 0; ci2 < 8; ci2++) {
    var comp = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 + Math.random() * 0.1, 0.04, 0.04 + Math.random() * 0.06),
      new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x222222 : 0xaa3333 })
    );
    comp.position.set((Math.random() - 0.5) * 0.8, 0.04, (Math.random() - 0.5) * 0.5);
    pcb.add(comp);
  }

  // ─── Limit switch ───
  var limitSw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), matOrange);
  limitSw.position.set(-1.2, -0.5, 0.5);
  limitSw.userData.explodeOffset = new THREE.Vector3(-3, -1, 2);
  scene.add(limitSw);

  var explodables = [casingTop, casingBot, statorGroup, wormGroup, cap, pcb, limitSw];


  // ─── Animation Loop ───
  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;
    var fSize = fitRenderer(renderer, canvas);
    camera.aspect = fSize.w / fSize.h;
    camera.updateProjectionMatrix();

    // Explode animation
    var targetT = motorExploded ? 1 : 0;
    motorExplodeT += (targetT - motorExplodeT) * 0.04;

    explodables.forEach(function(obj) {
      if (obj.userData.explodeOffset) {
        var off = obj.userData.explodeOffset;
        var basePos = obj.userData.basePos || obj.position.clone();
        if (!obj.userData.basePos) obj.userData.basePos = basePos.clone();
        obj.position.lerpVectors(basePos, basePos.clone().add(off), motorExplodeT);
      }
    });

    // Motor rotation
    if (motorRunning) {
      rotor.rotation.y += 0.15;
      wormGroup.children.forEach(function(c, idx) {
        if (idx === 0) c.rotation.y += 0.15;
      });
      wheel.rotation.z += 0.15 / 40;
    }

    // ─── Update current flow shader uniforms (Upgrade 6) ───
    var runningTarget = motorRunning ? 1.0 : 0.0;
    coilMaterials.forEach(function(mat) {
      mat.uniforms.uTime.value = time;
      mat.uniforms.uRunning.value += (runningTarget - mat.uniforms.uRunning.value) * 0.05;
    });

    // ─── Update magnetic field visualization (Upgrade 7) ───
    fieldGroup.visible = showFieldViz;
    if (showFieldViz && motorRunning) {
      var fieldAngle = time * 3.0;

      fieldArrows.forEach(function(arrow) {
        var localAngle = arrow.baseTheta - fieldAngle;
        var fieldStrength = Math.cos(localAngle);

        // Point arrow along field direction (radial)
        arrow.group.lookAt(0, 0.4, 0);
        if (fieldStrength < 0) {
          arrow.group.rotateX(Math.PI);
        }

        // Scale by field strength
        var scale = 0.3 + Math.abs(fieldStrength) * 0.7;
        arrow.group.scale.set(scale, scale, scale);

        // Vary opacity
        arrow.group.children.forEach(function(child) {
          if (child.material) {
            child.material.opacity = 0.3 + Math.abs(fieldStrength) * 0.5;
          }
        });
      });

      // Rotate field rings
      fieldGroup.children.forEach(function(child) {
        if (child.userData && child.userData.isFieldRing) {
          child.rotation.y = fieldAngle * 0.5;
        }
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  // Expose field toggle globally
  window._toggleFieldViz = function() {
    showFieldViz = !showFieldViz;
  };
})();

function toggleMotorExplode() { motorExploded = !motorExploded; }
function toggleMotorRun() { motorRunning = !motorRunning; }
function toggleFieldViz() { window._toggleFieldViz(); }


// ═══════════════════════════════════════════════════════════════
// INTEGRATION NOTES
// ═══════════════════════════════════════════════════════════════
//
// To integrate this file into index.html:
//
// 1. Replace the Scene 1 IIFE block (from "// SCENE 1: GARAGE
//    DOOR SYSTEM" through the toggleDoor function) with the
//    Scene 1 code above.
//
// 2. Replace the Scene 4 IIFE block (from "// SCENE 4: MOTOR
//    INTERNALS" through the toggleMotorRun function) with the
//    Scene 4 code above.
//
// 3. Add a "Toggle B-Field" button to the motor internals
//    controls bar in HTML:
//      <button class="ctrl-btn" onclick="toggleFieldViz()">
//        Toggle B-Field
//      </button>
//
// 4. The old simple box tracks (trackRail, trackRail2) are
//    replaced by the C-channel track system (Upgrade 4).
//
// 5. The old "hinge dots" on panels are replaced by full
//    roller assemblies (Upgrade 1).
//
// 6. Add the 5 new materials (matCopper, matRollerSteel,
//    matCableSteel, matWeatherseal, matBracket) alongside
//    the existing shared materials block.
//
// 7. All readout element IDs remain unchanged.
// ═══════════════════════════════════════════════════════════════

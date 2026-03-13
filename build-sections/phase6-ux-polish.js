/**
 * Phase 6: Performance & UX Polish
 * =================================
 * Cross-cutting enhancements for the Science of Garage Doors interactive explorer.
 *
 * This file provides:
 *   1. SceneManager    — Scroll-triggered activation + progressive loading + scene lifecycle
 *   2. LabelSystem     — 3D annotation labels with leader lines
 *   3. AudioEngine     — Procedural sound design via Web Audio API
 *   4. TouchHandler    — Mobile gesture support (pinch zoom, rotate, pan)
 *   5. PrintStyles     — @media print CSS injection
 *   6. KeyboardNav     — Section navigation, focus management, ARIA
 *
 * INTEGRATION INSTRUCTIONS (see bottom of file for full wiring guide)
 * -------------------------------------------------------------------
 * 1. Include this file AFTER Three.js and AFTER the existing inline <script>:
 *      <script src="build-sections/phase6-ux-polish.js"></script>
 *
 * 2. Call Phase6.init() once the DOM is ready:
 *      Phase6.init();
 *
 * 3. To register existing scenes with the SceneManager, wrap each scene's
 *    animate() in a callback:
 *      Phase6.sceneManager.register('door-system', {
 *        canvas: document.getElementById('doorCanvas'),
 *        render: function() { /* your per-frame logic here * / }
 *      });
 *
 * Depends on: Three.js r128 (loaded globally as THREE)
 * No other external dependencies.
 */

var Phase6 = (function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1. SceneManager
  //    Scroll-triggered activation, progressive
  //    loading, scene lifecycle management.
  // ─────────────────────────────────────────────

  function SceneManager() {
    this._scenes = {};         // id -> { canvas, render, observer, active, initialized, disposeFn, initFn }
    this._activeIds = [];      // ordered list of currently-active scene ids
    this._maxActive = 2;       // GPU budget: at most 2 scenes animate simultaneously
    this._observer = null;
    this._rafId = null;
    this._running = false;
  }

  SceneManager.prototype.init = function () {
    if (this._observer) return;

    var self = this;

    // Single IntersectionObserver for all registered canvases
    this._observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.getAttribute('data-scene-id');
        if (!id) return;
        var scene = self._scenes[id];
        if (!scene) return;

        if (entry.isIntersecting) {
          self._activateScene(id);
        } else {
          self._deactivateScene(id);
        }
      });
    }, {
      rootMargin: '200px 0px',   // preload 200px before entering viewport
      threshold: [0, 0.1, 0.5]
    });

    // Start the unified render loop
    this._running = true;
    this._tick();
  };

  /**
   * Register a scene with the manager.
   *
   * @param {string} id            - Section id (e.g. 'door-system')
   * @param {object} opts
   * @param {HTMLCanvasElement} opts.canvas   - The canvas element
   * @param {Function}         opts.render    - Per-frame render callback (called only when active)
   * @param {Function}        [opts.initFn]   - Lazy init function, called once when first visible
   * @param {Function}        [opts.disposeFn] - Cleanup (dispose geometries/textures) when evicted
   */
  SceneManager.prototype.register = function (id, opts) {
    var canvas = opts.canvas;
    if (!canvas) return;

    canvas.setAttribute('data-scene-id', id);

    var wrapper = canvas.closest('.canvas-wrap') || canvas.parentElement;

    this._scenes[id] = {
      canvas: canvas,
      wrapper: wrapper,
      render: opts.render,
      initFn: opts.initFn || null,
      disposeFn: opts.disposeFn || null,
      active: false,
      initialized: !opts.initFn,  // if no initFn, consider it already initialized
      fadedIn: false
    };

    // Add fade-in CSS to wrapper
    wrapper.style.opacity = '0';
    wrapper.style.transition = 'opacity 0.6s ease-out';

    // Observe the wrapper (bigger target than canvas alone)
    if (this._observer) {
      this._observer.observe(wrapper);
    }
  };

  SceneManager.prototype._activateScene = function (id) {
    var scene = this._scenes[id];
    if (!scene || scene.active) return;

    // Lazy initialization
    if (!scene.initialized && scene.initFn) {
      this._showSkeleton(scene, false);
      scene.initFn();
      scene.initialized = true;
    }

    scene.active = true;

    // Fade in
    if (!scene.fadedIn) {
      scene.wrapper.style.opacity = '1';
      scene.fadedIn = true;
    }

    // Track activation order
    var idx = this._activeIds.indexOf(id);
    if (idx === -1) {
      this._activeIds.push(id);
    }

    // Enforce max active budget: evict oldest off-screen scenes
    while (this._activeIds.length > this._maxActive) {
      var evictId = this._activeIds[0];
      // Only evict if it is actually off-screen
      var evictScene = this._scenes[evictId];
      if (evictScene && !this._isInViewport(evictScene.wrapper)) {
        this._evictScene(evictId);
        this._activeIds.shift();
      } else {
        // Can't evict something still visible; stop trying
        break;
      }
    }
  };

  SceneManager.prototype._deactivateScene = function (id) {
    var scene = this._scenes[id];
    if (!scene) return;
    scene.active = false;

    var idx = this._activeIds.indexOf(id);
    if (idx !== -1) {
      this._activeIds.splice(idx, 1);
    }
  };

  SceneManager.prototype._evictScene = function (id) {
    var scene = this._scenes[id];
    if (!scene) return;
    scene.active = false;
    if (scene.disposeFn) {
      scene.disposeFn();
    }
  };

  SceneManager.prototype._isInViewport = function (el) {
    var rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  SceneManager.prototype._showSkeleton = function (scene, show) {
    var wrapper = scene.wrapper;
    var existing = wrapper.querySelector('.phase6-skeleton');
    if (show && !existing) {
      var skel = document.createElement('div');
      skel.className = 'phase6-skeleton';
      skel.style.cssText =
        'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'background:var(--surface,#161619);z-index:3;font-family:"JetBrains Mono",monospace;' +
        'font-size:0.75rem;color:var(--text2,#9a9894);letter-spacing:0.15em;text-transform:uppercase;';
      skel.textContent = 'Loading scene\u2026';
      wrapper.style.position = 'relative';
      wrapper.appendChild(skel);
    } else if (!show && existing) {
      existing.remove();
    }
  };

  SceneManager.prototype._tick = function () {
    if (!this._running) return;
    var self = this;
    this._rafId = requestAnimationFrame(function () { self._tick(); });

    for (var id in this._scenes) {
      var scene = this._scenes[id];
      if (scene.active && scene.initialized && scene.render) {
        scene.render();
      }
    }
  };

  SceneManager.prototype.destroy = function () {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._observer) this._observer.disconnect();
  };


  // ─────────────────────────────────────────────
  // 2. LabelSystem
  //    Floating HTML labels projected from 3D
  //    coordinates with leader lines and auto-hide.
  // ─────────────────────────────────────────────

  function LabelSystem() {
    this._labels = [];      // { el, leaderEl, object3D, offset, camera, canvas }
    this._container = null;
    this._rafId = null;
    this._running = false;
  }

  /**
   * Initialize the label overlay container.
   * Call once after DOM ready.
   */
  LabelSystem.prototype.init = function () {
    if (this._container) return;

    this._container = document.createElement('div');
    this._container.id = 'phase6-labels';
    this._container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden;';
    document.body.appendChild(this._container);

    // Inject label styles
    var style = document.createElement('style');
    style.textContent =
      '.p6-label{position:absolute;transform:translate(-50%,-100%);pointer-events:auto;' +
      'background:rgba(12,12,14,0.92);border:1px solid var(--border,#2a2a30);border-radius:4px;' +
      'padding:4px 10px;font-family:"JetBrains Mono",monospace;font-size:0.65rem;' +
      'color:var(--text,#e8e6e3);letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;' +
      'transition:opacity 0.25s;cursor:default;}' +
      '.p6-label.hidden{opacity:0;pointer-events:none;}' +
      '.p6-label-spec{display:block;color:var(--accent,#ff6b2b);font-size:0.6rem;margin-top:2px;}' +
      '.p6-leader{position:absolute;pointer-events:none;z-index:49;}';
    document.head.appendChild(style);

    this._running = true;
    this._update();
  };

  /**
   * Add a label attached to a 3D object.
   *
   * @param {object}          opts
   * @param {string}          opts.text       - Label title text
   * @param {string}         [opts.spec]      - Optional spec line (shown below title in accent color)
   * @param {THREE.Object3D}  opts.object3D   - The 3D object to track
   * @param {THREE.Camera}    opts.camera     - The scene's camera
   * @param {HTMLCanvasElement} opts.canvas    - The scene's canvas
   * @param {THREE.Vector3}  [opts.offset]    - Offset from object center in world units (default 0,0,0)
   * @returns {object} The label entry (for later removal)
   */
  LabelSystem.prototype.add = function (opts) {
    var el = document.createElement('div');
    el.className = 'p6-label';
    el.textContent = opts.text;
    if (opts.spec) {
      var specSpan = document.createElement('span');
      specSpan.className = 'p6-label-spec';
      specSpan.textContent = opts.spec;
      el.appendChild(specSpan);
    }
    // ARIA
    el.setAttribute('role', 'tooltip');
    el.setAttribute('aria-label', opts.text + (opts.spec ? ': ' + opts.spec : ''));

    this._container.appendChild(el);

    // SVG leader line
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'p6-leader');
    svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:49;';
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', 'rgba(255,107,43,0.4)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '4,3');
    svg.appendChild(line);
    this._container.appendChild(svg);

    var entry = {
      el: el,
      leaderSvg: svg,
      leaderLine: line,
      object3D: opts.object3D,
      camera: opts.camera,
      canvas: opts.canvas,
      offset: opts.offset || new THREE.Vector3(0, 0, 0)
    };
    this._labels.push(entry);
    return entry;
  };

  /**
   * Remove a specific label.
   */
  LabelSystem.prototype.remove = function (entry) {
    var idx = this._labels.indexOf(entry);
    if (idx !== -1) {
      this._labels.splice(idx, 1);
      if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
      if (entry.leaderSvg.parentNode) entry.leaderSvg.parentNode.removeChild(entry.leaderSvg);
    }
  };

  /**
   * Remove all labels.
   */
  LabelSystem.prototype.clear = function () {
    while (this._labels.length) {
      this.remove(this._labels[0]);
    }
  };

  LabelSystem.prototype._update = function () {
    if (!this._running) return;
    var self = this;
    this._rafId = requestAnimationFrame(function () { self._update(); });

    var tempVec = new THREE.Vector3();

    for (var i = 0; i < this._labels.length; i++) {
      var label = this._labels[i];
      var canvas = label.canvas;
      var camera = label.camera;
      var obj = label.object3D;

      // Get world position of the object + offset
      tempVec.copy(label.offset);
      obj.localToWorld(tempVec);

      // Project to NDC
      var projected = tempVec.clone().project(camera);

      // Behind camera check (z > 1 means behind)
      if (projected.z > 1) {
        label.el.classList.add('hidden');
        label.leaderSvg.style.display = 'none';
        continue;
      }

      // Convert NDC to canvas-relative screen coords
      var rect = canvas.getBoundingClientRect();
      var screenX = rect.left + (projected.x * 0.5 + 0.5) * rect.width;
      var screenY = rect.top + (-projected.y * 0.5 + 0.5) * rect.height;

      // Check if point is within canvas bounds (with margin)
      var margin = 20;
      if (screenX < rect.left - margin || screenX > rect.right + margin ||
          screenY < rect.top - margin || screenY > rect.bottom + margin) {
        label.el.classList.add('hidden');
        label.leaderSvg.style.display = 'none';
        continue;
      }

      label.el.classList.remove('hidden');
      label.leaderSvg.style.display = '';

      // Position label above the point
      var labelX = screenX;
      var labelY = screenY - 20; // 20px above the anchor
      label.el.style.left = labelX + 'px';
      label.el.style.top = labelY + 'px';

      // Leader line from label bottom-center to the 3D point
      label.leaderLine.setAttribute('x1', labelX);
      label.leaderLine.setAttribute('y1', labelY);
      label.leaderLine.setAttribute('x2', screenX);
      label.leaderLine.setAttribute('y2', screenY);
    }
  };

  LabelSystem.prototype.destroy = function () {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this.clear();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  };


  // ─────────────────────────────────────────────
  // 3. AudioEngine
  //    Procedural sound via Web Audio API.
  //    All sounds generated from oscillators and
  //    noise — no audio file downloads.
  // ─────────────────────────────────────────────

  function AudioEngine() {
    this._ctx = null;
    this._masterGain = null;
    this._muted = false;
    this._initialized = false;
    this._activeSounds = {};   // name -> { nodes... , stop() }
    this._muteButton = null;
  }

  /**
   * Initialize AudioContext on first user gesture (Chrome autoplay policy).
   * Idempotent — safe to call multiple times.
   */
  AudioEngine.prototype.init = function () {
    if (this._initialized) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this._ctx = new AudioCtx();
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 0.3;
    this._masterGain.connect(this._ctx.destination);
    this._initialized = true;

    // Resume if suspended (Chrome policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    this._createMuteButton();
  };

  AudioEngine.prototype._ensureContext = function () {
    if (!this._initialized) this.init();
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._initialized;
  };

  /**
   * Create a floating mute toggle button.
   */
  AudioEngine.prototype._createMuteButton = function () {
    if (this._muteButton) return;
    var btn = document.createElement('button');
    btn.id = 'phase6-mute-btn';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.setAttribute('title', 'Toggle sound');
    btn.style.cssText =
      'position:fixed;bottom:1.5rem;right:1.5rem;z-index:200;width:44px;height:44px;' +
      'border-radius:50%;border:1px solid var(--border,#2a2a30);' +
      'background:rgba(12,12,14,0.9);color:var(--text,#e8e6e3);' +
      'font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'backdrop-filter:blur(8px);transition:border-color 0.3s;' +
      'font-family:"JetBrains Mono",monospace;';
    btn.textContent = '\u266A'; // music note
    var self = this;
    btn.addEventListener('click', function () { self.toggleMute(); });
    document.body.appendChild(btn);
    this._muteButton = btn;
  };

  AudioEngine.prototype.toggleMute = function () {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(this._muted ? 0 : 0.3, this._ctx.currentTime, 0.05);
    }
    if (this._muteButton) {
      this._muteButton.textContent = this._muted ? '\u2715' : '\u266A'; // X or music note
      this._muteButton.style.borderColor = this._muted ? 'var(--danger,#ef4444)' : 'var(--border,#2a2a30)';
    }
  };

  /**
   * Create a spatial panner positioned at a canvas-wrap center.
   * Returns a PannerNode connected to masterGain.
   */
  AudioEngine.prototype._makePanner = function (x, y, z) {
    if (!this._ctx) return null;
    var panner = this._ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 20;
    panner.rolloffFactor = 1;
    panner.setPosition(x || 0, y || 0, z || 0);
    panner.connect(this._masterGain);
    return panner;
  };

  /**
   * Door rumble — filtered white noise simulating a heavy door moving.
   * @param {number} [duration=3] seconds
   */
  AudioEngine.prototype.playDoorRumble = function (duration) {
    if (!this._ensureContext()) return;
    duration = duration || 3;
    var ctx = this._ctx;
    var now = ctx.currentTime;

    // White noise buffer
    var bufLen = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low-pass filter for rumble
    var lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 120;
    lpf.Q.value = 2;

    // Envelope
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.setValueAtTime(0.4, now + duration - 0.3);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    var panner = this._makePanner(0, 0, -2);

    source.connect(lpf);
    lpf.connect(gain);
    gain.connect(panner || this._masterGain);

    source.start(now);
    source.stop(now + duration);

    return { source: source, stop: function () { try { source.stop(); } catch (e) {} } };
  };

  /**
   * Spring winding clicks — short percussive impulses repeating.
   * @param {number} [count=8]    Number of clicks
   * @param {number} [interval=0.15] seconds between clicks
   */
  AudioEngine.prototype.playSpringClicks = function (count, interval) {
    if (!this._ensureContext()) return;
    count = count || 8;
    interval = interval || 0.15;
    var ctx = this._ctx;
    var now = ctx.currentTime;
    var panner = this._makePanner(0, 1, 0);
    var target = panner || this._masterGain;

    for (var i = 0; i < count; i++) {
      var t = now + i * interval;
      // Short burst oscillator
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 800 + Math.random() * 400;

      var clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0, t);
      clickGain.gain.linearRampToValueAtTime(0.25, t + 0.002);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(clickGain);
      clickGain.connect(target);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  };

  /**
   * Motor hum — 60Hz fundamental with harmonics.
   * Returns an object with stop() method.
   */
  AudioEngine.prototype.playMotorHum = function () {
    if (!this._ensureContext()) return { stop: function () {} };
    var ctx = this._ctx;
    var now = ctx.currentTime;
    var panner = this._makePanner(0, 0, -3);
    var target = panner || this._masterGain;
    var oscs = [];

    // 60Hz fundamental + harmonics at 120, 180, 240 Hz
    var freqs = [60, 120, 180, 240];
    var amps = [0.15, 0.08, 0.04, 0.02];
    var mixGain = ctx.createGain();
    mixGain.gain.setValueAtTime(0, now);
    mixGain.gain.linearRampToValueAtTime(1, now + 0.3);
    mixGain.connect(target);

    for (var i = 0; i < freqs.length; i++) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freqs[i];
      var g = ctx.createGain();
      g.gain.value = amps[i];
      osc.connect(g);
      g.connect(mixGain);
      osc.start(now);
      oscs.push(osc);
    }

    return {
      stop: function () {
        var t = ctx.currentTime;
        mixGain.gain.setValueAtTime(mixGain.gain.value, t);
        mixGain.gain.linearRampToValueAtTime(0, t + 0.3);
        setTimeout(function () {
          oscs.forEach(function (o) { try { o.stop(); } catch (e) {} });
        }, 400);
      }
    };
  };

  /**
   * Chain drive rattle — randomized metallic clicks.
   * Returns an object with stop() method.
   */
  AudioEngine.prototype.playChainRattle = function () {
    if (!this._ensureContext()) return { stop: function () {} };
    var ctx = this._ctx;
    var panner = this._makePanner(0, 0, -1);
    var target = panner || this._masterGain;
    var running = true;
    var timeouts = [];

    function scheduleClick() {
      if (!running) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 2000 + Math.random() * 3000;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.1 + Math.random() * 0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(g);
      g.connect(target);
      osc.start(now);
      osc.stop(now + 0.02);

      var next = 30 + Math.random() * 60; // 30-90ms between clicks
      timeouts.push(setTimeout(scheduleClick, next));
    }
    scheduleClick();

    return {
      stop: function () {
        running = false;
        timeouts.forEach(clearTimeout);
      }
    };
  };

  /**
   * Belt drive whisper — filtered white noise, very soft.
   * Returns an object with stop() method.
   */
  AudioEngine.prototype.playBeltWhisper = function () {
    if (!this._ensureContext()) return { stop: function () {} };
    var ctx = this._ctx;
    var now = ctx.currentTime;

    // Long noise buffer (5 seconds, looped)
    var bufLen = ctx.sampleRate * 5;
    var buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Band-pass filter for the whisper character
    var bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 3000;
    bpf.Q.value = 0.5;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.5);

    var panner = this._makePanner(0, 0, -1);
    var target = panner || this._masterGain;

    source.connect(bpf);
    bpf.connect(gain);
    gain.connect(target);
    source.start(now);

    return {
      stop: function () {
        var t = ctx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        setTimeout(function () { try { source.stop(); } catch (e) {} }, 400);
      }
    };
  };

  AudioEngine.prototype.destroy = function () {
    for (var name in this._activeSounds) {
      if (this._activeSounds[name] && this._activeSounds[name].stop) {
        this._activeSounds[name].stop();
      }
    }
    if (this._ctx) {
      this._ctx.close();
    }
    if (this._muteButton && this._muteButton.parentNode) {
      this._muteButton.parentNode.removeChild(this._muteButton);
    }
  };


  // ─────────────────────────────────────────────
  // 4. TouchHandler
  //    Mobile gesture support: pinch-to-zoom,
  //    single-finger rotate, two-finger pan.
  //    Reduces geometry on mobile.
  // ─────────────────────────────────────────────

  var TouchHandler = {};

  /**
   * Detect mobile/low-power device.
   */
  TouchHandler.isMobile = function () {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  };

  /**
   * Suggested segment reduction factor for mobile.
   * Use this when creating geometries: segments = Math.floor(desktopSegments * factor)
   */
  TouchHandler.geometryFactor = function () {
    return TouchHandler.isMobile() ? 0.5 : 1.0;
  };

  /**
   * Attach touch gesture handling to a canvas with an orbit-like camera.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {THREE.PerspectiveCamera} camera
   * @param {object} [opts]
   * @param {THREE.Vector3} [opts.target]   - Look-at target (default 0,0,0)
   * @param {number}        [opts.minDist]  - Min zoom distance (default 2)
   * @param {number}        [opts.maxDist]  - Max zoom distance (default 20)
   */
  TouchHandler.attach = function (canvas, camera, opts) {
    opts = opts || {};
    var target = opts.target || new THREE.Vector3(0, 0, 0);
    var minDist = opts.minDist || 2;
    var maxDist = opts.maxDist || 20;

    var spherical = { theta: 0, phi: Math.PI / 4, radius: camera.position.length() };

    // Compute initial spherical coords from camera position
    var offset = camera.position.clone().sub(target);
    spherical.radius = offset.length();
    spherical.theta = Math.atan2(offset.x, offset.z);
    spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / spherical.radius)));

    var lastTouches = [];
    var lastPinchDist = 0;

    function getTouchDist(t1, t2) {
      var dx = t1.clientX - t2.clientX;
      var dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function updateCamera() {
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      spherical.radius = Math.max(minDist, Math.min(maxDist, spherical.radius));
      camera.position.set(
        target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        target.y + spherical.radius * Math.cos(spherical.phi),
        target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      );
      camera.lookAt(target);
    }

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      lastTouches = Array.from(e.touches);
      if (e.touches.length === 2) {
        lastPinchDist = getTouchDist(e.touches[0], e.touches[1]);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var touches = e.touches;

      if (touches.length === 1 && lastTouches.length >= 1) {
        // Single finger: rotate
        var dx = touches[0].clientX - lastTouches[0].clientX;
        var dy = touches[0].clientY - lastTouches[0].clientY;
        spherical.theta -= dx * 0.008;
        spherical.phi += dy * 0.008;
        updateCamera();
      } else if (touches.length === 2) {
        // Pinch: zoom
        var dist = getTouchDist(touches[0], touches[1]);
        if (lastPinchDist > 0) {
          var scale = lastPinchDist / dist;
          spherical.radius *= scale;
          updateCamera();
        }
        lastPinchDist = dist;
      }

      lastTouches = Array.from(touches);
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
      lastTouches = Array.from(e.touches);
      if (e.touches.length < 2) lastPinchDist = 0;
    }, { passive: false });
  };

  /**
   * Ensure interactive elements meet the 44px minimum touch target size.
   * Scans for .ctrl-btn, .tab-btn and adjusts if needed.
   */
  TouchHandler.enforceTouchTargets = function () {
    if (!TouchHandler.isMobile()) return;

    var style = document.createElement('style');
    style.textContent =
      '@media (pointer: coarse) {' +
      '.ctrl-btn,.tab-btn{min-width:44px;min-height:44px;padding:0.6rem 1.2rem;font-size:0.8rem;}' +
      '.bulb-demo{min-width:80px;min-height:80px;padding:1rem;}' +
      'input[type="range"]{height:8px;}' +
      'input[type="range"]::-webkit-slider-thumb{width:28px;height:28px;}' +
      '.nav a{padding:1rem 1rem;font-size:0.8rem;}' +
      '}';
    document.head.appendChild(style);
  };


  // ─────────────────────────────────────────────
  // 5. Print Styles
  //    @media print CSS: hide 3D canvases,
  //    show static reference tables and formulas.
  // ─────────────────────────────────────────────

  var PRINT_CSS = [
    '@media print {',
    '  /* Hide interactive elements */',
    '  .canvas-wrap, .hero canvas, .controls-bar, .tabs, .nav,',
    '  .scroll-hint, .interference-demo, #phase6-labels,',
    '  #phase6-mute-btn, .p6-label, .p6-leader { display: none !important; }',
    '',
    '  /* Reset backgrounds for print */',
    '  body { background: #fff !important; color: #000 !important; font-size: 11pt; }',
    '  .hero { min-height: auto; padding: 1rem; }',
    '  .hero-content { position: static; }',
    '  .hero h1 { -webkit-text-fill-color: #333 !important; background: none !important; font-size: 24pt; }',
    '  .hero .subtitle { color: #666 !important; }',
    '',
    '  .section { padding: 1rem 0; page-break-inside: avoid; }',
    '  .section-tag { color: #666 !important; }',
    '  .section-title { color: #000 !important; font-size: 16pt; }',
    '',
    '  .info-card { border: 1px solid #ccc; background: #f9f9f9 !important; page-break-inside: avoid; }',
    '  .info-card h3 { color: #333 !important; }',
    '  .info-card p { color: #333 !important; }',
    '',
    '  .specs-table { border: 1px solid #999; }',
    '  .specs-table th { background: #eee !important; color: #333 !important; border-color: #999; }',
    '  .specs-table td { color: #333 !important; border-color: #ccc; }',
    '',
    '  .warning-box { border-color: #c00 !important; background: #fff5f5 !important; }',
    '  .warning-box h4 { color: #c00 !important; }',
    '  .warning-box p { color: #333 !important; }',
    '',
    '  .tip-box { border-color: #069 !important; background: #f0f8ff !important; }',
    '  .tip-box h4 { color: #069 !important; }',
    '  .tip-box p { color: #333 !important; }',
    '',
    '  .readout { display: flex; flex-wrap: wrap; }',
    '  .readout-item { border: 1px solid #ccc; background: #f9f9f9 !important; }',
    '  .readout-label { color: #666 !important; }',
    '  .readout-value { color: #333 !important; }',
    '',
    '  .divider { background: #ccc !important; }',
    '  .footer { border-color: #ccc !important; color: #666 !important; }',
    '',
    '  .signal-diagram { background: #f9f9f9 !important; border-color: #ccc !important; }',
    '',
    '  /* Print-only reference sheet */',
    '  .print-reference { display: block !important; page-break-before: always; }',
    '}',
    '',
    '/* Hidden on screen, visible in print */',
    '.print-reference { display: none; }'
  ].join('\n');

  /**
   * Build print reference HTML as DOM elements (no innerHTML).
   * Appended before the footer so it appears at the end in print.
   */
  function createPrintReference() {
    var div = document.createElement('div');
    div.className = 'print-reference';

    var wrapper = document.createElement('div');
    wrapper.style.padding = '2rem 0';

    // -- Spring Formula Table --
    var h2a = document.createElement('h2');
    h2a.style.cssText = 'font-family:Oswald,sans-serif;font-size:18pt;margin-bottom:1rem;border-bottom:2px solid #333;padding-bottom:0.5rem;';
    h2a.textContent = 'REFERENCE SHEET \u2014 Spring Engineering Formulas';
    wrapper.appendChild(h2a);

    var springFormulas = [
      ['Torque (Hooke\'s Law)', '\u03C4 = \u03BA\u03B8', '\u03BA = spring rate, \u03B8 = angular displacement'],
      ['Spring Rate (\u03BA)', '\u03BA = d\u2074G / (10.8DN)', 'd = wire dia., G = shear modulus, D = coil dia., N = active coils'],
      ['IPPT (Inch-Pounds Per Turn)', 'IPPT = d\u2074G / (10.8 \u00D7 (ID+d))', 'ID = inside diameter of coil'],
      ['Wire Stress', 'S = (8KDF) / (\u03C0d\u00B3)', 'K = Wahl factor, F = force, D = mean coil dia.'],
      ['Wahl Correction Factor', 'K = (4C-1)/(4C-4) + 0.615/C', 'C = D/d (spring index)'],
      ['Stored Energy', 'E = \u00BD\u03BA\u03B8\u00B2', '\u03B8 in radians (1 turn = 2\u03C0 rad)'],
      ['Turns Needed', 'Turns = (W \u00D7 R) / IPPT', 'W = door weight, R = drum radius']
    ];
    wrapper.appendChild(_buildTable(
      ['Formula', 'Expression', 'Variables'],
      springFormulas
    ));

    // -- Troubleshooting Table --
    var h2b = document.createElement('h2');
    h2b.style.cssText = 'font-family:Oswald,sans-serif;font-size:18pt;margin:2rem 0 1rem;border-bottom:2px solid #333;padding-bottom:0.5rem;';
    h2b.textContent = 'QUICK REFERENCE \u2014 Troubleshooting Guide';
    wrapper.appendChild(h2b);

    var troubleshooting = [
      ['Remote range reduced', 'LED bulb EMI', 'Replace with garage-rated LED (\u22648W)'],
      ['Door reverses when closing', 'Safety sensor misaligned / dirty', 'Clean & realign sensors, check wiring'],
      ['Motor runs, door doesn\'t move', 'Broken gear / stripped trolley', 'Replace drive gear or trolley'],
      ['Door heavy to lift manually', 'Broken / weak spring', 'Professional spring replacement'],
      ['Door won\'t fully open/close', 'Limit switch adjustment', 'Adjust open/close limit screws on motor'],
      ['Loud grinding noise', 'Worn rollers or dry chain', 'Replace nylon rollers, lubricate chain'],
      ['myQ disconnects frequently', 'LED EMI on 2.4 GHz / weak Wi-Fi', 'Remove LED bulbs, check router distance'],
      ['Door drifts down when open', 'Spring tension too low', 'Add \u00BC-turn increments (professional only)']
    ];
    wrapper.appendChild(_buildTable(
      ['Symptom', 'Likely Cause', 'Solution'],
      troubleshooting
    ));

    // -- Drive Type Comparison Table --
    var h2c = document.createElement('h2');
    h2c.style.cssText = 'font-family:Oswald,sans-serif;font-size:18pt;margin:2rem 0 1rem;border-bottom:2px solid #333;padding-bottom:0.5rem;';
    h2c.textContent = 'QUICK REFERENCE \u2014 Drive Type Comparison';
    wrapper.appendChild(h2c);

    var driveComparison = [
      ['Noise', '70+ dB', '50-55 dB', '60 dB', '45 dB'],
      ['Price', '$150-$250', '$200-$400', '$175-$300', '$300-$500+'],
      ['Maintenance', 'Regular lube', 'Minimal', 'Periodic grease', 'Near zero']
    ];
    wrapper.appendChild(_buildTable(
      ['Spec', 'Chain', 'Belt', 'Screw', 'Direct'],
      driveComparison
    ));

    div.appendChild(wrapper);

    var footer = document.querySelector('.footer');
    if (footer) {
      footer.parentNode.insertBefore(div, footer);
    } else {
      document.body.appendChild(div);
    }
  }

  /**
   * Helper: build a simple HTML table from headers and row data arrays.
   */
  function _buildTable(headers, rows) {
    var table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:2rem;';

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    headers.forEach(function (text) {
      var th = document.createElement('th');
      th.style.cssText = 'text-align:left;padding:6px;border:1px solid #999;background:#eee;';
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    rows.forEach(function (cells) {
      var tr = document.createElement('tr');
      cells.forEach(function (text, colIdx) {
        var td = document.createElement('td');
        td.style.cssText = 'padding:6px;border:1px solid #ccc;';
        if (colIdx === 1 && headers[0] === 'Formula') {
          td.style.fontFamily = 'monospace';
        }
        td.textContent = text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  function injectPrintStyles() {
    var style = document.createElement('style');
    style.id = 'phase6-print-styles';
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    createPrintReference();
  }


  // ─────────────────────────────────────────────
  // 6. KeyboardNav
  //    Arrow keys between sections, Space/Enter
  //    for controls, Tab focus, ARIA labels.
  // ─────────────────────────────────────────────

  function KeyboardNav() {
    this._sections = [];
    this._currentIndex = -1;
    this._initialized = false;
  }

  KeyboardNav.prototype.init = function () {
    if (this._initialized) return;
    this._initialized = true;

    var self = this;

    // Collect all navigable sections
    this._sections = Array.from(document.querySelectorAll('.section[id]'));

    // Add ARIA attributes to interactive elements
    this._addAriaLabels();

    // Create a skip-to-content link
    this._createSkipLink();

    // Keyboard event handler
    document.addEventListener('keydown', function (e) {
      self._handleKey(e);
    });

    // Announce section changes to screen readers
    this._announcer = document.createElement('div');
    this._announcer.setAttribute('role', 'status');
    this._announcer.setAttribute('aria-live', 'polite');
    this._announcer.setAttribute('aria-atomic', 'true');
    this._announcer.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    document.body.appendChild(this._announcer);
  };

  KeyboardNav.prototype._addAriaLabels = function () {
    // Canvas wraps
    document.querySelectorAll('.canvas-wrap').forEach(function (wrap) {
      wrap.setAttribute('role', 'img');
      var label = wrap.querySelector('.canvas-label');
      if (label) {
        wrap.setAttribute('aria-label', label.textContent);
      }
    });

    // Control buttons
    document.querySelectorAll('.ctrl-btn').forEach(function (btn) {
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
      btn.setAttribute('tabindex', '0');
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('tabindex', '0');
    });

    // Nav links
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.setAttribute('role', 'link');
    });

    // Slider inputs
    document.querySelectorAll('input[type="range"]').forEach(function (slider) {
      var labelEl = slider.closest('.slider-group');
      if (labelEl) {
        var labelText = labelEl.querySelector('label');
        if (labelText && !slider.getAttribute('aria-label')) {
          slider.setAttribute('aria-label', labelText.textContent.replace(/:\s*\d+.*$/, ''));
        }
      }
    });

    // Readout values
    document.querySelectorAll('.readout-item').forEach(function (item) {
      var label = item.querySelector('.readout-label');
      if (label) {
        item.setAttribute('role', 'status');
        item.setAttribute('aria-label', label.textContent);
      }
    });

    // Sections
    this._sections.forEach(function (section) {
      section.setAttribute('role', 'region');
      var title = section.querySelector('.section-title');
      if (title) {
        section.setAttribute('aria-label', title.textContent);
      }
      section.setAttribute('tabindex', '-1');
    });
  };

  KeyboardNav.prototype._createSkipLink = function () {
    var link = document.createElement('a');
    link.href = '#door-system';
    link.textContent = 'Skip to content';
    link.className = 'phase6-skip-link';
    link.style.cssText =
      'position:fixed;top:-100px;left:50%;transform:translateX(-50%);z-index:9999;' +
      'background:var(--accent,#ff6b2b);color:#fff;padding:0.75rem 1.5rem;border-radius:0 0 6px 6px;' +
      'font-family:"JetBrains Mono",monospace;font-size:0.8rem;text-decoration:none;' +
      'transition:top 0.2s;letter-spacing:0.1em;text-transform:uppercase;';
    link.addEventListener('focus', function () { link.style.top = '0'; });
    link.addEventListener('blur', function () { link.style.top = '-100px'; });
    document.body.insertBefore(link, document.body.firstChild);
  };

  KeyboardNav.prototype._handleKey = function (e) {
    // Don't intercept when user is typing in an input
    var tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        this._navigateSection(1);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        this._navigateSection(-1);
        break;

      case 'Home':
        e.preventDefault();
        this._goToSection(0);
        break;

      case 'End':
        e.preventDefault();
        this._goToSection(this._sections.length - 1);
        break;

      case 'Escape':
        // Close any active overlays / deselect
        document.activeElement.blur();
        break;

      case ' ':
      case 'Enter':
        // If a .ctrl-btn or .tab-btn is focused, activate it
        if (document.activeElement.classList.contains('ctrl-btn') ||
            document.activeElement.classList.contains('tab-btn')) {
          e.preventDefault();
          document.activeElement.click();
        }
        break;
    }
  };

  KeyboardNav.prototype._navigateSection = function (direction) {
    // Find current section based on scroll position
    var scrollY = window.scrollY || window.pageYOffset;
    var found = -1;
    for (var i = 0; i < this._sections.length; i++) {
      if (scrollY >= this._sections[i].offsetTop - 250) {
        found = i;
      }
    }
    var next = Math.max(0, Math.min(this._sections.length - 1, found + direction));
    this._goToSection(next);
  };

  KeyboardNav.prototype._goToSection = function (index) {
    if (index < 0 || index >= this._sections.length) return;
    this._currentIndex = index;
    var section = this._sections[index];
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.focus({ preventScroll: true });

    // Announce to screen reader
    var title = section.querySelector('.section-title');
    if (title && this._announcer) {
      this._announcer.textContent = 'Navigated to: ' + title.textContent;
    }
  };


  // ─────────────────────────────────────────────
  // Public API & Initialization
  // ─────────────────────────────────────────────

  var sceneManager = new SceneManager();
  var labelSystem = new LabelSystem();
  var audioEngine = new AudioEngine();
  var keyboardNav = new KeyboardNav();

  /**
   * Initialize all Phase 6 systems.
   * Call once after the DOM is ready and all scenes are defined.
   */
  function init() {
    // Inject print CSS
    injectPrintStyles();

    // Mobile touch targets
    TouchHandler.enforceTouchTargets();

    // Scene manager (scroll activation + progressive loading)
    sceneManager.init();

    // Label system (3D annotations)
    labelSystem.init();

    // Keyboard navigation
    keyboardNav.init();

    // Initialize audio on first user interaction (Chrome autoplay policy)
    var initAudioOnce = function () {
      audioEngine.init();
      document.removeEventListener('click', initAudioOnce);
      document.removeEventListener('touchstart', initAudioOnce);
      document.removeEventListener('keydown', initAudioOnce);
    };
    document.addEventListener('click', initAudioOnce);
    document.addEventListener('touchstart', initAudioOnce);
    document.addEventListener('keydown', initAudioOnce);
  }

  // ─────────────────────────────────────────────
  // Return public API
  // ─────────────────────────────────────────────

  return {
    init: init,
    sceneManager: sceneManager,
    labelSystem: labelSystem,
    audioEngine: audioEngine,
    keyboardNav: keyboardNav,
    TouchHandler: TouchHandler
  };

})();


/*
 * =====================================================================
 * INTEGRATION GUIDE
 * =====================================================================
 *
 * STEP 1: Include this file after Three.js and after the inline script
 * ---------------------------------------------------------------------
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
 *   <!-- ... existing inline <script> with all scene code ... -->
 *   <script src="build-sections/phase6-ux-polish.js"></script>
 *
 *
 * STEP 2: Initialize Phase 6
 * ---------------------------------------------------------------------
 *   <script>
 *     Phase6.init();
 *   </script>
 *
 *
 * STEP 3: Register existing scenes with SceneManager
 * ---------------------------------------------------------------------
 * To get scroll-triggered activation working, each scene's animate()
 * loop must be replaced with a registration call. Example for the
 * door scene:
 *
 *   // BEFORE (in the existing code):
 *   function animate() {
 *     requestAnimationFrame(animate);
 *     // ... update door, render ...
 *     renderer.render(scene, camera);
 *   }
 *   animate();
 *
 *   // AFTER (replace animate() + animate() call with):
 *   Phase6.sceneManager.register('door-system', {
 *     canvas: document.getElementById('doorCanvas'),
 *     render: function() {
 *       var dims = fitRenderer(renderer, canvas);
 *       camera.aspect = dims.w / dims.h;
 *       camera.updateProjectionMatrix();
 *       if (Math.abs(doorProgress - doorTarget) > 0.002) {
 *         doorProgress += (doorTarget - doorProgress) * 0.02;
 *       }
 *       updateDoor(doorProgress);
 *       if (Math.abs(doorProgress - doorTarget) > 0.01) {
 *         springMesh.rotation.x += 0.02 * Math.sign(doorTarget - doorProgress);
 *       }
 *       renderer.render(scene, camera);
 *     }
 *   });
 *
 *
 * STEP 4: Add touch gesture support to each 3D canvas
 * ---------------------------------------------------------------------
 *   Phase6.TouchHandler.attach(
 *     document.getElementById('doorCanvas'),
 *     camera,  // the scene's PerspectiveCamera
 *     { target: new THREE.Vector3(0, 2, 0), minDist: 3, maxDist: 15 }
 *   );
 *
 *
 * STEP 5: Add 3D annotation labels (example for motor internals)
 * ---------------------------------------------------------------------
 *   // After motor scene is built, add labels to the explodable components:
 *   Phase6.labelSystem.add({
 *     text: 'STATOR',
 *     spec: '6-pole copper windings',
 *     object3D: statorGroup,
 *     camera: camera,
 *     canvas: document.getElementById('motorCanvas'),
 *     offset: new THREE.Vector3(0, 0.5, 0)
 *   });
 *
 *   Phase6.labelSystem.add({
 *     text: 'ROTOR',
 *     spec: 'Squirrel-cage, 12-bar',
 *     object3D: rotor,
 *     camera: camera,
 *     canvas: document.getElementById('motorCanvas'),
 *     offset: new THREE.Vector3(0, 0.6, 0)
 *   });
 *
 *   // Repeat for: wormGroup, cap, pcb, limitSw
 *
 *
 * STEP 6: Wire up sound effects to scene actions
 * ---------------------------------------------------------------------
 *   // In toggleDoor():
 *   function toggleDoor() {
 *     doorTarget = doorTarget < 0.5 ? 1 : 0;
 *     Phase6.audioEngine.playDoorRumble(3);
 *   }
 *
 *   // In windSpring() / unwindSpring():
 *   function windSpring() {
 *     springDirection = 1;
 *     Phase6.audioEngine.playSpringClicks(8, 0.12);
 *   }
 *
 *   // In toggleMotorRun():
 *   var motorHumSound = null;
 *   function toggleMotorRun() {
 *     motorRunning = !motorRunning;
 *     if (motorRunning) {
 *       motorHumSound = Phase6.audioEngine.playMotorHum();
 *     } else if (motorHumSound) {
 *       motorHumSound.stop();
 *       motorHumSound = null;
 *     }
 *   }
 *
 *   // In showTab() for drive type scenes:
 *   var driveSound = null;
 *   function showTab(name) {
 *     // ... existing tab logic ...
 *     if (driveSound) { driveSound.stop(); driveSound = null; }
 *     if (name === 'chain') driveSound = Phase6.audioEngine.playChainRattle();
 *     if (name === 'belt')  driveSound = Phase6.audioEngine.playBeltWhisper();
 *   }
 *
 *
 * STEP 7: Progressive loading (lazy-init a heavy scene)
 * ---------------------------------------------------------------------
 *   // Instead of immediately building a scene, pass an initFn:
 *   Phase6.sceneManager.register('motor-internals', {
 *     canvas: document.getElementById('motorCanvas'),
 *     initFn: function() {
 *       // Move all the motor scene IIFE code here
 *       // It will only run when the user scrolls near this section
 *     },
 *     render: function() {
 *       // Per-frame render logic (called only when visible)
 *     },
 *     disposeFn: function() {
 *       // Optional: dispose geometries/textures when evicted
 *     }
 *   });
 *
 *
 * STEP 8: Mobile geometry reduction
 * ---------------------------------------------------------------------
 *   var factor = Phase6.TouchHandler.geometryFactor();
 *   var segments = Math.floor(200 * factor); // 200 on desktop, 100 on mobile
 *   var springGeo = new THREE.TubeGeometry(curve, segments, 0.04, 8, false);
 *
 *
 * NOTES:
 * - The hero scene (SCENE 0) should always render and NOT be registered
 *   with the SceneManager, since it is the first thing users see.
 * - The SceneManager's unified render loop replaces individual
 *   requestAnimationFrame calls. Only register scenes that should be
 *   scroll-managed.
 * - AudioEngine initializes its AudioContext on first user click/touch
 *   to comply with Chrome's autoplay policy. Sound calls before that
 *   are silently ignored.
 * - Print mode: users can hit Ctrl+P / Cmd+P at any time. The 3D
 *   canvases are hidden and replaced with the reference tables.
 *
 * =====================================================================
 */

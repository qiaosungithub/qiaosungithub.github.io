// Theme toggle, top bar state, scroll reveal, and the hero animation.
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('.hero');

  // Theme toggle. An explicit choice is stored; otherwise the OS decides.
  var toggle = document.querySelector('.theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
  }

  function labelToggle() {
    toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (toggle) {
    labelToggle();
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      labelToggle();
    });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', labelToggle);
  }

  // The bar turns solid once the band has scrolled out from under it.
  var bar = document.querySelector('.topbar');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: '-' + bar.offsetHeight + 'px 0px 0px 0px' }).observe(hero);
  }

  // Sections fade in as they enter the viewport.
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduceMotion && revealEls.length && 'IntersectionObserver' in window) {
    root.classList.add('reveal-ready');
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  }

  if (hero) initFlow(hero);

  // Particles follow the probability-flow ODE of flow matching,
  //   x_t = t * x1 + (1 - t) * x0,  x0 ~ N(0, I),
  // from noise to a 2-D toy distribution and back. Each target is a Gaussian
  // mixture with isotropic sigma, which makes the marginal velocity exact:
  //   v(x, t) = ((1 - t) m - (1 - t - t sigma^2) x) / s^2,
  //   s^2 = t^2 sigma^2 + (1 - t)^2,
  //   m = sum_k w_k mu_k,  w = softmax_k(-|x - t mu_k|^2 / (2 s^2)).
  function initFlow(hero) {
    var canvas = hero.querySelector('.flow');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var inner = hero.querySelector('.hero-inner');
    var labelEl = hero.querySelector('.flow-label');
    var timeEl = hero.querySelector('.flow-t');

    var TAU = Math.PI * 2;
    var T_END = 0.985; // the field stiffens as t -> 1; stopping short is invisible
    var ARROW = ' → ';

    var targets = [
      { name: 'two moons', sigma: 0.05, mu: moons(128) },
      { name: 'checkerboard', sigma: 0.09, mu: checkerboard() },
      { name: 'spirals', sigma: 0.055, mu: spirals(160) },
      { name: 'lemniscate', sigma: 0.045, mu: lemniscate(128) },
      { name: '8 gaussians', sigma: 0.11, mu: ring(8, 1.5) }
    ];
    var maxCenters = 0;
    targets.forEach(function (d) { maxCenters = Math.max(maxCenters, d.mu.length / 2); });
    var logits = new Float32Array(maxCenters);

    // Colors follow each particle's starting angle in noise space, so the
    // noise-to-data map stays visible from one target to the next.
    var palette = ['rgba(166,238,220,0.9)', 'rgba(127,220,202,0.9)', 'rgba(82,192,177,0.9)', 'rgba(127,220,202,0.9)',
      'rgba(207,227,176,0.9)', 'rgba(242,201,138,0.9)', 'rgba(244,169,106,0.9)', 'rgba(242,201,138,0.9)'];

    var W = 0, H = 0, cx = 0, cy = 0, scale = 1, dotR = 1.2;
    var N = hero.clientWidth < 640 ? 460 : 760;
    var px = new Float32Array(N), py = new Float32Array(N);
    var zx = new Float32Array(N), zy = new Float32Array(N); // each particle's own noise
    var buckets = palette.map(function () { return []; });
    var rand = seeded(2026);
    for (var i = 0; i < N; i++) {
      var r = Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-7))), a = TAU * rand();
      px[i] = zx[i] = r * Math.cos(a);
      py[i] = zy[i] = r * Math.sin(a);
      buckets[Math.floor(a / TAU * palette.length) % palette.length].push(i);
    }

    var t = 0;
    var phases = [
      { flow: 1, dur: 2800 },  // noise -> data
      { flow: 0, dur: 1900 },  // hold on data
      { flow: -1, dur: 2300 }, // data -> noise
      { flow: 0, dur: 600 }    // hold on noise
    ];
    var phase = 3, clock = 0, target = targets.length - 1;
    var idleFrames = 0, last = 0, raf = 0, running = false, tick = 0;
    var shownLabel = '', shownTime = '';

    layout();

    if (reduceMotion) {
      drawStill();
      window.addEventListener('resize', debounce(function () { layout(); drawStill(); }, 150));
      return;
    }

    window.addEventListener('resize', debounce(function () { layout(); idleFrames = 0; }, 150));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }).observe(hero);
    } else {
      start();
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      clock += dt;

      var p = phases[phase];
      var u = Math.min(clock / p.dur, 1);
      if (p.flow) {
        var e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        advance(p.flow > 0 ? T_END * e : T_END * (1 - e));
        idleFrames = 0;
      } else if (t < 0.5) {
        // Euler error accumulates over the round trip; settle back onto the
        // starting noise so the cloud never drifts or shrinks.
        var k = 1 - Math.exp(-dt / 150);
        for (var i = 0; i < N; i++) {
          px[i] += (zx[i] - px[i]) * k;
          py[i] += (zy[i] - py[i]) * k;
        }
        if (clock < 450) idleFrames = 0;
      }
      if (idleFrames++ < 45) draw(); // let trails fade during a hold, then rest
      caption(p);

      if (u >= 1) {
        clock = 0;
        phase = (phase + 1) % phases.length;
        if (phase === 0) target = (target + 1) % targets.length;
      }
    }

    // Euler steps toward tTarget, smaller as t nears 1 where the field is steep.
    function advance(tTarget) {
      var d = targets[target];
      for (var guard = 0; Math.abs(tTarget - t) > 1e-6 && guard < 32; guard++) {
        var hMax = Math.min(0.03, 0.22 * (1 - Math.max(t, tTarget)) + 0.002);
        var h = Math.max(-hMax, Math.min(hMax, tTarget - t));
        step(d, h);
        t += h;
      }
    }

    function step(d, h) {
      var mu = d.mu, M = mu.length, s2 = t * t * d.sigma * d.sigma + (1 - t) * (1 - t);
      var inv = 0.5 / s2, ca = (1 - t) / s2, cb = (1 - t - t * d.sigma * d.sigma) / s2;
      for (var i = 0; i < N; i++) {
        var x = px[i], y = py[i], best = -Infinity, k, j;
        for (k = 0, j = 0; k < M; k += 2, j++) {
          var dx = x - t * mu[k], dy = y - t * mu[k + 1];
          var l = -(dx * dx + dy * dy) * inv;
          logits[j] = l;
          if (l > best) best = l;
        }
        var z = 0, mx = 0, my = 0;
        for (k = 0, j = 0; k < M; k += 2, j++) {
          var g = logits[j] - best;
          if (g > -18) {
            var w = Math.exp(g);
            z += w;
            mx += w * mu[k];
            my += w * mu[k + 1];
          }
        }
        px[i] = x + h * (ca * mx / z - cb * x);
        py[i] = y + h * (ca * my / z - cb * y);
      }
    }

    function draw() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      dots(1);
      ctx.globalCompositeOperation = 'source-over';
    }

    function dots(alpha) {
      ctx.globalAlpha = alpha;
      for (var b = 0; b < buckets.length; b++) {
        var list = buckets[b];
        ctx.fillStyle = palette[b];
        ctx.beginPath();
        for (var n = 0; n < list.length; n++) {
          var i = list[n], x = cx + px[i] * scale, y = cy - py[i] * scale;
          ctx.moveTo(x + dotR, y);
          ctx.arc(x, y, dotR, 0, TAU);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function caption(p) {
      if (!labelEl || tick++ % 3) return;
      var name = targets[target].name;
      var label = p.flow > 0 ? 'noise' + ARROW + name : p.flow < 0 ? name + ARROW + 'noise' : t > 0.5 ? name : 'noise';
      var time = 't = ' + (t / T_END).toFixed(2);
      if (label !== shownLabel) labelEl.textContent = shownLabel = label;
      if (time !== shownTime) timeEl.textContent = shownTime = time;
    }

    // Reduced motion: one still figure of trajectories into the first target.
    function drawStill() {
      var steps = 40, xs = [], ys = [], i;
      var saveX = Float32Array.from(px), saveY = Float32Array.from(py), saveT = t, saveTarget = target;
      for (i = 0; i < N; i++) { xs.push([px[i]]); ys.push([py[i]]); }
      target = 0;
      t = 0;
      for (var s = 1; s <= steps; s++) {
        var q = s / steps;
        advance(T_END * (1 - (1 - q) * (1 - q)));
        for (i = 0; i < N; i++) { xs[i].push(px[i]); ys[i].push(py[i]); }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.6;
      for (var b = 0; b < buckets.length; b++) {
        ctx.strokeStyle = palette[b].replace('0.9)', '0.16)');
        ctx.beginPath();
        buckets[b].forEach(function (n) {
          ctx.moveTo(cx + xs[n][0] * scale, cy - ys[n][0] * scale);
          for (var k = 1; k < xs[n].length; k++) ctx.lineTo(cx + xs[n][k] * scale, cy - ys[n][k] * scale);
        });
        ctx.stroke();
      }
      dots(1);
      ctx.globalCompositeOperation = 'source-over';
      if (labelEl) {
        labelEl.textContent = 'noise' + ARROW + targets[0].name;
        timeEl.textContent = 't = 0' + ARROW + '1';
      }
      px.set(saveX);
      py.set(saveY);
      t = saveT;
      target = saveTarget;
    }

    // Place the figure in the right part of the content column (centered on
    // phones, above the name), in data units of about +-1.75.
    function layout() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var box = inner.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(inner).paddingLeft) || 0;
      var left = box.left + pad, width = box.width - 2 * pad;
      if (W >= 640) {
        cx = left + width * (W >= 1024 ? 0.79 : 0.74);
        cy = H * 0.4;
        scale = Math.min(H * 0.27, width * 0.19, 180) / 1.75;
        dotR = 1.25;
      } else {
        cx = W / 2;
        cy = H * 0.33;
        scale = Math.min(W * 0.4, H * 0.21) / 1.75;
        dotR = 1.05;
      }
    }
  }

  function moons(n) {
    var mu = [], half = n / 2;
    for (var i = 0; i < half; i++) {
      var a = Math.PI * i / (half - 1);
      mu.push((Math.cos(a) - 0.5) * 1.15, (Math.sin(a) - 0.25) * 1.15);
      mu.push((0.5 - Math.cos(a)) * 1.15, (0.25 - Math.sin(a)) * 1.15);
    }
    return new Float32Array(mu);
  }

  function checkerboard() {
    var mu = [], rand = seeded(11), size = 0.8, k = 4, cell = size / k;
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        if ((i + j) % 2) continue;
        for (var a = 0; a < k; a++) {
          for (var b = 0; b < k; b++) {
            mu.push(-1.6 + i * size + (a + 0.5 + (rand() - 0.5) * 0.6) * cell,
              -1.6 + j * size + (b + 0.5 + (rand() - 0.5) * 0.6) * cell);
          }
        }
      }
    }
    return new Float32Array(mu);
  }

  function spirals(n) {
    var mu = [], per = n / 2;
    for (var arm = 0; arm < 2; arm++) {
      for (var i = 0; i < per; i++) {
        var u = i / (per - 1), r = 0.2 + 1.45 * u, a = 0.6 + u * 2.6 * Math.PI + arm * Math.PI;
        mu.push(r * Math.cos(a), r * Math.sin(a));
      }
    }
    return new Float32Array(mu);
  }

  function lemniscate(n) {
    var mu = [], size = 1.75;
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n, s = Math.sin(a), d = 1 + s * s;
      mu.push(size * Math.cos(a) / d, size * s * Math.cos(a) / d);
    }
    return new Float32Array(mu);
  }

  function ring(n, radius) {
    var mu = [];
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n;
      mu.push(radius * Math.cos(a), radius * Math.sin(a));
    }
    return new Float32Array(mu);
  }

  function seeded(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function debounce(fn, ms) {
    var timer = 0;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }
})();

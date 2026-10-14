// Theme toggle, top bar state, scroll reveal, and the hero background.
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

  if (hero) initField(hero);

  // Contour lines of a slowly drifting noise terrain, drawn like a survey map:
  // marching squares on a coarse grid, tinted by height, with every fifth line
  // heavier. The pointer raises a soft hill beneath it.
  function initField(hero) {
    var canvas = hero.querySelector('.field');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var noise = simplex3(seeded(2026));

    var LEVELS = 15, SPACING = 0.13;
    var low = [96, 196, 180], high = [240, 198, 142];
    var styles = [];
    for (var l = 0; l < LEVELS; l++) {
      var f = l / (LEVELS - 1), major = l % 5 === 2;
      styles.push({
        level: (l - (LEVELS - 1) / 2) * SPACING,
        width: major ? 1.3 : 0.8,
        color: 'rgba(' + low.map(function (c, i) { return Math.round(c + (high[i] - c) * f); }).join(',') + ',' + (major ? 0.62 : 0.3) + ')'
      });
    }

    var W = 0, H = 0, cell = 10, scale = 1 / 260, cols = 0, rows = 0, values = null, fade = null, topFade = null;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0 };
    var start = performance.now(), raf = 0, running = false, lastDraw = 0;

    layout();

    if (reduceMotion) {
      draw(0);
      window.addEventListener('resize', debounce(function () { layout(); draw(0); }, 150));
      return;
    }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var box = hero.getBoundingClientRect();
      pointer.tx = e.clientX - box.left;
      pointer.ty = e.clientY - box.top;
      if (pointer.a < 0.02) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.ta = 1;
    });
    hero.addEventListener('pointerleave', function () { pointer.ta = 0; });
    window.addEventListener('resize', debounce(function () { layout(); lastDraw = 0; }, 150));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) play(); else pause();
      }).observe(hero);
    } else {
      play();
    }

    function play() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (now - lastDraw < 33) return; // the terrain moves slowly; 30 fps is plenty
      lastDraw = now;
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
      pointer.a += (pointer.ta - pointer.a) * 0.07;
      draw((now - start) / 1000);
    }

    function draw(time) {
      var z = time * 0.045, drift = time * 0.012, s = scale;
      var hill = pointer.a > 0.01, r2 = 2 * 110 * 110, idx = 0, i, j;
      for (j = 0; j <= rows; j++) {
        for (i = 0; i <= cols; i++, idx++) {
          var x = i * cell, y = j * cell;
          var v = noise(x * s + drift, y * s, z) + 0.45 * noise(x * s * 2.1 + 7.3, y * s * 2.1 - drift, z * 1.4 + 3.1);
          if (hill) {
            var dx = x - pointer.x, dy = y - pointer.y;
            v += 0.55 * pointer.a * Math.exp(-(dx * dx + dy * dy) / r2);
          }
          values[idx] = v;
        }
      }

      ctx.clearRect(0, 0, W, H);
      for (var l = 0; l < styles.length; l++) {
        ctx.beginPath();
        contour(styles[l].level);
        ctx.lineWidth = styles[l].width;
        ctx.strokeStyle = styles[l].color;
        ctx.stroke();
      }
      // Fade the map out toward the name and under the top bar.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);
      if (topFade) {
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Marching squares for one level. Corners: a top-left, b top-right,
    // e bottom-right, d bottom-left; saddles are split by the cell's mean.
    function contour(level) {
      var stride = cols + 1, c = cell;
      for (var j = 0; j < rows; j++) {
        var y = j * c;
        for (var i = 0; i < cols; i++) {
          var k = j * stride + i;
          var a = values[k], b = values[k + 1], d = values[k + stride], e = values[k + stride + 1];
          var code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (e > level ? 2 : 0) | (d > level ? 1 : 0);
          if (code === 0 || code === 15) continue;
          var x = i * c;
          var top = x + c * (level - a) / (b - a), right = y + c * (level - b) / (e - b);
          var bottom = x + c * (level - d) / (e - d), left = y + c * (level - a) / (d - a);
          switch (code) {
            case 1: case 14: seg(x, left, bottom, y + c); break;
            case 2: case 13: seg(bottom, y + c, x + c, right); break;
            case 3: case 12: seg(x, left, x + c, right); break;
            case 4: case 11: seg(top, y, x + c, right); break;
            case 6: case 9: seg(top, y, bottom, y + c); break;
            case 7: case 8: seg(top, y, x, left); break;
            default: // 5 or 10
              if ((code === 5) === ((a + b + d + e) / 4 > level)) {
                seg(top, y, x, left);
                seg(bottom, y + c, x + c, right);
              } else {
                seg(top, y, x + c, right);
                seg(x, left, bottom, y + c);
              }
          }
        }
      }
    }

    function seg(x1, y1, x2, y2) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }

    function layout() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      var narrow = W < 640;
      cell = narrow ? 8 : 10;
      scale = narrow ? 1 / 190 : 1 / 260;
      cols = Math.ceil(W / cell);
      rows = Math.ceil(H / cell);
      values = new Float32Array((cols + 1) * (rows + 1));
      topFade = null;
      if (narrow) {
        fade = ctx.createLinearGradient(0, 0, 0, H);
        fade.addColorStop(0, 'rgba(0,0,0,0.4)');
        fade.addColorStop(0.14, 'rgba(0,0,0,0.95)');
        fade.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        fade.addColorStop(1, 'rgba(0,0,0,0.12)');
      } else {
        topFade = ctx.createLinearGradient(0, 0, 0, 110);
        topFade.addColorStop(0, 'rgba(0,0,0,0.35)');
        topFade.addColorStop(1, 'rgba(0,0,0,1)');
        fade = ctx.createLinearGradient(0, 0, W, 0);
        fade.addColorStop(0, 'rgba(0,0,0,0.1)');
        fade.addColorStop(0.42, 'rgba(0,0,0,0.38)');
        fade.addColorStop(0.72, 'rgba(0,0,0,1)');
        fade.addColorStop(1, 'rgba(0,0,0,0.85)');
      }
    }
  }

  // 3-D simplex noise, after Stefan Gustavson's public-domain reference code.
  function simplex3(rand) {
    var grad = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1];
    var p = new Uint8Array(256), perm = new Uint8Array(512), mod12 = new Uint8Array(512), i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) {
      var r = Math.floor(rand() * (i + 1)), tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    for (i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      mod12[i] = perm[i] % 12;
    }
    var G3 = 1 / 6;

    function corner(x, y, z, g) {
      var t = 0.6 - x * x - y * y - z * z;
      if (t < 0) return 0;
      g *= 3;
      t *= t;
      return t * t * (grad[g] * x + grad[g + 1] * y + grad[g + 2] * z);
    }

    return function (x, y, z) {
      var s = (x + y + z) / 3;
      var i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      var t = (i + j + k) * G3;
      var x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
      var i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
        else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
      } else if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      var ii = i & 255, jj = j & 255, kk = k & 255;
      return 32 * (
        corner(x0, y0, z0, mod12[ii + perm[jj + perm[kk]]]) +
        corner(x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, mod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]) +
        corner(x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, mod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]) +
        corner(x0 - 0.5, y0 - 0.5, z0 - 0.5, mod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]));
    };
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

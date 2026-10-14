// Theme toggle, top bar state, and scroll reveal.
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
})();

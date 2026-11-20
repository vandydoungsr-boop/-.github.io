/**
 * main.js — ចំណុចចាប់ផ្តើមចម្បងនៃប្រព័ន្ធវេបសាយសាស្រ្តាស្លឹករឹត
 */
(function (app) {
  'use strict';

  function boot() {
    if (app.ThemeToggle && app.ThemeToggle.init) app.ThemeToggle.init();
    if (app.MenuEffect && app.MenuEffect.init) app.MenuEffect.init();
    if (app.ScrollReveal && app.ScrollReveal.init) app.ScrollReveal.init();
    if (app.DocLibrary && app.DocLibrary.init) app.DocLibrary.init();
    if (app.MediaManager && app.MediaManager.init) app.MediaManager.init();
    app._initialized = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})((window.SastraApp = window.SastraApp || {}));

/**
 * main.js — ចំណុចចាប់ផ្តើមចម្បងនៃប្រព័ន្ធវេបសាយសាស្រ្តាស្លឹករឹត
 */
(function (app) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (app.ThemeToggle) app.ThemeToggle.init();
    if (app.MenuEffect) app.MenuEffect.init();
    if (app.ScrollReveal) app.ScrollReveal.init();
    if (app.DocLibrary) app.DocLibrary.init();
    if (app.MediaManager) app.MediaManager.init();
  });
})((window.SastraApp = window.SastraApp || {}));

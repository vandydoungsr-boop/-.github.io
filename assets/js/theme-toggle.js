/**
 * theme-toggle.js — មុខងារប្តូរម៉ូដថ្ងៃ និងម៉ូដយប់ការពារភ្នែក (Day / Night Eye-Care Mode)
 * រក្សាទុកជម្រើសរបស់ User ក្នុង localStorage និងគាំទ្រការកំណត់ប្រព័ន្ធស្វ័យប្រវត្តិ
 */
(function (app) {
  'use strict';

  const STORAGE_KEY = 'sastra-theme';
  let toastTimer = null;

  function showThemeToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function updateMetaThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0d1413' : '#f5f8f7');
    }
  }

  function applyTheme(theme, persist) {
    const isDark = theme === 'dark';
    const root = document.documentElement;
    const toggleBtn = document.getElementById('theme-toggle');
    const toggleLabel = document.getElementById('theme-toggle-label');

    if (isDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(isDark));
      toggleBtn.setAttribute(
        'title',
        isDark ? 'ប្តូរទៅម៉ូដថ្ងៃ ត្រជាក់ភ្នែក' : 'ប្តូរទៅម៉ូដយប់ ការពារភ្នែក'
      );
    }

    if (toggleLabel) {
      toggleLabel.textContent = isDark ? 'ម៉ូដយប់' : 'ម៉ូដថ្ងៃ';
    }

    updateMetaThemeColor(theme);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Ignore storage restrictions
      }
    }
  }

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage restrictions
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function init() {
    const toggleBtn = document.getElementById('theme-toggle');
    const initial = getInitialTheme();
    applyTheme(initial, false);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isCurrentlyDark ? 'light' : 'dark';
        applyTheme(nextTheme, true);
        showThemeToast(
          nextTheme === 'dark'
            ? 'បានប្តូរទៅម៉ូដយប់ ការពារភ្នែក 🌙'
            : 'បានប្តូរទៅម៉ូដថ្ងៃ ត្រជាក់ភ្នែក ☀️'
        );
      });
    }

    // តាមដានការផ្លាស់ប្តូរ Theme ប្រព័ន្ធ ប្រសិនបើ User មិនទាន់ជ្រើសរើសផ្ទាល់
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (event) => {
        try {
          if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(event.matches ? 'dark' : 'light', false);
          }
        } catch {
          applyTheme(event.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  app.ThemeToggle = { init, applyTheme };
})((window.SastraApp = window.SastraApp || {}));


/**
 * menu-effect.js — បច្ចេកទេសលោត Host Color មួយដងនៅផ្ទៃខាងក្រោយពេលចុច Menu
 * ផ្តល់នូវពន្លឺពណ៌ស្រស់ស្អាត ទាក់ទាញ និងរលូនរាល់ពេលចុចលើម៉ឺនុយនីមួយៗ
 */
(function (app) {
  'use strict';

  function init() {
    const root = document.documentElement;
    const navList = document.getElementById('nav-list');
    const navPill = document.getElementById('nav-host-pill');
    const navLinks = Array.from(document.querySelectorAll('.nav-link[data-host-color]'));
    const hostBackdrop = document.getElementById('host-color-backdrop');
    const headerWave = document.getElementById('header-host-wave');
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');

    if (!navLinks.length) return;

    function applyHostColors(link) {
      const color = link.dataset.hostColor || '#1e7366';
      const soft = link.dataset.hostSoft || 'rgba(30, 115, 102, 0.22)';
      const glow = link.dataset.hostGlow || 'rgba(30, 115, 102, 0.44)';

      root.style.setProperty('--host-color', color);
      root.style.setProperty('--host-color-soft', soft);
      root.style.setProperty('--host-color-glow', glow);
    }

    function movePillTo(link, withPop) {
      if (!navPill || !navList || !link) return;
      const width = link.offsetWidth;
      if (width === 0) return;

      const offsetLeft = link.offsetLeft;
      navPill.style.width = `${width}px`;
      navPill.style.transform = `translateX(${offsetLeft}px)`;

      if (withPop) {
        navPill.classList.remove('is-popping');
        void navPill.offsetWidth; // Force reflow ដើម្បីឲ្យចលនាលោតម្តងទៀតបានរាល់ការចុច
        navPill.classList.add('is-popping');
      }
    }

    function triggerHostFlashOnce(link, event) {
      applyHostColors(link);

      // កំណត់ចំណុចកណ្តាលនៃការផ្ទុះពណ៌ Host Color ចំទីតាំង Menu ដែលបានចុច
      const rect = link.getBoundingClientRect();
      const originX = event && event.clientX ? event.clientX : rect.left + rect.width / 2;
      const originY = event && event.clientY ? event.clientY : rect.top + rect.height / 2;

      root.style.setProperty('--host-origin-x', `${Math.round(originX)}px`);
      root.style.setProperty('--host-origin-y', `${Math.round(originY)}px`);

      // ១. លោត Host Color មួយដងនៅផ្ទៃខាងក្រោយទំព័រ (Radial Ambient Flash)
      if (hostBackdrop) {
        hostBackdrop.classList.remove('is-flashing');
        void hostBackdrop.offsetWidth;
        hostBackdrop.classList.add('is-flashing');
      }

      // ២. លោតរលក Host Color មួយដងនៅផ្ទៃខាងក្រោយរបារ Header
      if (headerWave) {
        headerWave.classList.remove('is-flashing');
        void headerWave.offsetWidth;
        headerWave.classList.add('is-flashing');
      }

      // ៣. លោតពន្លឺ Host Color មួយដងនៅខាងក្រោយប៊ូតុង Menu ដែលចុច
      link.classList.remove('is-host-clicked');
      void link.offsetWidth;
      link.classList.add('is-host-clicked');
    }

    function setActiveLink(activeLink, shouldFlash, event) {
      navLinks.forEach((item) => {
        item.classList.toggle('is-active', item === activeLink);
      });

      applyHostColors(activeLink);
      movePillTo(activeLink, shouldFlash);

      if (shouldFlash) {
        triggerHostFlashOnce(activeLink, event);
      }
    }

    // ភ្ជាប់ព្រឹត្តិការណ៍ចុចលើ Menu នីមួយៗ
    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        setActiveLink(link, true, event);

        // បិទម៉ឺនុយទូរស័ព្ទដោយស្វ័យប្រវត្តិក្រោយពេលចុច
        if (mainNav && mainNav.classList.contains('is-open')) {
          mainNav.classList.remove('is-open');
          if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // ប៊ូតុងបើក/បិទម៉ឺនុយលើទូរស័ព្ទ
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('is-open');
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // កំណត់ទីតាំងស៊ុមពណ៌ដំបូង និងតម្រឹមឡើងវិញក្រោយពុម្ពអក្សរខ្មែរផ្ទុករួច
    const initialActive = navLinks.find((l) => l.classList.contains('is-active')) || navLinks[0];
    requestAnimationFrame(() => {
      setActiveLink(initialActive, false);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const current = navLinks.find((l) => l.classList.contains('is-active')) || navLinks[0];
        movePillTo(current, false);
      });
    }

    window.addEventListener('resize', () => {
      const current = navLinks.find((l) => l.classList.contains('is-active')) || navLinks[0];
      movePillTo(current, false);
    });

    // តាមដានផ្នែកដែលកំពុងមើលពេលអូសចុះឡើង (Scroll Spy)
    const sectionIds = navLinks
      .map((l) => l.getAttribute('href'))
      .filter((href) => href && href.startsWith('#'))
      .map((href) => href.slice(1));

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      const spyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const matched = navLinks.find(
                (link) => link.getAttribute('href') === `#${entry.target.id}`
              );
              if (matched && !matched.classList.contains('is-active')) {
                setActiveLink(matched, false);
              }
            }
          });
        },
        {
          rootMargin: '-38% 0px -52% 0px',
          threshold: 0,
        }
      );

      sections.forEach((sec) => spyObserver.observe(sec));
    }
  }

  app.MenuEffect = { init };
})((window.SastraApp = window.SastraApp || {}));


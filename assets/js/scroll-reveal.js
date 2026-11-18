/**
 * scroll-reveal.js — ប្រព័ន្ធអូសដល់ចាំលោតផុសឡើង + Lazy Load រូបភាព
 * ជួយឲ្យវេបសាយស្រាលក្នុង Browser មិនផ្ទុកធាតុខាងក្រោមមុនពេលចាំបាច់ និងដំណើរការលឿនរហ័ស
 */
(function (app) {
  'use strict';

  let revealObserver = null;
  let mediaLazyObserver = null;

  function loadLazyImage(img) {
    const realSrc = img.dataset.src;
    if (!realSrc) return;
    img.src = realSrc;
    img.removeAttribute('data-src');
  }

  function initObservers() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-item').forEach((el) => el.classList.add('is-revealed'));
      document.querySelectorAll('img[data-src]').forEach(loadLazyImage);
      return;
    }

    // Observer សម្រាប់លោតផុសមាតិកានៅពេលអូសមកដល់
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.08,
      }
    );

    // Observer សម្រាប់ផ្ទុករូបភាពតែពេលជិតអូសមកដល់ (True Lazy Load)
    mediaLazyObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadLazyImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '120px 0px 120px 0px',
        threshold: 0.01,
      }
    );
  }

  function observeElements(scope) {
    const root = scope || document;
    const revealTargets = root.querySelectorAll('.reveal-item:not(.is-revealed)');
    const lazyImages = root.querySelectorAll('img[data-src]');

    if (!revealObserver) {
      revealTargets.forEach((el) => el.classList.add('is-revealed'));
      lazyImages.forEach(loadLazyImage);
      return;
    }

    revealTargets.forEach((el) => revealObserver.observe(el));
    lazyImages.forEach((img) => mediaLazyObserver.observe(img));
  }

  function initScrollIndicators() {
    const progressBar = document.getElementById('scroll-progress');
    const siteHeader = document.getElementById('site-header');
    const backToTop = document.getElementById('back-to-top');

    let ticking = false;

    function updateOnScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const percent = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;

      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }

      if (siteHeader) {
        siteHeader.classList.toggle('is-scrolled', scrollTop > 16);
      }

      if (backToTop) {
        backToTop.classList.toggle('is-visible', scrollTop > 460);
      }

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateOnScroll);
          ticking = true;
        }
      },
      { passive: true }
    );

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    updateOnScroll();
  }

  function init() {
    initObservers();
    observeElements(document);
    initScrollIndicators();
  }

  app.ScrollReveal = {
    init,
    observeElements,
  };
})((window.SastraApp = window.SastraApp || {}));


/**
 * media-uploader.js — មុខងារអនុញ្ញាតឲ្យ User បញ្ចូលរូបភាព និងវីឌីអូ ត្រង ស្វែងរក និងបើកមើលពេញអេក្រង់
 */
(function (app) {
  'use strict';

  const MAX_IMAGE_MB = 15;
  const MAX_VIDEO_MB = 80;

  let allItems = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let selectedFile = null;
  let previewUrl = null;
  let galleryHydrated = false;

  // DOM Elements
  let mediaGrid;
  let totalCountEl;
  let userUploadCountEl;
  let toastEl;
  let toastTimer;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function formatKhmerDate(timestamp) {
    try {
      return new Intl.DateTimeFormat('km-KH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  function updateCounters() {
    if (totalCountEl) {
      totalCountEl.textContent = `${allItems.length}+`;
    }
    if (userUploadCountEl) {
      const uploads = allItems.filter((item) => item.isUserUpload).length;
      userUploadCountEl.textContent = String(uploads);
    }
  }

  function getFilteredItems() {
    return allItems.filter((item) => {
      const matchFilter =
        currentFilter === 'all' ||
        (currentFilter === 'image' && item.type === 'image') ||
        (currentFilter === 'video' && item.type === 'video') ||
        (currentFilter === 'user' && item.isUserUpload);

      const q = currentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.author && item.author.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }

  function renderGallery() {
    if (!mediaGrid) return;
    const filtered = getFilteredItems();

    if (!filtered.length) {
      mediaGrid.innerHTML = `
        <div class="empty-state reveal-item is-revealed">
          <h3>មិនទាន់មានឯកសារត្រូវនឹងការស្វែងរកនេះទេ</h3>
          <p style="margin-top:8px;">អ្នកអាចបញ្ចូលរូបភាព ឬវីឌីអូថ្មីនៅផ្នែក «បញ្ចូលឯកសារ» ខាងក្រោម។</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = `media-card reveal-item reveal-delay-${(index % 3) + 1}`;

      const isVideo = item.type === 'video';
      const typeLabel = isVideo ? 'វីឌីអូ' : 'រូបភាព';

      // ប្រើ data-src + placeholder SVG និង preload="metadata" ដើម្បីឲ្យស្រាលក្នុង Browser
      const placeholderSvg =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3C/svg%3E";
      const mediaMarkup = isVideo
        ? `
          <video src="${item.src}" preload="metadata" muted playsinline></video>
          <div class="video-play-pill" aria-hidden="true">
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </span>
          </div>
        `
        : `<img src="${placeholderSvg}" data-src="${item.src}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" />`;

      const userBadge = item.isUserUpload
        ? '<span class="media-user-badge">User បញ្ចូល</span>'
        : '';

      const deleteBtn = item.canDelete
        ? `<button type="button" class="btn btn-danger-soft" data-delete-id="${item.id}" data-storage-path="${escapeHtml(item.storagePath || '')}">លុប</button>`
        : `<span>មើលលម្អិត →</span>`;

      card.innerHTML = `
        <div class="media-thumb" data-open-id="${item.id}" role="button" tabindex="0" aria-label="បើកមើល ${escapeHtml(item.title)}">
          ${mediaMarkup}
          <span class="media-type-badge">${typeLabel}</span>
          ${userBadge}
        </div>
        <div class="media-body">
          <div class="media-meta-row">
            <span>${escapeHtml(item.category || 'សាស្រ្តាស្លឹករឹត')}</span>
            <span>${escapeHtml(item.date || '')}</span>
          </div>
          <h3 class="media-title" data-open-id="${item.id}">${escapeHtml(item.title)}</h3>
          <p class="media-desc">${escapeHtml(item.description || '')}</p>
          <div class="media-footer">
            <span>ដោយ៖ ${escapeHtml(item.author || 'អ្នកប្រើប្រាស់')}</span>
            ${deleteBtn}
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    mediaGrid.innerHTML = '';
    mediaGrid.appendChild(fragment);

    // ឲ្យ ScrollReveal តាមដានកាតថ្មីៗដើម្បីអូសដល់ចាំលោតផុសឡើង និង Lazy Load រូបភាព
    if (app.ScrollReveal) {
      app.ScrollReveal.observeElements(mediaGrid);
    }
  }

  async function refreshMedia(forceRender) {
    allItems = await app.Storage.getAllMedia();
    updateCounters();
    if (galleryHydrated || forceRender) {
      galleryHydrated = true;
      renderGallery();
    }
  }

  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxMedia = document.getElementById('lightbox-media');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxMeta = document.getElementById('lightbox-meta');
    const lightboxClose = document.getElementById('lightbox-close');

    if (!lightbox) return;

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxMedia.innerHTML = '';
      document.body.style.overflow = '';
    }

    function openLightbox(item) {
      if (!item) return;

      if (item.type === 'video') {
        lightboxMedia.innerHTML = `
          <video src="${item.src}" controls autoplay playsinline></video>
        `;
      } else {
        lightboxMedia.innerHTML = `
          <img src="${item.src}" alt="${escapeHtml(item.title)}" />
        `;
      }

      lightboxTitle.textContent = item.title;
      lightboxDesc.textContent = item.description || '';
      lightboxMeta.textContent = `${item.category || 'សាស្រ្តាស្លឹករឹត'} • ដោយ៖ ${item.author || 'អ្នកប្រើប្រាស់'} • ${item.date || ''}`;

      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    mediaGrid.addEventListener('click', async (event) => {
      const deleteTrigger = event.target.closest('[data-delete-id]');
      if (deleteTrigger) {
        const id = deleteTrigger.dataset.deleteId;
        const storagePath = deleteTrigger.dataset.storagePath || '';
        deleteTrigger.disabled = true;
        try {
          await app.Storage.deleteMediaItem(id, storagePath);
          await refreshMedia(true);
          showToast('បានលុបឯកសារចេញពីបណ្ណសារដោយជោគជ័យ');
        } catch (err) {
          console.error(err);
          deleteTrigger.disabled = false;
          showToast('មិនអាចលុបឯកសារបានទេ សូមព្យាយាមម្តងទៀត');
        }
        return;
      }

      const openTrigger = event.target.closest('[data-open-id]');
      if (openTrigger) {
        const item = allItems.find((m) => m.id === openTrigger.dataset.openId);
        openLightbox(item);
      }
    });

    mediaGrid.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const openTrigger = event.target.closest('[data-open-id]');
        if (openTrigger) {
          event.preventDefault();
          const item = allItems.find((m) => m.id === openTrigger.dataset.openId);
          openLightbox(item);
        }
      }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  function setupUploader() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('media-file-input');
    const previewBox = document.getElementById('upload-preview');
    const fileStatus = document.getElementById('upload-file-status');
    const form = document.getElementById('media-upload-form');
    const submitBtn = document.getElementById('upload-submit-btn');
    const modePill = document.getElementById('storage-mode-pill');

    if (modePill && app.Storage && app.Storage.isCloudEnabled) {
      const isCloud = app.Storage.isCloudEnabled();
      modePill.textContent = isCloud
        ? '☁ ភ្ជាប់ Cloud រួចរាល់ — អ្នកទាំងអស់គ្នាមើលឃើញរួមគ្នា'
        : '● រក្សាទុកក្នុងឧបករណ៍ផ្ទាល់ (អាចភ្ជាប់ Cloud ក្នុង cloud-config.js)';
    }

    if (!dropzone || !fileInput || !form) return;

    function clearPreview() {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      selectedFile = null;
      previewBox.innerHTML = '';
      previewBox.hidden = true;
      fileStatus.textContent = 'គាំទ្ររូបភាព (JPG, PNG, WEBP) និងវីឌីអូ (MP4, WEBM)';
      fileInput.value = '';
    }

    function handleSelectedFile(file) {
      if (!file) return;

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        showToast('សូមជ្រើសរើសតែឯកសាររូបភាព ឬវីឌីអូប៉ុណ្ណោះ!');
        return;
      }

      const maxBytes = (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
      if (file.size > maxBytes) {
        showToast(
          `ទំហំឯកសារធំពេក! សូមប្រើ${isVideo ? `វីឌីអូក្រោម ${MAX_VIDEO_MB}MB` : `រូបភាពក្រោម ${MAX_IMAGE_MB}MB`}`
        );
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      selectedFile = file;
      previewUrl = URL.createObjectURL(file);

      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      fileStatus.textContent = `បានជ្រើសរើស៖ ${file.name} (${sizeMB} MB)`;

      previewBox.hidden = false;
      previewBox.innerHTML = isVideo
        ? `<video src="${previewUrl}" controls muted playsinline></video>`
        : `<img src="${previewUrl}" alt="រូបភាពមើលជាមុន" />`;
    }

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleSelectedFile(fileInput.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach((evt) => {
      dropzone.addEventListener(evt, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      dropzone.addEventListener(evt, (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer && event.dataTransfer.files[0];
      if (file) handleSelectedFile(file);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!selectedFile) {
        showToast('សូមជ្រើសរើសរូបភាព ឬវីឌីអូជាមុនសិន!');
        dropzone.focus();
        return;
      }

      const title = document.getElementById('media-title-input').value.trim();
      const category = document.getElementById('media-category-input').value;
      const author = document.getElementById('media-author-input').value.trim() || 'អ្នកចូលរួមថែរក្សាមរតក';
      const description =
        document.getElementById('media-desc-input').value.trim() ||
        'ឯកសារសាស្រ្តាស្លឹករឹតដែលបានចែករំលែកដោយអ្នកប្រើប្រាស់។';

      if (!title) {
        showToast('សូមបំពេញចំណងជើងឯកសារ!');
        return;
      }

      const now = Date.now();
      const record = {
        id: `user-${now}-${Math.random().toString(36).slice(2, 7)}`,
        type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
        title,
        category,
        author,
        description,
        date: formatKhmerDate(now),
        createdAt: now,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        blob: selectedFile,
      };

      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = app.Storage.isCloudEnabled()
          ? 'កំពុងបញ្ជូនទៅ Cloud...'
          : 'កំពុងរក្សាទុក...';
      }

      try {
        await app.Storage.saveMediaItem(record);
        form.reset();
        clearPreview();
        currentFilter = 'all';
        document.querySelectorAll('.filter-tab').forEach((btn) => {
          btn.classList.toggle('is-active', btn.dataset.filter === 'all');
        });
        await refreshMedia(true);
        showToast(
          app.Storage.isCloudEnabled()
            ? 'បានបង្ហោះទៅ Cloud ដោយជោគជ័យ! អ្នកគ្រប់គ្នាអាចមើលឃើញបានហើយ'
            : 'បានបញ្ចូល និងរក្សាទុកឯកសារដោយជោគជ័យ!'
        );

        // អូសទៅបង្ហាញបណ្ណសារភ្លាមៗ
        const gallerySection = document.getElementById('gallery');
        if (gallerySection) {
          gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        console.error(err);
        showToast('មានបញ្ហាក្នុងការរក្សាទុកឯកសារ សូមពិនិត្យការតភ្ជាប់ ឬព្យាយាមម្តងទៀត');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  function setupFiltersAndSearch() {
    const filterButtons = document.querySelectorAll('.filter-tab');
    const searchInput = document.getElementById('gallery-search');

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter || 'all';
        filterButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        galleryHydrated = true;
        renderGallery();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value;
        galleryHydrated = true;
        renderGallery();
      });
    }
  }

  function setupLazyGalleryHydration() {
    const gallerySection = document.getElementById('gallery');
    if (!gallerySection || !('IntersectionObserver' in window)) {
      galleryHydrated = true;
      renderGallery();
      return;
    }

    // មិនបាច់បង្កើត DOM កាតបណ្ណសារមុនទេ រងចាំ User អូសមកជិតដល់ចាំ Render ដើម្បីឲ្យ Browser លឿនខ្លាំង
    const galleryObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !galleryHydrated) {
            galleryHydrated = true;
            renderGallery();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '160px 0px',
        threshold: 0.01,
      }
    );

    galleryObserver.observe(gallerySection);
  }

  async function init() {
    mediaGrid = document.getElementById('media-grid');
    totalCountEl = document.getElementById('stat-media-count');
    userUploadCountEl = document.getElementById('stat-user-uploads');
    toastEl = document.getElementById('toast');

    if (!mediaGrid) return;

    setupFiltersAndSearch();
    setupLightbox();
    setupUploader();
    await refreshMedia(false);
    setupLazyGalleryHydration();
  }

  app.MediaManager = { init, refreshMedia };
})((window.SastraApp = window.SastraApp || {}));


/**
 * media-uploader.js — បញ្ចូលរូបភាព/វីឌីអូជាលក្ខណៈ File ឬ Folder (បង្ហាញភ្លាមៗ Instant UI)
 * - គាំទ្រជ្រើស File ទោល, ជ្រើសច្រើន File ឬជ្រើសទាំង Folder (webkitdirectory / Drag & Drop Folder)
 * - ថតសាស្រ្តាស្លឹករឹត-ក្រាំង (Manuscript Folder Strips) ចុចលើថតដើម្បីបើកមើលរូបភាពទាំងអស់ខាងក្នុង
 * - បង្ហាញភ្លាមៗ < 16ms ដោយមិនចាំបាច់អង្គុយចាំ រួចរក្សាទុកក្នុងផ្ទៃខាងក្រោយយ៉ាងរលូន
 */
(function (app) {
  'use strict';

  const MAX_IMAGE_MB = 20;
  const MAX_VIDEO_MB = 100;

  let allMedia = [];
  let allFolders = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let selectedFiles = [];
  let detectedFolderName = '';
  let previewObjectUrls = [];
  let galleryHydrated = false;

  // ស្ថានភាពផ្ទាំង Folder Viewer និង Lightbox
  let activeFolderId = null;
  let lightboxList = [];
  let lightboxIndex = 0;

  // DOM References
  let folderShowcaseEl;
  let folderGridEl;
  let mediaGridEl;
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
    }, 3000);
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

  function detectMediaType(file) {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) return 'image';
    if (file.type && file.type.startsWith('video/')) return 'video';
    const name = (file.name || '').toLowerCase();
    if (/\.(jpe?g|png|webp|gif|bmp|avif|jfif|svg)$/.test(name)) return 'image';
    if (/\.(mp4|webm|ogg|mov|m4v|mkv)$/.test(name)) return 'video';
    return null;
  }

  function naturalSortFiles(files) {
    return [...files].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    );
  }

  function updateCounters() {
    const folderItemsCount = allFolders.reduce((sum, f) => sum + (f.items ? f.items.length : 0), 0);
    if (totalCountEl) {
      totalCountEl.textContent = `${allMedia.length + folderItemsCount}+`;
    }
    if (userUploadCountEl) {
      const userSingle = allMedia.filter((m) => m.isUserUpload).length;
      const userFolders = allFolders.filter((f) => f.isUserUpload).length;
      userUploadCountEl.textContent = String(userSingle + userFolders);
    }
  }

  // --------------------------------------------------------------------------
  // Render ថតសាស្រ្តាស្លឹករឹត-ក្រាំង (Manuscript Folder Strips)
  // --------------------------------------------------------------------------
  function getFilteredFolders() {
    if (currentFilter === 'video') {
      return allFolders.filter((f) => (f.items || []).some((it) => it.type === 'video'));
    }
    return allFolders.filter((folder) => {
      const matchFilter =
        currentFilter === 'all' ||
        currentFilter === 'folder' ||
        currentFilter === 'image' ||
        (currentFilter === 'user' && folder.isUserUpload);

      const q = currentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (folder.title && folder.title.toLowerCase().includes(q)) ||
        (folder.description && folder.description.toLowerCase().includes(q)) ||
        (folder.category && folder.category.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }

  function renderFolders(immediateReveal) {
    if (!folderGridEl || !folderShowcaseEl) return;
    const filtered = getFilteredFolders();

    if (!filtered.length) {
      folderShowcaseEl.hidden = currentFilter !== 'folder';
      folderGridEl.innerHTML =
        currentFilter === 'folder'
          ? `
            <div class="empty-state reveal-item is-revealed" style="grid-column: 1 / -1;">
              <h3>មិនទាន់មានថតសាស្រ្តាត្រូវនឹងការស្វែងរកនេះទេ</h3>
              <p style="margin-top:8px;">អ្នកអាចចុច «ជ្រើសទាំង Folder» នៅខាងក្រោមដើម្បីបញ្ចូលកម្រងរូបភាពថ្មី។</p>
            </div>
          `
          : '';
      return;
    }

    folderShowcaseEl.hidden = false;
    const fragment = document.createDocumentFragment();

    filtered.forEach((folder, idx) => {
      const card = document.createElement('article');
      card.className = immediateReveal
        ? 'manuscript-folder-card reveal-item is-revealed'
        : `manuscript-folder-card reveal-item reveal-delay-${(idx % 2) + 1}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.folderId = folder.id;

      const count = folder.items ? folder.items.length : 0;
      const firstImage = (folder.items || []).find((it) => it.type === 'image');
      const useCoverPhoto = folder.coverStyle === 'photo' && firstImage && firstImage.src;

      const coverMarkup = useCoverPhoto
        ? `<img class="manuscript-plank-bg" src="${firstImage.src}" alt="${escapeHtml(folder.title)}" decoding="async" />`
        : '';

      card.innerHTML = `
        <div class="manuscript-plank ${useCoverPhoto ? 'has-cover-img' : ''}">
          ${coverMarkup}
          <span class="manuscript-plank-title">${escapeHtml(folder.title)}</span>
          <span class="manuscript-plank-count">${count} ឯកសារ</span>
        </div>
        <div class="manuscript-folder-meta">
          <span class="manuscript-folder-caption">${escapeHtml(folder.title)}</span>
          <span class="manuscript-folder-sub">${escapeHtml(folder.category || 'សាស្រ្តាស្លឹករឹត')} • ចុចបើកមើល →</span>
        </div>
      `;

      fragment.appendChild(card);
    });

    folderGridEl.innerHTML = '';
    folderGridEl.appendChild(fragment);

    if (!immediateReveal && app.ScrollReveal) {
      app.ScrollReveal.observeElements(folderGridEl);
    }
  }

  // --------------------------------------------------------------------------
  // Render ក្រឡាឯកសារទោល (Single Images & Videos)
  // --------------------------------------------------------------------------
  function getFilteredMedia() {
    if (currentFilter === 'folder') return [];
    return allMedia.filter((item) => {
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

  function renderGallery(immediateReveal) {
    renderFolders(immediateReveal);

    if (!mediaGridEl) return;
    if (currentFilter === 'folder') {
      mediaGridEl.innerHTML = '';
      return;
    }

    const filtered = getFilteredMedia();

    if (!filtered.length) {
      if (getFilteredFolders().length > 0) {
        mediaGridEl.innerHTML = '';
        return;
      }
      mediaGridEl.innerHTML = `
        <div class="empty-state reveal-item is-revealed">
          <h3>មិនទាន់មានឯកសារត្រូវនឹងការស្វែងរកនេះទេ</h3>
          <p style="margin-top:8px;">អ្នកអាចបញ្ចូលរូបភាព វីឌីអូ ឬថតឯកសារថ្មីនៅផ្នែក «បញ្ចូលឯកសារ» ខាងក្រោម។</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    const placeholderSvg =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3C/svg%3E";

    filtered.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = immediateReveal
        ? 'media-card reveal-item is-revealed'
        : `media-card reveal-item reveal-delay-${(index % 3) + 1}`;

      const isVideo = item.type === 'video';
      const typeLabel = isVideo ? 'វីឌីអូ' : 'រូបភាព';
      const loadDirectly = Boolean(immediateReveal || item.isUserUpload);

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
        : loadDirectly
          ? `<img src="${item.src}" alt="${escapeHtml(item.title)}" decoding="async" />`
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

    mediaGridEl.innerHTML = '';
    mediaGridEl.appendChild(fragment);

    if (!immediateReveal && app.ScrollReveal) {
      app.ScrollReveal.observeElements(mediaGridEl);
    }
  }

  async function refreshAll(forceRender) {
    const [media, folders] = await Promise.all([
      app.Storage.getAllMedia(),
      app.Storage.getAllFolders(),
    ]);
    allMedia = media;
    allFolders = folders;
    updateCounters();
    if (galleryHydrated || forceRender) {
      galleryHydrated = true;
      renderGallery(Boolean(forceRender));
    }
  }

  // --------------------------------------------------------------------------
  // Folder Viewer Modal (បើកមើលរូបភាព/វីឌីអូទាំងអស់ក្នុងថតសាស្រ្តា)
  // --------------------------------------------------------------------------
  function setupFolderModal() {
    const modal = document.getElementById('folder-modal');
    const titleEl = document.getElementById('folder-modal-title');
    const subEl = document.getElementById('folder-modal-sub');
    const gridEl = document.getElementById('folder-pages-grid');
    const closeBtn = document.getElementById('folder-modal-close');
    const deleteBtn = document.getElementById('folder-modal-delete');
    const addMoreBtn = document.getElementById('folder-modal-add-more');
    const addMoreInput = document.getElementById('folder-add-more-input');

    if (!modal || !gridEl) return;

    function closeFolderModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      activeFolderId = null;
      document.body.style.overflow = '';
    }

    function renderFolderPages(folder) {
      if (!folder) return;
      titleEl.textContent = folder.title;
      subEl.textContent = `${folder.category || 'សាស្រ្តាស្លឹករឹត'} • សរុប ${(folder.items || []).length} ឯកសារ • ដោយ៖ ${folder.author || 'អ្នកប្រើប្រាស់'}`;
      if (deleteBtn) deleteBtn.hidden = !folder.canDelete;
      if (addMoreBtn) addMoreBtn.hidden = !folder.isUserUpload;

      const fragment = document.createDocumentFragment();
      (folder.items || []).forEach((item, idx) => {
        const card = document.createElement('article');
        card.className = 'folder-page-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.dataset.pageIndex = String(idx);

        const mediaHtml =
          item.type === 'video'
            ? `
              <video src="${item.src}" preload="metadata" muted playsinline></video>
              <div class="video-play-pill" aria-hidden="true">
                <span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></span>
              </div>
            `
            : `<img src="${item.src}" alt="${escapeHtml(item.name || `ទំព័រ ${idx + 1}`)}" decoding="async" />`;

        card.innerHTML = `
          <div class="folder-page-thumb">${mediaHtml}</div>
          <div class="folder-page-label">
            <span class="folder-page-name">${escapeHtml(item.name || `ទំព័រទី ${idx + 1}`)}</span>
            <span style="color: var(--text-muted); flex-shrink:0;">#${idx + 1}</span>
          </div>
        `;
        fragment.appendChild(card);
      });

      gridEl.innerHTML = '';
      gridEl.appendChild(fragment);
    }

    function openFolderModal(folderId) {
      const folder = allFolders.find((f) => f.id === folderId);
      if (!folder) return;
      activeFolderId = folder.id;
      renderFolderPages(folder);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    // ចុចលើកាតថតសាស្រ្តាដើម្បីបើកមើលឯកសារទាំងអស់ខាងក្នុង
    if (folderGridEl) {
      folderGridEl.addEventListener('click', (event) => {
        const card = event.target.closest('.manuscript-folder-card[data-folder-id]');
        if (card) openFolderModal(card.dataset.folderId);
      });

      folderGridEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          const card = event.target.closest('.manuscript-folder-card[data-folder-id]');
          if (card) {
            event.preventDefault();
            openFolderModal(card.dataset.folderId);
          }
        }
      });
    }

    // ចុចលើទំព័រណាមួយក្នុង Folder ដើម្បីបើក Lightbox មើលធំពេញអេក្រង់ + ប្តូរទំព័រមុន/ក្រោយ
    gridEl.addEventListener('click', (event) => {
      const pageCard = event.target.closest('.folder-page-card[data-page-index]');
      if (!pageCard) return;
      const folder = allFolders.find((f) => f.id === activeFolderId);
      if (!folder) return;

      const idx = Number(pageCard.dataset.pageIndex) || 0;
      const list = (folder.items || []).map((it, i) => ({
        type: it.type,
        src: it.src,
        title: `${folder.title} — ${it.name || `ទំព័រទី ${i + 1}`}`,
        description: folder.description || '',
        category: folder.category,
        author: folder.author,
        date: `ទំព័រ ${i + 1} / ${(folder.items || []).length}`,
      }));

      openLightboxList(list, idx);
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!activeFolderId) return;
        const deletingId = activeFolderId;
        closeFolderModal();
        allFolders = allFolders.filter((f) => f.id !== deletingId);
        updateCounters();
        renderGallery(true);
        app.Storage.deleteFolder(deletingId);
        showToast('បានលុបថតឯកសារសាស្រ្តាដោយជោគជ័យ');
      });
    }

    if (addMoreBtn && addMoreInput) {
      addMoreBtn.addEventListener('click', () => addMoreInput.click());
      addMoreInput.addEventListener('change', async () => {
        if (!activeFolderId || !addMoreInput.files || !addMoreInput.files.length) return;
        const validFiles = naturalSortFiles(Array.from(addMoreInput.files)).filter((f) =>
          Boolean(detectMediaType(f))
        );
        if (!validFiles.length) return;

        const now = Date.now();
        const newEntries = validFiles.map((file, idx) => ({
          id: `pg-${now}-${idx}`,
          type: detectMediaType(file),
          name: file.name.replace(/\.[^.]+$/, ''),
          mimeType: file.type,
          blob: file,
        }));

        const updatedFolder = await app.Storage.appendFilesToFolder(activeFolderId, newEntries);
        addMoreInput.value = '';
        if (updatedFolder) {
          allFolders = allFolders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f));
          updateCounters();
          renderFolders(true);
          renderFolderPages(updatedFolder);
          showToast(`⚡ បានបន្ថែម ${newEntries.length} ឯកសារចូលថតភ្លាមៗ!`);
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeFolderModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeFolderModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox || !lightbox.classList.contains('is-open')) {
          closeFolderModal();
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Lightbox Modal (គាំទ្រការប្តូរទំព័រមុន/ក្រោយ ទាំងប៊ូតុង និង Keyboard Arrows)
  // --------------------------------------------------------------------------
  let openLightboxList = () => {};

  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxMedia = document.getElementById('lightbox-media');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxMeta = document.getElementById('lightbox-meta');
    const lightboxClose = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const navBar = document.getElementById('lightbox-nav-bar');

    if (!lightbox) return;

    function renderCurrentSlide() {
      const item = lightboxList[lightboxIndex];
      if (!item) return;

      if (item.type === 'video') {
        lightboxMedia.innerHTML = `<video src="${item.src}" controls autoplay playsinline></video>`;
      } else {
        lightboxMedia.innerHTML = `<img src="${item.src}" alt="${escapeHtml(item.title)}" />`;
      }

      lightboxTitle.textContent = item.title || '';
      lightboxDesc.textContent = item.description || '';
      lightboxMeta.textContent = `${item.category || 'សាស្រ្តាស្លឹករឹត'} • ដោយ៖ ${item.author || 'អ្នកប្រើប្រាស់'} • ${item.date || ''}`;

      const hasMultiple = lightboxList.length > 1;
      if (navBar) navBar.hidden = !hasMultiple;
      if (prevBtn) prevBtn.disabled = lightboxIndex <= 0;
      if (nextBtn) nextBtn.disabled = lightboxIndex >= lightboxList.length - 1;
    }

    openLightboxList = function (items, startIndex) {
      lightboxList = items || [];
      lightboxIndex = Math.max(0, Math.min(startIndex || 0, lightboxList.length - 1));
      renderCurrentSlide();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxMedia.innerHTML = '';
      if (!activeFolderId) {
        document.body.style.overflow = '';
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (lightboxIndex > 0) {
          lightboxIndex -= 1;
          renderCurrentSlide();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (lightboxIndex < lightboxList.length - 1) {
          lightboxIndex += 1;
          renderCurrentSlide();
        }
      });
    }

    mediaGridEl.addEventListener('click', async (event) => {
      const deleteTrigger = event.target.closest('[data-delete-id]');
      if (deleteTrigger) {
        const id = deleteTrigger.dataset.deleteId;
        const storagePath = deleteTrigger.dataset.storagePath || '';
        allMedia = allMedia.filter((m) => m.id !== id);
        updateCounters();
        renderGallery(true);
        app.Storage.deleteMediaItem(id, storagePath).catch(console.warn);
        showToast('បានលុបឯកសារចេញពីបណ្ណសារដោយជោគជ័យ');
        return;
      }

      const openTrigger = event.target.closest('[data-open-id]');
      if (openTrigger) {
        const filtered = getFilteredMedia();
        const idx = filtered.findIndex((m) => m.id === openTrigger.dataset.openId);
        if (idx !== -1) openLightboxList(filtered, idx);
      }
    });

    mediaGridEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const openTrigger = event.target.closest('[data-open-id]');
        if (openTrigger) {
          event.preventDefault();
          const filtered = getFilteredMedia();
          const idx = filtered.findIndex((m) => m.id === openTrigger.dataset.openId);
          if (idx !== -1) openLightboxList(filtered, idx);
        }
      }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft' && lightboxIndex > 0) {
        lightboxIndex -= 1;
        renderCurrentSlide();
      }
      if (event.key === 'ArrowRight' && lightboxIndex < lightboxList.length - 1) {
        lightboxIndex += 1;
        renderCurrentSlide();
      }
    });
  }

  // --------------------------------------------------------------------------
  // ប្រព័ន្ធបញ្ចូល File ឬ Folder (Instant Preview + Zero-Wait Publish)
  // --------------------------------------------------------------------------
  async function extractFilesFromDrop(dataTransfer) {
    const items = dataTransfer && dataTransfer.items ? Array.from(dataTransfer.items) : [];
    const results = [];
    let folderName = '';

    async function readEntry(entry) {
      if (!entry) return;
      if (entry.isFile) {
        await new Promise((resolve) => {
          entry.file(
            (file) => {
              results.push(file);
              resolve();
            },
            () => resolve()
          );
        });
      } else if (entry.isDirectory) {
        if (!folderName) folderName = entry.name;
        const reader = entry.createReader();
        const readAllEntries = () =>
          new Promise((resolve) => {
            const batch = [];
            function nextBatch() {
              reader.readEntries(
                (entries) => {
                  if (!entries.length) {
                    resolve(batch);
                    return;
                  }
                  batch.push(...entries);
                  nextBatch();
                },
                () => resolve(batch)
              );
            }
            nextBatch();
          });
        const children = await readAllEntries();
        for (const child of children) {
          await readEntry(child);
        }
      }
    }

    const hasEntries = items.some((it) => typeof it.webkitGetAsEntry === 'function');
    if (hasEntries) {
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) await readEntry(entry);
      }
      return { files: results, folderName };
    }

    return {
      files: dataTransfer && dataTransfer.files ? Array.from(dataTransfer.files) : [],
      folderName: '',
    };
  }

  function setupUploader() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('media-file-input');
    const folderInput = document.getElementById('media-folder-input');
    const pickFilesBtn = document.getElementById('pick-files-btn');
    const pickFolderBtn = document.getElementById('pick-folder-btn');
    const previewBox = document.getElementById('upload-preview');
    const fileStatus = document.getElementById('upload-file-status');
    const form = document.getElementById('media-upload-form');
    const modePill = document.getElementById('storage-mode-pill');
    const coverStyleGroup = document.getElementById('cover-style-group');

    if (modePill && app.Storage && app.Storage.isCloudEnabled) {
      const isCloud = app.Storage.isCloudEnabled();
      modePill.textContent = isCloud
        ? '⚡ បង្ហាញភ្លាមៗ • ភ្ជាប់ Cloud រួចរាល់'
        : '⚡ បង្ហាញភ្លាមៗ មិនចាំបាច់អង្គុយចាំ (គាំទ្រ File & Folder)';
    }

    if (!dropzone || !fileInput || !form) return;

    function clearSelection() {
      previewObjectUrls.forEach((u) => URL.revokeObjectURL(u));
      previewObjectUrls = [];
      selectedFiles = [];
      detectedFolderName = '';
      previewBox.innerHTML = '';
      previewBox.hidden = true;
      if (coverStyleGroup) coverStyleGroup.hidden = true;
      fileStatus.textContent = 'គាំទ្រជ្រើស File ទោល, ច្រើន File ឬជ្រើសទាំង Folder (រូបភាព & វីឌីអូ)';
      fileInput.value = '';
      if (folderInput) folderInput.value = '';
    }

    function handleIncomingFiles(rawFiles, explicitFolderName) {
      const valid = naturalSortFiles(Array.from(rawFiles || [])).filter((file) => {
        const kind = detectMediaType(file);
        if (!kind) return false;
        const maxBytes = (kind === 'video' ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
        return file.size <= maxBytes;
      });

      if (!valid.length) {
        showToast('រកមិនឃើញឯកសាររូបភាព ឬវីឌីអូដែលត្រឹមត្រូវទេ!');
        return;
      }

      previewObjectUrls.forEach((u) => URL.revokeObjectURL(u));
      previewObjectUrls = [];
      selectedFiles = valid;

      // ចាប់ឈ្មោះ Folder ដោយស្វ័យប្រវត្តិ (ពី webkitRelativePath ឬ Drag & Drop Folder)
      let folderTitle = explicitFolderName || '';
      if (!folderTitle && valid[0].webkitRelativePath) {
        folderTitle = valid[0].webkitRelativePath.split('/')[0] || '';
      }
      detectedFolderName = folderTitle;

      const isFolderMode = valid.length > 1 || Boolean(folderTitle);
      if (coverStyleGroup) coverStyleGroup.hidden = !isFolderMode;

      const titleInput = document.getElementById('media-title-input');
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value =
          folderTitle || valid[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      }

      const totalMB = (valid.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(2);
      fileStatus.textContent = isFolderMode
        ? `📁 បានជ្រើសថតឯកសារ៖ ${valid.length} ឯកសារ (${totalMB} MB) — លោតបង្ហាញជាថតសាស្រ្តា`
        : `📄 បានជ្រើសរើស៖ ${valid[0].name} (${totalMB} MB)`;

      // បង្ហាញ Preview រហ័សបំផុត (បង្ហាញរហូតដល់ ២៤ រូបជាមុនដើម្បីកុំឲ្យធ្ងន់ DOM)
      previewBox.hidden = false;
      if (valid.length === 1) {
        const url = URL.createObjectURL(valid[0]);
        previewObjectUrls.push(url);
        previewBox.innerHTML =
          detectMediaType(valid[0]) === 'video'
            ? `<video src="${url}" controls muted playsinline></video>`
            : `<img src="${url}" alt="រូបភាពមើលជាមុន" />`;
      } else {
        const thumbs = valid
          .slice(0, 24)
          .map((file, idx) => {
            const url = URL.createObjectURL(file);
            previewObjectUrls.push(url);
            const isVid = detectMediaType(file) === 'video';
            return `
              <div class="preview-thumb-cell">
                ${isVid ? `<video src="${url}" muted playsinline preload="metadata"></video>` : `<img src="${url}" alt="" decoding="async" />`}
                <span class="preview-thumb-index">${idx + 1}</span>
              </div>
            `;
          })
          .join('');
        const extra =
          valid.length > 24
            ? `<div class="preview-thumb-cell" style="display:grid;place-items:center;font-size:0.8rem;font-weight:700;color:#fff;">+${valid.length - 24}</div>`
            : '';
        previewBox.innerHTML = `<div class="preview-strip">${thumbs}${extra}</div>`;
      }
    }

    fileInput.addEventListener('click', (e) => e.stopPropagation());
    if (folderInput) folderInput.addEventListener('click', (e) => e.stopPropagation());

    if (pickFilesBtn) {
      pickFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (pickFolderBtn && folderInput) {
      pickFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        folderInput.click();
      });
    }

    dropzone.addEventListener('click', (event) => {
      if (event.target.closest('button') || event.target.closest('video')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length) {
        handleIncomingFiles(fileInput.files, '');
      }
    });

    if (folderInput) {
      folderInput.addEventListener('change', () => {
        if (folderInput.files && folderInput.files.length) {
          handleIncomingFiles(folderInput.files, '');
        }
      });
    }

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

    dropzone.addEventListener('drop', async (event) => {
      const { files, folderName } = await extractFilesFromDrop(event.dataTransfer);
      if (files.length) handleIncomingFiles(files, folderName);
    });

    // បង្ហោះភ្លាមៗ (Optimistic Instant Publish — លោតឃើញភ្លាមៗ ០ វិនាទី!)
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!selectedFiles.length) {
        showToast('សូមជ្រើសរើស File ឬ Folder រូបភាព/វីឌីអូជាមុនសិន!');
        return;
      }

      const title =
        document.getElementById('media-title-input').value.trim() ||
        detectedFolderName ||
        selectedFiles[0].name.replace(/\.[^.]+$/, '');
      const category = document.getElementById('media-category-input').value;
      const author =
        document.getElementById('media-author-input').value.trim() || 'អ្នកចូលរួមថែរក្សាមរតក';
      const description =
        document.getElementById('media-desc-input').value.trim() ||
        'ឯកសារសាស្រ្តាស្លឹករឹតដែលបានចែករំលែកដោយអ្នកប្រើប្រាស់។';
      const coverStyleEl = document.getElementById('folder-cover-style');
      const coverStyle = coverStyleEl ? coverStyleEl.value : 'plank';

      const now = Date.now();
      const filesToPublish = [...selectedFiles];
      const isFolderUpload = filesToPublish.length > 1 || Boolean(detectedFolderName);

      // កំណត់ Filter ទៅ "ទាំងអស់" ដើម្បីឲ្យឃើញភ្លាមៗ
      currentFilter = 'all';
      currentSearch = '';
      const searchBox = document.getElementById('gallery-search');
      if (searchBox) searchBox.value = '';
      document.querySelectorAll('.gallery-filter-tab').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.filter === 'all');
      });

      if (isFolderUpload) {
        // បង្កើតជាថតសាស្រ្តាស្លឹករឹត (Folder / Album) ហើយបង្ហាញភ្លាមៗ!
        const folderRecord = {
          id: `folder-${now}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          category,
          author,
          description,
          coverStyle,
          date: formatKhmerDate(now),
          createdAt: now,
          items: filesToPublish.map((file, idx) => ({
            id: `p-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            type: detectMediaType(file) || 'image',
            name: file.name.replace(/\.[^.]+$/, ''),
            mimeType: file.type,
            blob: file,
          })),
        };

        const hydratedFolder = app.Storage.stageFolderInstant(folderRecord);
        allFolders = [hydratedFolder, ...allFolders.filter((f) => f.id !== hydratedFolder.id)];
        galleryHydrated = true;
        updateCounters();
        renderGallery(true);

        // រក្សាទុកក្នុង IndexedDB ក្នុងផ្ទៃខាងក្រោយដោយមិនឲ្យអាក់ UI ឡើយ
        app.Storage.persistFolderBackground(folderRecord);
        showToast(`⚡ បានបញ្ចូលថត «${title}» (${filesToPublish.length} ឯកសារ) រួចរាល់ភ្លាមៗ!`);
      } else {
        // បង្កើតឯកសារទោល ហើយបង្ហាញភ្លាមៗ!
        const file = filesToPublish[0];
        const kind = detectMediaType(file) || 'image';
        const singleRecord = {
          id: `user-${now}-${Math.random().toString(36).slice(2, 7)}`,
          type: kind,
          title,
          category,
          author,
          description,
          date: formatKhmerDate(now),
          createdAt: now,
          fileName: file.name,
          mimeType: file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
          blob: file,
        };

        const hydratedSingle = app.Storage.stageSingleInstant(singleRecord);
        allMedia = [hydratedSingle, ...allMedia.filter((m) => m.id !== hydratedSingle.id)];
        galleryHydrated = true;
        updateCounters();
        renderGallery(true);

        // រក្សាទុកក្នុងផ្ទៃខាងក្រោយ (IndexedDB / Supabase Cloud)
        app.Storage.persistSingleBackground(singleRecord).catch((err) => {
          console.warn('Background persist error:', err);
        });
        showToast('⚡ បានបញ្ចូលរូបភាព/វីឌីអូ និងបង្ហាញភ្លាមៗ!');
      }

      form.reset();
      clearSelection();

      // អូសទៅបណ្ណសារយ៉ាងរលូនភ្លាមៗ
      const gallerySection = document.getElementById('gallery');
      if (gallerySection) {
        gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function setupFiltersAndSearch() {
    const filterButtons = document.querySelectorAll('.gallery-filter-tab');
    const searchInput = document.getElementById('gallery-search');

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter || 'all';
        filterButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        galleryHydrated = true;
        renderGallery(true);
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value;
        galleryHydrated = true;
        renderGallery(true);
      });
    }
  }

  function setupLazyGalleryHydration() {
    const gallerySection = document.getElementById('gallery');
    if (!gallerySection || !('IntersectionObserver' in window)) {
      galleryHydrated = true;
      renderGallery(false);
      return;
    }

    const galleryObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !galleryHydrated) {
            galleryHydrated = true;
            renderGallery(false);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '180px 0px', threshold: 0.01 }
    );

    galleryObserver.observe(gallerySection);
  }

  async function init() {
    folderShowcaseEl = document.getElementById('folder-showcase');
    folderGridEl = document.getElementById('folder-grid');
    mediaGridEl = document.getElementById('media-grid');
    totalCountEl = document.getElementById('stat-media-count');
    userUploadCountEl = document.getElementById('stat-user-uploads');
    toastEl = document.getElementById('toast');

    if (!mediaGridEl) return;

    setupFiltersAndSearch();
    setupFolderModal();
    setupLightbox();
    setupUploader();
    await refreshAll(false);
    setupLazyGalleryHydration();
  }

  app.MediaManager = { init, refreshAll };
})((window.SastraApp = window.SastraApp || {}));

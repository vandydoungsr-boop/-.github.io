/**
 * doc-library.js — ប្រព័ន្ធបណ្ណាល័យឯកសារប្រវត្តិសាស្រ្តាស្លឹករឹត
 * - Lazy Hydrated ពេលអូសមកដល់ (ស្រាល និងលឿនក្នុង Browser)
 * - ត្រងតាមប្រភេទ និងស្វែងរកឯកសារភ្លាមៗ
 * - ផ្ទាំងអានឯកសារងាយស្រួលភ្នែក (បង្កើន/បន្ថយទំហំអក្សរ, ចម្លងអត្ថបទ, ទាញយក .txt)
 * - អនុញ្ញាតឲ្យ User បន្ថែមអត្ថបទប្រវត្តិ ឬភ្ជាប់ឯកសារ PDF/TXT (រក្សាទុកក្នុង IndexedDB)
 */
(function (app) {
  'use strict';

  const DOC_DB_NAME = 'SastraHistoryDocsDB';
  const DOC_DB_VERSION = 1;
  const DOC_STORE_NAME = 'user_documents';

  let allDocs = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentDocIndex = -1;
  let readerFontSize = 16;
  let libraryHydrated = false;
  let dbInstance = null;
  const activeAttachmentUrls = new Set();

  // DOM Elements
  let timelineEl;
  let docGridEl;
  let docModalEl;
  let addDocModalEl;

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(window.__docToastTimer);
    window.__docToastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // --------------------------------------------------------------------------
  // IndexedDB សម្រាប់ឯកសារប្រវត្តិដែល User បន្ថែម
  // --------------------------------------------------------------------------
  function openDocDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }
      if (!window.indexedDB) {
        reject(new Error('No IndexedDB'));
        return;
      }
      const req = window.indexedDB.open(DOC_DB_NAME, DOC_DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(DOC_STORE_NAME)) {
          db.createObjectStore(DOC_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function saveUserDoc(doc) {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOC_STORE_NAME, 'readwrite');
      tx.objectStore(DOC_STORE_NAME).put(doc);
      tx.oncomplete = () => resolve(doc);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function deleteUserDoc(id) {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOC_STORE_NAME, 'readwrite');
      tx.objectStore(DOC_STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadUserDocs() {
    try {
      const db = await openDocDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DOC_STORE_NAME, 'readonly');
        const req = tx.objectStore(DOC_STORE_NAME).getAll();
        req.onsuccess = () => {
          const rows = req.result || [];
          rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          resolve(rows);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  function revokeAttachmentUrls() {
    activeAttachmentUrls.forEach((url) => URL.revokeObjectURL(url));
    activeAttachmentUrls.clear();
  }

  async function refreshDocuments(forceRender) {
    revokeAttachmentUrls();
    const defaults = (app.HistoryDocsData && app.HistoryDocsData.DEFAULT_DOCUMENTS) || [];
    const userDocs = await loadUserDocs();

    const hydratedUserDocs = userDocs.map((item) => {
      let attachmentUrl = '';
      if (item.fileBlob) {
        attachmentUrl = URL.createObjectURL(item.fileBlob);
        activeAttachmentUrls.add(attachmentUrl);
      }
      return {
        ...item,
        attachmentUrl,
        isUserDoc: true,
      };
    });

    allDocs = [...hydratedUserDocs, ...defaults];
    if (libraryHydrated || forceRender) {
      libraryHydrated = true;
      renderDocGrid();
    }
  }

  // --------------------------------------------------------------------------
  // Render Timeline & Document Cards
  // --------------------------------------------------------------------------
  function renderTimeline() {
    if (!timelineEl || !app.HistoryDocsData) return;
    const milestones = app.HistoryDocsData.TIMELINE_MILESTONES || [];
    const fragment = document.createDocumentFragment();

    milestones.forEach((item, idx) => {
      const card = document.createElement('article');
      card.className = `timeline-pill reveal-item reveal-delay-${(idx % 4) + 1}`;
      card.innerHTML = `
        <span class="timeline-era">${escapeHtml(item.era)}</span>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.summary)}</p>
      `;
      fragment.appendChild(card);
    });

    timelineEl.innerHTML = '';
    timelineEl.appendChild(fragment);
    if (app.ScrollReveal) app.ScrollReveal.observeElements(timelineEl);
  }

  function getFilteredDocs() {
    return allDocs.filter((doc) => {
      const matchCat =
        currentCategory === 'all' ||
        (currentCategory === 'user' && doc.isUserDoc) ||
        doc.category === currentCategory;

      const q = currentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.summary && doc.summary.toLowerCase().includes(q)) ||
        (doc.category && doc.category.toLowerCase().includes(q)) ||
        (doc.era && doc.era.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }

  function renderDocGrid() {
    if (!docGridEl) return;
    const filtered = getFilteredDocs();

    if (!filtered.length) {
      docGridEl.innerHTML = `
        <div class="empty-state reveal-item is-revealed">
          <h3>មិនមានឯកសារប្រវត្តិត្រូវនឹងការស្វែងរកនេះទេ</h3>
          <p style="margin-top:8px;">អ្នកអាចសាកល្បងពាក្យស្វែងរកផ្សេង ឬចុច «+ បន្ថែមឯកសារប្រវត្តិ» ដើម្បីបញ្ចូលឯកសារថ្មី។</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((doc, idx) => {
      const card = document.createElement('article');
      card.className = `doc-card reveal-item reveal-delay-${(idx % 3) + 1}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.docId = doc.id;

      const attachmentChip = doc.fileName
        ? `<span class="doc-file-chip">📎 ${escapeHtml(doc.fileName)}</span>`
        : '';

      card.innerHTML = `
        <div class="doc-card-top">
          <span class="doc-category-tag">${escapeHtml(doc.category)}</span>
          <span class="doc-era-tag">${escapeHtml(doc.era || '')}</span>
        </div>
        <h3 class="doc-card-title">${escapeHtml(doc.title)}</h3>
        <p class="doc-card-summary">${escapeHtml(doc.summary)}</p>
        ${attachmentChip}
        <div class="doc-card-footer">
          <span>${escapeHtml(doc.readTime || 'ឯកសារប្រវត្តិ')}</span>
          <span class="doc-read-link">អានឯកសារ →</span>
        </div>
      `;

      fragment.appendChild(card);
    });

    docGridEl.innerHTML = '';
    docGridEl.appendChild(fragment);

    if (app.ScrollReveal) {
      app.ScrollReveal.observeElements(docGridEl);
    }
  }

  // --------------------------------------------------------------------------
  // ផ្ទាំងអានឯកសារ (Reader Modal)
  // --------------------------------------------------------------------------
  function buildPlainText(doc) {
    const lines = [
      doc.title,
      `ប្រភេទ៖ ${doc.category} | សម័យកាល៖ ${doc.era || '-'} | ប្រភព៖ ${doc.author || '-'}`,
      '====================================================',
      '',
    ];
    if (doc.quote) {
      lines.push(doc.quote, '');
    }
    (doc.sections || []).forEach((sec) => {
      if (sec.heading) lines.push(sec.heading);
      (sec.paragraphs || []).forEach((p) => lines.push(p, ''));
      (sec.bullets || []).forEach((b) => lines.push(`• ${b}`));
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  function renderReaderDocument(doc) {
    if (!doc || !docModalEl) return;

    const titleEl = document.getElementById('doc-reader-title');
    const metaEl = document.getElementById('doc-reader-meta');
    const contentEl = document.getElementById('doc-reader-content');
    const deleteBtn = document.getElementById('doc-reader-delete');
    const prevBtn = document.getElementById('doc-prev-btn');
    const nextBtn = document.getElementById('doc-next-btn');

    titleEl.textContent = doc.title;
    metaEl.innerHTML = `
      <span class="doc-category-tag">${escapeHtml(doc.category)}</span>
      <span>សម័យកាល៖ ${escapeHtml(doc.era || 'ប្រវត្តិសាស្ត្រខ្មែរ')}</span>
      <span>•</span>
      <span>${escapeHtml(doc.author || 'បណ្ណសារសាស្រ្តាស្លឹករឹត')}</span>
      <span>•</span>
      <span>${escapeHtml(doc.readTime || '')}</span>
    `;

    let html = '';
    if (doc.quote) {
      html += `<blockquote class="doc-reader-quote">${escapeHtml(doc.quote)}</blockquote>`;
    }

    (doc.sections || []).forEach((sec) => {
      if (sec.heading) {
        html += `<h4>${escapeHtml(sec.heading)}</h4>`;
      }
      (sec.paragraphs || []).forEach((p) => {
        html += `<p>${escapeHtml(p)}</p>`;
      });
      if (sec.bullets && sec.bullets.length) {
        html += '<ul>';
        sec.bullets.forEach((b) => {
          html += `<li>${escapeHtml(b)}</li>`;
        });
        html += '</ul>';
      }
    });

    if (doc.attachmentUrl && doc.fileName) {
      html += `
        <div class="doc-attachment-box">
          <div>
            <strong>ឯកសារភ្ជាប់៖ ${escapeHtml(doc.fileName)}</strong>
            <p style="font-size: 0.84rem; margin-top: 2px;">ចុចប៊ូតុងខាងស្តាំដើម្បីបើកមើល ឬទាញយកឯកសារដើម</p>
          </div>
          <a href="${doc.attachmentUrl}" download="${escapeHtml(doc.fileName)}" target="_blank" rel="noopener" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">
            បើក / ទាញយកឯកសារភ្ជាប់
          </a>
        </div>
      `;
    }

    contentEl.innerHTML = html;

    if (deleteBtn) {
      deleteBtn.hidden = !doc.isUserDoc;
    }

    if (prevBtn) prevBtn.disabled = currentDocIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentDocIndex >= allDocs.length - 1;
  }

  function openReaderById(id) {
    const idx = allDocs.findIndex((d) => d.id === id);
    if (idx === -1) return;
    currentDocIndex = idx;
    renderReaderDocument(allDocs[idx]);
    docModalEl.classList.add('is-open');
    docModalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeReader() {
    if (!docModalEl) return;
    docModalEl.classList.remove('is-open');
    docModalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setupReaderControls() {
    const closeBtn = document.getElementById('doc-reader-close');
    const fontInc = document.getElementById('doc-font-inc');
    const fontDec = document.getElementById('doc-font-dec');
    const copyBtn = document.getElementById('doc-copy-btn');
    const downloadBtn = document.getElementById('doc-download-btn');
    const deleteBtn = document.getElementById('doc-reader-delete');
    const prevBtn = document.getElementById('doc-prev-btn');
    const nextBtn = document.getElementById('doc-next-btn');
    const readerBody = document.getElementById('doc-reader-body');

    function applyFontSize() {
      if (readerBody) {
        readerBody.style.setProperty('--reader-font-size', `${readerFontSize}px`);
      }
    }

    if (fontInc) {
      fontInc.addEventListener('click', () => {
        readerFontSize = Math.min(22, readerFontSize + 2);
        applyFontSize();
      });
    }

    if (fontDec) {
      fontDec.addEventListener('click', () => {
        readerFontSize = Math.max(14, readerFontSize - 2);
        applyFontSize();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const doc = allDocs[currentDocIndex];
        if (!doc) return;
        try {
          await navigator.clipboard.writeText(buildPlainText(doc));
          showToast('បានចម្លងអត្ថបទឯកសារដោយជោគជ័យ!');
        } catch {
          showToast('មិនអាចចម្លងស្វ័យប្រវត្តិបានទេ');
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const doc = allDocs[currentDocIndex];
        if (!doc) return;
        const blob = new Blob([buildPlainText(doc)], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.id || 'sastra-history-doc'}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('កំពុងទាញយកឯកសារប្រវត្តិ (.txt)...');
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const doc = allDocs[currentDocIndex];
        if (!doc || !doc.isUserDoc) return;
        await deleteUserDoc(doc.id);
        closeReader();
        await refreshDocuments(true);
        showToast('បានលុបឯកសារប្រវត្តិចេញដោយជោគជ័យ');
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentDocIndex > 0) {
          currentDocIndex -= 1;
          renderReaderDocument(allDocs[currentDocIndex]);
          if (readerBody) readerBody.scrollTop = 0;
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentDocIndex < allDocs.length - 1) {
          currentDocIndex += 1;
          renderReaderDocument(allDocs[currentDocIndex]);
          if (readerBody) readerBody.scrollTop = 0;
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeReader);
    if (docModalEl) {
      docModalEl.addEventListener('click', (event) => {
        if (event.target === docModalEl) closeReader();
      });
    }

    docGridEl.addEventListener('click', (event) => {
      const card = event.target.closest('.doc-card[data-doc-id]');
      if (card) openReaderById(card.dataset.docId);
    });

    docGridEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const card = event.target.closest('.doc-card[data-doc-id]');
        if (card) {
          event.preventDefault();
          openReaderById(card.dataset.docId);
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // ផ្ទាំងបន្ថែមឯកសារប្រវត្តិថ្មី (User Add Historical Document)
  // --------------------------------------------------------------------------
  function setupAddDocModal() {
    const openBtn = document.getElementById('open-add-doc-btn');
    const closeBtn = document.getElementById('add-doc-close');
    const form = document.getElementById('add-doc-form');
    const fileInput = document.getElementById('doc-file-input');

    if (!addDocModalEl || !form) return;

    function openAddModal() {
      addDocModalEl.classList.add('is-open');
      addDocModalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeAddModal() {
      addDocModalEl.classList.remove('is-open');
      addDocModalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openAddModal);
    if (closeBtn) closeBtn.addEventListener('click', closeAddModal);
    addDocModalEl.addEventListener('click', (event) => {
      if (event.target === addDocModalEl) closeAddModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('doc-title-input').value.trim();
      const category = document.getElementById('doc-category-input').value;
      const era = document.getElementById('doc-era-input').value.trim() || 'ប្រវត្តិសាស្ត្រខ្មែរ';
      const author = document.getElementById('doc-author-input').value.trim() || 'អ្នករួមចំណែកឯកសារ';
      const bodyText = document.getElementById('doc-body-input').value.trim();
      const attachedFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!title || (!bodyText && !attachedFile)) {
        showToast('សូមបំពេញចំណងជើង និងខ្លឹមសារ ឬភ្ជាប់ឯកសារ!');
        return;
      }

      if (attachedFile && attachedFile.size > 20 * 1024 * 1024) {
        showToast('ទំហំឯកសារភ្ជាប់ធំពេក! សូមប្រើឯកសារក្រោម 20MB');
        return;
      }

      const paragraphs = bodyText
        ? bodyText.split(/\n+/).map((p) => p.trim()).filter(Boolean)
        : ['ឯកសារប្រវត្តិសាស្រ្តាស្លឹករឹតដែលបានភ្ជាប់ដោយអ្នកប្រើប្រាស់។'];

      const summary =
        paragraphs[0].length > 130 ? `${paragraphs[0].slice(0, 130)}...` : paragraphs[0];

      const record = {
        id: `user-doc-${Date.now()}`,
        title,
        category,
        era,
        author,
        readTime: 'ឯកសារ User បញ្ចូល',
        summary,
        sections: [
          {
            heading: 'ខ្លឹមសារឯកសារ',
            paragraphs,
          },
        ],
        fileName: attachedFile ? attachedFile.name : '',
        fileBlob: attachedFile || null,
        createdAt: Date.now(),
      };

      try {
        await saveUserDoc(record);
        form.reset();
        closeAddModal();
        currentCategory = 'all';
        document.querySelectorAll('.doc-filter-tab').forEach((tab) => {
          tab.classList.toggle('is-active', tab.dataset.docFilter === 'all');
        });
        await refreshDocuments(true);
        showToast('បានបន្ថែមឯកសារប្រវត្តិចូលបណ្ណាល័យដោយជោគជ័យ!');
      } catch (err) {
        console.error(err);
        showToast('មិនអាចរក្សាទុកឯកសារបានទេ សូមព្យាយាមម្តងទៀត');
      }
    });
  }

  function setupFilters() {
    const tabs = document.querySelectorAll('.doc-filter-tab');
    const searchInput = document.getElementById('doc-search-input');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        currentCategory = tab.dataset.docFilter || 'all';
        tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
        libraryHydrated = true;
        renderDocGrid();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value;
        libraryHydrated = true;
        renderDocGrid();
      });
    }
  }

  function setupLazyHydration() {
    const section = document.getElementById('documents');
    if (!section || !('IntersectionObserver' in window)) {
      libraryHydrated = true;
      renderTimeline();
      renderDocGrid();
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !libraryHydrated) {
            libraryHydrated = true;
            renderTimeline();
            renderDocGrid();
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '160px 0px', threshold: 0.01 }
    );

    observer.observe(section);
  }

  async function init() {
    timelineEl = document.getElementById('history-timeline');
    docGridEl = document.getElementById('doc-grid');
    docModalEl = document.getElementById('doc-reader-modal');
    addDocModalEl = document.getElementById('add-doc-modal');

    if (!docGridEl) return;

    setupFilters();
    setupReaderControls();
    setupAddDocModal();
    await refreshDocuments(false);
    setupLazyHydration();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (docModalEl && docModalEl.classList.contains('is-open')) closeReader();
        if (addDocModalEl && addDocModalEl.classList.contains('is-open')) {
          addDocModalEl.classList.remove('is-open');
          addDocModalEl.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      }
    });
  }

  window.addEventListener('beforeunload', revokeAttachmentUrls);

  app.DocLibrary = { init };
})((window.SastraApp = window.SastraApp || {}));


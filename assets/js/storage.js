/**
 * storage.js — ប្រព័ន្ធផ្ទុករហ័សរហួន (Optimistic Instant UI + Background IndexedDB + Supabase Cloud)
 * - គាំទ្រទាំងឯកសារទោល (Single File) និងថតឯកសារ/ក្រាំង (Folder / Multi-Image Album)
 * - បង្ហាញរូបភាពភ្លាមៗ (< 16ms) តាម ObjectURL ដោយមិនចាំបាច់អង្គុយចាំ រួចរក្សាទុកក្នុងផ្ទៃខាងក្រោយ
 */
(function (app) {
  'use strict';

  const DB_NAME = 'SastraSleukRithDB';
  const DB_VERSION = 2;
  const STORE_MEDIA = 'user_media';
  const STORE_FOLDERS = 'user_folders';
  const DEVICE_TOKEN_KEY = 'sastra-device-token';

  // រូបភាពគំរូទោលដើម
  const DEFAULT_MEDIA = [
    {
      id: 'default-1',
      type: 'image',
      title: 'សាស្រ្តាស្លឹករឹតចងខ្សែសូត្រក្រហម',
      category: 'សាស្រ្តាបុរាណ',
      description:
        'គម្ពីរសាស្រ្តាស្លឹករឹតបុរាណរៀបចំចងភ្ជាប់ដោយខ្សែសូត្រក្រហម និងមានក្បាំងឈើក្បាច់មាសសម្រាប់ការពារស្លឹករឹត។',
      author: 'បណ្ណសារមរតកខ្មែរ',
      date: 'ឯកសារគំរូ',
      src: 'assets/images/hero-manuscript.jpg',
      isUserUpload: false,
      canDelete: false,
    },
    {
      id: 'default-2',
      type: 'image',
      title: 'សិល្បៈចារអក្សរដោយដែកចារលើស្លឹករឹត',
      category: 'ការចារស្លឹករឹត',
      description:
        'ទិដ្ឋភាពដៃសិប្បករចារអក្សរខ្មែរបុរាណយ៉ាងផ្ចិតផ្ចង់លើស្លឹកទ្រាំងដែលបានកែច្នៃរួច មុននឹងជូតទឹកខ្មៅធម្មជាតិ។',
      author: 'បណ្ណសារមរតកខ្មែរ',
      date: 'ឯកសារគំរូ',
      src: 'assets/images/crafting-leaves.jpg',
      isUserUpload: false,
      canDelete: false,
    },
    {
      id: 'default-3',
      type: 'image',
      title: 'ហោត្រ័យ និងទូរក្សាសាស្រ្តាក្នុងវត្តអារាម',
      category: 'បណ្ណាល័យហោត្រ័យ',
      description:
        'ទូឈើឆ្លាក់ក្បាច់ខ្មែរសម្រាប់តម្កល់សាស្រ្តាស្លឹករឹតរុំដោយកំណាត់សំពត់ពណ៌លឿង និងក្រហមដើម្បីការពារសំណើម និងសត្វល្អិត។',
      author: 'បណ្ណសារមរតកខ្មែរ',
      date: 'ឯកសារគំរូ',
      src: 'assets/images/temple-archive.jpg',
      isUserUpload: false,
      canDelete: false,
    },
    {
      id: 'default-4',
      type: 'image',
      title: 'អក្សរចារ និងក្បាច់ផ្កាឈូកលើផ្ទៃស្លឹករឹត',
      category: 'អក្សរសិល្ប៍បុរាណ',
      description:
        'ភាពលម្អិតនៃតួអក្សរខ្មែរបុរាណជ្រាបទឹកខ្មៅខ្មៅក្រឹប និងរន្ធដោតខ្សែកណ្តាលស្លឹករឹតដែលបង្ហាញពីភាពប៉ិនប្រសប់របស់បុព្វបុរស។',
      author: 'បណ្ណសារមរតកខ្មែរ',
      date: 'ឯកសារគំរូ',
      src: 'assets/images/palm-detail.jpg',
      isUserUpload: false,
      canDelete: false,
    },
  ];

  // ថតសាស្រ្តាស្លឹករឹតគំរូ (បង្ហាញទម្រង់សន្លឹកឈើសាស្រ្តាដូចបណ្ណាល័យសាស្រ្តាបុរាណ)
  const DEFAULT_FOLDERS = [
    {
      id: 'sample-folder-1',
      title: 'កម្រងគម្ពីរសាស្រ្តាស្លឹករឹតបុរាណ',
      category: 'សាស្រ្តាបុរាណ',
      author: 'បណ្ណសារមរតកខ្មែរ',
      description: 'ថតឯកសាររូបភាពគំរូបង្ហាញពីគម្ពីរសាស្រ្តា ហោត្រ័យ និងសិល្បៈចារស្លឹករឹតខ្មែរ។',
      coverStyle: 'plank',
      date: 'ថតគំរូ',
      isUserUpload: false,
      canDelete: false,
      items: [
        {
          id: 'sf1-1',
          type: 'image',
          name: 'ទំព័រទី ១ — គម្ពីរសាស្រ្តាចងខ្សែសូត្រ',
          src: 'assets/images/hero-manuscript.jpg',
        },
        {
          id: 'sf1-2',
          type: 'image',
          name: 'ទំព័រទី ២ — អក្សរចារលើស្លឹករឹតលម្អិត',
          src: 'assets/images/palm-detail.jpg',
        },
        {
          id: 'sf1-3',
          type: 'image',
          name: 'ទំព័រទី ៣ — ហោត្រ័យរក្សាសាស្រ្តា',
          src: 'assets/images/temple-archive.jpg',
        },
      ],
    },
    {
      id: 'sample-folder-2',
      title: 'កម្រងសិប្បកម្មចារសាស្រ្តាលើស្លឹកទ្រាំង',
      category: 'ការចារស្លឹករឹត',
      author: 'បណ្ណសារមរតកខ្មែរ',
      description: 'រូបភាពដំណាក់កាលសិប្បករចារអក្សរ និងភាពលម្អិតនៃផ្ទៃស្លឹករឹត។',
      coverStyle: 'plank',
      date: 'ថតគំរូ',
      isUserUpload: false,
      canDelete: false,
      items: [
        {
          id: 'sf2-1',
          type: 'image',
          name: 'ទំព័រទី ១ — ចារដោយដែកចារ',
          src: 'assets/images/crafting-leaves.jpg',
        },
        {
          id: 'sf2-2',
          type: 'image',
          name: 'ទំព័រទី ២ — ស្នាមអក្សរជ្រាបទឹកខ្មៅ',
          src: 'assets/images/palm-detail.jpg',
        },
      ],
    },
  ];

  let dbInstance = null;
  let memoryMedia = [];
  let memoryFolders = [];
  const objectUrlCache = new Map();

  function getCloudConfig() {
    const cfg = app.CloudConfig || {};
    return {
      url: (cfg.url || '').trim().replace(/\/+$/, ''),
      anonKey: (cfg.anonKey || '').trim(),
      bucket: (cfg.bucket || 'sastra-media').trim(),
      table: (cfg.table || 'media_items').trim(),
    };
  }

  function isCloudEnabled() {
    const cfg = getCloudConfig();
    return Boolean(cfg.url && cfg.anonKey);
  }

  function getDeviceToken() {
    try {
      let token = localStorage.getItem(DEVICE_TOKEN_KEY);
      if (!token) {
        token = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(DEVICE_TOKEN_KEY, token);
      }
      return token;
    } catch {
      return 'dev-session';
    }
  }

  function formatKhmerDate(input) {
    try {
      return new Intl.DateTimeFormat('km-KH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(input));
    } catch {
      return new Date(input).toLocaleDateString();
    }
  }

  function getSafeExtension(fileName, mimeType) {
    const fromName = (fileName || '').split('.').pop();
    if (fromName && /^[a-zA-Z0-9]{2,5}$/.test(fromName)) {
      return fromName.toLowerCase();
    }
    const fromMime = (mimeType || '').split('/')[1];
    if (fromMime) {
      return fromMime.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
    }
    return 'bin';
  }

  function getOrCreateUrl(key, blob) {
    if (!blob) return '';
    if (objectUrlCache.has(key)) return objectUrlCache.get(key);
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(key, url);
    return url;
  }

  function revokeUrl(key) {
    if (objectUrlCache.has(key)) {
      URL.revokeObjectURL(objectUrlCache.get(key));
      objectUrlCache.delete(key);
    }
  }

  function revokeAllUrls() {
    objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
    objectUrlCache.clear();
  }

  // --------------------------------------------------------------------------
  // IndexedDB (Version 2: គាំទ្រទាំង user_media និង user_folders)
  // --------------------------------------------------------------------------
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }
      if (!window.indexedDB) {
        reject(new Error('No IndexedDB'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          const store = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
          const fStore = db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
          fStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = function (event) {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = function () {
        reject(request.error || new Error('IndexedDB open failed'));
      };
    });
  }

  async function idbPut(storeName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelete(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbGetAll(storeName) {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Supabase Cloud (សម្រាប់ឯកសារទោល ពេលភ្ជាប់ CloudConfig)
  // --------------------------------------------------------------------------
  async function cloudUploadSingle(record) {
    const cfg = getCloudConfig();
    const folder = record.type === 'video' ? 'videos' : 'images';
    const ext = getSafeExtension(record.fileName, record.mimeType);
    const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadRes = await fetch(
      `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${storagePath}`,
      {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': record.mimeType || 'application/octet-stream',
          'x-upsert': 'false',
        },
        body: record.blob,
      }
    );

    if (!uploadRes.ok) throw new Error(await uploadRes.text());

    const mediaUrl = `${cfg.url}/storage/v1/object/public/${encodeURIComponent(cfg.bucket)}/${storagePath}`;
    const deleteToken = getDeviceToken();

    const insertRes = await fetch(`${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        title: record.title,
        category: record.category,
        author: record.author,
        description: record.description,
        type: record.type,
        media_url: mediaUrl,
        storage_path: storagePath,
        delete_token: deleteToken,
      }),
    });

    if (!insertRes.ok) throw new Error(await insertRes.text());
    return insertRes.json();
  }

  async function cloudFetchAllMedia() {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Cloud fetch failed (${res.status})`);
    const rows = await res.json();
    return (rows || []).map((row) => ({
      id: String(row.id),
      type: row.type === 'video' ? 'video' : 'image',
      title: row.title || 'ឯកសារសាស្រ្តាស្លឹករឹត',
      category: row.category || 'សាស្រ្តាបុរាណ',
      description: row.description || '',
      author: row.author || 'អ្នកចូលរួមថែរក្សាមរតក',
      date: row.created_at ? formatKhmerDate(row.created_at) : '',
      src: row.media_url,
      storagePath: row.storage_path || '',
      isUserUpload: true,
      canDelete: Boolean(row.delete_token && row.delete_token === deviceToken),
    }));
  }

  async function cloudDeleteSingle(id, storagePath) {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?id=eq.${encodeURIComponent(id)}&delete_token=eq.${encodeURIComponent(deviceToken)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      }
    );
    if (!res.ok) throw new Error('Cloud delete failed');
    if (storagePath) {
      await fetch(
        `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${storagePath}`,
        {
          method: 'DELETE',
          headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
          },
        }
      ).catch(() => {});
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // Hydrate Helpers (រហ័សបំផុត មិនប្រើ FileReader ប្លុក UI ឡើយ)
  // --------------------------------------------------------------------------
  function hydrateMediaItem(item) {
    const src = item.blob instanceof Blob ? getOrCreateUrl(item.id, item.blob) : item.src || '';
    return {
      ...item,
      src,
      isUserUpload: true,
      canDelete: true,
    };
  }

  function hydrateFolder(folder) {
    const hydratedItems = (folder.items || []).map((entry) => ({
      ...entry,
      src:
        entry.blob instanceof Blob
          ? getOrCreateUrl(`${folder.id}:${entry.id}`, entry.blob)
          : entry.src || '',
    }));

    return {
      ...folder,
      items: hydratedItems,
      isUserUpload: true,
      canDelete: true,
    };
  }

  // --------------------------------------------------------------------------
  // Public API — Optimistic Instant Save + Background Persistence
  // --------------------------------------------------------------------------
  function stageSingleInstant(record) {
    const hydrated = hydrateMediaItem(record);
    memoryMedia = [record, ...memoryMedia.filter((m) => m.id !== record.id)];
    return hydrated;
  }

  async function persistSingleBackground(record) {
    if (isCloudEnabled()) {
      await cloudUploadSingle(record);
      return;
    }
    try {
      await idbPut(STORE_MEDIA, record);
    } catch (err) {
      console.warn('Background IndexedDB save warning:', err);
    }
  }

  function stageFolderInstant(folderRecord) {
    const hydrated = hydrateFolder(folderRecord);
    memoryFolders = [folderRecord, ...memoryFolders.filter((f) => f.id !== folderRecord.id)];
    return hydrated;
  }

  async function persistFolderBackground(folderRecord) {
    try {
      await idbPut(STORE_FOLDERS, folderRecord);
    } catch (err) {
      console.warn('Background Folder IndexedDB save warning:', err);
    }
  }

  async function appendFilesToFolder(folderId, newEntries) {
    const existingMem = memoryFolders.find((f) => f.id === folderId);
    const dbFolders = existingMem ? null : await idbGetAll(STORE_FOLDERS);
    const target = existingMem || (dbFolders && dbFolders.find((f) => f.id === folderId));
    if (!target) return null;

    const updated = {
      ...target,
      items: [...(target.items || []), ...newEntries],
    };

    const hydrated = stageFolderInstant(updated);
    persistFolderBackground(updated);
    return hydrated;
  }

  async function deleteMediaItem(id, storagePath) {
    revokeUrl(id);
    memoryMedia = memoryMedia.filter((m) => m.id !== id);
    if (isCloudEnabled() && storagePath) {
      return cloudDeleteSingle(id, storagePath);
    }
    try {
      await idbDelete(STORE_MEDIA, id);
    } catch (err) {
      console.warn('Delete single warning:', err);
    }
    return true;
  }

  async function deleteFolder(folderId) {
    const target = memoryFolders.find((f) => f.id === folderId);
    if (target && target.items) {
      target.items.forEach((it) => revokeUrl(`${folderId}:${it.id}`));
    }
    memoryFolders = memoryFolders.filter((f) => f.id !== folderId);
    try {
      await idbDelete(STORE_FOLDERS, folderId);
    } catch (err) {
      console.warn('Delete folder warning:', err);
    }
    return true;
  }

  async function getAllMedia() {
    if (isCloudEnabled()) {
      try {
        const cloudItems = await cloudFetchAllMedia();
        const memHydrated = memoryMedia.map(hydrateMediaItem);
        const mergedMap = new Map();
        [...cloudItems, ...memHydrated].forEach((m) => mergedMap.set(m.id, m));
        return [...mergedMap.values(), ...DEFAULT_MEDIA];
      } catch {
        // Fallback to local
      }
    }

    const dbRows = await idbGetAll(STORE_MEDIA);
    const mergedMap = new Map();
    [...dbRows, ...memoryMedia].forEach((row) => {
      if (row && row.id) mergedMap.set(row.id, row);
    });
    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    memoryMedia = sorted;

    return [...sorted.map(hydrateMediaItem), ...DEFAULT_MEDIA];
  }

  async function getAllFolders() {
    const dbRows = await idbGetAll(STORE_FOLDERS);
    const mergedMap = new Map();
    [...dbRows, ...memoryFolders].forEach((row) => {
      if (row && row.id) mergedMap.set(row.id, row);
    });
    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    memoryFolders = sorted;

    return [...sorted.map(hydrateFolder), ...DEFAULT_FOLDERS];
  }

  window.addEventListener('beforeunload', revokeAllUrls);

  app.Storage = {
    isCloudEnabled,
    stageSingleInstant,
    persistSingleBackground,
    stageFolderInstant,
    persistFolderBackground,
    appendFilesToFolder,
    deleteMediaItem,
    deleteFolder,
    getAllMedia,
    getAllFolders,
    DEFAULT_MEDIA,
    DEFAULT_FOLDERS,
  };
})((window.SastraApp = window.SastraApp || {}));

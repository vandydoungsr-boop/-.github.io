/**
 * storage.js — ប្រព័ន្ធផ្ទុកឯកសាររូបភាព និងវីឌីអូ (Hybrid: Supabase Cloud + IndexedDB)
 * - បើបានកំណត់ CloudConfig (Supabase) => ផ្ទុកលើ Cloud ឲ្យអ្នកទាំងអស់គ្នាមើលឃើញរួមគ្នាលើ GitHub Pages
 * - បើមិនទាន់ភ្ជាប់ Cloud => រក្សាទុកក្នុង Browser (IndexedDB) ដោយស្វ័យប្រវត្តិ
 */
(function (app) {
  'use strict';

  const DB_NAME = 'SastraSleukRithDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'user_media';
  const DEVICE_TOKEN_KEY = 'sastra-device-token';

  // ទិន្នន័យរូបភាពគំរូដើមដែលផ្ទុកនៅក្នុងថត assets/images/
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

  let dbInstance = null;
  const activeObjectUrls = new Set();

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

  // --------------------------------------------------------------------------
  // ផ្នែកទី ១៖ ប្រព័ន្ធផ្ទុកលើ Cloud (Supabase REST API — មិនបាច់ Build ដើរលើ GitHub Pages)
  // --------------------------------------------------------------------------
  async function cloudUploadMedia(record) {
    const cfg = getCloudConfig();
    const folder = record.type === 'video' ? 'videos' : 'images';
    const ext = getSafeExtension(record.fileName, record.mimeType);
    const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // ជំហាន ១៖ បញ្ជូនឯកសាររូបភាព ឬវីឌីអូទៅ Supabase Storage
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

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`មិនអាចបញ្ជូនឯកសារទៅ Cloud Storage បានទេ៖ ${errText}`);
    }

    const mediaUrl = `${cfg.url}/storage/v1/object/public/${encodeURIComponent(cfg.bucket)}/${storagePath}`;
    const deleteToken = getDeviceToken();

    // ជំហាន ២៖ រក្សាទុកព័ត៌មានចំណងជើង និងតំណភ្ជាប់ក្នុង Database
    const payload = {
      title: record.title,
      category: record.category,
      author: record.author,
      description: record.description,
      type: record.type,
      media_url: mediaUrl,
      storage_path: storagePath,
      delete_token: deleteToken,
    };

    const insertRes = await fetch(`${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`មិនអាចរក្សាទុកទិន្នន័យក្នុង Cloud Database បានទេ៖ ${errText}`);
    }

    return insertRes.json();
  }

  async function cloudFetchAllMedia() {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();

    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?select=*&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Cloud fetch failed (${res.status})`);
    }

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

  async function cloudDeleteMedia(id, storagePath) {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();

    const delRowRes = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?id=eq.${encodeURIComponent(id)}&delete_token=eq.${encodeURIComponent(deviceToken)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      }
    );

    if (!delRowRes.ok) {
      throw new Error('មិនអាចលុបទិន្នន័យពី Cloud Database បានទេ');
    }

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
  // ផ្នែកទី ២៖ ប្រព័ន្ធផ្ទុកក្នុង Browser (IndexedDB — ប្រើស្វ័យប្រវត្តិពេលមិនទាន់ភ្ជាប់ Cloud)
  // --------------------------------------------------------------------------
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }

      if (!window.indexedDB) {
        reject(new Error('Browser នេះមិនគាំទ្រ IndexedDB ទេ'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = function (event) {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = function () {
        reject(request.error || new Error('មិនអាចបើកមូលដ្ឋានទិន្នន័យបានទេ'));
      };
    });
  }

  function revokeActiveUrls() {
    activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrls.clear();
  }

  async function localSaveMedia(record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function localDeleteMedia(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function localGetMedia() {
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const rows = req.result || [];
          rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          resolve(rows);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB fallback:', err);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  async function saveMediaItem(record) {
    if (isCloudEnabled()) {
      return cloudUploadMedia(record);
    }
    return localSaveMedia(record);
  }

  async function deleteMediaItem(id, storagePath) {
    if (isCloudEnabled()) {
      return cloudDeleteMedia(id, storagePath);
    }
    return localDeleteMedia(id);
  }

  async function getAllMedia() {
    revokeActiveUrls();

    if (isCloudEnabled()) {
      try {
        const cloudItems = await cloudFetchAllMedia();
        return [...cloudItems, ...DEFAULT_MEDIA];
      } catch (err) {
        console.warn('Cloud fetch error, falling back to default items:', err);
        return [...DEFAULT_MEDIA];
      }
    }

    const userRows = await localGetMedia();
    const hydratedUploads = userRows.map((item) => {
      const objectUrl = item.blob ? URL.createObjectURL(item.blob) : item.src;
      if (item.blob && objectUrl) {
        activeObjectUrls.add(objectUrl);
      }
      return {
        ...item,
        src: objectUrl,
        isUserUpload: true,
        canDelete: true,
      };
    });

    return [...hydratedUploads, ...DEFAULT_MEDIA];
  }

  window.addEventListener('beforeunload', revokeActiveUrls);

  app.Storage = {
    isCloudEnabled,
    saveMediaItem,
    deleteMediaItem,
    getAllMedia,
    DEFAULT_MEDIA,
  };
})((window.SastraApp = window.SastraApp || {}));

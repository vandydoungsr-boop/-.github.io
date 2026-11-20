/**
 * storage.js — ប្រព័ន្ធផ្ទុករហ័សរហួន និងធន់ខ្ពស់ (Local-First + Supabase Cloud Sync + IndexedDB)
 * - Local-First: រូបភាព និងថតឯកសាររក្សាទុកក្នុង IndexedDB ភ្លាមៗ ធានាថា Refresh មិនដែលបាត់
 * - Cloud Sync: ប្រសិនបើភ្ជាប់ Supabase វានឹងបញ្ជូនឡើង Cloud ដោយស្វ័យប្រវត្តិដើម្បីឲ្យអ្នកទាំងអស់គ្នាមើលឃើញរួមគ្នា
 * - Resilience: បើទោះជា Supabase មិនទាន់បង្កើតតារាង ឬបាត់ Internet ក៏រូបភាពនៅតែបង្ហាញលើអេក្រង់ជាប់ជានិច្ច
 */
(function (app) {
  'use strict';

  const DB_NAME = 'SastraSleukRithDB';
  const DB_VERSION = 2;
  const STORE_MEDIA = 'user_media';
  const STORE_FOLDERS = 'user_folders';
  const DEVICE_TOKEN_KEY = 'sastra-device-token';

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
  let cachedCloudStatus = null;
  const objectUrlCache = new Map();

  function getCloudConfig() {
    const cfg = app.CloudConfig || {};
    return {
      url: (cfg.url || '').trim().replace(/\/+$/, ''),
      anonKey: (cfg.anonKey || '').trim(),
      bucket: (cfg.bucket || 'sastra-media').trim(),
      table: (cfg.table || 'media_items').trim(),
      foldersTable: (cfg.foldersTable || 'media_folders').trim(),
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
  // IndexedDB (ផ្ទុកក្នុងឧបករណ៍ផ្ទាល់ Local-First ធានាមិនដែលបាត់)
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
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`idbPut [${storeName}] failed:`, err);
      return value;
    }
  }

  async function idbDelete(storeName, id) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return false;
    }
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
  // Supabase Cloud API & Health Check
  // --------------------------------------------------------------------------
  function buildCloudHeaders(extra) {
    const cfg = getCloudConfig();
    return {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      ...(extra || {}),
    };
  }

  async function checkCloudStatus(forceRefresh) {
    if (cachedCloudStatus && !forceRefresh) return cachedCloudStatus;
    const cfg = getCloudConfig();
    if (!cfg.url || !cfg.anonKey) {
      cachedCloudStatus = {
        state: 'unconfigured',
        label: '● ផ្ទុកក្នុងឧបករណ៍ផ្ទាល់ (IndexedDB)',
        details: 'មិនទាន់បានកំណត់ Cloud URL ឬ API Key',
      };
      return cachedCloudStatus;
    }

    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?select=id&limit=1`,
        {
          method: 'GET',
          headers: buildCloudHeaders(),
        }
      );

      if (res.ok) {
        cachedCloudStatus = {
          state: 'connected',
          label: '☁ ភ្ជាប់ Cloud រួចរាល់ — អ្នកគ្រប់គ្នាមើលឃើញរួមគ្នា',
          details: 'តារាង Database និង Cloud Storage ដំណើរការល្អឥតខ្ចោះ',
        };
        return cachedCloudStatus;
      }

      if (res.status === 404) {
        cachedCloudStatus = {
          state: 'tables_missing',
          label: '⚠️ មិនទាន់បង្កើតតារាងក្នុង Supabase (PGRST205)',
          details: 'សូមបើក Supabase SQL Editor រួច Run កូដ supabase-setup.sql ដើម្បីឲ្យអ្នកដទៃមើលឃើញ',
        };
        return cachedCloudStatus;
      }

      cachedCloudStatus = {
        state: 'error',
        label: `⚠️ Cloud ឆ្លើយតបបញ្ហា (${res.status})`,
        details: 'សូមពិនិត្យមើល Supabase Project',
      };
      return cachedCloudStatus;
    } catch {
      cachedCloudStatus = {
        state: 'offline',
        label: '● ផ្ទុកក្នុងឧបករណ៍ផ្ទាល់ (Offline)',
        details: 'មិនអាចតភ្ជាប់ទៅ Supabase បានទេ សូមពិនិត្យមើលអ៊ីនធឺណិត',
      };
      return cachedCloudStatus;
    }
  }

  async function uploadBlobToCloudStorage(blob, prefix, fileName, mimeType) {
    const cfg = getCloudConfig();
    const ext = getSafeExtension(fileName, mimeType);
    const storagePath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadRes = await fetch(
      `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${storagePath}`,
      {
        method: 'POST',
        headers: buildCloudHeaders({
          'Content-Type': mimeType || 'application/octet-stream',
          'x-upsert': 'true',
        }),
        body: blob,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(await uploadRes.text());
    }

    const mediaUrl = `${cfg.url}/storage/v1/object/public/${encodeURIComponent(cfg.bucket)}/${storagePath}`;
    return { mediaUrl, storagePath };
  }

  async function deleteBlobFromCloudStorage(storagePath) {
    if (!storagePath) return;
    const cfg = getCloudConfig();
    await fetch(
      `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${storagePath}`,
      {
        method: 'DELETE',
        headers: buildCloudHeaders(),
      }
    ).catch(() => {});
  }

  async function cloudUploadSingle(record) {
    const cfg = getCloudConfig();
    const prefix = record.type === 'video' ? 'videos' : 'images';
    const { mediaUrl, storagePath } = await uploadBlobToCloudStorage(
      record.blob,
      prefix,
      record.fileName,
      record.mimeType
    );

    const insertRes = await fetch(`${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}`, {
      method: 'POST',
      headers: buildCloudHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        title: record.title,
        category: record.category,
        author: record.author,
        description: record.description,
        type: record.type,
        media_url: mediaUrl,
        storage_path: storagePath,
        delete_token: getDeviceToken(),
      }),
    });

    if (!insertRes.ok) throw new Error(await insertRes.text());
    const inserted = await insertRes.json();
    return inserted && inserted[0] ? inserted[0] : null;
  }

  async function cloudFetchAllMedia() {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?select=*&order=created_at.desc`,
      {
        headers: buildCloudHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Cloud media fetch failed (${res.status})`);
    const rows = await res.json();
    return (rows || []).map((row) => ({
      id: String(row.id),
      type: row.type === 'video' ? 'video' : 'image',
      title: row.title || 'ឯកសារសាស្រ្តាស្លឹករឹត',
      category: row.category || 'សាស្រ្តាបុរាណ',
      description: row.description || '',
      author: row.author || 'អ្នកចូលរួមថែរក្សាមរតក',
      date: row.created_at ? formatKhmerDate(row.created_at) : '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
      src: row.media_url,
      storagePath: row.storage_path || '',
      isUserUpload: true,
      canDelete: Boolean(row.delete_token && row.delete_token === deviceToken),
      isFromCloud: true,
    }));
  }

  async function cloudDeleteSingle(id, storagePath) {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}?id=eq.${encodeURIComponent(id)}&delete_token=eq.${encodeURIComponent(deviceToken)}`,
      {
        method: 'DELETE',
        headers: buildCloudHeaders(),
      }
    );
    if (!res.ok) throw new Error('Cloud delete failed');
    await deleteBlobFromCloudStorage(storagePath);
    return true;
  }

  async function cloudUploadFolder(folderRecord) {
    const cfg = getCloudConfig();
    const folderPrefix = `folders/${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const uploadedItems = [];
    const items = folderRecord.items || [];
    const BATCH_SIZE = 4;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const slice = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        slice.map(async (entry) => {
          const { mediaUrl, storagePath } = await uploadBlobToCloudStorage(
            entry.blob,
            folderPrefix,
            entry.name || 'page.jpg',
            entry.mimeType
          );
          return {
            id: entry.id,
            type: entry.type || 'image',
            name: entry.name || 'ទំព័រ',
            media_url: mediaUrl,
            storage_path: storagePath,
          };
        })
      );
      uploadedItems.push(...batchResults);
    }

    const insertRes = await fetch(`${cfg.url}/rest/v1/${encodeURIComponent(cfg.foldersTable)}`, {
      method: 'POST',
      headers: buildCloudHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        title: folderRecord.title,
        category: folderRecord.category,
        author: folderRecord.author,
        description: folderRecord.description,
        cover_style: folderRecord.coverStyle || 'plank',
        items: uploadedItems,
        delete_token: getDeviceToken(),
      }),
    });

    if (!insertRes.ok) throw new Error(await insertRes.text());
    const inserted = await insertRes.json();
    return inserted && inserted[0] ? inserted[0] : null;
  }

  async function cloudFetchAllFolders() {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.foldersTable)}?select=*&order=created_at.desc`,
      {
        headers: buildCloudHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Cloud folders fetch failed (${res.status})`);
    const rows = await res.json();
    return (rows || []).map((row) => ({
      id: String(row.id),
      title: row.title || 'ថតសាស្រ្តាស្លឹករឹត',
      category: row.category || 'សាស្រ្តាបុរាណ',
      author: row.author || 'អ្នកចូលរួមថែរក្សាមរតក',
      description: row.description || '',
      coverStyle: row.cover_style || 'plank',
      date: row.created_at ? formatKhmerDate(row.created_at) : '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
      isUserUpload: true,
      canDelete: Boolean(row.delete_token && row.delete_token === deviceToken),
      isFromCloud: true,
      items: (Array.isArray(row.items) ? row.items : []).map((it, idx) => ({
        id: it.id || `ci-${idx}`,
        type: it.type === 'video' ? 'video' : 'image',
        name: it.name || `ទំព័រទី ${idx + 1}`,
        src: it.media_url || it.src || '',
        storagePath: it.storage_path || '',
      })),
    }));
  }

  async function cloudAppendToFolder(folderId, existingItems, newEntries) {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const folderPrefix = `folders/${folderId}`;

    const uploadedNew = await Promise.all(
      newEntries.map(async (entry) => {
        const { mediaUrl, storagePath } = await uploadBlobToCloudStorage(
          entry.blob,
          folderPrefix,
          entry.name || 'page.jpg',
          entry.mimeType
        );
        return {
          id: entry.id,
          type: entry.type || 'image',
          name: entry.name || 'ទំព័រ',
          media_url: mediaUrl,
          storage_path: storagePath,
        };
      })
    );

    const combined = [
      ...(existingItems || []).map((it) => ({
        id: it.id,
        type: it.type,
        name: it.name,
        media_url: it.src,
        storagePath: it.storagePath || '',
      })),
      ...uploadedNew,
    ].map((it) => ({
      id: it.id,
      type: it.type,
      name: it.name,
      media_url: it.media_url,
      storage_path: it.storage_path || it.storagePath || '',
    }));

    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.foldersTable)}?id=eq.${encodeURIComponent(folderId)}&delete_token=eq.${encodeURIComponent(deviceToken)}`,
      {
        method: 'PATCH',
        headers: buildCloudHeaders({
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        }),
        body: JSON.stringify({ items: combined }),
      }
    );

    if (!res.ok) throw new Error(await res.text());
    return combined.map((it, idx) => ({
      id: it.id || `ci-${idx}`,
      type: it.type === 'video' ? 'video' : 'image',
      name: it.name,
      src: it.media_url,
      storagePath: it.storage_path || '',
    }));
  }

  async function cloudDeleteFolder(folderId, items) {
    const cfg = getCloudConfig();
    const deviceToken = getDeviceToken();
    const res = await fetch(
      `${cfg.url}/rest/v1/${encodeURIComponent(cfg.foldersTable)}?id=eq.${encodeURIComponent(folderId)}&delete_token=eq.${encodeURIComponent(deviceToken)}`,
      {
        method: 'DELETE',
        headers: buildCloudHeaders(),
      }
    );
    if (!res.ok) throw new Error('Cloud folder delete failed');
    await Promise.all((items || []).map((it) => deleteBlobFromCloudStorage(it.storagePath)));
    return true;
  }

  // --------------------------------------------------------------------------
  // Hydrate Helpers (Optimistic Instant Render)
  // --------------------------------------------------------------------------
  function hydrateMediaItem(item) {
    let src = item.src || '';
    if (item.blob instanceof Blob) {
      src = getOrCreateUrl(item.id, item.blob);
    }
    return {
      ...item,
      src,
      isUserUpload: true,
      canDelete: item.canDelete !== false,
    };
  }

  function hydrateFolder(folder) {
    const hydratedItems = (folder.items || []).map((entry) => {
      let src = entry.src || '';
      if (entry.blob instanceof Blob) {
        src = getOrCreateUrl(`${folder.id}:${entry.id}`, entry.blob);
      }
      return {
        ...entry,
        src,
      };
    });

    return {
      ...folder,
      items: hydratedItems,
      isUserUpload: true,
      canDelete: folder.canDelete !== false,
    };
  }

  // --------------------------------------------------------------------------
  // Public API — Local-First + Resilient Cloud Persistence
  // --------------------------------------------------------------------------
  function stageSingleInstant(record) {
    const hydrated = hydrateMediaItem(record);
    memoryMedia = [record, ...memoryMedia.filter((m) => m.id !== record.id)];
    // រក្សាទុកក្នុង IndexedDB ភ្លាមៗ (Optimistic Write)
    idbPut(STORE_MEDIA, record).catch(console.warn);
    return hydrated;
  }

  async function persistSingleBackground(record) {
    // ១. រក្សាទុកក្នុង IndexedDB ជានិច្ចដើម្បីកុំឲ្យបាត់ពេល Refresh
    await idbPut(STORE_MEDIA, record);

    // ២. ប្រសិនបើមាន Cloud ព្យាយាម Upload
    if (isCloudEnabled()) {
      try {
        const savedRow = await cloudUploadSingle(record);
        memoryMedia = memoryMedia.filter((m) => m.id !== record.id);
        if (savedRow && savedRow.media_url) {
          await idbPut(STORE_MEDIA, {
            ...record,
            syncedToCloud: true,
            cloudId: String(savedRow.id),
            src: savedRow.media_url,
          });
        }
        return savedRow;
      } catch (cloudErr) {
        console.warn('Cloud upload failed (kept in IndexedDB):', cloudErr);
        throw cloudErr;
      }
    }
    return record;
  }

  function stageFolderInstant(folderRecord) {
    const hydrated = hydrateFolder(folderRecord);
    memoryFolders = [folderRecord, ...memoryFolders.filter((f) => f.id !== folderRecord.id)];
    idbPut(STORE_FOLDERS, folderRecord).catch(console.warn);
    return hydrated;
  }

  async function persistFolderBackground(folderRecord) {
    await idbPut(STORE_FOLDERS, folderRecord);

    if (isCloudEnabled()) {
      try {
        const savedRow = await cloudUploadFolder(folderRecord);
        memoryFolders = memoryFolders.filter((f) => f.id !== folderRecord.id);
        if (savedRow) {
          await idbPut(STORE_FOLDERS, {
            ...folderRecord,
            syncedToCloud: true,
            cloudId: String(savedRow.id),
          });
        }
        return savedRow;
      } catch (cloudErr) {
        console.warn('Cloud folder upload failed (kept in IndexedDB):', cloudErr);
        throw cloudErr;
      }
    }
    return folderRecord;
  }

  async function appendFilesToFolder(folderId, newEntries, currentFolderObj) {
    if (isCloudEnabled() && currentFolderObj && currentFolderObj.isFromCloud) {
      try {
        const updatedItems = await cloudAppendToFolder(folderId, currentFolderObj.items, newEntries);
        return {
          ...currentFolderObj,
          items: updatedItems,
        };
      } catch (err) {
        console.warn('Cloud append warning:', err);
      }
    }

    const existingMem = memoryFolders.find((f) => f.id === folderId);
    const dbFolders = existingMem ? null : await idbGetAll(STORE_FOLDERS);
    const target = existingMem || (dbFolders && dbFolders.find((f) => f.id === folderId));
    if (!target) return null;

    const updated = {
      ...target,
      items: [...(target.items || []), ...newEntries],
    };

    const hydrated = stageFolderInstant(updated);
    persistFolderBackground(updated).catch(console.warn);
    return hydrated;
  }

  async function deleteMediaItem(id, storagePath) {
    revokeUrl(id);
    memoryMedia = memoryMedia.filter((m) => m.id !== id);
    await idbDelete(STORE_MEDIA, id);

    if (isCloudEnabled() && storagePath) {
      try {
        await cloudDeleteSingle(id, storagePath);
      } catch (err) {
        console.warn('Cloud single delete warning:', err);
      }
    }
    return true;
  }

  async function deleteFolder(folderId, currentItems) {
    const target = memoryFolders.find((f) => f.id === folderId);
    if (target && target.items) {
      target.items.forEach((it) => revokeUrl(`${folderId}:${it.id}`));
    }
    memoryFolders = memoryFolders.filter((f) => f.id !== folderId);
    await idbDelete(STORE_FOLDERS, folderId);

    if (isCloudEnabled()) {
      try {
        await cloudDeleteFolder(folderId, currentItems);
      } catch (err) {
        console.warn('Cloud folder delete warning:', err);
      }
    }
    return true;
  }

  async function getAllMedia() {
    let cloudItems = [];
    let cloudSuccess = false;

    if (isCloudEnabled()) {
      try {
        cloudItems = await cloudFetchAllMedia();
        cloudSuccess = true;
      } catch (err) {
        console.warn('Cloud fetch fallback (using local storage):', err);
      }
    }

    // ទាញយកឯកសារពី IndexedDB
    const dbRows = await idbGetAll(STORE_MEDIA);
    const localHydrated = dbRows.map(hydrateMediaItem);
    const memHydrated = memoryMedia.map(hydrateMediaItem);

    // បញ្ចូលគ្នាឆ្លាតវៃ (Smart Merge): Local + Cloud
    const mergedMap = new Map();

    // ១. ដាក់ឯកសារក្នុងម៉ាស៊ីន (Local IndexedDB + RAM)
    [...localHydrated, ...memHydrated].forEach((item) => {
      if (item && item.id) mergedMap.set(item.id, item);
    });

    // ២. ប្រសិនបើ Cloud ដំណើរការ ដាក់ឯកសារពី Cloud ពីលើ
    if (cloudSuccess && cloudItems.length > 0) {
      cloudItems.forEach((cloudItem) => {
        mergedMap.set(cloudItem.id, cloudItem);
      });
    }

    const userItems = Array.from(mergedMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    return [...userItems, ...DEFAULT_MEDIA];
  }

  async function getAllFolders() {
    let cloudFolders = [];
    let cloudSuccess = false;

    if (isCloudEnabled()) {
      try {
        cloudFolders = await cloudFetchAllFolders();
        cloudSuccess = true;
      } catch (err) {
        console.warn('Cloud folders fetch fallback (using local storage):', err);
      }
    }

    const dbRows = await idbGetAll(STORE_FOLDERS);
    const localHydrated = dbRows.map(hydrateFolder);
    const memHydrated = memoryFolders.map(hydrateFolder);

    const mergedMap = new Map();

    [...localHydrated, ...memHydrated].forEach((folder) => {
      if (folder && folder.id) mergedMap.set(folder.id, folder);
    });

    if (cloudSuccess && cloudFolders.length > 0) {
      cloudFolders.forEach((cloudFolder) => {
        mergedMap.set(cloudFolder.id, cloudFolder);
      });
    }

    const userFolders = Array.from(mergedMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    return [...userFolders, ...DEFAULT_FOLDERS];
  }

  window.addEventListener('beforeunload', revokeAllUrls);

  app.Storage = {
    isCloudEnabled,
    checkCloudStatus,
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

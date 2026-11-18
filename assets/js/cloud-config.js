/**
 * cloud-config.js — ការកំណត់ភ្ជាប់ Cloud (Supabase) សម្រាប់បង្ហោះលើ GitHub Pages
 *
 * របៀបប្រើ៖
 * ១. បើទុក url និង anonKey ទទេ => វេបសាយដំណើរការដោយរក្សាទុកក្នុង Browser ផ្ទាល់ (IndexedDB)
 * ២. បើបញ្ចូល url និង anonKey ពីគណនី Supabase ឥតគិតថ្លៃ => ឯកសារដែល User បញ្ចូល
 *    នឹងផ្ទុកលើ Cloud ហើយអ្នកចូលមើលទាំងអស់គ្នា (ទាំងកុំព្យូទ័រ និងទូរស័ព្ទ) មើលឃើញរួមគ្នា!
 *
 * សូមមើលការណែនាំលម្អិតក្នុងឯកសារ DEPLOY_GUIDE.md
 */
(function (app) {
  'use strict';

  app.CloudConfig = {
    // ដាក់ Project URL ពី Supabase -> Project Settings -> API (ឧ. "https://xxxxx.supabase.co")
    url: '',

    // ដាក់ anon public key ពី Supabase -> Project Settings -> API
    anonKey: '',

    // ឈ្មោះ Storage Bucket និងតារាង Database (ត្រូវគ្នានឹងឯកសារ supabase-setup.sql)
    bucket: 'sastra-media',
    table: 'media_items',
  };
})((window.SastraApp = window.SastraApp || {}));


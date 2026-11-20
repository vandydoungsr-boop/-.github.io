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
    // Project URL របស់អ្នក (បានបំពេញរួចរាល់!)
    url: 'https://lktvuvgwciwltjixbmxt.supabase.co',

    // Publishable Key (សុវត្ថិភាពសម្រាប់ប្រើលើ Frontend / GitHub Pages)
    anonKey: 'sb_publishable_D8nzigTvcBQzhPuLF4upBg_9bNTU6qi',

    // ឈ្មោះ Storage Bucket និងតារាង Database (ត្រូវគ្នានឹងឯកសារ supabase-setup.sql)
    bucket: 'sastra-media',
    table: 'media_items',
    foldersTable: 'media_folders',
  };
})((window.SastraApp = window.SastraApp || {}));


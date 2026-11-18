# ការណែនាំបង្ហោះវេបសាយលើ GitHub Pages និងភ្ជាប់ Cloud (Supabase)

ឯកសារនេះជួយអ្នកបង្ហោះវេបសាយ **សាស្រ្តាស្លឹករឹត** ឡើងអ៊ីនធឺណិតដោយឥតគិតថ្លៃ ដើម្បីចូលមើលបានទាំង **កុំព្យូទ័រ និងទូរស័ព្ទដៃ** ព្រមទាំងអាចឲ្យ User គ្រប់គ្នាបញ្ចូលរូបភាព និងវីឌីអូមើលឃើញរួមគ្នា។

---

## ផ្នែកទី ១៖ ភ្ជាប់ Supabase Cloud (ប្រើពេល ៣ នាទី • ឥតគិតថ្លៃ)

> **ចំណាំ៖** បើអ្នកមិនទាន់ចង់ភ្ជាប់ Supabase ទេ អាចរំលងទៅ **ផ្នែកទី ២** ភ្លាមៗបាន វេបសាយនៅតែដើរធម្មតា (រក្សាទុកក្នុង Browser ផ្ទាល់)។ បើចង់ឲ្យ User បញ្ចូលរូប/វីឌីអូហើយអ្នកទាំងអស់គ្នាមើលឃើញរួមគ្នា សូមធ្វើតាមជំហានខាងក្រោម៖

1. ចូលទៅ [supabase.com](https://supabase.com) → ចុច **Start your project** → ចូលគណនី (ប្រើ GitHub ឬ Google) → ចុច **New Project** ដាក់ឈ្មោះ (ឧ. `sastra-sleuk-rith`) រួចចុច **Create new project**។
2. ពេល Project បង្កើតរួច ចុចលើ **SQL Editor** នៅម៉ឺនុយខាងឆ្វេង → ចុច **New query**។
3. បើកឯកសារ `supabase-setup.sql` ក្នុងថតនេះ → ចម្លងកូដទាំងអស់ទៅបិទភ្ជាប់ក្នុង SQL Editor → ចុច **Run** (ត្រូវឃើញពាក្យ *Success*)។
4. ចូលទៅ **Project Settings** (រូបស្ពឺខាងក្រោមឆ្វេង) → **API** ហើយចម្លងតម្លៃ ២ នេះ៖
   - **Project URL** (ឧ. `https://abcdefgh.supabase.co`)
   - **anon public** key
5. បើកឯកសារ `assets/js/cloud-config.js` រួចបំពេញតម្លៃទាំង ២ នោះចូល៖
   ```js
   app.CloudConfig = {
     url: 'https://xxxxxxxx.supabase.co',
     anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
     bucket: 'sastra-media',
     table: 'media_items',
   };
   ```
6. រក្សាទុក (Save) ឯកសារ — ជាការស្រេច! ឥឡូវវេបសាយនឹងបង្ហាញសញ្ញា `☁ ភ្ជាប់ Cloud រួចរាល់ — អ្នកទាំងអស់គ្នាមើលឃើញរួមគ្នា`។

---

## ផ្នែកទី ២៖ បង្ហោះវេបសាយលើ GitHub Pages (ឥតគិតថ្លៃ • មិនបាច់ដំឡើង Git)

1. ចូលទៅ [github.com](https://github.com) រួចចុចសញ្ញា **+** នៅជ្រុងខាងស្តាំលើ → **New repository**។
2. ដាក់ឈ្មោះ Repository (ឧ. `sastra-sleuk-rith`) → ជ្រើសរើស **Public** → ចុច **Create repository**។
3. នៅទំព័រ Repository ថ្មី ចុចតំណ **uploading an existing file**។
4. អូសឯកសារ និងថតទាំងអស់ក្នុងថត `codetest` (`index.html`, `assets/`, `.nojekyll`, `README.md`, `DEPLOY_GUIDE.md`) ទម្លាក់ចូលទៅក្នុង GitHub → ចុច **Commit changes**។
5. ចូលទៅ **Settings** → **Pages** (នៅម៉ឺនុយខាងឆ្វេង)។
6. ត្រង់ **Build and deployment → Branch** ជ្រើសរើស `main` និង `/ (root)` → ចុច **Save**។
7. រង់ចាំប្រហែល ១–២ នាទី រួច Refresh ទំព័រ Settings → Pages អ្នកនឹងឃើញ Link វេបសាយរបស់អ្នកដូចជា៖
   `https://<ឈ្មោះគណនីGitHubរបស់អ្នក>.github.io/sastra-sleuk-rith/`

អ្នកអាចផ្ញើ Link នោះបើកមើលបានទាំងលើ **កុំព្យូទ័រ** និង **ទូរស័ព្ទដៃ** គ្រប់ទីកន្លែង!


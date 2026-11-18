# វេបសាយសាស្រ្តាស្លឹករឹត (Sastra Sleuk Rith Archive)

វេបសាយបង្ហាញពីមរតក **សាស្រ្តាស្លឹករឹតខ្មែរ** រៀបចំដោយហេដ្ឋារចនាសម្ព័ន្ធកូដច្បាស់លាស់ ស្អាត និងលឿនរហ័សក្នុង Browser។

## ហេដ្ឋារចនាសម្ព័ន្ធថត និងឯកសារ (Project Structure)

```text
codetest/
├── index.html                    # ទំព័រដើមចម្បង (Main Entry Point)
├── .nojekyll                     # កំណត់ឲ្យ GitHub Pages ផ្ទុកឯកសារលឿនដោយផ្ទាល់
├── supabase-setup.sql            # កូដ SQL សម្រាប់បង្កើត Cloud Database & Storage លើ Supabase
├── DEPLOY_GUIDE.md               # ការណែនាំលម្អិតរបៀបបង្ហោះលើ GitHub Pages + ភ្ជាប់ Supabase
├── README.md                     # ឯកសារពន្យល់រចនាសម្ព័ន្ធ និងរបៀបប្រើប្រាស់
└── assets/
    ├── css/
    │   ├── variables.css         # កំណត់ពណ៌ ពុម្ពអក្សរ និង Host Color Tokens
    │   ├── base.css              # រចនាបថមូលដ្ឋាន Typography និង Performance CSS
    │   ├── layout.css            # រចនាសម្ព័ន្ធ Header, Navbar, Hero, Sections, Footer
    │   ├── components.css        # ប៊ូតុង កាត បណ្ណសារ ប្រអប់ Upload និង Lightbox
    │   ├── folders.css           # រចនាបថថតសាស្រ្តាស្លឹករឹត-ក្រាំង និងផ្ទាំងបើកមើលក្នុងថត
    │   ├── documents.css         # រចនាបថប្រព័ន្ធឯកសារប្រវត្តិ និងផ្ទាំងអាន
    │   └── animations.css        # ចលនា Host Color ពេលចុច Menu និង Scroll Reveal
    ├── data/
    │   └── history-docs.js       # ទិន្នន័យឯកសារប្រវត្តិសាស្រ្តាស្លឹករឹត និងខ្សែពេលវេលា
    ├── js/
    │   ├── theme-toggle.js       # ប៊ូតុងប្តូរម៉ូដថ្ងៃ/យប់ការពារភ្នែក (Day & Night Mode)
    │   ├── cloud-config.js       # ឯកសារដាក់ URL & Key របស់ Supabase Cloud
    │   ├── storage.js            # ប្រព័ន្ធផ្ទុកឯកសារ Hybrid (Supabase Cloud + IndexedDB)
    │   ├── menu-effect.js        # បច្ចេកទេសលោត Host Color មួយដងនៅខាងក្រោយ Menu
    │   ├── scroll-reveal.js      # អូសមកដល់ចាំលោតផុសឡើង + True Lazy Load
    │   ├── doc-library.js        # ប្រព័ន្ធបណ្ណាល័យឯកសារប្រវត្តិ ផ្ទាំងអាន និងបន្ថែម PDF/TXT
    │   ├── media-uploader.js     # មុខងារ User បញ្ចូល មើល ត្រង ស្វែងរក និងលុបឯកសារ
    │   └── main.js               # ឯកសារចាប់ផ្តើមដំណើរការប្រព័ន្ធទាំងមូល
    ├── fonts/                    # ថតផ្ទុកពុម្ពអក្សរសិលាចារឹកសម័យអង្គរ (NokorReach Angkor)
    │   ├── NokorReach-Angkor-1.ttf
    │   └── NokorReach-Angkor-2-Plus.ttf
    ├── images/                   # ថតផ្ទុករូបភាពសាស្រ្តាស្លឹករឹត
    │   ├── hero-manuscript.jpg
    │   ├── crafting-leaves.jpg
    │   ├── temple-archive.jpg
    │   └── palm-detail.jpg
    └── videos/                   # ថតផ្ទុកឯកសារវីឌីអូ
        └── README.txt
```

## មុខងារសំខាន់ៗ

1. **ម៉ូដថ្ងៃ និងម៉ូដយប់ការពារភ្នែក (World-Class Day & Night Mode)**: ប្រើប្រាស់ប្រព័ន្ធពណ៌ត្រជាក់ភ្នែក (*Serene Angkor Jade & Soft Mist* សម្រាប់ម៉ូដថ្ងៃ និង *Deep Slate-Forest* សម្រាប់ម៉ូដយប់) ដើម្បីកាត់បន្ថយពន្លឺចាំងភ្នែក រក្សាទុកជម្រើសស្វ័យប្រវត្តិ និងគាំទ្រការបន្ទន់ពន្លឺរូបភាពពេលយប់។
2. **បញ្ចូលរូបភាព និងវីឌីអូដោយអ្នកប្រើប្រាស់ (User Upload)**: អាចចុចជ្រើសរើស ឬអូសទម្លាក់រូបភាព/វីឌីអូ មើលជាមុន បញ្ចូលចំណងជើង ប្រភេទ និងរក្សាទុកជាប់ក្នុង Browser (IndexedDB មិនបាត់បង់ពេល Refresh)។
3. **ចលនា Host Color មួយដងនៅផ្ទៃខាងក្រោយ Menu**: រាល់ពេលចុចលើម៉ឺនុយនីមួយៗ នឹងលោតពន្លឺពណ៌ Host Color មួយដងនៅផ្ទៃខាងក្រោយយ៉ាងទាក់ទាញ និងរំកិលស៊ុមពណ៌តាមម៉ឺនុយយ៉ាងរលូន។
4. **អូសដល់ចាំលោតផុសឡើង (Scroll Reveal + Lazy Load)**: ផ្នែកខាងក្រោម និងកាតបណ្ណសារមិនបង្ហាញ ឬផ្ទុកទិន្នន័យមុនពេលចាំបាច់ទេ រងចាំ User អូសមកដល់ទើបលោតផុសឡើង ធ្វើឲ្យស្រាលក្នុង Browser និងលឿនខ្លាំង។

## របៀបបើកប្រើប្រាស់

គ្រាន់តែចុចបើកឯកសារ `index.html` ដោយផ្ទាល់ក្នុង Browser (Chrome, Edge, Firefox, Safari) ជាការស្រេច — មិនចាំបាច់ដំឡើងកម្មវិធីបន្ថែមទេ។


-- ============================================================================
-- supabase-setup.sql — កូដបង្កើត Database និង Storage លើ Supabase (ឥតគិតថ្លៃ)
-- របៀបប្រើ៖ ចម្លងកូដទាំងអស់នេះទៅដាក់ក្នុង Supabase -> SQL Editor -> ចុច Run
-- ============================================================================

-- ១. បង្កើតតារាងផ្ទុកព័ត៌មានរូបភាព និងវីឌីអូសាស្រ្តាស្លឹករឹត
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'សាស្រ្តាបុរាណ',
  author text not null default 'អ្នកចូលរួមថែរក្សាមរតក',
  description text default '',
  type text not null check (type in ('image', 'video')),
  media_url text not null,
  storage_path text not null,
  delete_token text not null,
  created_at timestamptz not null default now()
);

-- បើក Row Level Security (RLS)
alter table public.media_items enable row level security;

-- អនុញ្ញាតឲ្យអ្នកចូលមើលគ្រប់គ្នាអាចអាន បញ្ចូល និងលុបឯកសារបាន
drop policy if exists "Public can read media_items" on public.media_items;
create policy "Public can read media_items"
  on public.media_items for select
  using (true);

drop policy if exists "Public can insert media_items" on public.media_items;
create policy "Public can insert media_items"
  on public.media_items for insert
  with check (true);

drop policy if exists "Public can delete media_items" on public.media_items;
create policy "Public can delete media_items"
  on public.media_items for delete
  using (true);

-- ២. បង្កើត Storage Bucket ឈ្មោះ sastra-media (ជា Public សម្រាប់បង្ហាញរូបភាព/វីឌីអូ)
insert into storage.buckets (id, name, public)
values ('sastra-media', 'sastra-media', true)
on conflict (id) do update set public = true;

-- កំណត់សិទ្ធិ Storage Bucket ឲ្យ User បង្ហោះ និងមើលរូបភាព/វីឌីអូបាន
drop policy if exists "Public read sastra-media" on storage.objects;
create policy "Public read sastra-media"
  on storage.objects for select
  using (bucket_id = 'sastra-media');

drop policy if exists "Public upload sastra-media" on storage.objects;
create policy "Public upload sastra-media"
  on storage.objects for insert
  with check (bucket_id = 'sastra-media');

drop policy if exists "Public delete sastra-media" on storage.objects;
create policy "Public delete sastra-media"
  on storage.objects for delete
  using (bucket_id = 'sastra-media');


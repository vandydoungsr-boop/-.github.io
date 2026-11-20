-- ============================================================================
-- supabase-setup.sql — កូដបង្កើត Cloud Database & Storage លើ Supabase (ឥតគិតថ្លៃ)
-- របៀបប្រើ៖ ចម្លងកូដទាំងអស់នេះទៅដាក់ក្នុង Supabase -> SQL Editor -> ចុច Run
-- គាំទ្រទាំងឯកសារទោល (media_items) និងថតសាស្រ្តាស្លឹករឹត (media_folders)
-- ============================================================================

-- ១. តារាងផ្ទុករូបភាព និងវីឌីអូទោល (Single Files)
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

alter table public.media_items enable row level security;

drop policy if exists "Public can read media_items" on public.media_items;
create policy "Public can read media_items"
  on public.media_items for select
  to public
  using (true);

drop policy if exists "Public can insert media_items" on public.media_items;
create policy "Public can insert media_items"
  on public.media_items for insert
  to public
  with check (true);

drop policy if exists "Public can delete media_items" on public.media_items;
create policy "Public can delete media_items"
  on public.media_items for delete
  to public
  using (true);

-- ២. តារាងផ្ទុកថតសាស្រ្តាស្លឹករឹត / កម្រងរូបភាព (Folders / Albums)
create table if not exists public.media_folders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'សាស្រ្តាបុរាណ',
  author text not null default 'អ្នកចូលរួមថែរក្សាមរតក',
  description text default '',
  cover_style text not null default 'plank',
  items jsonb not null default '[]'::jsonb,
  delete_token text not null,
  created_at timestamptz not null default now()
);

alter table public.media_folders enable row level security;

drop policy if exists "Public can read media_folders" on public.media_folders;
create policy "Public can read media_folders"
  on public.media_folders for select
  to public
  using (true);

drop policy if exists "Public can insert media_folders" on public.media_folders;
create policy "Public can insert media_folders"
  on public.media_folders for insert
  to public
  with check (true);

drop policy if exists "Public can update media_folders" on public.media_folders;
create policy "Public can update media_folders"
  on public.media_folders for update
  to public
  using (true)
  with check (true);

drop policy if exists "Public can delete media_folders" on public.media_folders;
create policy "Public can delete media_folders"
  on public.media_folders for delete
  to public
  using (true);

-- ៣. បង្កើត Storage Bucket ឈ្មោះ sastra-media (ជា Public សម្រាប់ឲ្យគ្រប់គ្នាមើលឃើញ)
insert into storage.buckets (id, name, public)
values ('sastra-media', 'sastra-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read sastra-media" on storage.objects;
create policy "Public read sastra-media"
  on storage.objects for select
  to public
  using (bucket_id = 'sastra-media');

drop policy if exists "Public upload sastra-media" on storage.objects;
create policy "Public upload sastra-media"
  on storage.objects for insert
  to public
  with check (bucket_id = 'sastra-media');

drop policy if exists "Public update sastra-media" on storage.objects;
create policy "Public update sastra-media"
  on storage.objects for update
  to public
  using (bucket_id = 'sastra-media');

drop policy if exists "Public delete sastra-media" on storage.objects;
create policy "Public delete sastra-media"
  on storage.objects for delete
  to public
  using (bucket_id = 'sastra-media');

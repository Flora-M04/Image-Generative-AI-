-- =====================================================
--  PixelMind AI — Supabase Database Setup
--  Run this ONCE in Supabase Dashboard → SQL Editor
--  Safe to re-run: drops existing policies first
-- =====================================================

-- ── 1. profiles table ─────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- ── 2. Auto-create profile row on new signup ──────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 3. images table ───────────────────────────────────
create table if not exists public.images (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  prompt      text not null,
  image_url   text not null,
  model       text not null default 'flux-schnell',
  created_at  timestamptz not null default now()
);

create index if not exists images_user_id_idx on public.images(user_id);

alter table public.images enable row level security;

drop policy if exists "images: select own" on public.images;
create policy "images: select own"
  on public.images for select
  using (auth.uid() = user_id);

drop policy if exists "images: insert own" on public.images;
create policy "images: insert own"
  on public.images for insert
  with check (auth.uid() = user_id);

drop policy if exists "images: delete own" on public.images;
create policy "images: delete own"
  on public.images for delete
  using (auth.uid() = user_id);

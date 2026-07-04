create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  password_version integer default 1,
  session_version integer default 1,
  password_changed_at timestamptz,
  two_factor_enabled boolean default false,
  two_factor_secret text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.admin_users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  category text not null,
  price numeric not null,
  images text[] not null default '{}',
  stock integer not null default 0,
  is_customizable boolean default false,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  user_id uuid,
  email text,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

-- Auxiliary table required to keep the existing TOTP recovery-code feature.
create table if not exists public.two_factor_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.admin_users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists password_reset_tokens_token_hash_idx
  on public.password_reset_tokens(token_hash);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens(user_id);

create index if not exists products_category_idx
  on public.products(category);

create index if not exists products_featured_idx
  on public.products(is_featured);

create index if not exists security_events_type_created_at_idx
  on public.security_events(type, created_at desc);

create index if not exists two_factor_recovery_codes_user_id_idx
  on public.two_factor_recovery_codes(user_id);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.products enable row level security;
alter table public.security_events enable row level security;
alter table public.two_factor_recovery_codes enable row level security;

-- This app accesses these tables through the server-side Supabase service role.
-- No anon policies are created for admin/auth data.

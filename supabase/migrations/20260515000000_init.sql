-- ============================================================
-- Akaito — schema inicial
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- Tabelas
-- ============================================================

-- Casal (linha única, configura uma vez)
create table couple (
  id uuid primary key default gen_random_uuid(),
  started_at date not null,
  created_at timestamptz default now()
);

-- Perfis (1:1 com auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_url text,
  birthday date,
  expo_push_token text,
  created_at timestamptz default now()
);

-- Memórias
create table memories (
  id uuid primary key default gen_random_uuid(),
  memory_date date not null,
  caption text,
  location_name text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  storage_path text not null,
  position int default 0
);

-- Countdowns
create table countdowns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_date date not null,
  emoji text,
  notify_days_before int[] default '{7,3,1,0}',
  created_at timestamptz default now()
);

-- Perguntas diárias
create table daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  category text
);

create table daily_assignments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references daily_questions(id),
  assigned_date date not null unique
);

create table daily_answers (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references daily_assignments(id) on delete cascade,
  user_id uuid references profiles(id),
  answer text not null,
  created_at timestamptz default now(),
  unique(assignment_id, user_id)
);

-- Streak (linha única)
create table streak (
  id uuid primary key default gen_random_uuid(),
  current_count int default 0,
  longest_count int default 0,
  last_complete_date date
);

-- Lugares (restaurantes, eventos, shows)
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'restaurant',
  category text,
  address text,
  latitude numeric,
  longitude numeric,
  visited_at date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table place_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  user_id uuid references profiles(id),
  rating_quality int check (rating_quality between 0 and 5),
  rating_ambience int check (rating_ambience between 0 and 5),
  rating_value int check (rating_value between 0 and 5),
  comment text,
  would_return boolean,
  created_at timestamptz default now(),
  unique(place_id, user_id)
);

-- Mídia (filmes, séries, animes, podcasts, livros)
create table media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  status text not null default 'want',
  cover_url text,
  external_id text,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table media_reviews (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references media(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating between 0 and 5),
  comment text,
  finished_at date,
  created_at timestamptz default now(),
  unique(media_id, user_id)
);

-- ============================================================
-- Trigger: cria profile automaticamente quando auth.users nasce
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- RLS — autenticado lê/escreve tudo (só 2 usuários no app)
-- ============================================================
alter table couple enable row level security;
alter table profiles enable row level security;
alter table memories enable row level security;
alter table memory_photos enable row level security;
alter table countdowns enable row level security;
alter table daily_questions enable row level security;
alter table daily_assignments enable row level security;
alter table daily_answers enable row level security;
alter table streak enable row level security;
alter table places enable row level security;
alter table place_reviews enable row level security;
alter table media enable row level security;
alter table media_reviews enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'couple','profiles','memories','memory_photos','countdowns',
    'daily_questions','daily_assignments','daily_answers','streak',
    'places','place_reviews','media','media_reviews'
  ])
  loop
    execute format(
      'create policy "auth_all" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end$$;

-- ============================================================
-- Seeds mínimos
-- ============================================================
insert into couple (started_at) values ('2025-01-17');
insert into streak (current_count, longest_count) values (0, 0);

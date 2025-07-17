-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

-- Brands table
create table public.brands (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Queries table
create table public.queries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  prompt text not null,
  schedule text default 'manual' check (schedule in ('manual', 'weekly')),
  created_at timestamptz default now()
);

-- Runs table
create table public.runs (
  id uuid primary key default uuid_generate_v4(),
  query_id uuid references public.queries(id) on delete cascade,
  model text not null check (model in ('chatgpt', 'perplexity', 'you')),
  raw_response text,
  created_at timestamptz default now()
);

-- Mentions table
create table public.mentions (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid references public.runs(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  rank integer not null,
  created_at timestamptz default now(),
  unique(run_id, brand_id)
);

-- Indexes for performance
create index idx_brands_user_id on public.brands(user_id);
create index idx_queries_user_id on public.queries(user_id);
create index idx_runs_query_id on public.runs(query_id);
create index idx_mentions_run_id on public.mentions(run_id);
create index idx_mentions_brand_id on public.mentions(brand_id);

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.brands enable row level security;
alter table public.queries enable row level security;
alter table public.runs enable row level security;
alter table public.mentions enable row level security;

-- RLS Policies
-- Users can only see their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Brands policies
create policy "Users can view own brands" on public.brands
  for select using (auth.uid() = user_id);

create policy "Users can insert own brands" on public.brands
  for insert with check (auth.uid() = user_id);

create policy "Users can update own brands" on public.brands
  for update using (auth.uid() = user_id);

create policy "Users can delete own brands" on public.brands
  for delete using (auth.uid() = user_id);

-- Queries policies
create policy "Users can view own queries" on public.queries
  for select using (auth.uid() = user_id);

create policy "Users can insert own queries" on public.queries
  for insert with check (auth.uid() = user_id);

create policy "Users can update own queries" on public.queries
  for update using (auth.uid() = user_id);

create policy "Users can delete own queries" on public.queries
  for delete using (auth.uid() = user_id);

-- Runs policies (users can view runs for their queries)
create policy "Users can view runs for own queries" on public.runs
  for select using (
    exists (
      select 1 from public.queries
      where queries.id = runs.query_id
      and queries.user_id = auth.uid()
    )
  );

-- Mentions policies (users can view mentions for their runs)
create policy "Users can view mentions for own runs" on public.mentions
  for select using (
    exists (
      select 1 from public.runs
      join public.queries on queries.id = runs.query_id
      where runs.id = mentions.run_id
      and queries.user_id = auth.uid()
    )
  );

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user(); 
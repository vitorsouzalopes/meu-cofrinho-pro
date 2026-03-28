-- Ensure investments table exists on remote database
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text not null,
  investment_type text not null,
  amount numeric not null default 0,
  current_amount numeric,
  start_date date not null,
  created_at timestamp with time zone default now()
);

alter table if exists public.investments enable row level security;

create policy if not exists "Users can manage their investments" on public.investments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

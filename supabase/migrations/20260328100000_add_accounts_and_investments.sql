-- Add accounts and investments tables for financial planning

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text not null,
  account_type text not null,
  amount numeric not null default 0,
  start_date date not null,
  created_at timestamp with time zone default now()
);

create table if not exists investments (
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

alter table accounts enable row level security;
create policy "Users can manage their accounts" on accounts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table investments enable row level security;
create policy "Users can manage their investments" on investments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

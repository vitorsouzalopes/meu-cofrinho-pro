-- Create privacy_requests table for tracking LGPD data rights requests
create table if not exists public.privacy_requests (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    request_type text not null, -- 'access', 'correction', 'portability', 'deletion'
    status text default 'pending' not null, -- 'pending', 'processing', 'completed', 'rejected'
    details text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.privacy_requests enable row level security;

-- Policies
create policy "Users can view their own privacy requests"
    on public.privacy_requests for select
    using (auth.uid() = user_id);

create policy "Users can insert their own privacy requests"
    on public.privacy_requests for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own pending privacy requests"
    on public.privacy_requests for update
    using (auth.uid() = user_id and status = 'pending');

-- Trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_privacy_requests_updated_at
    before update on public.privacy_requests
    for each row
    execute function public.handle_updated_at();

-- Create analytics table for event statistics
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  total_children integer default 0,
  love_count integer default 0,
  joy_count integer default 0,
  hope_count integer default 0,
  peace_count integer default 0,
  redeemed_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on analytics table
alter table public.analytics enable row level security;

-- Create policies for analytics table
create policy "Anyone can view analytics"
  on public.analytics for select
  using (true);

create policy "Anyone can insert analytics"
  on public.analytics for insert
  with check (true);

create policy "Anyone can update analytics"
  on public.analytics for update
  using (true);

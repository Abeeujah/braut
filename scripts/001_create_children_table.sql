-- Create children table for storing kid biodata
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null,
  class text not null,
  gender text not null check (gender in ('Male', 'Female')),
  photo_url text,
  house text check (house in ('Love', 'Joy', 'Hope', 'Peace')),
  ticket_id text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on children table
alter table public.children enable row level security;

-- Create policies for children table
create policy "Anyone can view all children"
  on public.children for select
  using (true);

create policy "Anyone can insert children"
  on public.children for insert
  with check (true);

create policy "Anyone can update children"
  on public.children for update
  using (true);

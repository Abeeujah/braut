-- Create tickets table for ticket redemption tracking
create table if not exists public.tickets (
  id text primary key,
  child_id uuid not null references public.children(id) on delete cascade,
  ticket_number text unique not null,
  status text default 'active' check (status in ('active', 'redeemed', 'void')),
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on tickets table
alter table public.tickets enable row level security;

-- Create policies for tickets table
create policy "Anyone can view tickets"
  on public.tickets for select
  using (true);

create policy "Anyone can insert tickets"
  on public.tickets for insert
  with check (true);

create policy "Anyone can update tickets"
  on public.tickets for update
  using (true);

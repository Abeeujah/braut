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

-- Create ticket templates table for custom ticket designs
create table if not exists public.ticket_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  template_html text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on ticket_templates table
alter table public.ticket_templates enable row level security;

-- Create policies for children table
create policy "children_select_policy" on public.children for select using (true);
create policy "children_insert_policy" on public.children for insert with check (true);
create policy "children_update_policy" on public.children for update using (true) with check (true);

-- Create policies for tickets table
create policy "tickets_select_policy" on public.tickets for select using (true);
create policy "tickets_insert_policy" on public.tickets for insert with check (true);
create policy "tickets_update_policy" on public.tickets for update using (true) with check (true);

-- Create policies for analytics table
create policy "analytics_select_policy" on public.analytics for select using (true);
create policy "analytics_insert_policy" on public.analytics for insert with check (true);
create policy "analytics_update_policy" on public.analytics for update using (true) with check (true);

-- Create policies for ticket_templates table
create policy "templates_select_policy" on public.ticket_templates for select using (true);
create policy "templates_insert_policy" on public.ticket_templates for insert with check (true);
create policy "templates_update_policy" on public.ticket_templates for update using (true) with check (true);

-- Grant public permissions
grant select, insert, update on public.children to authenticated, anon;
grant select, insert, update on public.tickets to authenticated, anon;
grant select, insert, update on public.analytics to authenticated, anon;
grant select, insert, update on public.ticket_templates to authenticated, anon;

-- Create a sequence for each house
CREATE OR REPLACE FUNCTION get_next_child_number(house_name text)
RETURNS integer AS $$
DECLARE
  next_number integer;
BEGIN
  INSERT INTO house_sequences (house_name, last_number)
  VALUES (house_name, 1)
  ON CONFLICT (house_name)
  DO UPDATE SET last_number = house_sequences.last_number + 1
  RETURNING last_number INTO next_number;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

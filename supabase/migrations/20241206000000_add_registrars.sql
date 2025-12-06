-- Create registrars table to track who registers children
-- Uses Supabase Auth - registrars are users in auth.users
create table if not exists public.registrars (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on registrars table
alter table public.registrars enable row level security;

-- Add registered_by column to children table (nullable for backward compatibility)
alter table public.children 
add column if not exists registered_by uuid references public.registrars(id) on delete set null;

-- Create policies for registrars table
create policy "registrars_select_policy" on public.registrars 
  for select using (true);

create policy "registrars_insert_policy" on public.registrars 
  for insert with check (auth.uid() = id);

create policy "registrars_update_policy" on public.registrars 
  for update using (auth.uid() = id);

-- Update children insert policy to require authentication for new records
-- Keep existing records accessible
drop policy if exists "children_insert_policy" on public.children;
create policy "children_insert_policy" on public.children 
  for insert with check (auth.uid() is not null);

-- Grant permissions
grant select on public.registrars to authenticated, anon;
grant insert, update on public.registrars to authenticated;

-- Create index for faster lookups
create index if not exists idx_children_registered_by on public.children(registered_by);

-- Function to auto-populate registrar on signup
create or replace function public.handle_new_registrar()
returns trigger as $$
begin
  insert into public.registrars (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create registrar profile on auth signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_registrar();

-- Add guardian phone number column to children table
alter table public.children 
add column if not exists guardian_phone text;

-- Create index for phone lookups
create index if not exists idx_children_guardian_phone on public.children(guardian_phone);

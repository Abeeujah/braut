-- Drop existing policies if they exist and recreate them with proper grants
drop policy if exists "Anyone can view all children" on public.children;
drop policy if exists "Anyone can insert children" on public.children;
drop policy if exists "Anyone can update children" on public.children;
drop policy if exists "children_select_policy" on public.children;
drop policy if exists "children_insert_policy" on public.children;
drop policy if exists "children_update_policy" on public.children;

-- Recreate children policies with explicit permissions
create policy "children_select_policy"
  on public.children for select
  using (true);

create policy "children_insert_policy"
  on public.children for insert
  with check (true);

create policy "children_update_policy"
  on public.children for update
  using (true)
  with check (true);

-- Drop and recreate tickets policies
drop policy if exists "Anyone can view tickets" on public.tickets;
drop policy if exists "Anyone can insert tickets" on public.tickets;
drop policy if exists "Anyone can update tickets" on public.tickets;
drop policy if exists "tickets_select_policy" on public.tickets;
drop policy if exists "tickets_insert_policy" on public.tickets;
drop policy if exists "tickets_update_policy" on public.tickets;

create policy "tickets_select_policy"
  on public.tickets for select
  using (true);

create policy "tickets_insert_policy"
  on public.tickets for insert
  with check (true);

create policy "tickets_update_policy"
  on public.tickets for update
  using (true)
  with check (true);

-- Grant public permissions
grant select, insert, update on public.children to authenticated, anon;
grant select, insert, update on public.tickets to authenticated, anon;

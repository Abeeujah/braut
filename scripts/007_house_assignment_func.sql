-- Function to assign a child to a house based on balancing logic
create or replace function public.get_balanced_house(
  p_child_age integer,
  p_child_gender text
) returns text as $$
declare
  -- Define house names
  house_names text[] := array['Love', 'Joy', 'Hope', 'Peace'];
  house_stats record;
  candidate_houses text[];
  min_age_group_count bigint;
  min_total_count bigint;
  min_gender_count bigint;
  child_age_group text;
  final_house text;
begin
  -- 1. Determine Age Group
  if p_child_age <= 5 then
    child_age_group := 'YOUNG';
  elsif p_child_age <= 10 then
    child_age_group := 'ELEMENTARY';
  elsif p_child_age <= 14 then
    child_age_group := 'MIDDLE';
  else
    child_age_group := 'TEEN';
  end if;

  -- 2. Gather Stats (Age Group Count, Total Count, Gender Count per House)
  -- We'll use a temporary table or CTE-like logic. 
  -- Since we need to filter iteratively, let's select everything into a temporary structure or just query directly.
  
  -- Let's build a stats table for all houses
  create temp table temp_house_stats as
  select
    h.house_name,
    (
      select count(*) 
      from public.children c 
      where c.house = h.house_name 
      and (
        case 
          when c.age <= 5 then 'YOUNG'
          when c.age <= 10 then 'ELEMENTARY'
          when c.age <= 14 then 'MIDDLE'
          else 'TEEN'
        end
      ) = child_age_group
    ) as age_group_count,
    (
      select count(*) 
      from public.children c 
      where c.house = h.house_name
    ) as total_count,
    (
      select count(*) 
      from public.children c 
      where c.house = h.house_name 
      and c.gender = p_child_gender
    ) as gender_count
  from unnest(house_names) as h(house_name);

  -- 3. Priority 1: Age Group Balance
  -- Find min age group count
  select min(age_group_count) into min_age_group_count from temp_house_stats;
  
  -- Filter candidates
  select array_agg(house_name) into candidate_houses 
  from temp_house_stats 
  where age_group_count = min_age_group_count;

  -- If only one candidate, we are done
  if array_length(candidate_houses, 1) = 1 then
    final_house := candidate_houses[1];
    drop table temp_house_stats;
    return final_house;
  end if;

  -- 4. Priority 2: Total House Size
  -- Find min total count among candidates
  select min(total_count) into min_total_count 
  from temp_house_stats 
  where house_name = any(candidate_houses);

  -- Filter candidates
  select array_agg(house_name) into candidate_houses 
  from temp_house_stats 
  where house_name = any(candidate_houses) 
  and total_count = min_total_count;

  -- If only one candidate, we are done
  if array_length(candidate_houses, 1) = 1 then
    final_house := candidate_houses[1];
    drop table temp_house_stats;
    return final_house;
  end if;

  -- 5. Priority 3: Gender Balance
  -- Find min gender count among candidates
  select min(gender_count) into min_gender_count 
  from temp_house_stats 
  where house_name = any(candidate_houses);

  -- Filter candidates
  select array_agg(house_name) into candidate_houses 
  from temp_house_stats 
  where house_name = any(candidate_houses) 
  and gender_count = min_gender_count;

  -- 6. Tie-breaker
  final_house := candidate_houses[1];
  
  drop table temp_house_stats;
  return final_house;
end;
$$ language plpgsql security definer;

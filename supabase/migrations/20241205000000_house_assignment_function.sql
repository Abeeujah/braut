-- Function to determine age group (Nigerian education system)
CREATE OR REPLACE FUNCTION get_age_group(age integer)
RETURNS text AS $$
BEGIN
  IF age <= 5 THEN RETURN 'PRESCHOOL';           -- Preschool/Nursery 1-3
  ELSIF age <= 11 THEN RETURN 'PRIMARY';         -- Primary 1-6
  ELSIF age <= 14 THEN RETURN 'JSS';             -- Junior Secondary 1-3
  ELSIF age <= 17 THEN RETURN 'SSS';             -- Senior Secondary 1-3
  ELSE RETURN 'UNDERGRADUATE';                    -- Undergraduate
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to assign a house based on balanced distribution
-- Priority: 1. Age Group Balance, 2. Total House Size, 3. Gender Balance
CREATE OR REPLACE FUNCTION assign_house(child_age integer, child_gender text)
RETURNS text AS $$
DECLARE
  houses text[] := ARRAY['Love', 'Joy', 'Hope', 'Peace'];
  child_age_group text;
  best_house text;
BEGIN
  child_age_group := get_age_group(child_age);

  -- Single query using cascading priority with ORDER BY
  SELECT house INTO best_house
  FROM (
    SELECT 
      h.house,
      COALESCE(stats.age_group_count, 0) AS age_group_count,
      COALESCE(stats.total_count, 0) AS total_count,
      COALESCE(stats.gender_count, 0) AS gender_count
    FROM unnest(houses) AS h(house)
    LEFT JOIN (
      SELECT 
        c.house,
        COUNT(*) FILTER (WHERE get_age_group(c.age) = child_age_group) AS age_group_count,
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE c.gender = child_gender) AS gender_count
      FROM children c
      WHERE c.house IS NOT NULL
      GROUP BY c.house
    ) stats ON h.house = stats.house
  ) ranked
  ORDER BY 
    age_group_count ASC,  -- Priority 1: Fewest children in same age group
    total_count ASC,       -- Priority 2: Smallest house
    gender_count ASC,      -- Priority 3: Fewest children of same gender
    house ASC              -- Tiebreaker: Alphabetical order for consistency
  LIMIT 1;

  RETURN best_house;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger function to auto-assign house on insert if not provided
CREATE OR REPLACE FUNCTION auto_assign_house()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.house IS NULL THEN
    NEW.house := assign_house(NEW.age, NEW.gender);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on children table
DROP TRIGGER IF EXISTS trigger_auto_assign_house ON children;
CREATE TRIGGER trigger_auto_assign_house
  BEFORE INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_house();

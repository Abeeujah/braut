-- Create the storage bucket for child photos
-- Note: This script uses Supabase admin API via SQL. 
-- The bucket creation will be handled through a POST request to the Supabase Management API

-- For now, we'll document what needs to be done:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named "child-photos"
-- 3. Make it public (allow public access)
-- 4. Set file size limit to 10MB

-- The bucket policy allows public read access and authenticated uploads
-- This is handled in the application layer via the registration form

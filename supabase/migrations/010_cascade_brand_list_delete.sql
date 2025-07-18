-- Migration: Set ON DELETE CASCADE for queries.brand_list_id foreign key

-- Drop the old constraint if it exists
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_brand_list_id_fkey;

-- Add the new constraint with ON DELETE CASCADE
ALTER TABLE queries
  ADD CONSTRAINT queries_brand_list_id_fkey
  FOREIGN KEY (brand_list_id)
  REFERENCES brand_lists(id)
  ON DELETE CASCADE; 
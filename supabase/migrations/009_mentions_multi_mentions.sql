-- 009_mentions_multi_mentions.sql

-- 1. Drop the unique constraint if it exists
ALTER TABLE public.mentions DROP CONSTRAINT IF EXISTS mentions_run_id_brand_id_key;

-- 2. Add a position column to store the offset of each mention in the text
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS position integer;

-- 3. (Optional) Add a context/snippet column for future-proofing (not required for counting)
-- ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS context text; 

-- 4. RLS policy: Allow users to insert mentions for their own runs
DROP POLICY IF EXISTS "Users can insert mentions for own runs" ON public.mentions;

CREATE POLICY "Users can insert mentions for own runs" ON public.mentions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.runs
      JOIN public.queries ON queries.id = runs.query_id
      WHERE runs.id = mentions.run_id
      AND queries.user_id = auth.uid()
    )
  ); 
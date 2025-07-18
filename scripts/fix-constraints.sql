-- Update the model constraint to ensure all models are properly allowed
ALTER TABLE public.runs 
DROP CONSTRAINT IF EXISTS runs_model_check;
 
ALTER TABLE public.runs 
ADD CONSTRAINT runs_model_check 
CHECK (model IN ('chatgpt', 'claude', 'gemini', 'perplexity')); 

-- Ensure the raw_response column can handle large responses
ALTER TABLE public.runs 
ALTER COLUMN raw_response TYPE TEXT;

-- Fix the RLS policies for the runs table
DROP POLICY IF EXISTS "Users can view runs for own queries" ON public.runs;
DROP POLICY IF EXISTS "Users can insert runs for own queries" ON public.runs;

-- Create proper RLS policies for the runs table
CREATE POLICY "Users can view runs for own queries" ON public.runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = runs.query_id
      AND queries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert runs for own queries" ON public.runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = runs.query_id
      AND queries.user_id = auth.uid()
    )
  );

-- Also add update policy for completeness
CREATE POLICY "Users can update runs for own queries" ON public.runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = runs.query_id
      AND queries.user_id = auth.uid()
    )
  ); 
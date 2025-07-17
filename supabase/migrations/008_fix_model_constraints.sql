-- Update the model constraint to ensure all models are properly allowed
ALTER TABLE public.runs 
DROP CONSTRAINT IF EXISTS runs_model_check;
 
ALTER TABLE public.runs 
ADD CONSTRAINT runs_model_check 
CHECK (model IN ('chatgpt', 'claude', 'gemini', 'perplexity')); 

-- Ensure the raw_response column can handle large responses
ALTER TABLE public.runs 
ALTER COLUMN raw_response TYPE TEXT; 
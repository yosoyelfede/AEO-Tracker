-- Update the model constraint to include all available models
ALTER TABLE public.runs 
DROP CONSTRAINT runs_model_check;
 
ALTER TABLE public.runs 
ADD CONSTRAINT runs_model_check 
CHECK (model IN ('chatgpt', 'claude', 'gemini', 'perplexity')); 
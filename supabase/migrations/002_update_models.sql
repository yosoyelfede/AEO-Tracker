-- Update the model constraint to only include chatgpt and perplexity
ALTER TABLE public.runs 
DROP CONSTRAINT runs_model_check;

ALTER TABLE public.runs 
ADD CONSTRAINT runs_model_check 
CHECK (model IN ('chatgpt', 'perplexity')); 
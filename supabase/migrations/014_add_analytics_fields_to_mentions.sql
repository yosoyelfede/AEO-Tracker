-- Migration: Add analytics fields to mentions table
-- This migration adds the missing fields needed for the comprehensive analytics dashboard

-- Add missing columns to mentions table
ALTER TABLE public.mentions 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS position integer,
ADD COLUMN IF NOT EXISTS context text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS query_text text,
ADD COLUMN IF NOT EXISTS brand_list_id uuid REFERENCES public.brand_lists(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sentiment_score decimal(3,2),
ADD COLUMN IF NOT EXISTS evidence_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_citation boolean DEFAULT false;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_mentions_brand ON public.mentions(brand);
CREATE INDEX IF NOT EXISTS idx_mentions_model ON public.mentions(model);
CREATE INDEX IF NOT EXISTS idx_mentions_brand_list_id ON public.mentions(brand_list_id);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment_score ON public.mentions(sentiment_score);

-- Update existing mentions to populate the new fields
-- This will join with related tables to get the missing data
UPDATE public.mentions 
SET 
  brand = b.name,
  model = r.model,
  query_text = q.prompt,
  brand_list_id = q.brand_list_id
FROM public.runs r
JOIN public.queries q ON r.query_id = q.id
JOIN public.brands b ON mentions.brand_id = b.id
WHERE mentions.run_id = r.id;

-- Add a function to automatically populate these fields when new mentions are inserted
CREATE OR REPLACE FUNCTION public.populate_mention_analytics_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate brand name
  SELECT brands.name INTO NEW.brand
  FROM public.brands
  WHERE brands.id = NEW.brand_id;
  
  -- Populate model and query_text
  SELECT runs.model, queries.prompt, queries.brand_list_id
  INTO NEW.model, NEW.query_text, NEW.brand_list_id
  FROM public.runs
  JOIN public.queries ON runs.query_id = queries.id
  WHERE runs.id = NEW.run_id;
  
  -- Set default values for analytics fields
  NEW.sentiment_score = COALESCE(NEW.sentiment_score, 0);
  NEW.evidence_count = COALESCE(NEW.evidence_count, 0);
  NEW.has_citation = COALESCE(NEW.has_citation, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate fields on insert
DROP TRIGGER IF EXISTS trigger_populate_mention_analytics ON public.mentions;
CREATE TRIGGER trigger_populate_mention_analytics
  BEFORE INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_mention_analytics_fields();

-- Create trigger to automatically populate fields on update
DROP TRIGGER IF EXISTS trigger_update_mention_analytics ON public.mentions;
CREATE TRIGGER trigger_update_mention_analytics
  BEFORE UPDATE ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_mention_analytics_fields(); 
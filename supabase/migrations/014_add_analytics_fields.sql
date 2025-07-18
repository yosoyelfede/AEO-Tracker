-- Migration: Add analytics fields to mentions table for comprehensive analytics
-- This migration adds the fields needed for the finalanalytics.md specification

-- Add sentiment_score field for sentiment analysis (-1.0 to +1.0)
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0);

-- Add evidence_count field for answer richness (number of citations, links, data points)
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0 CHECK (evidence_count >= 0);

-- Add has_citation field for citation presence detection
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS has_citation BOOLEAN DEFAULT FALSE;

-- Add context field for storing mention context (if not already present)
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS context TEXT;

-- Add query_text field to store the original query text for easier analytics
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS query_text TEXT;

-- Add brand_list_id field to link mentions to brand lists for easier filtering
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS brand_list_id UUID REFERENCES public.brand_lists(id) ON DELETE CASCADE;

-- Create indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment_score ON public.mentions(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_mentions_evidence_count ON public.mentions(evidence_count);
CREATE INDEX IF NOT EXISTS idx_mentions_has_citation ON public.mentions(has_citation);
CREATE INDEX IF NOT EXISTS idx_mentions_brand_list_id ON public.mentions(brand_list_id);
CREATE INDEX IF NOT EXISTS idx_mentions_query_text ON public.mentions(query_text);

-- Update RLS policies to include brand_list_id
DROP POLICY IF EXISTS "Users can view mentions for own runs" ON public.mentions;
CREATE POLICY "Users can view mentions for own runs" ON public.mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runs
      JOIN public.queries ON queries.id = runs.query_id
      WHERE runs.id = mentions.run_id
      AND queries.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = mentions.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- Add function to calculate sentiment score from text
CREATE OR REPLACE FUNCTION calculate_sentiment_score(text_content TEXT)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  positive_words TEXT[] := ARRAY['excellent', 'amazing', 'best', 'great', 'outstanding', 'fantastic', 'wonderful', 'perfect', 'superb', 'brilliant', 'outstanding', 'top', 'premium', 'quality', 'recommended', 'favorite', 'loved', 'enjoyed', 'satisfied', 'happy'];
  negative_words TEXT[] := ARRAY['terrible', 'awful', 'worst', 'bad', 'poor', 'disappointing', 'horrible', 'mediocre', 'average', 'overrated', 'expensive', 'cheap', 'avoid', 'skip', 'waste', 'disappointed', 'unhappy', 'dissatisfied', 'regret', 'complaint'];
  positive_count INTEGER := 0;
  negative_count INTEGER := 0;
  total_words INTEGER := 0;
  word TEXT;
BEGIN
  -- Count positive and negative words
  FOREACH word IN ARRAY positive_words
  LOOP
    positive_count := positive_count + array_length(regexp_matches(lower(text_content), word, 'g'), 1);
  END LOOP;
  
  FOREACH word IN ARRAY negative_words
  LOOP
    negative_count := negative_count + array_length(regexp_matches(lower(text_content), word, 'g'), 1);
  END LOOP;
  
  -- Calculate total words
  total_words := array_length(regexp_split_to_array(text_content, '\s+'), 1);
  
  -- Calculate sentiment score (-1.0 to +1.0)
  IF total_words = 0 THEN
    RETURN 0.0;
  ELSE
    RETURN LEAST(GREATEST((positive_count - negative_count)::DECIMAL / total_words, -1.0), 1.0);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to count evidence (citations, links, data points)
CREATE OR REPLACE FUNCTION count_evidence(text_content TEXT)
RETURNS INTEGER AS $$
DECLARE
  evidence_count INTEGER := 0;
BEGIN
  -- Count URLs
  evidence_count := evidence_count + array_length(regexp_matches(text_content, 'https?://[^\s]+', 'g'), 1);
  
  -- Count citations (text in quotes or parentheses with source)
  evidence_count := evidence_count + array_length(regexp_matches(text_content, '["''][^"'']*["'']\s*\([^)]+\)', 'g'), 1);
  
  -- Count numbers that might be data points
  evidence_count := evidence_count + array_length(regexp_matches(text_content, '\d+%|\d+\s*(stars?|points?|rating)', 'g'), 1);
  
  -- Count "according to" or "source:" patterns
  evidence_count := evidence_count + array_length(regexp_matches(text_content, 'according to|source:|cited|reference', 'gi'), 1);
  
  RETURN evidence_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to detect citations
CREATE OR REPLACE FUNCTION has_citation(text_content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for various citation patterns
  RETURN (
    text_content ~* 'https?://[^\s]+' OR  -- URLs
    text_content ~* '["''][^"'']*["'']\s*\([^)]+\)' OR  -- Quoted text with source
    text_content ~* 'according to|source:|cited|reference' OR  -- Citation keywords
    text_content ~* '\d{4}.*\b(study|research|report|survey)\b'  -- Year with research terms
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE; 
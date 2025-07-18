-- Migration: Fix analytics tables - create only if they don't exist
-- This migration safely creates analytics tables without conflicts

-- Analytics Summary Table
CREATE TABLE IF NOT EXISTS public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_list_id UUID REFERENCES brand_lists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_queries INTEGER NOT NULL DEFAULT 0,
  total_mentions INTEGER NOT NULL DEFAULT 0,
  avg_rank DECIMAL(5,2),
  share_of_voice DECIMAL(5,2),
  model_coverage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand Analytics Table
CREATE TABLE IF NOT EXISTS public.brand_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_list_id UUID REFERENCES brand_lists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mention_count INTEGER NOT NULL DEFAULT 0,
  avg_rank DECIMAL(5,2),
  best_rank INTEGER,
  worst_rank INTEGER,
  share_of_voice DECIMAL(5,2),
  model_diversity INTEGER DEFAULT 0,
  ranking_stability DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Competitive Analysis Table
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_a_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_b_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_list_id UUID REFERENCES brand_lists(id) ON DELETE CASCADE,
  head_to_head_wins INTEGER DEFAULT 0,
  total_comparisons INTEGER DEFAULT 0,
  avg_rank_difference DECIMAL(5,2),
  win_rate DECIMAL(5,2),
  date_range_start DATE,
  date_range_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Query Effectiveness Table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.query_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  success_rate DECIMAL(5,2),
  mention_efficiency DECIMAL(5,2),
  query_diversity_score DECIMAL(5,2),
  avg_response_length INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Model Performance Table
CREATE TABLE IF NOT EXISTS public.model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  brand_list_id UUID REFERENCES brand_lists(id) ON DELETE CASCADE,
  total_queries INTEGER DEFAULT 0,
  total_mentions INTEGER DEFAULT 0,
  avg_rank DECIMAL(5,2),
  bias_score DECIMAL(5,2),
  consistency_score DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Forecasting Data Table
CREATE TABLE IF NOT EXISTS public.forecasting_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_list_id UUID REFERENCES brand_lists(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_mentions INTEGER,
  predicted_rank DECIMAL(5,2),
  confidence_interval_lower DECIMAL(5,2),
  confidence_interval_upper DECIMAL(5,2),
  model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_summary_brand_list_date ON public.analytics_summary(brand_list_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON public.analytics_summary(date);

CREATE INDEX IF NOT EXISTS idx_brand_analytics_brand_id ON public.brand_analytics(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_analytics_brand_list_date ON public.brand_analytics(brand_list_id, date);
CREATE INDEX IF NOT EXISTS idx_brand_analytics_date ON public.brand_analytics(date);

CREATE INDEX IF NOT EXISTS idx_competitive_analysis_brands ON public.competitive_analysis(brand_a_id, brand_b_id);
CREATE INDEX IF NOT EXISTS idx_competitive_analysis_brand_list ON public.competitive_analysis(brand_list_id);
CREATE INDEX IF NOT EXISTS idx_competitive_analysis_date_range ON public.competitive_analysis(date_range_start, date_range_end);

CREATE INDEX IF NOT EXISTS idx_query_effectiveness_query_id ON public.query_effectiveness(query_id);

CREATE INDEX IF NOT EXISTS idx_model_performance_model_brand_list ON public.model_performance(model_name, brand_list_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON public.model_performance(date);

CREATE INDEX IF NOT EXISTS idx_forecasting_data_brand_date ON public.forecasting_data(brand_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecasting_data_brand_list ON public.forecasting_data(brand_list_id);

-- Enable Row Level Security
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasting_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_summary
DROP POLICY IF EXISTS "Users can view own analytics summary" ON public.analytics_summary;
CREATE POLICY "Users can view own analytics summary" ON public.analytics_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = analytics_summary.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own analytics summary" ON public.analytics_summary;
CREATE POLICY "Users can insert own analytics summary" ON public.analytics_summary
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = analytics_summary.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own analytics summary" ON public.analytics_summary;
CREATE POLICY "Users can update own analytics summary" ON public.analytics_summary
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = analytics_summary.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- RLS Policies for brand_analytics
DROP POLICY IF EXISTS "Users can view own brand analytics" ON public.brand_analytics;
CREATE POLICY "Users can view own brand analytics" ON public.brand_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_analytics.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own brand analytics" ON public.brand_analytics;
CREATE POLICY "Users can insert own brand analytics" ON public.brand_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_analytics.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own brand analytics" ON public.brand_analytics;
CREATE POLICY "Users can update own brand analytics" ON public.brand_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_analytics.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- RLS Policies for competitive_analysis
DROP POLICY IF EXISTS "Users can view own competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can view own competitive analysis" ON public.competitive_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = competitive_analysis.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can insert own competitive analysis" ON public.competitive_analysis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = competitive_analysis.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can update own competitive analysis" ON public.competitive_analysis
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = competitive_analysis.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- RLS Policies for query_effectiveness
DROP POLICY IF EXISTS "Users can view own query effectiveness" ON public.query_effectiveness;
CREATE POLICY "Users can view own query effectiveness" ON public.query_effectiveness
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = query_effectiveness.query_id
      AND queries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own query effectiveness" ON public.query_effectiveness;
CREATE POLICY "Users can insert own query effectiveness" ON public.query_effectiveness
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = query_effectiveness.query_id
      AND queries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own query effectiveness" ON public.query_effectiveness;
CREATE POLICY "Users can update own query effectiveness" ON public.query_effectiveness
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.queries
      WHERE queries.id = query_effectiveness.query_id
      AND queries.user_id = auth.uid()
    )
  );

-- RLS Policies for model_performance
DROP POLICY IF EXISTS "Users can view own model performance" ON public.model_performance;
CREATE POLICY "Users can view own model performance" ON public.model_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = model_performance.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own model performance" ON public.model_performance;
CREATE POLICY "Users can insert own model performance" ON public.model_performance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = model_performance.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own model performance" ON public.model_performance;
CREATE POLICY "Users can update own model performance" ON public.model_performance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = model_performance.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- RLS Policies for forecasting_data
DROP POLICY IF EXISTS "Users can view own forecasting data" ON public.forecasting_data;
CREATE POLICY "Users can view own forecasting data" ON public.forecasting_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = forecasting_data.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own forecasting data" ON public.forecasting_data;
CREATE POLICY "Users can insert own forecasting data" ON public.forecasting_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = forecasting_data.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own forecasting data" ON public.forecasting_data;
CREATE POLICY "Users can update own forecasting data" ON public.forecasting_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = forecasting_data.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_analytics_summary_updated_at ON public.analytics_summary;
CREATE TRIGGER update_analytics_summary_updated_at
    BEFORE UPDATE ON public.analytics_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_analytics_updated_at ON public.brand_analytics;
CREATE TRIGGER update_brand_analytics_updated_at
    BEFORE UPDATE ON public.brand_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitive_analysis_updated_at ON public.competitive_analysis;
CREATE TRIGGER update_competitive_analysis_updated_at
    BEFORE UPDATE ON public.competitive_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_query_effectiveness_updated_at ON public.query_effectiveness;
CREATE TRIGGER update_query_effectiveness_updated_at
    BEFORE UPDATE ON public.query_effectiveness
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_model_performance_updated_at ON public.model_performance;
CREATE TRIGGER update_model_performance_updated_at
    BEFORE UPDATE ON public.model_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
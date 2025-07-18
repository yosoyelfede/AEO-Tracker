-- Brand Lists Migration
-- This adds support for organizing brands into themed lists

-- Brand Lists table - for organizing brands into themes
CREATE TABLE public.brand_lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Brand List Items table - individual brands within each list
CREATE TABLE public.brand_list_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_list_id uuid REFERENCES public.brand_lists(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_list_id, brand_name)
);

-- Add brand_list_id to queries table to track which brand list was used
ALTER TABLE public.queries 
ADD COLUMN brand_list_id uuid REFERENCES public.brand_lists(id);

-- Indexes for performance
CREATE INDEX idx_brand_lists_user_id ON public.brand_lists(user_id);
CREATE INDEX idx_brand_list_items_brand_list_id ON public.brand_list_items(brand_list_id);
CREATE INDEX idx_queries_brand_list_id ON public.queries(brand_list_id);

-- RLS Policies for brand_lists
ALTER TABLE public.brand_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand lists" ON public.brand_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand lists" ON public.brand_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand lists" ON public.brand_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand lists" ON public.brand_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for brand_list_items
ALTER TABLE public.brand_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand list items" ON public.brand_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_list_items.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert brand list items" ON public.brand_list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_list_items.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brand list items" ON public.brand_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_list_items.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete brand list items" ON public.brand_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.brand_lists
      WHERE brand_lists.id = brand_list_items.brand_list_id
      AND brand_lists.user_id = auth.uid()
    )
  ); 
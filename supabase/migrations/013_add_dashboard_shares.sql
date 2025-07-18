-- Create dashboard_shares table
CREATE TABLE IF NOT EXISTS dashboard_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  analytics_data JSONB,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_user_id ON dashboard_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_share_token ON dashboard_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_public ON dashboard_shares(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE dashboard_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own shares
CREATE POLICY "Users can view own dashboard shares" ON dashboard_shares
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own shares
CREATE POLICY "Users can insert own dashboard shares" ON dashboard_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own shares
CREATE POLICY "Users can update own dashboard shares" ON dashboard_shares
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete own dashboard shares" ON dashboard_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view public shares (for shared links)
CREATE POLICY "Public can view public dashboard shares" ON dashboard_shares
  FOR SELECT USING (is_public = true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(share_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE dashboard_shares 
  SET view_count = view_count + 1, updated_at = NOW()
  WHERE id = share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_shares 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to clean up expired shares (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-shares', '0 2 * * *', 'SELECT cleanup_expired_shares();'); 
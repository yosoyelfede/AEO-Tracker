-- User profiles and secure API key storage migration
-- This adds support for user profiles, encrypted API keys, and free query tracking

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- API Keys table with encryption
CREATE TABLE public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'perplexity')),
  encrypted_key text NOT NULL, -- Encrypted using pgcrypto
  key_hint text, -- Last 4 characters of the key for display
  is_valid boolean DEFAULT true,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);

-- Free query usage tracking
CREATE TABLE public.user_query_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  free_queries_used integer DEFAULT 0 CHECK (free_queries_used >= 0),
  last_free_query_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for usage lookups
CREATE INDEX idx_user_query_usage_user_id ON public.user_query_usage(user_id);

-- Audit log for API key access (for security monitoring)
CREATE TABLE public.api_key_access_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'validate', 'use')),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for audit log
CREATE INDEX idx_api_key_access_log_user_id ON public.api_key_access_log(user_id);
CREATE INDEX idx_api_key_access_log_created_at ON public.api_key_access_log(created_at);

-- RLS Policies for user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own API keys
CREATE POLICY "Users can view own API keys" ON public.user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert own API keys" ON public.user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON public.user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON public.user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_query_usage
ALTER TABLE public.user_query_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.user_query_usage
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update usage (through service role)
CREATE POLICY "Users can insert own usage" ON public.user_query_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_query_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for api_key_access_log
ALTER TABLE public.api_key_access_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own access logs
CREATE POLICY "Users can view own access logs" ON public.api_key_access_log
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert logs
-- No user INSERT policy - logs should only be created by the system

-- Function to safely store encrypted API key
CREATE OR REPLACE FUNCTION store_api_key(
  p_user_id uuid,
  p_provider text,
  p_api_key text
)
RETURNS TABLE (success boolean, message text, key_hint text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted_key text;
  v_key_hint text;
  v_encryption_key text;
BEGIN
  -- Validate inputs
  IF p_api_key IS NULL OR length(p_api_key) < 10 THEN
    RETURN QUERY SELECT false, 'Invalid API key format', NULL::text;
    RETURN;
  END IF;

  -- Get encryption key from environment (set in Supabase dashboard)
  v_encryption_key := current_setting('app.encryption_key', true);
  
  IF v_encryption_key IS NULL THEN
    -- Fallback to a default key (should be set properly in production)
    v_encryption_key := 'your-32-byte-encryption-key-here-change-in-production';
  END IF;

  -- Create key hint (last 4 characters)
  v_key_hint := '...' || right(p_api_key, 4);

  -- Encrypt the API key
  v_encrypted_key := encode(
    pgp_sym_encrypt(p_api_key, v_encryption_key),
    'base64'
  );

  -- Upsert the encrypted key
  INSERT INTO user_api_keys (user_id, provider, encrypted_key, key_hint)
  VALUES (p_user_id, p_provider, v_encrypted_key, v_key_hint)
  ON CONFLICT (user_id, provider) 
  DO UPDATE SET 
    encrypted_key = EXCLUDED.encrypted_key,
    key_hint = EXCLUDED.key_hint,
    updated_at = now(),
    is_valid = true;

  -- Log the action
  INSERT INTO api_key_access_log (user_id, provider, action)
  VALUES (p_user_id, p_provider, 'create');

  RETURN QUERY SELECT true, 'API key stored successfully', v_key_hint;
END;
$$;

-- Function to retrieve decrypted API key (for internal use only)
CREATE OR REPLACE FUNCTION get_decrypted_api_key(
  p_user_id uuid,
  p_provider text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted_key text;
  v_decrypted_key text;
  v_encryption_key text;
BEGIN
  -- Only allow if current user matches or is service role
  IF auth.uid() != p_user_id AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized access to API keys';
  END IF;

  -- Get the encrypted key
  SELECT encrypted_key INTO v_encrypted_key
  FROM user_api_keys
  WHERE user_id = p_user_id AND provider = p_provider AND is_valid = true;

  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get encryption key
  v_encryption_key := current_setting('app.encryption_key', true);
  
  IF v_encryption_key IS NULL THEN
    v_encryption_key := 'your-32-byte-encryption-key-here-change-in-production';
  END IF;

  -- Decrypt the key
  v_decrypted_key := pgp_sym_decrypt(
    decode(v_encrypted_key, 'base64'),
    v_encryption_key
  );

  -- Log the access
  INSERT INTO api_key_access_log (user_id, provider, action)
  VALUES (p_user_id, p_provider, 'use');

  RETURN v_decrypted_key;
END;
$$;

-- Function to check if user has free queries remaining
CREATE OR REPLACE FUNCTION check_free_query_available(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_queries_used integer;
  v_free_query_limit integer := 1; -- Configurable limit
BEGIN
  -- Get current usage
  SELECT COALESCE(free_queries_used, 0) INTO v_queries_used
  FROM user_query_usage
  WHERE user_id = p_user_id;

  -- If no record exists, user hasn't used any free queries
  IF v_queries_used IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_queries_used < v_free_query_limit;
END;
$$;

-- Function to increment free query usage
CREATE OR REPLACE FUNCTION increment_free_query_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_query_usage (user_id, free_queries_used, last_free_query_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    free_queries_used = user_query_usage.free_queries_used + 1,
    last_free_query_at = now(),
    updated_at = now();

  RETURN true;
END;
$$;

-- Initialize query usage for existing users
INSERT INTO user_query_usage (user_id, free_queries_used)
SELECT id, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger to auto-initialize query usage for new users
CREATE OR REPLACE FUNCTION initialize_user_query_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_query_usage (user_id, free_queries_used)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created_init_usage
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_query_usage(); 
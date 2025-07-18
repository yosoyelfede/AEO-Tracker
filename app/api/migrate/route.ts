import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const MIGRATION_007_FIX_RLS = `
-- Fix infinite recursion in users table RLS policies
-- The issue is that the admin policy references the users table from within a users table policy

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Update the is_admin function to avoid recursion by using auth.jwt() claims instead
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Use auth.jwt() to check for admin role to avoid table recursion
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
    false
  );
$$;

-- Alternative: Create a more efficient admin check using a different approach
-- We'll create a simple policy that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- This function can be called without causing recursion
  -- because it uses the auth.uid() directly without table joins
  SELECT CASE 
    WHEN user_id = auth.uid() THEN 'self'
    ELSE 'other'
  END;
$$;

-- Recreate admin policy using a safer approach
-- Instead of querying the users table, we'll use auth metadata or a different approach
CREATE POLICY "Admins can view all users via metadata" ON public.users
  FOR SELECT TO authenticated
  USING (
    -- Check if user has admin role in JWT metadata
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
    OR 
    -- Allow users to see their own profile (fallback to original policy)
    auth.uid() = id
  );

-- Update the promote_to_admin function to use the new approach
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if current user is admin (via JWT metadata) or this is service role
  IF NOT (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin', false) OR 
    current_setting('role') = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Ensure the basic user policies are still working correctly
-- These should not cause recursion because they use auth.uid() directly

-- Drop and recreate the basic user policies to ensure they're clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recreate basic user policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Add a policy for delete operations (was missing)
CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);
`;

const MIGRATION_014_ANALYTICS_FIELDS = `
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
`;

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid authorization header'
      }, { status: 401 });
    }

    // Simple security check - in production you'd want better auth
    const token = authHeader.substring(7);
    if (token !== 'migrate-rls-fix-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid migration token'
      }, { status: 403 });
    }

    // Parse request body to determine which migration to run
    const body = await request.json();
    const migrationType = body.migration || '007_fix_rls';

    const supabase = await createClient()
    
    let migrationSQL = '';
    let migrationName = '';

    if (migrationType === '014_add_analytics_fields_to_mentions.sql' || migrationType === '014_analytics_fields') {
      migrationSQL = MIGRATION_014_ANALYTICS_FIELDS;
      migrationName = '014_add_analytics_fields_to_mentions';
    } else {
      migrationSQL = MIGRATION_007_FIX_RLS;
      migrationName = '007_fix_rls';
    }

    // Execute the migration
    console.log(`🔧 Applying ${migrationName} migration...`);
    
    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.error(`❌ ${migrationName} migration failed:`, error);
      return NextResponse.json({
        success: false,
        error: 'Migration failed',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ ${migrationName} migration completed successfully`);
    
    return NextResponse.json({
      success: true,
      message: `${migrationName} migration applied successfully`
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Migration endpoint - use POST with proper authorization',
    required_header: 'Authorization: Bearer migrate-rls-fix-2024',
    available_migrations: [
      '007_fix_rls (default)',
      '014_add_analytics_fields_to_mentions.sql'
    ]
  });
} 
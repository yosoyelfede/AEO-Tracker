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

    const supabase = await createClient()
    
    // Execute the migration
    console.log('🔧 Applying RLS fix migration...');
    
    const { error } = await supabase.rpc('exec', {
      sql: MIGRATION_007_FIX_RLS
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Migration failed',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Migration completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'RLS recursion fix applied successfully'
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
    required_header: 'Authorization: Bearer migrate-rls-fix-2024'
  });
} 
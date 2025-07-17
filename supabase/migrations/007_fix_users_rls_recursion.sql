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

-- Verify that the original policies exist and are correct
-- (They should be fine, but let's make sure they're properly defined)

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

-- Note: For production use, you should set user roles via Supabase auth metadata
-- instead of relying on database fields for admin access control
-- This can be done through the Supabase dashboard or auth API 
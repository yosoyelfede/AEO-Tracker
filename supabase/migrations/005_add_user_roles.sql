-- Add user roles for better admin access control
-- This replaces the environment variable-only approach

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role queries
CREATE INDEX idx_users_role ON public.users(role);

-- Update RLS policies to include role-based access

-- Admin users can view all data (for admin operations)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.role = 'admin'
    )
  );

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Function to safely promote user to admin (requires existing admin or service role)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if current user is admin or this is called with service role
  IF NOT (public.is_admin() OR current_setting('role') = 'service_role') THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$; 
// Admin user configuration
// Admin status is determined by database roles (preferred) or environment variables (fallback)
// No hardcoded admin credentials for security

// Environment variable-based admin check (safe for client components)
export function isAdminEmail(email: string): boolean {
  // Check if user has admin role in database or use environment variable for admin emails
  // For security, admin emails should be stored in environment variables
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

// Client-side admin check (for client components)
export async function isAdminUserClient(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    // Check database role first (preferred method)
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (!error && user?.role === 'admin') {
      return true
    }
    
    // Fallback to environment variable check
    const { data: authUser } = await supabaseClient.auth.getUser()
    if (authUser?.user?.email) {
      return isAdminEmail(authUser.user.email)
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
} 
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runCascadeDeleteMigration() {
  try {
    console.log('Running cascade delete migration...')
    
    // Drop existing foreign key constraint if it exists
    const dropConstraintQuery = `
      ALTER TABLE public.queries 
      DROP CONSTRAINT IF EXISTS queries_brand_list_id_fkey;
    `
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropConstraintQuery })
    
    if (dropError) {
      console.log('Note: No existing constraint to drop (this is normal)')
    } else {
      console.log('Dropped existing foreign key constraint')
    }
    
    // Add new foreign key constraint with CASCADE DELETE
    const addConstraintQuery = `
      ALTER TABLE public.queries 
      ADD CONSTRAINT queries_brand_list_id_fkey 
      FOREIGN KEY (brand_list_id) 
      REFERENCES public.brand_lists(id) 
      ON DELETE CASCADE;
    `
    
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addConstraintQuery })
    
    if (addError) {
      console.error('Error adding cascade delete constraint:', addError)
      return false
    }
    
    console.log('Successfully added cascade delete constraint')
    
    // Clean up any existing orphaned queries
    const cleanupQuery = `
      DELETE FROM public.queries 
      WHERE brand_list_id NOT IN (
        SELECT id FROM public.brand_lists
      );
    `
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupQuery })
    
    if (cleanupError) {
      console.error('Error cleaning up orphaned queries:', cleanupError)
    } else {
      console.log('Cleaned up any orphaned queries')
    }
    
    console.log('Migration completed successfully!')
    return true
    
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
}

// Run the migration
runCascadeDeleteMigration()
  .then(success => {
    if (success) {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    } else {
      console.log('❌ Migration failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }) 
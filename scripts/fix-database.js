// Script to fix database constraints
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDatabaseConstraints() {
  console.log('Starting database fix script...');
  
  // Create Supabase client with admin privileges
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('Attempting to fix model constraints...');
    
    // Execute raw SQL to drop the constraint
    const { error: dropError } = await supabase.rpc('ALTER TABLE public.runs DROP CONSTRAINT IF EXISTS runs_model_check');

    if (dropError) {
      console.error('Error dropping constraint:', dropError);
      return;
    }
    
    // Add the new constraint
    const { error: addError } = await supabase.rpc('ALTER TABLE public.runs ADD CONSTRAINT runs_model_check CHECK (model IN (\'chatgpt\', \'claude\', \'gemini\', \'perplexity\'))');

    if (addError) {
      console.error('Error adding constraint:', addError);
      return;
    }
    
    // Alter the column type
    const { error: alterError } = await supabase.rpc('ALTER TABLE public.runs ALTER COLUMN raw_response TYPE TEXT');

    if (alterError) {
      console.error('Error altering column:', alterError);
      return;
    }

    console.log('Database constraints fixed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
fixDatabaseConstraints(); 
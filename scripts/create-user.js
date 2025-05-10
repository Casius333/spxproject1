import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  try {
    console.log('Creating test user...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: {
          username: 'testuser',
        }
      }
    });
    
    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }
    
    console.log('User created successfully!');
    console.log('User data:', JSON.stringify(data, null, 2));
    
    try {
      // Attempt to auto-confirm user for development
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        data.user?.id || '',
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error('Could not auto-confirm user email:', confirmError.message);
        console.log('User will need to verify via email link');
      } else {
        console.log('User email auto-confirmed successfully');
      }
    } catch (confirmError) {
      console.error('Exception during auto-confirm:', confirmError);
    }
  } catch (error) {
    console.error('Exception creating user:', error);
  }
}

createUser();
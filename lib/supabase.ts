import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase URL or Anon Key not provided. Authentication will not work.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get the Supabase project reference from the URL
export function getSupabaseProjectRef() {
  if (!supabaseUrl) return null;
  
  try {
    // Extract the project reference from the URL
    // Example: https://abcdefghijk.supabase.co -> abcdefghijk
    const url = new URL(supabaseUrl);
    const host = url.hostname;
    const parts = host.split('.');
    
    if (parts.length >= 3) {
      return parts[0];
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse Supabase URL:', error);
    return null;
  }
}

// Function to get the Supabase storage public URL
export function getSupabasePublicUrl() {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) return null;
  
  return `https://${projectRef}.supabase.co/storage/v1/object/public`;
}
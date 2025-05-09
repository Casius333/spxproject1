import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Validate the supabase URL and key
if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase credentials. Auth functionality may not work properly.');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Parse the URL from the DATABASE_URL to extract the project reference
export function getSupabaseProjectRef() {
  try {
    const databaseUrl = config.DATABASE_URL;
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    
    // Extract project reference from hostname (e.g., db.abc123def456.supabase.co)
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[1].length > 10) {
      return parts[1]; // The project reference
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Supabase project reference:', error);
    return null;
  }
}

// This utility helps to get the public URL for a Supabase project
export function getSupabasePublicUrl() {
  const projectRef = getSupabaseProjectRef();
  if (projectRef) {
    return `https://${projectRef}.supabase.co`;
  }
  return null;
}
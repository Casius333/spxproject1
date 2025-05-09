import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase URL or Anon Key not provided. Authentication will not work.');
}

// Get the app URL for redirects
function getAppUrl() {
  // In Replit, return the Replit domain
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  // Fallback to localhost in development
  return 'http://localhost:5000';
}

// Create Supabase client with redirect URLs for auth
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Configure URL to redirect to after authentication events (like email confirmation)
  global: {
    // This is used by Supabase for redirects after email confirmation
    fetch: (url, options) => {
      if (url.toString().includes('/signup') || url.toString().includes('/magiclink')) {
        // For signup and magic link emails, use our app URL as the redirect URL
        const params = new URLSearchParams(url.toString().split('?')[1] || '');
        params.set('redirect_to', `${getAppUrl()}/auth/callback`);
        
        // Reconstruct URL with new redirect_to parameter
        const urlParts = url.toString().split('?');
        const newUrl = urlParts[0] + '?' + params.toString();
        
        return fetch(newUrl, options);
      }
      return fetch(url, options);
    }
  }
});

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
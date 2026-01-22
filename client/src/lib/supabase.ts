import { createClient, SupabaseClient as Client } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

// Create a mock client for when Supabase isn't configured
const createMockClient = () => {
  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ error: new Error('Supabase not configured'), data: { user: null, session: null } }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not configured') }),
  };
  
  return { auth: mockAuth } as unknown as Client;
};

// Only create real client if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockClient();

export type SupabaseClient = typeof supabase;

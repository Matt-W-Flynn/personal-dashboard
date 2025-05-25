import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a browser client for client-side operations
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Create a standard client for server-side operations
export const serverSupabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false
    }
  }
)

console.log('[Supabase] Initialized clients for browser and server contexts.') 
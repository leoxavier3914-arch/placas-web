import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import env from '@/lib/env';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

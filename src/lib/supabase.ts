import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.COZE_SUPABASE_URL;
    const key = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

function getAnonClient(): SupabaseClient {
  if (!anonClient) {
    const url = process.env.COZE_SUPABASE_URL;
    const key = process.env.COZE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    anonClient = createClient(url, key);
  }
  return anonClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAdminClient() as any)[prop];
  },
});

export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAnonClient() as any)[prop];
  },
});

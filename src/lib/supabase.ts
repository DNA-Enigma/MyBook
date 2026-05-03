import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
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

export function getSupabaseAnon(): SupabaseClient {
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

// 兼容旧导出（运行时动态代理，但推荐直接使用 getSupabaseAdmin()）
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAnon();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

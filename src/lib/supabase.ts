import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.COZE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

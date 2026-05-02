import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken || !supabaseUrl) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const client = createClient(supabaseUrl, serviceRoleKey || "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: profile } = await client
      .from("profiles")
      .select("id, email, name, role, avatar_url, bio, skills, contact_email, github_url, website_url, linkedin_url, created_at")
      .eq("id", userData.user.id)
      .maybeSingle();

    const user = profile || {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "用户",
      role: "user",
      avatar_url: null,
      bio: null,
      skills: null,
      contact_email: null,
      github_url: null,
      website_url: null,
      linkedin_url: null,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

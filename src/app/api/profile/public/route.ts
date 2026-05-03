import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, name, email, bio, avatar_url, role, skills, contact_email, github_url, website_url, linkedin_url, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      // fallback: get first profile if no admin found
      const { data: fallback, error: fallbackError } = await getSupabaseAdmin()
        .from("profiles")
        .select("id, name, email, bio, avatar_url, role, skills, contact_email, github_url, website_url, linkedin_url, created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (fallbackError || !fallback) {
        return NextResponse.json({ profile: null });
      }
      return NextResponse.json({ profile: fallback });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("[PUBLIC PROFILE ERROR]", err);
    return NextResponse.json({ profile: null });
  }
}

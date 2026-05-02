import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        name: body.name,
        bio: body.bio,
        avatar_url: body.avatar_url,
        role: body.role,
        skills: body.skills,
        contact_email: body.contact_email,
        github_url: body.github_url,
        website_url: body.website_url,
        linkedin_url: body.linkedin_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "更新失败" },
      { status: 500 }
    );
  }
}

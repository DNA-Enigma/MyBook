import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("works")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ works: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("works")
      .insert({
        title: body.title,
        description: body.description,
        category: body.category || "开发",
        tech_stack: body.tech_stack || [],
        cover_url: body.cover_url,
        project_url: body.project_url,
        is_public: body.is_public ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ work: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}

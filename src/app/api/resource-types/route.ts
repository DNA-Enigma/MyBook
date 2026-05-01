import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("resource_types")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ types: data || [] });
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

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "类型名称不能为空" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("resource_types")
      .insert({ name, description: body.description || null })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ type: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}

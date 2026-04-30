import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("*, profiles(name, avatar_url)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    return NextResponse.json({ note: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("notes")
      .update({
        title: body.title,
        content: body.content,
        category: body.category,
        tags: body.tags,
        is_public: body.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_id", userData.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "无权更新" }, { status: 403 });
    return NextResponse.json({ note: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("author_id", userData.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "删除失败" },
      { status: 500 }
    );
  }
}

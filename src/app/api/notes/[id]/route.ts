import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAGS = 10;
const ALLOWED_CATEGORIES = ["技术", "生活", "设计", "随笔"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // UUID 格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "无效的笔记ID" }, { status: 400 });
    }

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

    // 输入验证
    const title = body.title ? String(body.title).trim() : undefined;
    if (title !== undefined) {
      if (title.length === 0) {
        return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
      }
      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { error: `标题长度不能超过${MAX_TITLE_LENGTH}字` },
          { status: 400 }
        );
      }
    }

    const content = body.content !== undefined ? String(body.content) : undefined;
    if (content !== undefined && content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `内容长度不能超过${MAX_CONTENT_LENGTH}字` },
        { status: 400 }
      );
    }

    let tags: string[] | undefined;
    if (body.tags !== undefined) {
      tags = Array.isArray(body.tags)
        ? body.tags
          .map((t: string) => String(t).trim().substring(0, 30))
          .filter(Boolean)
          .slice(0, MAX_TAGS)
        : [];
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (body.category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: "无效的分类" }, { status: 400 });
      }
      updateData.category = body.category;
    }
    if (tags !== undefined) updateData.tags = tags;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .update(updateData)
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

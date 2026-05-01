import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const ALLOWED_CATEGORIES = ["设计", "开发", "摄影", "写作"];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) return { error: "未登录", status: 401 };
  const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
  if (!userData.user) return { error: "未登录", status: 401 };
  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "权限不足", status: 403 };
  return { user: userData.user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "无效的作品ID" }, { status: 400 });
    }
    const { data, error } = await getSupabaseAdmin()
      .from("works")
      .select("*, profiles(name, avatar_url)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "作品不存在" }, { status: 404 });

    const work = {
      ...data,
      author: data.profiles ? { name: data.profiles.name, avatar_url: data.profiles.avatar_url } : null,
    };
    delete (work as Record<string, unknown>).profiles;

    return NextResponse.json({ work });
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
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "无效的作品ID" }, { status: 400 });
    }

    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

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

    const description = body.description !== undefined ? String(body.description) : undefined;
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `描述长度不能超过${MAX_DESCRIPTION_LENGTH}字` },
        { status: 400 }
      );
    }

    if (body.category !== undefined && !ALLOWED_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "无效的分类" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tech_stack !== undefined) updateData.tech_stack = body.tech_stack;
    if (body.external_link !== undefined) updateData.external_link = body.external_link;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;

    const { data, error } = await getSupabaseAdmin()
      .from("works")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    return NextResponse.json({ work: data });
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
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "无效的作品ID" }, { status: 400 });
    }

    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { error } = await getSupabaseAdmin().from("works").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "删除失败" },
      { status: 500 }
    );
  }
}

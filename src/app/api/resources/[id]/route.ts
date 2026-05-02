import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "无效的资源ID" }, { status: 400 });
    }
    const { data, error } = await getSupabaseAdmin()
      .from("resources")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    return NextResponse.json({ resource: data });
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
      return NextResponse.json({ error: "无效的资源ID" }, { status: 400 });
    }

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
    const isAdmin = profile?.role === "admin";

    const body = await request.json();

    // 非管理员只能更新自己的资源
    if (!isAdmin) {
      const { data: existing } = await getSupabaseAdmin()
        .from("resources")
        .select("author_id")
        .eq("id", id)
        .maybeSingle();
      if (existing?.author_id !== userData.user.id) {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.file_url !== undefined) updateData.file_url = body.file_url;
    if (body.file_key !== undefined) updateData.file_key = body.file_key;
    if (body.file_type !== undefined) updateData.file_type = body.file_type;
    if (body.file_size !== undefined) updateData.file_size = body.file_size;
    if (body.docker_pull_cmd !== undefined) updateData.docker_pull_cmd = body.docker_pull_cmd;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (isAdmin && body.status !== undefined) updateData.status = body.status;

    const { data, error } = await getSupabaseAdmin()
      .from("resources")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ resource: data });
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
      return NextResponse.json({ error: "无效的资源ID" }, { status: 400 });
    }

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
    const isAdmin = profile?.role === "admin";

    // 仅管理员可删除资源
    if (!isAdmin) {
      return NextResponse.json({ error: "仅管理员可删除资源" }, { status: 403 });
    }

    // 获取资源信息以便删除存储文件
    const { data: existing } = await getSupabaseAdmin()
      .from("resources")
      .select("file_key")
      .eq("id", id)
      .maybeSingle();

    // 删除存储文件
    if (existing?.file_key) {
      try {
        const { deleteFile } = await import("@/lib/storage");
        await deleteFile(existing.file_key);
      } catch {
        // 存储文件删除失败不阻塞数据库记录删除
      }
    }

    const { error } = await getSupabaseAdmin().from("resources").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "删除失败" },
      { status: 500 }
    );
  }
}

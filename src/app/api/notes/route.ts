import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isPublic = searchParams.get("public");
    const limit = searchParams.get("limit");

    let query = supabaseAdmin
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (isPublic === "true") {
      query = query.eq("is_public", true);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: notesData, error: notesError } = await query;
    if (notesError) throw notesError;

    const notes = notesData || [];
    const authorIds = [...new Set(notes.map((n: { author_id: string }) => n.author_id))];

    let authorsMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", authorIds);
      authorsMap = (profilesData || []).reduce((acc, p) => {
        acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { name: string | null; avatar_url: string | null }>);
    }

    const enrichedNotes = notes.map((note: { author_id: string }) => ({
      ...note,
      author: authorsMap[note.author_id] || { name: "未知用户", avatar_url: null },
    }));

    return NextResponse.json({ notes: enrichedNotes });
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

    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        title: body.title,
        content: body.content,
        category: body.category || "技术",
        tags: body.tags || [],
        is_public: body.is_public ?? true,
        author_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}

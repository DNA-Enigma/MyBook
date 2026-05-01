import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function toMarkdown(note: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
}) {
  const frontmatter = [
    "---",
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `category: ${note.category}`,
    `tags: [${(note.tags || []).map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`,
    `date: ${note.created_at}`,
    note.updated_at ? `updated: ${note.updated_at}` : null,
    "---",
    "",
    note.content,
  ]
    .filter(Boolean)
    .join("\n");
  return frontmatter;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    let currentUserId: string | null = null;
    if (accessToken) {
      const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
      currentUserId = userData.user?.id || null;
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("id");
    const format = searchParams.get("format") || "json";

    let query = getSupabaseAdmin().from("notes").select("*").order("created_at", { ascending: false });

    if (noteId) {
      query = query.eq("id", noteId);
    } else if (!currentUserId) {
      // 未登录只能导出公开笔记
      query = query.eq("is_public", true);
    }

    const { data: notesData, error } = await query;
    if (error) throw error;

    const notes = (notesData || []).filter((note: { author_id: string; is_public: boolean }) => {
      // 未登录或不是作者/admin，只能看到公开笔记
      if (!currentUserId) return note.is_public;
      return note.is_public || note.author_id === currentUserId;
    });

    if (format === "markdown") {
      if (notes.length === 1) {
        const md = toMarkdown(notes[0]);
        return new NextResponse(md, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${notes[0].title.replace(/[^\w\u4e00-\u9fa5]/g, "_")}.md"`,
          },
        });
      }
      // 多篇时返回 markdown 数组
      const mdContent = notes.map((n: typeof notes[0]) => toMarkdown(n)).join("\n\n---\n\n");
      return new NextResponse(mdContent, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="notes_export.md"`,
        },
      });
    }

    // JSON 格式
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "导出失败" },
      { status: 500 }
    );
  }
}

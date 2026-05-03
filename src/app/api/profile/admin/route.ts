import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
        bio: profiles.bio,
        skills: profiles.skills,
        avatar_url: profiles.avatar_url,
        contact_email: profiles.contact_email,
        github_url: profiles.github_url,
        website_url: profiles.website_url,
        linkedin_url: profiles.linkedin_url,
        created_at: sql<string>`to_char(${profiles.created_at}, 'YYYY-MM-DD')`,
      })
      .from(profiles)
      .where(eq(profiles.role, "admin"))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "暂无站长信息" }, { status: 404 });
    }

    return NextResponse.json({ profile: result[0] });
  } catch (error) {
    console.error("获取站长信息失败:", error);
    return NextResponse.json({ error: "获取站长信息失败" }, { status: 500 });
  }
}

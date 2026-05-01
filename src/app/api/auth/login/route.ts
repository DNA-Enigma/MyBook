import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 速率限制：每个邮箱每分钟最多 5 次登录尝试
    const rateKey = `login:${email.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateKey, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `登录尝试过多，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || "登录失败" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, role, avatar_url, bio, contact_email, github_url, website_url, linkedin_url, created_at")
      .eq("id", data.user.id)
      .single();

    const user = profile || {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "用户",
      role: "user",
      avatar_url: null,
      bio: null,
      contact_email: null,
      github_url: null,
      website_url: null,
      linkedin_url: null,
      created_at: new Date().toISOString(),
    };

    const response = NextResponse.json({ success: true, user });

    // 安全的 Cookie 设置
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: "/",
    };

    response.cookies.set("sb-access-token", data.session.access_token, cookieOptions);
    response.cookies.set("sb-refresh-token", data.session.refresh_token, cookieOptions);

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "登录失败" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSignedDownloadUrl } from "@/lib/storage";
import { s3Storage } from "@/lib/s3-storage";
import { checkRateLimit } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const storageType = searchParams.get("storage_type") || "supabase";
    const fileUrl = searchParams.get("file_url");

    if (!key && !fileUrl) {
      return NextResponse.json({ error: "缺少文件 key 或 file_url" }, { status: 400 });
    }

    // 防止路径遍历攻击
    if (key && (key.includes("..") || key.startsWith("/") || key.includes("\\"))) {
      return NextResponse.json({ error: "非法的文件路径" }, { status: 400 });
    }

    // 尝试获取用户ID用于速率限制（未登录也允许下载，但使用IP限流）
    const accessToken = request.cookies.get("sb-access-token")?.value;
    let userId: string | null = null;
    if (accessToken) {
      try {
        const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
        if (userData.user) userId = userData.user.id;
      } catch {
        // ignore auth error for public download
      }
    }

    // 速率限制：每个用户/IP 每分钟最多 30 次下载请求
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateKey = userId ? `download:${userId}` : `download:ip:${clientIp}`;
    const rateCheck = checkRateLimit(rateKey, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `下载过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    let url: string;

    if (storageType === "s3") {
      // S3 对象存储：生成预签名 URL
      url = await s3Storage.generatePresignedUrl({ key: key!, expireTime: 300 });
    } else {
      // Supabase Storage：尝试生成签名下载链接，失败则回退到公开 URL
      try {
        url = await getSignedDownloadUrl(key!, 300);
      } catch {
        // 签名 URL 生成失败（文件可能不存在于当前 bucket），尝试使用公开 URL
        if (fileUrl) {
          url = fileUrl;
        } else {
          throw new Error("无法生成下载链接，文件可能已被移动或删除");
        }
      }
    }

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成下载链接失败" },
      { status: 500 }
    );
  }
}

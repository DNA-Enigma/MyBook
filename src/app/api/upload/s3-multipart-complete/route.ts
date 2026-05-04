import { NextRequest, NextResponse } from "next/server";
import {
  completeMultipartUpload,
  abortMultipartUpload,
  s3Storage,
} from "@/lib/s3-storage";

// 完成 S3 Multipart Upload，返回公开访问 URL
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { key, uploadId, parts } = body;

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证用户
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAdmin.auth.getUser(tokenMatch[1]);
    if (!user) {
      return NextResponse.json({ error: "无效的登录凭证" }, { status: 401 });
    }

    // 完成 Multipart Upload
    await completeMultipartUpload(key, uploadId, parts);

    // 生成预签名 URL（有效期 7 天）
    const publicUrl = await s3Storage.generatePresignedUrl({
      key,
      expireTime: 7 * 24 * 3600,
    });

    return NextResponse.json({
      publicUrl,
      key,
      storageType: "s3",
    });
  } catch (error) {
    console.error("[s3-multipart-complete] Error:", error);
    // 尝试中止上传
    try {
      const { key, uploadId } = await request.clone().json();
      if (key && uploadId) {
        await abortMultipartUpload(key, uploadId);
      }
    } catch {
      // 忽略清理错误
    }
    return NextResponse.json(
      { error: "文件拼装失败" },
      { status: 500 }
    );
  }
}

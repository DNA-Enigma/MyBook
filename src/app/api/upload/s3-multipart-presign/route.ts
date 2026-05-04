import { NextRequest, NextResponse } from "next/server";
import { presignUploadPart } from "@/lib/s3-storage";

// 为指定分片生成预签名 PUT URL，浏览器直传 S3
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { key, uploadId, partNumber, contentLength } = body;

    if (!key || !uploadId || !partNumber) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证用户
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAdmin.auth.getUser(tokenMatch[1]);
    if (!user) {
      return NextResponse.json({ error: "无效的登录凭证" }, { status: 401 });
    }

    const presignedUrl = await presignUploadPart(
      key,
      uploadId,
      partNumber,
      contentLength || 0,
    );

    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error("[s3-multipart-presign] Error:", error);
    return NextResponse.json(
      { error: "生成上传地址失败" },
      { status: 500 }
    );
  }
}

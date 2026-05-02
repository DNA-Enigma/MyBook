import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { uploadFile, getPublicUrl } from "@/lib/storage";
import { validateUploadFile, generateSafeFileName, checkRateLimit } from "@/lib/security";

// 支持大文件上传：最长 10 分钟，最大 2GB
export const maxDuration = 600;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 验证用户身份
    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    // 速率限制：每个用户每分钟最多 10 次上传
    const rateKey = `upload:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `上传过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    // 文件安全检查
    const fileCheck = validateUploadFile(file);
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.message }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 使用安全的文件名
    const safeFileName = generateSafeFileName(file.name);
    const key = `uploads/${userData.user.id}/${safeFileName}`;

    const uploadKey = await uploadFile(
      buffer,
      key,
      file.type || "application/octet-stream"
    );

    const publicUrl = await getPublicUrl(uploadKey);

    return NextResponse.json({
      key: uploadKey,
      publicUrl,
      originalName: file.name,
      size: file.size,
      success: true,
    });
  } catch (err) {
    const envCheck = {
      url: !!process.env.COZE_SUPABASE_URL,
      key: !!(process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 10),
      bucket: process.env.COZE_BUCKET_NAME || "uploads",
    };
    console.error("[UPLOAD ERROR]", JSON.stringify({ envCheck, error: String(err), stack: (err as Error).stack }));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "上传失败", debug: envCheck },
      { status: 500 }
    );
  }
}

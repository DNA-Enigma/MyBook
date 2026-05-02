import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSafeFileName, checkRateLimit } from "@/lib/security";

// 允许的文件扩展名（与 security.ts 保持一致）
const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".md",
  ".zip", ".tar", ".gz", ".tgz", ".rar", ".7z",
  ".exe", ".msi", ".dmg", ".deb", ".rpm", ".apk",
  ".dockerfile", ".yml", ".yaml", ".json", ".iso",
  ".ppt", ".pptx", ".csv",
];

const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB

/**
 * 预签名上传接口
 * 返回客户端直传 Supabase Storage 所需的参数，
 * 使大文件上传绕过 Next.js 服务端（受代理 body size 限制）
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
    }

    const { fileName, fileSize, contentType } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    // 文件大小检查
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过限制（最大3GB）" },
        { status: 400 }
      );
    }

    // 文件扩展名检查
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    // 速率限制
    const rateKey = `upload:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `上传过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const safeFileName = generateSafeFileName(fileName);
    const filePath = `uploads/${userData.user.id}/${safeFileName}`;
    const bucketName = process.env.COZE_BUCKET_NAME || "uploads";
    const supabaseUrl = process.env.COZE_SUPABASE_URL || "";

    return NextResponse.json({
      supabaseUrl,
      bucketName,
      filePath,
      accessToken,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`,
    });
  } catch (err) {
    console.error("[PRESIGN ERROR]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "预签名失败" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { uploadFile, getPublicUrl } from "@/lib/storage";
import { validateUploadFile, generateSafeFileName, checkRateLimit } from "@/lib/security";

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

    const isImage = file.type.startsWith("image/");

    // 图片允许所有登录用户上传（用于头像），其他文件仅管理员可上传
    if (!isImage) {
      const { data: profile } = await getSupabaseAdmin()
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "无权上传，仅管理员可操作" }, { status: 403 });
      }
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "上传失败" },
      { status: 500 }
    );
  }
}

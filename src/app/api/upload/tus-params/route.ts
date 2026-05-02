import { NextRequest, NextResponse } from "next/server";

/**
 * 获取 TUS 上传所需的参数
 * 前端使用 tus-js-client 直接上传到 Supabase Storage 的 TUS 端点
 * 这样大文件不经过 Next.js 服务器，不受代理层 body size 限制
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    // Supabase 项目 URL 作为 TUS 端点
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: "服务配置错误" }, { status: 500 });
    }

    // TUS 上传端点
    const tusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

    // 生成文件存储路径（与现有路径格式一致）
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const safeName = ext
      ? `${timestamp}-${randomStr}.${ext}`
      : `${timestamp}-${randomStr}`;

    // 从 token 中提取用户 ID（JWT 解码）
    let userId = "anonymous";
    try {
      const payload = JSON.parse(
        Buffer.from(accessToken.split(".")[1], "base64").toString()
      );
      userId = payload.sub || "anonymous";
    } catch {}

    const filePath = `uploads/${userId}/${safeName}`;
    const bucketName = process.env.COZE_BUCKET_NAME || "uploads";

    return NextResponse.json({
      tusEndpoint,
      accessToken,
      bucketName,
      filePath,
      contentType: contentType || "application/octet-stream",
    });
  } catch (error) {
    console.error("[tus-upload-params] Error:", error);
    return NextResponse.json(
      { error: "获取上传参数失败" },
      { status: 500 }
    );
  }
}

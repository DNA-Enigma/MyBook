import { NextRequest, NextResponse } from "next/server";
import { createMultipartUpload } from "@/lib/s3-storage";

// 初始化 S3 原生分片上传（不写 /tmp，分片直达 S3）
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, contentType, totalChunks } = body;

    if (!fileName || !fileSize || !contentType || !totalChunks) {
      return NextResponse.json(
        { error: "缺少必要参数（fileName, fileSize, contentType, totalChunks）" },
        { status: 400 },
      );
    }

    // 生成 S3 key：时间戳 + 原始文件名
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `uploads/${timestamp}_${safeName}`;

    // 调用 S3 createMultipartUpload
    const result = await createMultipartUpload(s3Key, contentType);

    return NextResponse.json({
      uploadId: result.uploadId,
      s3Key: result.key,
      totalChunks,
      fileName,
      fileSize,
      contentType,
    });
  } catch (error) {
    console.error("[s3-chunk-init] Error:", error);
    return NextResponse.json(
      { error: "初始化上传失败" },
      { status: 500 },
    );
  }
}

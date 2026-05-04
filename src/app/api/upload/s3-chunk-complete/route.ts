import { NextRequest, NextResponse } from "next/server";
import { completeMultipartUpload, abortMultipartUpload, s3Storage } from "@/lib/s3-storage";

// 完成 S3 原生分片上传：合并所有分片，生成下载 URL
export async function POST(request: NextRequest) {
  let s3Key = "";
  let uploadId = "";

  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    s3Key = body.s3Key || "";
    uploadId = body.uploadId || "";
    const parts = body.parts;
    const fileName = body.fileName || "";
    const fileSize = body.fileSize || 0;

    if (!uploadId || !s3Key || !parts || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: "缺少必要参数（uploadId, s3Key, parts）" },
        { status: 400 },
      );
    }

    // 调用 S3 completeMultipartUpload 合并分片
    const s3Parts = parts.map(
      (p: { partNumber: number; eTag: string }) => ({
        PartNumber: p.partNumber,
        ETag: p.eTag,
      }),
    );

    await completeMultipartUpload(s3Key, uploadId, s3Parts);

    // 生成预签名下载 URL（有效期 7 天）
    const publicUrl = await s3Storage.generatePresignedUrl({
      key: s3Key,
      expireTime: 7 * 24 * 3600,
    });

    return NextResponse.json({
      publicUrl,
      key: s3Key,
      fileName: fileName || s3Key.split("/").pop() || "file",
      fileSize,
      storageType: "s3",
    });
  } catch (error) {
    console.error("[s3-chunk-complete] Error:", error);
    // 出错时尝试中止上传，清理 S3 上的未完成分片
    if (s3Key && uploadId) {
      try {
        await abortMultipartUpload(s3Key, uploadId);
      } catch {
        // 清理失败不影响错误返回
      }
    }
    return NextResponse.json(
      { error: "文件合并失败" },
      { status: 500 },
    );
  }
}

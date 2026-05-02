import { NextRequest, NextResponse } from "next/server";
import { s3Storage } from "@/lib/s3-storage";
import { createReadStream } from "fs";
import { readFile, stat, unlink, readdir, rmdir } from "fs/promises";
import { join } from "path";

// 合并所有分片，使用 S3 streamUploadFile 上传到对象存储
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json({ error: "缺少 uploadId" }, { status: 400 });
    }

    const tmpDir = `/tmp/s3-chunks/${uploadId}`;
    const metaPath = join(tmpDir, "meta.json");

    // 读取 meta
    let meta: Record<string, unknown>;
    try {
      const metaRaw = await readFile(metaPath, "utf-8");
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json(
        { error: "上传会话不存在或已过期" },
        { status: 404 }
      );
    }

    const totalChunks = meta.totalChunks as number;
    const fileName = meta.fileName as string;
    const contentType = meta.contentType as string;
    const fileSize = meta.fileSize as number;

    // 验证所有分片
    for (let i = 0; i < totalChunks; i++) {
      try {
        await stat(join(tmpDir, `done_${i}`));
      } catch {
        return NextResponse.json(
          { error: `分片 ${i} 未上传` },
          { status: 400 }
        );
      }
    }

    // 合并分片到临时文件
    const mergedPath = join(tmpDir, "merged");
    const { appendFile, writeFile } = await import("fs/promises");
    await writeFile(mergedPath, Buffer.alloc(0));

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = await readFile(join(tmpDir, `chunk_${i}`));
      await appendFile(mergedPath, chunkData);
    }

    // 使用 S3 streamUploadFile 上传（支持大文件）
    const s3Key = await s3Storage.streamUploadFile({
      stream: createReadStream(mergedPath),
      fileName,
      contentType,
    });

    // 生成预签名 URL（有效期 7 天）
    const publicUrl = await s3Storage.generatePresignedUrl({
      key: s3Key,
      expireTime: 7 * 24 * 3600,
    });

    // 清理临时文件
    try {
      const files = await readdir(tmpDir);
      for (const f of files) {
        await unlink(join(tmpDir, f));
      }
      await rmdir(tmpDir);
    } catch {
      // 清理失败不影响结果
    }

    return NextResponse.json({
      publicUrl,
      key: s3Key,
      fileName,
      fileSize,
      storageType: "s3",
    });
  } catch (error) {
    console.error("[s3-chunk-complete] Error:", error);
    return NextResponse.json(
      { error: "文件拼装失败" },
      { status: 500 }
    );
  }
}

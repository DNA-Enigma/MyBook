import { NextRequest, NextResponse } from "next/server";
import { uploadFile, getPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 大文件拼装上传需要时间

// 所有分片上传完成后，合并分片并上传到 Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("sb-access-token");
    if (!cookie?.value) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const uploadId = body.uploadId || body.sessionId;

    if (!uploadId) {
      return NextResponse.json({ error: "缺少 uploadId" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const tmpDir = `/tmp/chunks/${uploadId}`;

    // 读取元信息
    let meta: {
      fileName: string;
      fileSize: number;
      contentType: string;
      totalChunks: number;
      uploadId: string;
      userId: string;
    };
    try {
      const metaRaw = await fs.readFile(`${tmpDir}/meta.json`, "utf-8");
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json({ error: "上传会话不存在或已过期" }, { status: 400 });
    }

    // 验证所有分片已上传
    for (let i = 0; i < meta.totalChunks; i++) {
      try {
        await fs.access(`${tmpDir}/done_${i}`);
      } catch {
        return NextResponse.json(
          { error: `分片 ${i + 1}/${meta.totalChunks} 尚未上传` },
          { status: 400 }
        );
      }
    }

    // 合并所有分片到 Buffer
    const chunks: Buffer[] = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkBuffer = await fs.readFile(`${tmpDir}/chunk_${i}`);
      chunks.push(chunkBuffer);
    }
    const fileBuffer = Buffer.concat(chunks, meta.fileSize);

    // 构建 Supabase Storage 文件路径（与原有 upload 路由保持一致）
    const ext = meta.fileName.includes(".") ? meta.fileName.split(".").pop() : "";
    const safeName = ext
      ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `uploads/${meta.userId}/${safeName}`;

    // 上传到 Supabase Storage
    const uploadKey = await uploadFile(
      fileBuffer,
      key,
      meta.contentType || "application/octet-stream"
    );

    const publicUrl = await getPublicUrl(uploadKey);

    // 清理临时文件
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }

    // 返回格式与前端期望一致
    return NextResponse.json({
      success: true,
      publicUrl,
      key: uploadKey,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
    });
  } catch (err) {
    console.error("[chunk-complete] Error:", err);
    return NextResponse.json({ error: "文件拼装失败" }, { status: 500 });
  }
}

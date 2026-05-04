import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { Readable } from "stream";
import { putObjectStream, getS3BucketName } from "@/lib/s3-storage";

export const maxDuration = 600;

/**
 * 按序读取多个文件并合并为一个 Readable stream
 */
class CombinedReadStream extends Readable {
  private filePaths: string[];
  private currentIndex = 0;
  private currentStream: fs.ReadStream | null = null;

  constructor(filePaths: string[]) {
    super({ highWaterMark: 1024 * 1024 }); // 1MB buffer
    this.filePaths = filePaths;
  }

  override _read() {
    if (this.currentIndex >= this.filePaths.length) {
      this.push(null); // 结束
      return;
    }

    if (!this.currentStream) {
      const filePath = this.filePaths[this.currentIndex];
      this.currentStream = fs.createReadStream(filePath, {
        highWaterMark: 1024 * 1024,
      });

      this.currentStream.on("data", (chunk: string | Buffer) => {
        if (!this.push(chunk)) {
          this.currentStream?.pause();
        }
      });

      this.currentStream.on("end", () => {
        this.currentIndex++;
        this.currentStream = null;
        // 继续读取下一个文件
        this._read();
      });

      this.currentStream.on("error", (err: Error) => {
        this.destroy(err);
      });
    } else {
      this.currentStream.resume();
    }
  }
}

/**
 * 完成分片上传
 * 1. 读取所有分片并合并成 Readable stream
 * 2. 用 PutObject (putObjectStream) 一次性上传到 S3
 * 3. 清理 /tmp 临时文件
 * 4. 写入数据库记录
 */
export async function POST(request: NextRequest) {
  let tmpDir = "";
  try {
    // 验证登录
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { supabaseAnon } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, fileName, fileSize, contentType, category, description } = body as {
      uploadId: string;
      fileName: string;
      fileSize: number;
      contentType: string;
      category?: string;
      description?: string;
    };

    if (!uploadId || !fileName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    tmpDir = `/tmp/upload_${uploadId}`;
    if (!fs.existsSync(tmpDir)) {
      return NextResponse.json({ error: "上传会话不存在" }, { status: 400 });
    }

    // 读取元数据
    const meta = JSON.parse(fs.readFileSync(`${tmpDir}/meta.json`, "utf8"));
    const s3Key = meta.s3Key;

    // 查找所有分片文件并按序排列
    const partFiles = fs.readdirSync(tmpDir)
      .filter((f) => f.startsWith("part_"))
      .sort((a, b) => {
        const numA = parseInt(a.replace("part_", ""), 10);
        const numB = parseInt(b.replace("part_", ""), 10);
        return numA - numB;
      });

    if (partFiles.length === 0) {
      return NextResponse.json({ error: "没有找到上传的分片" }, { status: 400 });
    }

    console.log(`[s3-chunk-complete] Merging ${partFiles.length} parts for ${s3Key}`);

    // 创建合并流：按序读取分片
    const combinedStream = new CombinedReadStream(
      partFiles.map((f) => `${tmpDir}/${f}`)
    );

    // 用 PutObject 流式上传到 S3
    const result = await putObjectStream(s3Key, combinedStream, fileSize, contentType);

    // 清理临时文件
    try {
      for (const f of partFiles) {
        fs.unlinkSync(`${tmpDir}/${f}`);
      }
      fs.unlinkSync(`${tmpDir}/meta.json`);
      fs.rmdirSync(tmpDir);
    } catch (cleanupErr) {
      console.error("[s3-chunk-complete] Cleanup error:", cleanupErr);
    }

    if (!result) {
      return NextResponse.json({ error: "S3 上传失败" }, { status: 500 });
    }

    // 构建文件 URL
    const fileUrl = `/api/download?key=${encodeURIComponent(s3Key)}&storage_type=s3`;

    // 写入数据库
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { error: dbError } = await supabaseAdmin.from("resources").insert({
      name: fileName,
      description: description || "",
      file_url: fileUrl,
      file_key: s3Key,
      file_type: contentType,
      file_size: fileSize,
      category: category || "其他",
      is_public: true,
    });

    if (dbError) {
      console.error("[s3-chunk-complete] DB error:", dbError);
      return NextResponse.json({ error: "数据库写入失败" }, { status: 500 });
    }

    console.log(`[s3-chunk-complete] Upload complete: ${s3Key}`);

    return NextResponse.json({
      success: true,
      fileUrl,
      s3Key,
    });
  } catch (error) {
    console.error("[s3-chunk-complete] Error:", error);
    // 清理临时文件
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
    return NextResponse.json(
      { error: "上传完成处理失败" },
      { status: 500 }
    );
  }
}

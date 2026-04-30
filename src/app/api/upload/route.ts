import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const key = await uploadFile(
      buffer,
      `uploads/${Date.now()}-${file.name}`,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({ key, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "上传失败" },
      { status: 500 }
    );
  }
}

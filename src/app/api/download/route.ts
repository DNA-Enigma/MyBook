import { NextRequest, NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "缺少文件 key" }, { status: 400 });
    }

    const url = await getSignedDownloadUrl(key, 300);

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成下载链接失败" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || "";
  let role = "unknown";
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64").toString()
    );
    role = payload.role || "no-role";
  } catch {
    role = "invalid-jwt";
  }

  return NextResponse.json({
    url: process.env.COZE_SUPABASE_URL ? "configured" : "missing",
    key: key ? "configured" : "missing",
    keyRole: role,
  });
}

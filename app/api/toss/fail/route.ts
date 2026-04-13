import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const reportId = searchParams.get("reportId");

  console.error("❌ 결제 실패:", { code, message });

  const url = new URL("/toss-test/fail", request.nextUrl.origin);
  if (code) url.searchParams.set("code", code);
  if (message) url.searchParams.set("message", message);
  if (reportId) url.searchParams.set("reportId", reportId);

  return NextResponse.redirect(url);
}

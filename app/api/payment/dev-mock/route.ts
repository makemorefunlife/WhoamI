import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const allow =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_MOCK_PAYMENT === "true";
  if (!allow) {
    return NextResponse.json(
      { error: "프로덕션에서는 비활성화입니다. ALLOW_MOCK_PAYMENT=true 로만 허용됩니다." },
      { status: 403 },
    );
  }

  let body: { reportId?: string };
  try {
    body = (await req.json()) as { reportId?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
  if (!reportId) {
    return NextResponse.json({ error: "reportId 필요" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 또는 URL 없음" },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("reports")
    .update({ payment_status: "paid", plan_type: "paid" })
    .eq("id", reportId);

  if (error) {
    console.error("dev-mock payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

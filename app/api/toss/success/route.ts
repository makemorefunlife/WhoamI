import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const reportId = searchParams.get("reportId");

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey || !paymentKey || !orderId || amount == null) {
    const u = new URL("/toss-test/fail", request.nextUrl.origin);
    u.searchParams.set("code", "INVALID");
    u.searchParams.set("message", "결제 파라미터 오류");
    if (reportId) u.searchParams.set("reportId", reportId);
    return NextResponse.redirect(u);
  }

  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    },
  );

  const data = (await response.json()) as {
    code?: string;
    message?: string;
  };

  if (response.ok) {
    console.log("✅ 결제 성공!", data);

    if (reportId) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && serviceKey) {
        const supabase = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error } = await supabase
          .from("reports")
          .update({ payment_status: "paid", plan_type: "paid" })
          .eq("id", reportId);
        if (error) console.error("reports update:", error);
      }
    }

    const ok = new URL("/toss-test/success", request.nextUrl.origin);
    ok.searchParams.set("orderId", orderId);
    if (reportId) ok.searchParams.set("reportId", reportId);
    return NextResponse.redirect(ok);
  }

  console.error("❌ 결제 실패:", data);
  const fail = new URL("/toss-test/fail", request.nextUrl.origin);
  fail.searchParams.set("code", String(data.code ?? "ERROR"));
  fail.searchParams.set(
    "message",
    String(data.message ?? "결제 실패"),
  );
  if (reportId) fail.searchParams.set("reportId", reportId);
  return NextResponse.redirect(fail);
}

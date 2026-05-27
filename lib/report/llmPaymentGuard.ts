import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export type PremiumLlmRequestType = "integrated" | "detailed_survey";

function logPaymentGuard(
  reportId: string,
  hasPremium: boolean,
  requestType: PremiumLlmRequestType,
) {
  console.info("[premium-pipeline] stage=llm_payment_guard", {
    reportId,
    hasPremium,
    requestType,
  });
}

/** premium LLM 호출 전 결제 확인 — 통과 시 null, 차단 시 Response */
export async function assertPremiumLlmAccess(
  reportId: unknown,
  requestType: PremiumLlmRequestType,
): Promise<Response | null> {
  const id = typeof reportId === "string" ? reportId.trim() : "";
  if (!id) {
    logPaymentGuard("(missing)", false, requestType);
    return Response.json({ error: "reportId가 필요합니다." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json(
      { error: "서버 Supabase 설정이 필요합니다." },
      { status: 500 },
    );
  }

  const supabase = createServiceRoleClient(url, serviceKey);
  const { data: report, error } = await supabase
    .from("reports")
    .select("payment_status, plan_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !report) {
    logPaymentGuard(id, false, requestType);
    return Response.json({ error: "리포트를 찾을 수 없습니다." }, { status: 403 });
  }

  const hasPremium =
    report.payment_status === "paid" || report.plan_type === "paid";
  logPaymentGuard(id, hasPremium, requestType);

  if (!hasPremium) {
    return Response.json(
      { error: "심화 리포트는 결제 후 이용할 수 있습니다." },
      { status: 403 },
    );
  }

  return null;
}

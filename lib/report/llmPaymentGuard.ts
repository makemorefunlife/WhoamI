import {
  createRouteSupabaseClient,
  SERVER_SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/serverClient";
import {
  readPremiumAccessCache,
  writePremiumAccessCache,
  logPremiumAccessCacheHit,
} from "@/lib/report/premiumAccessCache";

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

  const cached = readPremiumAccessCache(id);
  if (cached === true) {
    logPremiumAccessCacheHit(id, requestType);
    return null;
  }
  if (cached === false) {
    logPaymentGuard(id, false, requestType);
    return Response.json(
      { error: "심화 리포트는 결제 후 이용할 수 있습니다." },
      { status: 403 },
    );
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) {
    return Response.json(
      { error: SERVER_SUPABASE_CONFIG_ERROR },
      { status: 500 },
    );
  }
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
  writePremiumAccessCache(id, hasPremium);
  logPaymentGuard(id, hasPremium, requestType);

  if (!hasPremium) {
    return Response.json(
      { error: "심화 리포트는 결제 후 이용할 수 있습니다." },
      { status: 403 },
    );
  }

  return null;
}

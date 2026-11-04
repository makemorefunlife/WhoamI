"use client";

import { useState, type FormEvent } from "react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { lookupOrderDiagnosticAction, type OrderDiagnosticActionResult } from "./actions";

/**
 * Operator tool: look up Toss's own GET /v1/payments/orders/{orderId}
 * record for one order. 2026-11-04: gated on Clerk identity alone
 * (lib/security/operatorAuth.verifyOperatorClerkIdentity -- must be signed
 * in AND listed in OPERATOR_CLERK_USER_IDS) rather than the full two-factor
 * check the mutating admin routes (refunds etc.) still use -- this page
 * only reads Toss's record, nothing financial, and the site has no other
 * admin allowlist to reuse. An ordinary signed-in user who isn't on that
 * allowlist is still refused.
 *
 * Built while triaging a COMMON_ERROR on US PayPal checkout -- remove (or
 * leave, it's harmless/read-only) once that's resolved.
 */
function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#D4CFC4] py-1.5 text-sm">
      <span className="text-[#4A5C52]">{label}</span>
      <span className="font-mono text-[#1A3328]">{value === null || value === "" ? "—" : String(value)}</span>
    </div>
  );
}

function TossResult({ result }: { result: Extract<OrderDiagnosticActionResult, { ok: true }> }) {
  const { toss, keyMode } = result;
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-xl border border-[#D4CFC4] bg-[#FFFDF8] p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3A8F6E]">이 배포의 Toss 키</p>
        <Field label="키 종류" value={keyMode === "test" ? "테스트 키 (test_sk_...)" : keyMode === "live" ? "라이브 키 (live_sk_...)" : "설정 안 됨"} />
      </div>

      <div className="rounded-xl border border-[#D4CFC4] bg-[#FFFDF8] p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3A8F6E]">Toss 조회 결과</p>
        {toss.kind === "found" ? (
          <>
            <Field label="mId (상점아이디)" value={toss.mId} />
            <Field label="status" value={toss.status} />
            <Field label="method" value={toss.method} />
            <Field label="currency" value={toss.currency} />
            <Field label="totalAmount" value={toss.totalAmount} />
            <Field label="requestedAt" value={toss.requestedAt} />
            <Field label="approvedAt" value={toss.approvedAt} />
            {toss.failure ? (
              <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3">
                <p className="text-xs font-bold text-rose-700">failure (Toss가 기록한 실패 사유)</p>
                <p className="mt-1 text-sm text-rose-800">{toss.failure.code}</p>
                <p className="text-sm text-rose-800">{toss.failure.message}</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#4A5C52]">failure: 없음 (Toss가 이 주문에 대한 실패 상세를 기록하지 않았습니다)</p>
            )}
          </>
        ) : toss.kind === "not_found" ? (
          <p className="text-sm text-[#4A5C52]">
            Toss에 이 orderId로 조회되는 기록이 없습니다 (404). 결제창이 Toss 서버에 요청을 보내기 전에 끝났을 가능성이 있습니다.
          </p>
        ) : toss.kind === "error" ? (
          <>
            <Field label="HTTP status" value={toss.httpStatus} />
            <Field label="code" value={toss.code} />
            <Field label="message" value={toss.message} />
          </>
        ) : (
          <p className="text-sm text-amber-700">조회 자체가 실패했습니다 ({toss.reason}) — 네트워크/타임아웃일 수 있어 다시 시도해보세요.</p>
        )}
      </div>
    </div>
  );
}

function DiagnosticForm() {
  const [orderId, setOrderId] = useState("");
  // USD default: that's the currency actually under triage right now. KRW
  // stays selectable for any future KR order lookup through this same tool.
  const [currency, setCurrency] = useState<"KRW" | "USD">("USD");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OrderDiagnosticActionResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await lookupOrderDiagnosticAction(orderId, currency);
      setResult(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-xl font-semibold text-[#1A3328]">Toss 주문 진단 조회</h1>
      <p className="mt-1 text-sm text-[#4A5C52]">
        우리 toss_payment_orders 테이블이 아니라, Toss 자체가 갖고 있는 기록(GET /v1/payments/orders/orderId)을 조회합니다. 읽기 전용입니다.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A5C52]">
          주문번호 (orderId)
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="aha_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-sm text-[#1A3328]"
          />
        </label>
        <div className="block text-xs font-semibold uppercase tracking-wide text-[#4A5C52]">
          통화 (어느 키 쌍으로 조회할지)
          <div className="mt-1 flex gap-2">
            {(["USD", "KRW"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold normal-case",
                  currency === c ? "border-[#3A8F6E] bg-[#3A8F6E] text-white" : "border-[#D4CFC4] bg-white text-[#4A5C52]",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !orderId.trim()}
          className="w-full rounded-full bg-[#3A8F6E] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "조회 중…" : "조회"}
        </button>
      </form>

      {result && !result.ok && result.reason === "invalid_order_id" ? (
        <p role="alert" className="mt-4 text-sm text-rose-700">
          주문번호 형식이 올바르지 않습니다 (aha_ + 32자리 16진수).
        </p>
      ) : null}
      {result && !result.ok && result.reason === "operator_auth_failed" ? (
        <div role="alert" className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3">
          <p className="text-sm font-semibold text-rose-700">
            우리 쪽 운영자 인증 실패 (HTTP {result.status}) — Toss 쪽 조회는 시도조차 되지 않았습니다.
          </p>
          <p className="mt-1 text-xs text-rose-700">
            {result.status === 403
              ? "이 Clerk 계정이 OPERATOR_CLERK_USER_IDS에 없거나, 그 환경변수가 이 환경에 설정돼 있지 않습니다."
              : "로그인 상태를 확인할 수 없습니다 — 다시 로그인해주세요."}
          </p>
        </div>
      ) : null}
      {result && result.ok ? <TossResult result={result} /> : null}
    </main>
  );
}

export default function TossOrderDiagnosticPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <DiagnosticForm />;
}

"use client";

import { useState, type FormEvent } from "react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { lookupOrderDiagnosticAction, type OrderDiagnosticActionResult } from "./actions";

/**
 * Operator tool: look up Toss's own GET /v1/payments/orders/{orderId}
 * record for one order, without anyone pasting the operator secret into
 * DevTools or it ever appearing in client code. The secret is typed into a
 * password field fresh on every lookup and goes straight to the Server
 * Action (lib/security/operatorAuth.verifyOperatorCredentials) -- same
 * two-factor check (Clerk allowlist + OPERATOR_API_SECRET) as the existing
 * admin API routes, never weakened, never embedded in this file.
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
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OrderDiagnosticActionResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await lookupOrderDiagnosticAction(orderId, secret);
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
        <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A5C52]">
          운영자 비밀값 (OPERATOR_API_SECRET)
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-sm text-[#1A3328]"
          />
          <span className="mt-1 block text-[11px] font-normal normal-case text-[#4A5C52]">
            저장되지 않습니다 — 매 조회마다 새로 입력합니다. 서버에서만 검증되고, 코드 어디에도 들어있지 않습니다.
          </span>
        </label>
        <button
          type="submit"
          disabled={busy || !orderId.trim() || !secret.trim()}
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
              ? "Clerk 계정이 OPERATOR_CLERK_USER_IDS에 없거나, OPERATOR_API_SECRET/OPERATOR_CLERK_USER_IDS가 이 환경에 설정돼 있지 않습니다."
              : "비밀값이 틀렸습니다."}
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

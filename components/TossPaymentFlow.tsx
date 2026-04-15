"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Shield, Sparkles } from "lucide-react";

const RESULT_PATH = (id: string) =>
  `/result?id=${encodeURIComponent(id)}`;

/** 결제 직후 개인정보(생년월일 등) 입력 시트를 열기 위한 쿼리 */
const RESULT_AFTER_PAYMENT = (id: string) =>
  `/result?id=${encodeURIComponent(id)}&afterPayment=1`;

type Props = {
  /** true면 reportId 쿼리 없을 때 안내만 표시 (예: /payment) */
  requireReportId?: boolean;
  /** product: /payment 카드용 — 금액 고정·CTA만 (상위에서 카피 처리) */
  variant?: "developer" | "product";
};

export default function TossPaymentFlow({
  requireReportId = false,
  variant = "developer",
}: Props) {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") || "";

  const [amount, setAmount] = useState(variant === "product" ? 9900 : 10000);
  const [loading, setLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [sandboxAutoSuccess, setSandboxAutoSuccess] = useState(
    process.env.NEXT_PUBLIC_TOSS_SANDBOX_AUTO === "true",
  );

  if (requireReportId && !reportId) {
    if (variant === "product") return null;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-6 text-center text-[#e2e8f0]">
        <p className="mb-6 text-sm text-slate-400">
          결제할 리포트가 없어요. 결과 화면에서 다시 시도해주세요.
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#fb7185] px-6 py-3 font-medium text-white"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const handlePayment = async () => {
    setLoading(true);

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        alert("NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.");
        return;
      }

      if (clientKey.startsWith("live_")) {
        alert(
          "라이브 클라이언트 키입니다. 테스트 카드로는 결제할 수 없습니다. 개발자센터에서 test_ 로 시작하는 테스트 키를 넣어주세요.",
        );
        return;
      }

      const tossPayments = await loadTossPayments(clientKey);
      const orderId = `o${Date.now()}_${Math.random().toString(36).slice(2, 11)}`.slice(
        0,
        64,
      );

      const successBase = `${window.location.origin}/api/toss/success`;
      const successUrl = reportId
        ? `${successBase}?reportId=${encodeURIComponent(reportId)}`
        : successBase;

      const failBase = `${window.location.origin}/api/toss/fail`;
      const failUrl = reportId
        ? `${failBase}?reportId=${encodeURIComponent(reportId)}`
        : failBase;

      const orderName =
        variant === "product" && reportId
          ? "내면의 나 리포트"
          : reportId
            ? "리포트 상세 분석"
            : "테스트 상품";
      const paymentSandboxOpts = sandboxAutoSuccess
        ? { sandbox: { paymentResult: "SUCCESS" as const } }
        : {};

      const sdkMode = process.env.NEXT_PUBLIC_TOSS_SDK_MODE;
      const keyLooksWidget =
        clientKey.toLowerCase().includes("gck") ||
        clientKey.toLowerCase().includes("gw_ck");

      const runPayment = async () => {
        const payment = tossPayments.payment({ customerKey: ANONYMOUS });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: amount },
          orderId,
          orderName,
          successUrl,
          failUrl,
          customerName: "테스트 사용자",
          windowTarget: "self",
          ...paymentSandboxOpts,
        });
      };

      const runWidget = async () => {
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        await widgets.setAmount({ currency: "KRW", value: amount });
        await widgets.requestPaymentWindow(
          {
            amount: { currency: "KRW", value: amount },
            orderId,
            orderName,
            successUrl,
            failUrl,
            customerName: "테스트 사용자",
          },
          {
            variantKey: {
              paymentMethod: "DEFAULT",
              agreement: "DEFAULT",
            },
          },
        );
      };

      if (sdkMode === "widget") {
        await runWidget();
      } else if (sdkMode === "payment") {
        await runPayment();
      } else if (keyLooksWidget) {
        await runWidget();
      } else {
        await runPayment();
      }
    } catch (error) {
      console.error(error);
      const err = error as {
        message?: string;
        code?: string;
        cause?: unknown;
      };
      const cause =
        err.cause &&
        typeof err.cause === "object" &&
        err.cause !== null &&
        "message" in err.cause
          ? String((err.cause as { message?: string }).message)
          : "";
      const detail = [err.code, err.message, cause]
        .filter(Boolean)
        .join(" — ");
      alert(
        detail
          ? `결제창 오류 — ${detail}`
          : "결제창을 열 수 없습니다. 클라이언트 키·시크릿 키가 같은 상점의 테스트 키인지 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  async function handleMockPaid() {
    if (!reportId) {
      alert("reportId가 없습니다. 결과 화면에서 결제 링크로 들어와 주세요.");
      return;
    }
    setMockLoading(true);
    try {
      const res = await fetch("/api/payment/dev-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "모의 결제 실패");
        return;
      }
      window.location.assign(RESULT_AFTER_PAYMENT(reportId));
    } finally {
      setMockLoading(false);
    }
  }

  if (variant === "product") {
    const showDevPanel =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_ALLOW_MOCK_PAYMENT === "true";

    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums text-white">₩9,900</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#FFD6A5]">
            <Sparkles
              className="h-4 w-4 shrink-0 text-[#FFD6A5]"
              strokeWidth={1.75}
              aria-hidden
            />
            평생 이용권 (일회성 결제)
          </p>
          <p className="text-xs text-white/40">모든 개인분석 업데이트 무료</p>

          <button
            type="button"
            disabled={loading}
            onClick={() => void handlePayment()}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#ff9a44] to-[#ff6b35] py-4 text-lg font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "결제창 여는 중…" : "지금 바로 '나' 만나기"}
          </button>
        </div>

        <div className="space-y-2.5 border-t border-[var(--space-border)] pt-5 text-left">
          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--space-text-muted)]">
            <Shield
              className="mt-0.5 h-4 w-4 shrink-0 text-[#8eb8ff]"
              strokeWidth={1.75}
              aria-hidden
            />
            <span>안전한 결제</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--space-text-muted)]">
            <CalendarDays
              className="mt-0.5 h-4 w-4 shrink-0 text-[#8eb8ff]/90"
              strokeWidth={1.75}
              aria-hidden
            />
            <span>결제 후 7일 이내 미사용 시 전액 환불</span>
          </div>
        </div>

        {showDevPanel && reportId && (
          <details className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
            <summary className="cursor-pointer text-xs text-white/45">
              개발 · 모의 결제
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              로컬에서 토스 없이 잠금만 해제하려면 아래를 사용하세요.
            </p>
            <button
              type="button"
              disabled={mockLoading}
              onClick={() => void handleMockPaid()}
              className="mt-2 w-full rounded-xl bg-amber-600/90 py-2.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {mockLoading ? "처리 중…" : "결제한 것처럼 결과로 이동 (모의)"}
            </button>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          {requireReportId ? "✨ 심층 리포트 결제" : "🧪 토스 결제 테스트"}
        </h1>

        {reportId && (
          <p className="mb-4 text-sm text-gray-600 break-all">
            reportId: {reportId}
          </p>
        )}

        {reportId && (
          <div className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
            <p className="mb-2 text-sm font-medium text-amber-900">
              토스 없이 잠금만 해제하려면 (
              <code className="rounded bg-white px-1">npm run dev</code> 또는{" "}
              <code className="rounded bg-white px-1">ALLOW_MOCK_PAYMENT=true</code>
              )
            </p>
            <button
              type="button"
              disabled={mockLoading}
              onClick={() => void handleMockPaid()}
              className="w-full rounded-xl bg-amber-600 py-3 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mockLoading ? "처리 중..." : "결제한 것처럼 결과로 이동"}
            </button>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <h2 className="mb-2 font-semibold text-emerald-900">
            테스트 카드 (테스트 키일 때)
          </h2>
          <p className="mb-3 text-emerald-800 text-xs leading-relaxed">
            <code className="rounded bg-white px-1">NEXT_PUBLIC_TOSS_CLIENT_KEY</code>는
            테스트 키를 쓰세요. 위젯 키(
            <code className="rounded bg-white px-1">gck</code>)와 결제창 키를
            섞으면 오류가 납니다.{" "}
            <code className="rounded bg-gray-100 px-1">
              NEXT_PUBLIC_TOSS_SDK_MODE
            </code>
            로 강제할 수 있어요.
          </p>
          <table className="w-full border-collapse text-left text-emerald-900 text-xs">
            <tbody>
              <tr className="border-b border-emerald-100">
                <td className="py-1 pr-2">카드번호</td>
                <td className="font-mono">1111-2222-3333-4444</td>
              </tr>
              <tr className="border-b border-emerald-100">
                <td className="py-1 pr-2">유효기간</td>
                <td className="font-mono">12/28</td>
              </tr>
              <tr>
                <td className="py-1 pr-2">CVC</td>
                <td className="font-mono">123</td>
              </tr>
            </tbody>
          </table>
        </div>

        <label className="mb-6 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={sandboxAutoSuccess}
            onChange={(e) => setSandboxAutoSuccess(e.target.checked)}
          />
          <span>
            샌드박스 자동 성공 (결제창 API 경로에만 적용). .env에{" "}
            <code className="rounded bg-gray-100 px-1">
              NEXT_PUBLIC_TOSS_SANDBOX_AUTO=true
            </code>
          </span>
        </label>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-800">
            결제 금액 (원)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 p-2"
            min={1000}
            step={1000}
          />
        </div>

        <button
          type="button"
          onClick={() => void handlePayment()}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] py-3 font-medium text-white hover:opacity-95 disabled:bg-gray-400"
        >
          {loading
            ? "결제창 여는 중..."
            : `${amount.toLocaleString()}원 결제하기`}
        </button>

        {reportId && (
          <Link
            href={RESULT_PATH(reportId)}
            className="mt-4 block text-center text-sm text-violet-700 underline"
          >
            결과로 돌아가기
          </Link>
        )}

        {!requireReportId && (
          <p className="mt-4 text-center text-xs text-gray-500">
            테스트 모드에서는 실제로 돈이 빠져나가지 않습니다.
          </p>
        )}
      </div>
    </div>
  );
}

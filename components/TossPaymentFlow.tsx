"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const RESULT_PATH = (id: string) =>
  `/result?id=${encodeURIComponent(id)}`;

type Props = {
  /** true면 reportId 쿼리 없을 때 안내만 표시 (예: /payment) */
  requireReportId?: boolean;
};

export default function TossPaymentFlow({
  requireReportId = false,
}: Props) {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") || "";

  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [sandboxAutoSuccess, setSandboxAutoSuccess] = useState(
    process.env.NEXT_PUBLIC_TOSS_SANDBOX_AUTO === "true",
  );

  if (requireReportId && !reportId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] text-[#e2e8f0] text-center">
        <p className="text-slate-400 text-sm mb-6">
          결제할 리포트가 없어요. 결과 화면에서 다시 시도해주세요.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#fb7185] text-white font-medium"
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

      const orderName = reportId ? "리포트 상세 분석" : "테스트 상품";
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
      window.location.assign(RESULT_PATH(reportId));
    } finally {
      setMockLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e]">
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-2xl border border-white/10">
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

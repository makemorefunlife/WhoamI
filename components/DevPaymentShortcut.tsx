"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * 임시 개발용: 토스 테스트 페이지 이동 / 모의 결제 후 유료 결과 화면.
 * 제거: layout에서 import 삭제 + 이 파일 삭제.
 * 표시: npm run dev 이거나 .env에 NEXT_PUBLIC_DEV_PAYMENT_SHORTCUT=true
 * 모의 결제 API: 로컬은 dev 허용, next start 시에는 ALLOW_MOCK_PAYMENT=true 필요.
 */
export default function DevPaymentShortcut() {
  const pathname = usePathname();
  const [reportId, setReportId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visible =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_PAYMENT_SHORTCUT === "true";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReportId(localStorage.getItem("reportId"));
  }, [pathname]);

  const resolveReportId = useCallback(() => {
    const fromStore = reportId?.trim();
    if (fromStore) return fromStore;
    if (typeof window === "undefined") return "";
    const typed = window.prompt("reportId(UUID)를 입력하세요. (localStorage에 없을 때)");
    return typed?.trim() ?? "";
  }, [reportId]);

  const goMockPaid = useCallback(async () => {
    const id = resolveReportId();
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch("/api/payment/dev-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "모의 결제 실패");
        return;
      }
      window.location.assign(
        `/result?id=${encodeURIComponent(id)}&afterPayment=1`,
      );
    } finally {
      setBusy(false);
    }
  }, [resolveReportId]);

  if (!visible) return null;

  const tossHref = reportId
    ? `/toss-test?reportId=${encodeURIComponent(reportId)}`
    : "/toss-test";

  return (
    <div
      className="pointer-events-auto fixed bottom-3 left-3 z-[9999] flex max-w-[min(100vw-1.5rem,18rem)] flex-col gap-1.5 rounded-xl border border-amber-500/40 bg-[rgba(15,18,28,0.92)] p-2.5 text-[11px] shadow-lg backdrop-blur-sm"
      aria-label="개발용 결제 단축"
    >
      <p className="font-medium text-amber-200/95">개발 · 테스트 결제</p>
      <Link
        href={tossHref}
        className="rounded-lg bg-white/10 px-2 py-1.5 text-center text-white/90 hover:bg-white/15"
      >
        토스 샌드박스 페이지
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => void goMockPaid()}
        className="rounded-lg bg-amber-600/90 px-2 py-1.5 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {busy ? "처리 중…" : "모의 결제 → 유료 결과"}
      </button>
      {reportId ? (
        <p className="truncate text-white/45" title={reportId}>
          reportId: {reportId.slice(0, 8)}…
        </p>
      ) : (
        <p className="text-white/40">reportId 없음 → 버튼 시 입력 또는 설문 진행</p>
      )}
    </div>
  );
}

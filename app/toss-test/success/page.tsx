"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function TossSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reportId = searchParams.get("reportId");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold">결제 성공!</h1>
        <p className="mb-4 text-gray-600">주문번호: {orderId}</p>
        {reportId ? (
          <Link
            href={`/result?id=${encodeURIComponent(reportId)}`}
            className="text-blue-600 underline"
          >
            결과 보기
          </Link>
        ) : (
          <Link href="/toss-test" className="text-blue-600 underline">
            다시 테스트하기
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TossSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">로딩중...</div>
      }
    >
      <TossSuccessInner />
    </Suspense>
  );
}

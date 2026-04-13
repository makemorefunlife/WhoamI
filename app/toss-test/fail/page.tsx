"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function TossFailInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const reportId = searchParams.get("reportId");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h1 className="mb-2 text-2xl font-bold">결제 실패</h1>
        <p className="mb-2 text-gray-600">에러 코드: {code}</p>
        <p className="mb-4 text-gray-600">사유: {message}</p>
        <div className="flex flex-col gap-2">
          {reportId ? (
            <>
              <Link
                href={`/payment?reportId=${encodeURIComponent(reportId)}`}
                className="text-blue-600 underline"
              >
                다시 결제하기
              </Link>
              <Link
                href={`/result?id=${encodeURIComponent(reportId)}`}
                className="text-gray-600 underline"
              >
                결과로 돌아가기
              </Link>
            </>
          ) : (
            <Link href="/toss-test" className="text-blue-600 underline">
              다시 시도하기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TossFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">로딩중...</div>
      }
    >
      <TossFailInner />
    </Suspense>
  );
}

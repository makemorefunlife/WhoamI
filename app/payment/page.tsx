"use client";

import { Suspense } from "react";
import TossPaymentFlow from "@/components/TossPaymentFlow";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] text-slate-400 text-sm">
          로딩중...
        </div>
      }
    >
      <TossPaymentFlow requireReportId />
    </Suspense>
  );
}

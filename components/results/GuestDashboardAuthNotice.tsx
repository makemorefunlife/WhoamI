"use client";

import { SignInButton } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";

export default function GuestDashboardAuthNotice() {
  return (
    <div
      className="rounded-extra-large border border-accent-rose/35 bg-gradient-to-br from-accent-rose-soft/70 via-[#fff8f0] to-surface-container-low p-5 sm:p-6"
      role="status"
    >
      <div className="flex gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-accent-rose"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold leading-snug text-primary">
            로그인하지 않은 상태예요
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            지금 보시는 설문·출생 정보는{" "}
            <span className="font-medium text-primary">저장되지 않아요</span>.
            브라우저를 닫거나 기기를 바꾸면 분석 결과가{" "}
            <span className="font-medium text-primary">사라질 수 있어요</span>.
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            무료 세부 분석, 관계 분석, 결정 도우미 등을 이용하려면{" "}
            <span className="font-medium text-primary">
              로그인(회원가입)이 필요해요
            </span>
            .
          </p>
          <SignInButton mode="modal" forceRedirectUrl="/blueprint-preview">
            <button type="button" className="stitch-cta-primary mt-1 w-full sm:w-auto">
              로그인 · 회원가입
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}

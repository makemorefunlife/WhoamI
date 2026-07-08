"use client";

import Link from "next/link";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";

export default function AccountBillingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] px-4 pt-24 text-center text-sm text-white/50">
        불러오는 중…
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={ROUTES.accountBilling} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 pb-16 pt-20 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <nav className="flex gap-2 text-sm">
            <Link
              href={ROUTES.accountProfile}
              className="rounded-full border border-white/20 px-3 py-1.5 text-white/70"
            >
              내 정보
            </Link>
            <Link
              href={ROUTES.accountBilling}
              className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white"
            >
              결제 내역
            </Link>
          </nav>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-xl font-semibold text-white">결제 내역</h1>
            <p className="mt-2 text-sm text-white/70">
              결제 내역 화면은 곧 제공될 예정입니다.
            </p>
          </section>
        </div>
      </div>
  );
}


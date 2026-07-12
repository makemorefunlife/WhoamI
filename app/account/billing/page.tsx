"use client";

import Link from "next/link";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import AccountPageShell from "@/components/account/AccountPageShell";
import { ROUTES } from "@/constants/routes";

export default function AccountBillingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="billing" title="결제 내역">
        <p className="text-sm text-on-surface-variant">불러오는 중…</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={ROUTES.accountBilling} />;
  }

  return (
    <AccountPageShell
      activeTab="billing"
      title="결제 내역"
      subtitle="결제·구독 내역을 확인해요."
    >
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-on-surface-variant">
          결제 내역 화면은 곧 제공될 예정이에요.
        </p>
        <Link
          href={ROUTES.accountProfile}
          className="stitch-cta-secondary mt-5 inline-flex"
        >
          개인정보로 돌아가기
        </Link>
      </section>
    </AccountPageShell>
  );
}

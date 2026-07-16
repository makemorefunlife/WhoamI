"use client";

import Link from "next/link";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import AccountPageShell from "@/components/account/AccountPageShell";
import { ROUTES } from "@/constants/routes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function AccountBillingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const messages = useMessages();

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="billing" title={messages.account.billingLabel}>
        <p className="text-sm text-on-surface-variant">{messages.account.loading}</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={ROUTES.accountBilling} />;
  }

  return (
    <AccountPageShell
      activeTab="billing"
      title={messages.account.billingLabel}
      subtitle={messages.account.billingSubtitle}
    >
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {messages.account.billingComingSoon}
        </p>
        <Link
          href={ROUTES.accountProfile}
          className="stitch-cta-secondary mt-5 inline-flex"
        >
          {messages.account.backToProfile}
        </Link>
      </section>
    </AccountPageShell>
  );
}

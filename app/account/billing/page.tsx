"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import AccountPageShell from "@/components/account/AccountPageShell";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function AccountBillingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { messages, href } = useLocale();

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="billing" title={messages.account.billingLabel}>
        <p className="text-sm text-on-surface-variant">{messages.account.loading}</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={href(ROUTES.accountBilling)} />;
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
        <LocaleLink
          href={ROUTES.accountProfile}
          className="stitch-cta-secondary mt-5 inline-flex"
        >
          {messages.account.backToProfile}
        </LocaleLink>
      </section>
    </AccountPageShell>
  );
}

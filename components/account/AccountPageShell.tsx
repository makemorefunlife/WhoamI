"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import { ROUTES } from "@/constants/routes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type AccountTab = "profile" | "billing";

export default function AccountPageShell({
  activeTab,
  title,
  subtitle,
  children,
}: {
  activeTab: AccountTab;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const messages = useMessages();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-lg px-5 pb-28 pt-6 sm:px-6 sm:pt-8">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            {messages.account.eyebrow}
          </p>
          <h1 className="stitch-headline mt-2 text-3xl text-primary">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {subtitle}
            </p>
          ) : null}
        </header>

        <nav className="mb-8 flex flex-wrap gap-2">
          <Link
            href={ROUTES.accountProfile}
            className={
              activeTab === "profile"
                ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
                : "rounded-full border border-outline-variant/40 bg-surface-container-low/60 px-4 py-2 text-sm text-on-surface-variant transition hover:border-outline-variant"
            }
          >
            {messages.account.profileLabel}
          </Link>
          <Link
            href={ROUTES.accountBilling}
            className={
              activeTab === "billing"
                ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
                : "rounded-full border border-outline-variant/40 bg-surface-container-low/60 px-4 py-2 text-sm text-on-surface-variant transition hover:border-outline-variant"
            }
          >
            {messages.account.billingLabel}
          </Link>
        </nav>

        <div className="space-y-8">{children}</div>
      </div>
    </StitchSurveyShell>
  );
}

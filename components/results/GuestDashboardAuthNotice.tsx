"use client";

import { SignInButton } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function GuestDashboardAuthNotice() {
  const { messages, href: localize } = useLocale();
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
            {messages.report.guestNoticeTitle}
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {messages.report.guestNoticeP1Lead}
            <span className="font-medium text-primary">
              {messages.report.guestNoticeP1Bold1}
            </span>
            {messages.report.guestNoticeP1Mid}
            <span className="font-medium text-primary">
              {messages.report.guestNoticeP1Bold2}
            </span>
            .
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {messages.report.guestNoticeP2Lead}
            <span className="font-medium text-primary">
              {messages.report.guestNoticeP2Bold}
            </span>
            .
          </p>
          <SignInButton mode="modal" forceRedirectUrl={localize("/blueprint-preview")}>
            <button type="button" className="stitch-cta-primary mt-1 w-full sm:w-auto">
              {messages.report.guestNoticeSignInCta}
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, href: localize } = useLocale();

  const token =
    searchParams.get("token") || searchParams.get("invite") || "";

  const message = useMemo(() => {
    if (!token) return messages.invite.invalidToken;
    return messages.invite.inviteMessage;
  }, [token, messages]);

  const handleStart = () => {
    if (!token) {
      alert(messages.invite.missingTokenAlert);
      return;
    }

    localStorage.setItem("inviteToken", token);
    // Report is created on the home page when a nickname is entered — going straight to the survey has no reportId yet.
    router.push(localize(`/?token=${encodeURIComponent(token)}`));
  };

  return (
    <main className="min-h-screen bg-surface px-6 py-16 sm:py-24">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="stitch-headline text-2xl font-extrabold text-primary sm:text-3xl">
          {messages.invite.title}
        </h1>

        <div className="w-full rounded-extra-large border border-outline-variant/30 bg-surface-container-low/50 p-5">
          <p className="text-balance leading-relaxed text-on-surface">
            {message}
          </p>
          {token ? (
            <p className="mt-3 break-all text-xs text-on-surface-variant/60">
              token: {token}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <p className="text-sm leading-relaxed text-on-surface-variant/80">
            {messages.invite.startBody}
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="group relative z-10 inline-flex w-full min-w-[16rem] cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#234d3c] via-[#1a382c] to-[#12281f] px-8 py-4 text-base font-bold tracking-wide text-[#fffdf8] shadow-[0_16px_36px_rgba(26,51,40,0.32),0_2px_0_rgba(255,255,255,0.18)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(26,51,40,0.42),0_0_0_2px_rgba(58,143,110,0.4)] active:scale-[0.98]"
          >
            <span>{messages.invite.startCta}</span>
            <span
              className="text-lg font-semibold transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

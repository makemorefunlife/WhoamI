"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ResolveState = "loading" | "valid" | "invalid";

/**
 * Landing page for a personal connect link (/connect?token=...) — mirrors
 * app/invite/InviteContent.tsx's shape exactly (same redirect-into-onboarding
 * pattern via localStorage), but personalizes the copy by resolving the
 * token's owner name first, and never leaks whether an arbitrary token
 * exists: an expired/reset/unknown token all render the same invalid state.
 */
export default function ConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, href: localize } = useLocale();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<ResolveState>(token ? "loading" : "invalid");
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/connect/resolve?token=${encodeURIComponent(token)}`);
        const data = (await res.json().catch(() => ({}))) as {
          valid?: boolean;
          ownerName?: string;
        };
        if (cancelled) return;
        if (res.ok && data.valid) {
          setOwnerName(data.ownerName?.trim() || messages.connect.someoneFallbackName);
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        if (!cancelled) setState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, messages]);

  const handleStart = () => {
    if (!token) return;
    localStorage.setItem("connectToken", token);
    router.push(localize(`/?connectToken=${encodeURIComponent(token)}`));
  };

  const title =
    state === "loading"
      ? messages.invite.loadingFallback
      : state === "invalid"
        ? messages.connect.invalidTitle
        : messages.connect.invitedByTitle(ownerName);
  const body =
    state === "invalid" ? messages.connect.invalidBody : messages.connect.invitedByBody;

  return (
    <main className="min-h-screen bg-surface px-6 py-16 sm:py-24">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="stitch-headline text-2xl font-extrabold text-primary sm:text-3xl">
          {title}
        </h1>

        {state !== "loading" ? (
          <div className="w-full rounded-extra-large border border-outline-variant/30 bg-surface-container-low/50 p-5">
            <p className="text-balance leading-relaxed text-on-surface">{body}</p>
          </div>
        ) : null}

        {state === "valid" ? (
          <div className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="group relative z-10 inline-flex w-full min-w-[16rem] cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#234d3c] via-[#1a382c] to-[#12281f] px-8 py-4 text-base font-bold tracking-wide text-[#fffdf8] shadow-[0_16px_36px_rgba(26,51,40,0.32),0_2px_0_rgba(255,255,255,0.18)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(26,51,40,0.42),0_0_0_2px_rgba(58,143,110,0.4)] active:scale-[0.98]"
            >
              <span>{messages.connect.startCta}</span>
              <span
                className="text-lg font-semibold transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

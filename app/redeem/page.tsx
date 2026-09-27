"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { resolveHubHrefForIntent } from "@/lib/stitch/hubPaths";

type RedeemState = "idle" | "submitting" | "success" | "error";

/**
 * Every reason string either redeem RPC (redeem_gift_personal_coupon,
 * redeem_tester_personal_code) can surface, plus the two client-side-only
 * reasons (missing_code, error) -- see app/api/redeem/route.ts. Keeping this
 * as a plain lookup (not a switch with a default swallowing typos) means a
 * new reason added to either RPC without a matching copy key here fails
 * loudly in review rather than silently falling back to the generic error.
 */
function reasonCopy(
  reason: string | null,
  copy: ReturnType<typeof useLocale>["messages"]["redeem"],
): string {
  switch (reason) {
    case "missing_code":
      return copy.errorMissingCode;
    case "not_found":
      return copy.errorNotFound;
    case "inactive":
      return copy.errorInactive;
    case "expired":
      return copy.errorExpired;
    case "exhausted":
      return copy.errorExhausted;
    case "already_redeemed":
      return copy.errorAlreadyRedeemed;
    case "already_redeemed_or_revoked":
      return copy.errorAlreadyRedeemedOrRevoked;
    case "cannot_claim_own_gift":
      return copy.errorCannotClaimOwnGift;
    default:
      return copy.errorGeneric;
  }
}

function RedeemContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const { messages, href } = useLocale();
  const copy = messages.redeem;
  const searchParams = useSearchParams();

  const urlCode = searchParams.get("code")?.trim() ?? "";
  const [code, setCode] = useState(urlCode);
  const [state, setState] = useState<RedeemState>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [startHref, setStartHref] = useState<string | null>(null);
  // Guards the code-in-URL auto-submit to exactly once per mount, so a
  // re-render (e.g. from the startHref effect below) can never re-fire it.
  const autoSubmittedRef = useRef(false);

  const submit = useCallback(async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setState("error");
      setErrorReason("missing_code");
      return;
    }
    setState("submitting");
    setErrorReason(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
      };
      if (!res.ok || !body.ok) {
        setState("error");
        setErrorReason(body.reason ?? "error");
        return;
      }
      setState("success");
    } catch {
      setState("error");
      setErrorReason("error");
    }
  }, []);

  // ?code=... arrives via a shared gift link; once the user is signed in,
  // redeem it automatically instead of making them re-type/re-paste it --
  // this is the ONLY auto-submit path (a manually pasted/typed code always
  // goes through the form's own onSubmit below).
  useEffect(() => {
    if (!isSignedIn || !urlCode || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void submit(urlCode);
  }, [isSignedIn, urlCode, submit]);

  // Resolve the signed-in user's own Personal-analysis hub link once
  // redemption succeeds, reusing the SAME canonical-reportId resolution the
  // rest of the app uses to enter Personal analysis (see
  // lib/stitch/hubPaths.ts) rather than re-deriving report/session logic
  // here.
  useEffect(() => {
    if (state !== "success" || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      const path = await resolveHubHrefForIntent("blueprint", { isSignedIn: true });
      if (!cancelled) setStartHref(href(path));
    })();
    return () => {
      cancelled = true;
    };
  }, [state, isSignedIn, href]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    void submit(code);
  }

  if (!isLoaded) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-on-surface-variant">{messages.common.preparing}</p>
      </main>
    );
  }

  if (!isSignedIn) {
    // Preserve the code through sign-in/sign-up: redirect back to this
    // same /redeem?code=... URL once auth completes, so the auto-submit
    // effect above fires right after.
    const redirectPath = urlCode
      ? `${ROUTES.redeem}?code=${encodeURIComponent(urlCode)}`
      : ROUTES.redeem;
    return <RedirectToSignIn redirectUrl={href(redirectPath)} />;
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        {state === "success" ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-primary">{copy.successTitle}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">{copy.successSubtitle}</p>
            {startHref ? (
              <a href={startHref} className="stitch-cta-primary mt-6 inline-flex">
                {copy.successCta}
              </a>
            ) : null}
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-on-surface">{copy.pageTitle}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{copy.pageSubtitle}</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <label
                htmlFor="redeem-code-input"
                className="block text-xs font-semibold uppercase tracking-[0.1em] text-secondary"
              >
                {copy.codeInputLabel}
              </label>
              <input
                id="redeem-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={copy.codeInputPlaceholder}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                disabled={state === "submitting"}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface disabled:opacity-60"
              />
              {state === "error" ? (
                <p role="alert" className="text-xs text-rose-700">
                  {reasonCopy(errorReason, copy)}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={state === "submitting"}
                className="stitch-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "submitting" ? copy.submitting : copy.submitCta}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function RedeemFallback() {
  const { messages } = useLocale();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm text-on-surface-variant">{messages.common.preparing}</p>
    </main>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<RedeemFallback />}>
      <RedeemContent />
    </Suspense>
  );
}

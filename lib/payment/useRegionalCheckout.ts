"use client";

import { useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { resolveRegionalPlan } from "@/lib/payment/resolveRegionalPlan";
import { localizedPath, type Locale } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";

type PaddleEvent = { name: string; data?: Record<string, unknown> };

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: {
        token: string;
        eventCallback?: (event: PaddleEvent) => void;
      }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

const PADDLE_JS_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";

let paddleReadyPromise: Promise<void> | null = null;
/** Same module-level indirection as useBetaCheckout.ts -- see its comment. */
let currentEventListener: ((event: PaddleEvent) => void) | null = null;

function loadAndInitPaddle(clientToken: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (paddleReadyPromise) return paddleReadyPromise;
  paddleReadyPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PADDLE_JS_SRC;
    script.async = true;
    script.onload = () => {
      if (!window.Paddle) {
        reject(new Error("Paddle.js loaded but window.Paddle is missing"));
        return;
      }
      // Sandbox-only for this catalog too -- live Paddle is untouched.
      window.Paddle.Environment.set("sandbox");
      window.Paddle.Initialize({
        token: clientToken,
        eventCallback: (event) => currentEventListener?.(event),
      });
      resolve();
    };
    script.onerror = () => reject(new Error("failed to load Paddle.js"));
    document.head.appendChild(script);
  });
  return paddleReadyPromise;
}

/**
 * Pure -- exported for tests (tests/unit/checkout-success-redirect.test.mjs).
 * Builds the query suffix appended to Paddle's successUrl target
 * (ROUTES.thankYou, already locale-prefixed by the caller).
 *
 * When successRedirectPath is omitted (every caller before this change,
 * and every caller today except StitchPremiumCard's Personal Premium
 * flow), this reproduces the exact prior behavior byte-for-byte: the
 * current page's own query string (e.g. "?reportId=...") is carried over
 * as-is, and ThankYouClient falls back to its generic reportId-based
 * target. When successRedirectPath IS provided, it is added as an
 * (automatically percent-encoded, via URLSearchParams) "redirect" param,
 * which ThankYouClient already treats as its highest-priority target --
 * so if Paddle's own redirect wins the race against this hook's own
 * onSuccess -> router.push flow, the user still lands on the exact page
 * the caller intended instead of the generic fallback.
 */
export function buildThankYouSuccessPath(
  thankYouTarget: string,
  currentSearch: string,
  successRedirectPath?: string,
): string {
  if (successRedirectPath) {
    const params = new URLSearchParams(currentSearch);
    params.set("redirect", successRedirectPath);
    const query = params.toString();
    return `${thankYouTarget}${thankYouTarget.includes("?") ? "&" : "?"}${query}`;
  }
  return currentSearch
    ? `${thankYouTarget}${thankYouTarget.includes("?") ? "&" : "?"}${currentSearch.slice(1)}`
    : thankYouTarget;
}

export type RegionalCheckoutOutcome =
  | "success"
  | "already_processed"
  | "cancelled"
  | "error"
  | "ineligible"
  | "not_ready";

/**
 * Opens a Paddle SANDBOX checkout for one US or KR regional-catalog plan.
 * Which price id is used comes SOLELY from resolveRegionalPlan(planId) --
 * the same locale-agnostic, id-namespace-based lookup the server route
 * uses -- so a US plan id can never accidentally open a KR price or vice
 * versa. `locale` here is only for the completion request's Accept-
 * Language-style header (i18n error copy), not for price selection.
 */
export function useRegionalCheckout() {
  // isLoaded gates on Clerk having resolved auth state at all -- without
  // this, a click that lands before Clerk finishes its first load sees
  // `user` as undefined (indistinguishable from "signed out") and the
  // guard below used to return the generic "error" outcome for what is
  // really just "ask again in a moment." Callers should disable their
  // buy button while `isLoaded` is false rather than let the click
  // through to `openCheckout` at all.
  const { user, isLoaded } = useUser();
  const [busy, setBusy] = useState(false);

  const openCheckout = useCallback(
    async (
      planId: string,
      locale: Locale,
      /**
       * Optional explicit post-purchase destination (an app path, already
       * run through useLocale().href by the caller -- see
       * StitchPremiumCard). Used only to fill in Paddle's own successUrl
       * (see below); the primary checkout.completed -> onSuccess ->
       * router.push flow this hook already drives is unaffected either
       * way.
       */
      opts?: { successRedirectPath?: string },
    ): Promise<RegionalCheckoutOutcome> => {
      if (!isLoaded) return "not_ready";
      const match = resolveRegionalPlan(planId);
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN;
      if (!match || !user?.id || !clientToken) return "error";

      setBusy(true);
      try {
        // Checkout-CREATION-time server-side re-validation: re-resolves
        // plan/locale/eligibility right before Paddle opens, so a stale
        // client or a client that raced past its own eligibility gate can
        // never reach a real checkout window. Never trust the client-side
        // `match` above for anything but the price id to pass Paddle.
        const prepareRes = await fetch("/api/pricing/checkout/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-aha-locale": locale },
          body: JSON.stringify({ planId }),
        });
        if (!prepareRes.ok) {
          return prepareRes.status === 403 ? "ineligible" : "error";
        }

        await loadAndInitPaddle(clientToken);
        const priceId = match.priceId;

        return await new Promise<RegionalCheckoutOutcome>((resolve) => {
          currentEventListener = (event) => {
            if (event.name === "checkout.completed") {
              currentEventListener = null;
              const data = event.data ?? {};
              const transactionId =
                (data.transaction_id as string | undefined) ??
                (data.id as string | undefined);
              if (!transactionId) {
                resolve("error");
                return;
              }
              fetch("/api/pricing/checkout/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-aha-locale": locale },
                body: JSON.stringify({ transactionId, planId }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    resolve("error");
                    return;
                  }
                  const resBody = (await res.json().catch(() => ({}))) as {
                    alreadyProcessed?: boolean;
                  };
                  resolve(resBody.alreadyProcessed ? "already_processed" : "success");
                })
                .catch(() => resolve("error"));
            } else if (event.name === "checkout.closed") {
              currentEventListener = null;
              resolve("cancelled");
            }
          };

          // Fallback/parallel path only -- see buildThankYouSuccessPath's doc
          // comment above (and the opts.successRedirectPath one). Paddle's
          // overlay redirects the browser to successUrl on its own as soon
          // as it detects a successful payment, which can beat this hook's
          // own checkout.completed -> /checkout/complete -> onSuccess ->
          // router.push chain above to the punch (that chain is untouched
          // and still wins whenever it completes first).
          const thankYouTarget = localizedPath(ROUTES.thankYou, locale);
          const windowSearch = typeof window !== "undefined" ? window.location.search : "";
          const fullThankYouPath = buildThankYouSuccessPath(
            thankYouTarget,
            windowSearch,
            opts?.successRedirectPath,
          );

          const successUrl = typeof window !== "undefined"
            ? `${window.location.origin}${fullThankYouPath}`
            : fullThankYouPath;

          window.Paddle?.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customData: { clerkUserId: user.id, planId },
            settings: {
              locale: locale === "ko-KR" ? "ko" : "en",
              successUrl,
            },
          });
        });
      } catch {
        return "error";
      } finally {
        setBusy(false);
      }
    },
    [user?.id, isLoaded],
  );

  return { busy, openCheckout, isLoaded };
}

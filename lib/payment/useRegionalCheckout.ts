"use client";

import { useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { resolveRegionalPlan } from "@/lib/payment/resolveRegionalPlan";
import type { Locale } from "@/lib/i18n/locale";

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

export type RegionalCheckoutOutcome = "success" | "already_processed" | "cancelled" | "error";

/**
 * Opens a Paddle SANDBOX checkout for one US or KR regional-catalog plan.
 * Which price id is used comes SOLELY from resolveRegionalPlan(planId) --
 * the same locale-agnostic, id-namespace-based lookup the server route
 * uses -- so a US plan id can never accidentally open a KR price or vice
 * versa. `locale` here is only for the completion request's Accept-
 * Language-style header (i18n error copy), not for price selection.
 */
export function useRegionalCheckout() {
  const { user } = useUser();
  const [busy, setBusy] = useState(false);

  const openCheckout = useCallback(
    async (planId: string, locale: Locale): Promise<RegionalCheckoutOutcome> => {
      const match = resolveRegionalPlan(planId);
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN;
      if (!match || !user?.id || !clientToken) return "error";

      setBusy(true);
      try {
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

          window.Paddle?.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customData: { clerkUserId: user.id, planId },
          });
        });
      } catch {
        return "error";
      } finally {
        setBusy(false);
      }
    },
    [user?.id],
  );

  return { busy, openCheckout };
}

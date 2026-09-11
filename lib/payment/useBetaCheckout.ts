"use client";

import { useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { resolveBetaPlan, type BetaPlanId } from "@/lib/payment/betaPaddlePricing";
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
/**
 * Paddle v2's eventCallback is registered ONCE at Initialize() time, not
 * per Checkout.open() call — this module-level indirection is what lets
 * each openCheckout() call still get its own one-shot listener for the
 * checkout it personally opened.
 */
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
      // Sandbox-only for this Beta — see betaPaddlePricing.ts's doc comment.
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

export type BetaCheckoutOutcome = "success" | "already_processed" | "cancelled" | "error";

/**
 * Opens a Paddle SANDBOX checkout for one Beta plan and, once Paddle itself
 * reports the checkout complete, hands the transaction id to
 * /api/beta/checkout/complete — which is the actual trust boundary (it
 * re-verifies the transaction against Paddle's own Sandbox API server-side
 * before granting anything; this hook's job ends at "tell the server which
 * transaction to check").
 */
export function useBetaCheckout() {
  const { user } = useUser();
  const [busy, setBusy] = useState(false);

  const openCheckout = useCallback(
    async (planId: BetaPlanId, locale: Locale): Promise<BetaCheckoutOutcome> => {
      const plan = resolveBetaPlan(planId);
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN;
      if (!plan || !user?.id || !clientToken) return "error";

      setBusy(true);
      try {
        await loadAndInitPaddle(clientToken);
        const priceId = plan.priceId;

        return await new Promise<BetaCheckoutOutcome>((resolve) => {
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
              fetch("/api/beta/checkout/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-aha-locale": locale },
                body: JSON.stringify({ transactionId, planId }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    resolve("error");
                    return;
                  }
                  const body = (await res.json().catch(() => ({}))) as {
                    alreadyProcessed?: boolean;
                  };
                  resolve(body.alreadyProcessed ? "already_processed" : "success");
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

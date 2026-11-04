"use client";

import { useCallback, useRef, useState } from "react";
import { localizedPath, type Locale } from "@/lib/i18n/locale";

/**
 * Opens the Toss Payments payment window (SDK v2, "standard") for a
 * Toss-sold plan. Flow:
 *   1. POST /api/payments/toss/orders -> server fixes orderId/amount/currency
 *   2. payment.requestPayment(...) -> Toss redirects to
 *      /checkout/toss/success?paymentKey&orderId&amount (or /checkout/toss/fail)
 *   3. the success page POSTs /api/payments/toss/confirm (the only place
 *      money is captured and the entitlement granted)
 *
 * requestPayment navigates away on success, so the returned promise only
 * resolves for outcomes that keep the buyer on this page.
 */
type TossPaymentsFactory = ((clientKey: string) => {
  payment: (opts: { customerKey: string }) => {
    requestPayment: (params: Record<string, unknown>) => Promise<unknown>;
  };
}) & { ANONYMOUS?: string };

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

const TOSS_SDK_SRC = "https://js.tosspayments.com/v2/standard";
let sdkPromise: Promise<TossPaymentsFactory> | null = null;

function loadTossSdk(): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.onload = () => (window.TossPayments ? resolve(window.TossPayments) : reject(new Error("TossPayments missing")));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("failed to load Toss SDK"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export type TossCheckoutOutcome =
  | "redirecting"
  | "cancelled"
  | "already_member"
  | "not_configured"
  | "sign_in_required"
  | "invalid_email"
  | "error";

type OrderResponse = {
  orderId: string;
  orderName: string;
  amount: number;
  currency: "USD" | "KRW";
  method: "CARD" | "FOREIGN_EASY_PAY";
  guest: boolean;
  customerKey: string | null;
  customerEmail: string | null;
  clientKey: string;
};

export function useTossCheckout() {
  const [busy, setBusy] = useState(false);
  // Raw diagnostic for the "error" outcome -- the SDK's own code/message when
  // requestPayment() rejects client-side (never reaches Toss's hosted window,
  // so it never shows up in the /checkout/toss/fail URL), or a short reason
  // for the earlier validation failures below. Cleared at the start of each
  // attempt. A ref, not state: the caller reads it right after `await
  // startTossCheckout(...)` resolves, in the SAME closure that called it --
  // a state value captured at that closure's own render would still be the
  // PREVIOUS attempt's value (this hook's setState hasn't re-rendered the
  // caller yet), while a ref's `.current` is always the live value.
  const lastErrorRef = useRef<string | null>(null);

  const startTossCheckout = useCallback(
    async (
      planId: string,
      locale: Locale,
      opts?: {
        returnPath?: string;
        /** Signed-out purchase: the email the buyer will verify to claim it. */
        guestEmail?: string;
        /** Signed-out purchase: terms / privacy / withdrawal notice accepted. */
        agreedToTerms?: boolean;
      },
    ): Promise<TossCheckoutOutcome> => {
      setBusy(true);
      lastErrorRef.current = null;
      try {
        const res = await fetch("/api/payments/toss/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-aha-locale": locale },
          body: JSON.stringify({
            planId,
            ...(opts?.guestEmail !== undefined
              ? { guestEmail: opts.guestEmail, agreedToTerms: opts.agreedToTerms === true }
              : {}),
          }),
        });
        const order = (await res.json().catch(() => ({}))) as Partial<OrderResponse> & { code?: string };
        if (!res.ok) {
          if (order.code === "already_member") return "already_member";
          if (order.code === "toss_not_configured" || order.code === "currency_not_enabled") return "not_configured";
          if (order.code === "sign_in_required") return "sign_in_required";
          if (order.code === "invalid_email" || order.code === "consent_required") return "invalid_email";
          lastErrorRef.current = `orders:${res.status} ${order.code ?? "unknown"}`;
          return "error";
        }
        if (!order.orderId || !order.clientKey || !order.amount || !order.currency || !order.method) {
          lastErrorRef.current = "orders:incomplete_response";
          return "error";
        }

        const TossPayments = await loadTossSdk();
        const customerKey = order.guest ? TossPayments.ANONYMOUS : order.customerKey;
        if (!customerKey) {
          lastErrorRef.current = "orders:no_customer_key";
          return "error";
        }
        const payment = TossPayments(order.clientKey).payment({ customerKey });

        const origin = window.location.origin;
        const qp = new URLSearchParams();
        if (opts?.returnPath) qp.set("redirect", opts.returnPath);
        if (order.guest) qp.set("guest", "1");
        const q = qp.toString() ? `?${qp.toString()}` : "";
        const successUrl = `${origin}${localizedPath("/checkout/toss/success", locale)}${q}`;
        const failUrl = `${origin}${localizedPath("/checkout/toss/fail", locale)}${q}`;

        const params: Record<string, unknown> = {
          method: order.method,
          amount: { currency: order.currency, value: order.amount },
          orderId: order.orderId,
          orderName: order.orderName,
          successUrl,
          failUrl,
        };
        if (order.customerEmail) params.customerEmail = order.customerEmail;
        if (order.method === "FOREIGN_EASY_PAY") {
          // Per Toss's own SDK v2 reference (docs.tosspayments.com/sdk/v2/js/
          // payment-window -> requestPayment -> foreignEasyPay), the object
          // is { country, products?, shipping?, paymentMethodOptions? } --
          // there is no documented `provider` key (the old value here was
          // never a real parameter; Toss likely just ignored it). `products`
          // is listed as needed for PayPal seller protection, so it's
          // included even though the field itself isn't marked required.
          params.foreignEasyPay = {
            country: "US",
            products: [
              {
                name: order.orderName,
                quantity: 1,
                unitAmount: order.amount,
                currency: order.currency,
                description: order.orderName,
              },
            ],
          };
        } else {
          params.card = { flowMode: "DEFAULT", useEscrow: false, useCardPoint: false, useAppCardOnly: false };
        }

        await payment.requestPayment(params);
        return "redirecting";
      } catch (e) {
        // The SDK rejects with code USER_CANCEL when the buyer closes the window.
        const errObj = e as { code?: string; message?: string } | null;
        const code = errObj?.code;
        if (code !== "USER_CANCEL") {
          console.error("[TossCheckout] requestPayment failed:", errObj?.code || "unknown", errObj?.message || "");
          lastErrorRef.current = `sdk:${errObj?.code ?? "unknown"} ${errObj?.message ?? ""}`.trim();
        }
        return code === "USER_CANCEL" ? "cancelled" : "error";
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { busy, startTossCheckout, lastErrorRef };
}

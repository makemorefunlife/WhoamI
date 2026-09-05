"use client";

import { useEffect, useState } from "react";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const isDisplayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari's own (non-standard) flag for "launched from the home screen".
  const isIosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(isDisplayModeStandalone || isIosStandalone);
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
}

/**
 * "Add to Home Screen" button — spec: a web service without a native app,
 * offering an in-product way to install it like one.
 *
 * Chrome/Edge/Android: listens for `beforeinstallprompt`, then calls the
 * browser's own native install prompt on click.
 *
 * iOS Safari: Apple deliberately does not expose any way for a page to
 * trigger "Add to Home Screen" itself — `beforeinstallprompt` never fires
 * there. The best available option is showing the manual steps.
 *
 * Already installed (running in standalone display mode): shows a plain
 * confirmation instead of a button with nothing useful to do.
 */
export default function InstallAppButton() {
  const messages = useMessages();
  const copy = messages.installApp;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsIos(isIosDevice());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  }

  const canInstall = isIos || Boolean(deferredPrompt);

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      <h2 className="stitch-headline text-xl text-primary">{copy.title}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{copy.subtitle}</p>

      <div className="mt-4">
        {isStandalone ? (
          <p className="text-sm font-medium text-on-surface-variant">{copy.installedLabel}</p>
        ) : canInstall ? (
          <button
            type="button"
            onClick={() => void handleInstallClick()}
            className="w-full min-h-[48px] rounded-full border border-outline-variant/45 px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low active:scale-[0.99] sm:w-auto sm:px-6"
          >
            {copy.installCta}
          </button>
        ) : (
          <p className="text-sm text-on-surface-variant">{copy.unsupportedLabel}</p>
        )}
      </div>

      {showIosInstructions ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">{copy.iosInstructionsTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.iosInstructionsBody}</p>
            <button
              type="button"
              onClick={() => setShowIosInstructions(false)}
              className="mt-5 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              {copy.iosInstructionsClose}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

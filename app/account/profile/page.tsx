"use client";

import { RedirectToSignIn, UserProfile, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AccountBirthEditor from "@/components/account/AccountBirthEditor";
import AccountPageShell from "@/components/account/AccountPageShell";
import AccountSurveySection from "@/components/account/AccountSurveySection";
import DisplayNameEditor from "@/components/account/DisplayNameEditor";
import { ROUTES } from "@/constants/routes";
import { useLocale, useMessages } from "@/lib/i18n/LocaleProvider";

export default function AccountProfilePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { href } = useLocale();
  const messages = useMessages();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="profile" title={messages.account.profileLabel}>
        <p className="text-sm text-on-surface-variant">{messages.account.loading}</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={href(ROUTES.accountProfile)} />;
  }

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || messages.account.deleteAccountError);
      }
      window.alert(messages.account.deleteAccountFarewell);
      router.replace(href(ROUTES.home));
    } catch (e) {
      const msg =
        e instanceof Error && e.message.trim()
          ? e.message
          : messages.account.deleteAccountError;
      setDeleteError(msg);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <AccountPageShell
      activeTab="profile"
      title={messages.account.profileLabel}
      subtitle={messages.account.profileSubtitle}
    >
      <DisplayNameEditor />
      <AccountBirthEditor />
      <AccountSurveySection />

      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">
          {messages.account.settingsTitle}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {messages.account.settingsSubtitle}
        </p>
        <p className="mt-2 text-xs text-on-surface-variant/80">
          {messages.account.deleteAccountHint}
        </p>
        <div className="mt-4">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl border border-rose-500/70 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? messages.account.deleteAccountDeleting
              : messages.account.deleteAccountButton}
          </button>
          {deleteError ? (
            <p className="mt-2 text-xs text-rose-700">{deleteError}</p>
          ) : null}
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/80">
          <UserProfile
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "#2d5a47",
                colorBackground: "#fffdf8",
                borderRadius: "0.75rem",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                navbar: "hidden",
                pageScrollBox: "p-0",
              },
            }}
          />
        </div>
      </section>
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">
              {messages.account.deleteAccountConfirmTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {messages.account.deleteAccountConfirmBody}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {messages.account.deleteAccountCancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteAccount()}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.99] disabled:opacity-50"
              >
                {deleting
                  ? messages.account.deleteAccountDeleting
                  : messages.account.deleteAccountConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AccountPageShell>
  );
}

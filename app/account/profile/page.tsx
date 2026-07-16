"use client";

import { RedirectToSignIn, UserProfile, useAuth } from "@clerk/nextjs";
import AccountBirthEditor from "@/components/account/AccountBirthEditor";
import AccountPageShell from "@/components/account/AccountPageShell";
import AccountSurveySection from "@/components/account/AccountSurveySection";
import { ROUTES } from "@/constants/routes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function AccountProfilePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const messages = useMessages();

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="profile" title={messages.account.profileLabel}>
        <p className="text-sm text-on-surface-variant">{messages.account.loading}</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={ROUTES.accountProfile} />;
  }

  return (
    <AccountPageShell
      activeTab="profile"
      title={messages.account.profileLabel}
      subtitle={messages.account.profileSubtitle}
    >
      <AccountBirthEditor />
      <AccountSurveySection />

      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">
          {messages.account.settingsTitle}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {messages.account.settingsSubtitle}
        </p>
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
    </AccountPageShell>
  );
}

"use client";

import Link from "next/link";
import { RedirectToSignIn, UserProfile, useAuth } from "@clerk/nextjs";
import AccountBirthEditor from "@/components/account/AccountBirthEditor";
import { ROUTES } from "@/constants/routes";

export default function AccountProfilePage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] px-4 pt-24 text-center text-sm text-white/50">
        불러오는 중…
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={ROUTES.accountProfile} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 pb-16 pt-20 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-10">
          <nav className="flex gap-2 text-sm">
            <Link
              href={ROUTES.accountProfile}
              className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white"
            >
              내 정보
            </Link>
            <Link
              href={ROUTES.accountBilling}
              className="rounded-full border border-white/20 px-3 py-1.5 text-white/70"
            >
              결제 내역
            </Link>
          </nav>

          <section id="birth" className="scroll-mt-24">
            <AccountBirthEditor />
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-white/95">계정 설정</h2>
            <UserProfile
              routing="hash"
              appearance={{
                variables: { colorPrimary: "#4a90e2", borderRadius: "0.75rem" },
                elements: {
                  rootBox: "w-full",
                  card: "shadow-xl border border-white/10 bg-[#121a2c]",
                },
              }}
            />
          </section>
        </div>
      </div>
  );
}


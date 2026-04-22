"use client";

import { UserProfile, RedirectToSignIn, useAuth } from "@clerk/nextjs";

export default function AccountPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] px-4 pt-24 text-center text-sm text-white/50">
        불러오는 중…
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl="/account" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto flex max-w-3xl justify-center">
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
      </div>
    </div>
  );
}

"use client";

import CookieBanner from "@/components/legal/CookieBanner";
import LegalConsentGuard from "@/components/legal/LegalConsentGuard";
import StitchAppChrome from "@/components/layout/stitch/StitchAppChrome";
import { openStitchAuthModal } from "@/lib/stitch/authBridge";

export default function ConditionalAppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StitchAppChrome onOpenAuth={openStitchAuthModal}>
      <LegalConsentGuard />
      {children}
      <CookieBanner />
    </StitchAppChrome>
  );
}

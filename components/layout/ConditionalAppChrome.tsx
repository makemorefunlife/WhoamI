"use client";

import StitchAppChrome from "@/components/layout/stitch/StitchAppChrome";
import { openStitchAuthModal } from "@/lib/stitch/authBridge";

export default function ConditionalAppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StitchAppChrome onOpenAuth={openStitchAuthModal}>
      {children}
    </StitchAppChrome>
  );
}

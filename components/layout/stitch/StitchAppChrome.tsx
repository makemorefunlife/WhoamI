"use client";

import type { ReactNode } from "react";
import StitchAppFooter from "@/components/layout/stitch/StitchAppFooter";
import StitchFixedHeader from "@/components/layout/stitch/StitchFixedHeader";
import StitchScrollDock from "@/components/layout/stitch/StitchScrollDock";

export default function StitchAppChrome({
  children,
  onOpenAuth,
}: {
  children: ReactNode;
  onOpenAuth?: () => void;
}) {
  return (
    <>
      <StitchFixedHeader onOpenAuth={onOpenAuth} />
      <div className="flex min-h-dvh flex-col pt-16 pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
        {children}
        <StitchAppFooter />
      </div>
      <StitchScrollDock onOpenAuth={onOpenAuth} />
    </>
  );
}

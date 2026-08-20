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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary"
      >
        Skip to content
      </a>
      <StitchFixedHeader onOpenAuth={onOpenAuth} />
      <div className="flex min-h-dvh flex-col pt-16 pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
        {children}
        <StitchAppFooter />
      </div>
      <StitchScrollDock onOpenAuth={onOpenAuth} />
    </>
  );
}

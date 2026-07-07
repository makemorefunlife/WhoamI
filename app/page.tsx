"use client";

import { Suspense } from "react";
import HomeContent from "./homecontent";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface px-6">
          <p className="text-sm text-on-surface-variant">Loading…</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

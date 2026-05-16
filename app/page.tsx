"use client";

import { Suspense } from "react";
import SpaceLoading from "@/components/space/SpaceLoading";
import HomeContent from "./homecontent";

const homeShellClass =
  "min-h-screen bg-gradient-to-br from-[#0a0a2a] via-[#12123a] to-[#1a1a4a]";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className={`flex min-h-screen items-center justify-center px-6 ${homeShellClass}`}
        >
          <SpaceLoading
            rotateMainOnly
            rotatingStatuses={["탐사하는 중", "특징 분석 중", "패턴 분석 중"]}
          />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

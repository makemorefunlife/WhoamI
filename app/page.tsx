"use client";

import { Suspense } from "react";
import SpaceBackground from "@/components/space/SpaceBackground";
import SpaceLoading from "@/components/space/SpaceLoading";
import HomeContent from "./homecontent";

export default function Page() {
  return (
    <SpaceBackground>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center px-6">
            <SpaceLoading
              rotateMainOnly
              rotatingStatuses={["탐사하는 중", "특징 분석 중", "패턴 분석 중"]}
            />
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </SpaceBackground>
  );
}

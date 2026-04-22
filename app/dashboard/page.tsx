import { Suspense } from "react";
import SpaceBackground from "@/components/space/SpaceBackground";
import SpaceLoading from "@/components/space/SpaceLoading";
/** 대시보드 본문 UI·아코디언은 `DashboardContent.tsx`에서 다룹니다. */
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground>
          <div className="relative z-10 flex min-h-screen items-center justify-center px-5">
            <SpaceLoading />
          </div>
        </SpaceBackground>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

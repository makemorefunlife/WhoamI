import { Suspense } from "react";
import SpaceBackground from "@/components/space/SpaceBackground";
import SpaceLoading from "@/components/space/SpaceLoading";
import RelationshipsDashboard from "./RelationshipsDashboard";

export default function RelationshipsPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground>
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <SpaceLoading />
          </div>
        </SpaceBackground>
      }
    >
      <RelationshipsDashboard />
    </Suspense>
  );
}

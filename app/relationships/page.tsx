import { Suspense } from "react";
import RelationHubShell from "@/components/relationship/hub/RelationHubShell";
import {
  FriendStoryRowSkeleton,
  HubAnalysisListSkeleton,
  RelationHubActionSkeleton,
} from "@/components/ui/stitch/StitchSkeleton";
import RelationshipsDashboard from "./RelationshipsDashboard";

function RelationHubFallback() {
  return (
    <RelationHubShell>
      <div className="space-y-8">
        <FriendStoryRowSkeleton />
        <RelationHubActionSkeleton />
        <HubAnalysisListSkeleton />
      </div>
    </RelationHubShell>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<RelationHubFallback />}>
      <RelationshipsDashboard />
    </Suspense>
  );
}

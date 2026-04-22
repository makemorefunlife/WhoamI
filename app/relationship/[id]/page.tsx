import { Suspense } from "react";
import SpaceBackground from "@/components/space/SpaceBackground";
import SpaceLoading from "@/components/space/SpaceLoading";
import RelationshipView from "./RelationshipView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RelationshipPage({ params }: PageProps) {
  const { id } = await params;

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
      <RelationshipView relationshipReportId={id ?? ""} />
    </Suspense>
  );
}

"use client";

import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type PreviewClientProps = {
  report: RomanticSajuDeepReport["report"];
};

export default function PreviewClient({ report }: PreviewClientProps) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
      <RelationshipPremiumSection
        busy={false}
        premiumKind="romantic"
        analysisType="premium"
        premiumReady
        hasSnapshotView={false}
        partnerName="Jun"
        viewerName="Mina"
        nameA="Mina"
        nameB="Jun"
        viewerIsReportA
        displayPremium={null}
        displayRomanticDeep={report}
        displayWorkDeep={null}
        displayCohabitationDeep={null}
        displayFamilyDeep={null}
        displayFriendshipDeep={null}
        onRunPremium={async () => false}
        onRegeneratePremium={() => {}}
        forceVisible
      />
    </main>
  );
}

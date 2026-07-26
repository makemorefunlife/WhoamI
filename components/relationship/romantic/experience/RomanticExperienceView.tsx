"use client";

/**
 * Romantic Experience composition root (Batch B0 stub).
 * Safe entry only — no modules, no ScoreBoard, no RelationshipReportLayout.
 * Later batches replace the stub body with M1–M10.
 */
import {
  RelationshipReportBody,
  RelationshipReportCard,
  RelationshipReportParagraph,
} from "@/components/relationship/reportLayout";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

export type RomanticExperienceViewProps = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA?: boolean;
};

export default function RomanticExperienceView({
  myName,
  partnerName,
}: RomanticExperienceViewProps) {
  return (
    <div
      data-romantic-experience="v2-stub"
      className="space-y-6 sm:space-y-8"
    >
      <RelationshipReportCard title="Romantic Experience">
        <RelationshipReportBody>
          <RelationshipReportParagraph>
            {myName} · {partnerName}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph muted>
            Experience view stub (V2). Legacy report remains the default until
            modules ship. Set ROMANTIC_EXPERIENCE_LEGACY=1 to force the previous
            UI.
          </RelationshipReportParagraph>
        </RelationshipReportBody>
      </RelationshipReportCard>
    </div>
  );
}

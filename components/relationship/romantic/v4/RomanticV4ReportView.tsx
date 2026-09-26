"use client";

/**
 * Romantic V4 — production UI, behind ROMANTIC_V4_REPORT.
 * Thin wrapper mirroring RomanticExperienceView.tsx's pattern: takes the
 * already-built payload (from the API response, not recomputed here) and
 * renders it through the same CanonicalReportView the /dev prototype uses.
 * No calculation happens in this component.
 */
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import { CanonicalReportView } from "./CanonicalReportView";

export type RomanticV4ReportViewProps = {
  payload: RomanticV4PrototypePayload;
  myName?: string;
  partnerName?: string;
  viewerIsReportA?: boolean;
  debug?: boolean;
};

export default function RomanticV4ReportView({
  payload,
  myName,
  partnerName,
  viewerIsReportA = true,
  debug = false,
}: RomanticV4ReportViewProps) {
  if (!payload.canonicalReport) return null;
  return (
    <div data-romantic-experience="v4" data-test-romantic="VISIBLE-V4">
      <CanonicalReportView
        report={payload.canonicalReport}
        payload={payload}
        myName={myName}
        partnerName={partnerName}
        viewerIsReportA={viewerIsReportA}
        debug={debug}
      />
    </div>
  );
}

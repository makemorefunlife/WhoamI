import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import type { AnalysisLogListItem } from "@/components/relationship/RelationshipAnalysisHistory";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import { omitWorkContextOutputFromReport } from "@/lib/relationship/workColleague/stripWorkContextOutputForClient";
import { omitFamilyContextOutputFromReport } from "@/lib/relationship/familyParent/stripFamilyContextOutputForClient";
import { omitFriendContextOutputFromReport } from "@/lib/relationship/friend/stripFriendContextOutputForClient";
import { omitMarriageContextOutputFromReport } from "@/lib/relationship/marriage/stripMarriageContextOutputForClient";
import { omitRomanticContextInputFromReport } from "@/lib/relationship/romantic/stripRomanticContextInputForClient";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial";
import {
  parseRelationshipKind,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

export type AnalysisLogSnapshot = {
  logId: string;
  kind?: RelationshipKind;
  basic?: RelationshipPerspective | null;
  premium?: RelationshipPerspective | null;
  romanticDeep?: RomanticSajuDeepReport["report"] | null;
  workDeep?: WorkColleagueReportBody | null;
  cohabitationDeep?: MarriageReportBody | null;
  familyDeep?: FamilyParentReportBody | null;
  friendshipDeep?: FriendReportBody | null;
};

export function parseAnalysisLogSnapshot(
  log: AnalysisLogListItem,
  currentKind: RelationshipKind,
): { snapshot: AnalysisLogSnapshot; kind: RelationshipKind } {
  const snap = log.result_snapshot ?? {};

  function deepReportFromSnap(): unknown {
    if (snap.report != null) return snap.report;
    const full = snap.full;
    if (full && typeof full === "object" && !Array.isArray(full)) {
      const report = (full as { report?: unknown }).report;
      if (report != null) return report;
    }
    return null;
  }

  if (log.result_format === ROMANTIC_SAJU_DEEP_FORMAT) {
    const report = deepReportFromSnap() as
      | RomanticSajuDeepReport["report"]
      | null;
    return {
      snapshot: {
        logId: log.id,
        kind: "romantic",
        romanticDeep: report
          ? omitRomanticContextInputFromReport(report)
          : null,
        workDeep: null,
        cohabitationDeep: null,
        premium: null,
      },
      kind: "romantic",
    };
  }

  if (log.result_format === WORK_COLLEAGUE_DEEP_FORMAT) {
    const report = deepReportFromSnap() as WorkColleagueReportBody | null;
    return {
      snapshot: {
        logId: log.id,
        kind: "work",
        workDeep: report
          ? omitWorkContextOutputFromReport(report)
          : null,
        romanticDeep: null,
        cohabitationDeep: null,
        premium: null,
      },
      kind: "work",
    };
  }

  if (log.result_format === COHABITATION_DEEP_FORMAT) {
    const report = deepReportFromSnap() as MarriageReportBody | null;
    return {
      snapshot: {
        logId: log.id,
        kind: "cohabitation",
        cohabitationDeep: report
          ? omitMarriageContextOutputFromReport(report)
          : null,
        romanticDeep: null,
        workDeep: null,
        familyDeep: null,
        friendshipDeep: null,
        premium: null,
      },
      kind: "cohabitation",
    };
  }

  if (log.result_format === FAMILY_PARENT_CHILD_DEEP_FORMAT) {
    const report = deepReportFromSnap() as FamilyParentReportBody | null;
    return {
      snapshot: {
        logId: log.id,
        kind: "family",
        familyDeep: report
          ? omitFamilyContextOutputFromReport(report)
          : null,
        romanticDeep: null,
        workDeep: null,
        cohabitationDeep: null,
        friendshipDeep: null,
        premium: null,
      },
      kind: "family",
    };
  }

  if (log.result_format === FRIEND_SOCIAL_DEEP_FORMAT) {
    const report = deepReportFromSnap() as FriendReportBody | null;
    return {
      snapshot: {
        logId: log.id,
        kind: "friendship",
        friendshipDeep: report
          ? omitFriendContextOutputFromReport(report)
          : null,
        romanticDeep: null,
        workDeep: null,
        cohabitationDeep: null,
        familyDeep: null,
        premium: null,
      },
      kind: "friendship",
    };
  }

  if (log.analysis_level === "premium") {
    const kind =
      log.relationship_kind !== "unspecified"
        ? parseRelationshipKind(log.relationship_kind)
        : currentKind;
    return {
      snapshot: {
        logId: log.id,
        kind,
        premium: (snap.perspective ?? null) as RelationshipPerspective | null,
        romanticDeep: null,
      },
      kind,
    };
  }

  return {
    snapshot: {
      logId: log.id,
      basic: (snap.perspective ?? null) as RelationshipPerspective | null,
    },
    kind: currentKind,
  };
}

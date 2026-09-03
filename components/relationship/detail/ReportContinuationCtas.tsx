"use client";

import { useRouter } from "next/navigation";
import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { otherRelationshipKinds } from "@/lib/relationship/reportContinuationKinds";
import { buildRelationshipAnalyzeUrl } from "@/lib/relationship/hubNavigation";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Report-end next steps — spec sections 25-29. Never a dead end: the same
 * pair under another lens, a different person via the existing map/people
 * surface, or a fresh invite. Reuses buildRelationshipAnalyzeUrl and the
 * existing Relationship Lab routes — no new report engine, no new invite
 * flow, no new eligibility rules (every kind is currently valid for any
 * connection, per existing product behavior — CTA-1 excludes only the kind
 * already open).
 */
export default function ReportContinuationCtas({
  relationshipReportId,
  viewerReportId,
  currentKind,
  variant,
}: {
  relationshipReportId: string;
  viewerReportId: string;
  currentKind: RelationshipKind;
  variant: "owner" | "recipient";
}) {
  const router = useRouter();
  const { messages, href: localize } = useLocale();

  function goToKind(kind: RelationshipKind) {
    router.push(
      localize(buildRelationshipAnalyzeUrl(relationshipReportId, viewerReportId, kind)),
    );
  }
  function goToHub() {
    router.push(localize(ROUTES.relationships));
  }
  function goToAddPerson() {
    router.push(localize(`${ROUTES.relationships}?section=add`));
  }

  const otherKinds = otherRelationshipKinds(currentKind);

  return (
    <div className={`${hubPanelClass()} mt-6 space-y-4 p-5`}>
      <h2 className="stitch-headline text-lg text-primary">
        {variant === "owner"
          ? messages.report.continuationTitle
          : messages.report.recipientContinuationTitle}
      </h2>

      {variant === "owner" && otherKinds.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {messages.report.exploreAnotherLensCta}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {otherKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => goToKind(kind)}
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-3 text-sm font-semibold text-primary transition hover:border-secondary/35 active:scale-[0.98]"
              >
                {messages.report.relationshipKindNames[kind]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {variant === "recipient" ? (
          <button type="button" onClick={goToHub} className={hubTouchBtn(false)}>
            {messages.report.viewMyMapCta}
          </button>
        ) : null}
        <button type="button" onClick={goToHub} className={hubTouchBtn(false)}>
          {messages.report.exploreAnotherPersonCta}
        </button>
        <button type="button" onClick={goToAddPerson} className={hubTouchBtn(false)}>
          {messages.report.addSomeoneNewCta}
        </button>
      </div>
    </div>
  );
}

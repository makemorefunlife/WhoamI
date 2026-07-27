"use client";

/**
 * Romantic Experience V2 shell behind feature flag.
 * Current scope: M1..M10 (Daily Life suppressed).
 * No ScoreBoard / RelationshipReportLayout / legacy section_* access.
 */
import { useMemo } from "react";
import {
  RelationshipReportBody,
  RelationshipReportCard,
  RelationshipReportParagraph,
} from "@/components/relationship/reportLayout";
import { buildRomanticExperienceViewModel } from "@/lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import {
  ROMANTIC_MODULE_ORDER,
  summarizeRomanticModuleSlots,
  type RomanticExperienceViewModel,
} from "@/lib/relationship/romantic/experience/romanticExperienceTypes";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

export type RomanticExperienceViewProps = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA?: boolean;
  locale?: string;
};

function availableModuleCount(vm: RomanticExperienceViewModel): number {
  return summarizeRomanticModuleSlots(vm).filter((s) => s.available).length;
}

export default function RomanticExperienceView({
  report,
  nameA,
  nameB,
  myName,
  partnerName,
  viewerIsReportA = true,
  locale,
}: RomanticExperienceViewProps) {
  const vm = useMemo(
    () =>
      buildRomanticExperienceViewModel({
        report,
        nameA,
        nameB,
        myName,
        partnerName,
        viewerIsReportA,
        locale,
      }),
    [report, nameA, nameB, myName, partnerName, viewerIsReportA, locale],
  );

  const slots = summarizeRomanticModuleSlots(vm);
  const readyCount = availableModuleCount(vm);

  return (
    <div
      data-romantic-experience="v2"
      data-romantic-build={vm.meta.buildId}
      className="space-y-6 sm:space-y-8"
    >
      <RelationshipReportCard title="Romantic Experience V2">
        <RelationshipReportBody>
          <RelationshipReportParagraph>
            {vm.meta.myName} · {vm.meta.partnerName}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph muted>
            Feature-flag shell ({vm.meta.buildId}). Ready modules: {readyCount}/
            {ROMANTIC_MODULE_ORDER.length}. Legacy report remains default unless
            V2 is explicitly enabled.
          </RelationshipReportParagraph>
          <ul className="mt-3 space-y-1 text-sm text-on-surface-variant">
            {slots.map((slot) => (
              <li key={slot.id} data-module={slot.id} data-available={slot.available}>
                {slot.id}
                {slot.available ? " · ready" : " · omitted"}
              </li>
            ))}
          </ul>
        </RelationshipReportBody>
      </RelationshipReportCard>

      {vm.opening.available ? (
        <RelationshipReportCard title="M1 Hero">
          <RelationshipReportBody>
            {vm.opening.signature ? (
              <RelationshipReportParagraph>
                {vm.opening.signature}
              </RelationshipReportParagraph>
            ) : null}
            {vm.opening.paradox ? (
              <RelationshipReportParagraph muted>
                {vm.opening.paradox}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.snapshot.available ? (
        <RelationshipReportCard title="M2 Relationship Snapshot">
          <RelationshipReportBody>
            <ul className="space-y-2">
              {vm.snapshot.signals.map((signal) => (
                <li key={signal.kind} className="text-sm leading-relaxed">
                  <span className="font-medium">{signal.label}:</span>{" "}
                  {signal.summary}
                </li>
              ))}
            </ul>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.differenceMap.available ? (
        <RelationshipReportCard title="M3 Difference Map">
          <RelationshipReportBody>
            {vm.differenceMap.openingContrast ? (
              <RelationshipReportParagraph>
                {vm.differenceMap.openingContrast}
              </RelationshipReportParagraph>
            ) : null}
            {vm.differenceMap.buckets.map((bucket) => (
              <div key={bucket.kind} className="space-y-2">
                <RelationshipReportParagraph className="font-medium">
                  {bucket.label}
                </RelationshipReportParagraph>
                <ul className="space-y-2">
                  {bucket.items.map((item) => (
                    <li
                      key={`${bucket.kind}-${item.aspect}`}
                      className="text-sm leading-relaxed"
                    >
                      {item.aspect}: {item.me} ↔ {item.partner}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.flow.available ? (
        <RelationshipReportCard title="M4 Relationship Flow">
          <RelationshipReportBody>
            <ul className="space-y-2">
              {vm.flow.nodes.map((node) => (
                <li key={node.key} className="text-sm leading-relaxed">
                  <span className="font-medium">{node.label}:</span>{" "}
                  {node.body}
                </li>
              ))}
            </ul>
            {vm.flow.interrupt ? (
              <RelationshipReportParagraph className="mt-3" muted>
                {vm.flow.interrupt.label}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.hiddenHeart.available ? (
        <RelationshipReportCard title="M5 Hidden Heart">
          <RelationshipReportBody>
            {vm.hiddenHeart.me ? (
              <RelationshipReportParagraph>
                <span className="font-medium">{vm.hiddenHeart.me.name}:</span>{" "}
                {vm.hiddenHeart.me.need ?? vm.hiddenHeart.me.reason ?? vm.hiddenHeart.me.voice}
              </RelationshipReportParagraph>
            ) : null}
            {vm.hiddenHeart.partner ? (
              <RelationshipReportParagraph>
                <span className="font-medium">{vm.hiddenHeart.partner.name}:</span>{" "}
                {vm.hiddenHeart.partner.need ??
                  vm.hiddenHeart.partner.reason ??
                  vm.hiddenHeart.partner.voice}
              </RelationshipReportParagraph>
            ) : null}
            {vm.hiddenHeart.mutualGift ? (
              <RelationshipReportParagraph muted>
                {vm.hiddenHeart.mutualGift}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.specialDynamics.available ? (
        <RelationshipReportCard title="M6 Special Dynamics">
          <RelationshipReportBody>
            {vm.specialDynamics.gifts.map((gift, idx) => (
              <RelationshipReportParagraph key={`${gift.from}-${gift.to}-${idx}`}>
                <span className="font-medium">
                  {gift.from} → {gift.to}
                </span>
                : {gift.body}
              </RelationshipReportParagraph>
            ))}
            {vm.specialDynamics.onlyTogether ? (
              <RelationshipReportParagraph>
                {vm.specialDynamics.onlyTogether}
              </RelationshipReportParagraph>
            ) : null}
            {vm.specialDynamics.whySpecial ? (
              <RelationshipReportParagraph muted>
                {vm.specialDynamics.whySpecial}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.conflictTranslation.available ? (
        <RelationshipReportCard title="M7 Conflict Translation">
          <RelationshipReportBody>
            {vm.conflictTranslation.situationTitle ? (
              <RelationshipReportParagraph>
                {vm.conflictTranslation.situationTitle}
              </RelationshipReportParagraph>
            ) : null}
            {!vm.conflictTranslation.rows.some((row) => row.meant || row.heard) ? (
              <RelationshipReportParagraph muted>
                Current payload exposes said/better only; meant/heard rows are safely reduced.
              </RelationshipReportParagraph>
            ) : null}
            <ul className="space-y-3">
              {vm.conflictTranslation.rows.map((row, idx) => (
                <li
                  key={`${row.speakerLabel}-${idx}`}
                  className="rounded-xl border border-outline-variant/25 p-3 text-sm leading-relaxed"
                >
                  <p>
                    <span className="font-medium">{row.speakerLabel}</span>:{" "}
                    {row.said ?? "—"}
                  </p>
                  {row.meant || row.heard ? (
                    <>
                      <p className="mt-1 text-on-surface-variant">
                        Meant: {row.meant ?? "—"}
                      </p>
                      <p className="mt-1 text-on-surface-variant">
                        Heard: {row.heard ?? "—"}
                      </p>
                    </>
                  ) : null}
                  {row.better ? (
                    <p className="mt-2">
                      <span className="font-medium">Better:</span> {row.better}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.repairGuide.available ? (
        <RelationshipReportCard title="M8 Repair Guide">
          <RelationshipReportBody>
            <ul className="space-y-3">
              {vm.repairGuide.stages.map((stage) => (
                <li key={stage.id} className="text-sm leading-relaxed">
                  <span className="font-medium">{stage.title}:</span> {stage.body}
                  {stage.speakable ? ` (${stage.speakable})` : ""}
                </li>
              ))}
            </ul>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.doDont.available && vm.doDont.pack ? (
        <RelationshipReportCard title="M9 Do / Don't">
          <RelationshipReportBody>
            {vm.doDont.pack.items.map((item) => (
              <div key={item.topic} className="space-y-2">
                <RelationshipReportParagraph className="font-medium">
                  {item.headline}
                </RelationshipReportParagraph>
                <ul className="space-y-1 text-sm leading-relaxed">
                  {item.do_list.map((line, idx) => (
                    <li key={`do-${item.topic}-${idx}`}>Do: {line}</li>
                  ))}
                  {item.dont_list.map((line, idx) => (
                    <li key={`dont-${item.topic}-${idx}`}>Don't: {line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {vm.nextStep.available ? (
        <RelationshipReportCard title="M10 Next Step">
          <RelationshipReportBody>
            {vm.nextStep.viewerExperiments.map((step, idx) => (
              <RelationshipReportParagraph key={`${step.kind}-${idx}`}>
                <span className="font-medium">Next 24h:</span> {step.text}
              </RelationshipReportParagraph>
            ))}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}
    </div>
  );
}

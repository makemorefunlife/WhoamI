"use client";

/**
 * Deep Read — shared presentational shell for the four non-Romantic
 * saju-deep LLM narrative overlays (friend/work/cohabitation/family).
 * Renders whatever the normalized DeepReadViewModel actually contains;
 * never fabricates a subsection the overlay didn't supply.
 *
 * Order is recognition → pattern → advice → action, per the shared
 * Relationship Experience Blueprint's "Recognition before Improvement"
 * and the Narrative Style Bible's "Recognition before Advice".
 */
import type { DeepReadViewModel } from "@/lib/relationship/shared/deepReadViewModel";
import {
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
} from "@/components/relationship/reportLayout";

export type DeepReadLabels = {
  cardTitle: string;
  voiceMe: string;
  voicePartner: string;
  pattern: string;
  adviceMe: string;
  advicePartner: string;
  together: string;
};

function VoiceBlock({
  label,
  voice,
}: {
  label: string;
  voice: DeepReadViewModel["meNature"];
}) {
  if (!voice) return null;
  return (
    <div>
      <RelationshipReportLabel>{label}</RelationshipReportLabel>
      {voice.voice ? (
        <RelationshipReportParagraph className="mt-1.5 italic">
          “{voice.voice}”
        </RelationshipReportParagraph>
      ) : null}
      {voice.description ? (
        <RelationshipReportParagraph className="mt-1.5">
          {voice.description}
        </RelationshipReportParagraph>
      ) : null}
    </div>
  );
}

function AdviceBlock({
  label,
  tips,
}: {
  label: string;
  tips: DeepReadViewModel["adviceForMe"];
}) {
  if (!tips.length) return null;
  return (
    <div>
      <RelationshipReportLabel>{label}</RelationshipReportLabel>
      <div className="mt-2 space-y-3">
        {tips.map((tip, i) => (
          <RelationshipReportInset key={`${tip.actionTitle}-${i}`}>
            {tip.actionTitle ? (
              <p className="text-sm font-semibold leading-snug">
                {tip.actionTitle}
              </p>
            ) : null}
            {tip.reason ? (
              <RelationshipReportParagraph className="mt-1.5" muted>
                {tip.reason}
              </RelationshipReportParagraph>
            ) : null}
            {tip.speechTip ? (
              <RelationshipReportParagraph className="mt-1.5 italic">
                “{tip.speechTip}”
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportInset>
        ))}
      </div>
    </div>
  );
}

export default function DeepReadCard({
  vm,
  labels,
  accentColor,
}: {
  vm: DeepReadViewModel;
  labels: DeepReadLabels;
  accentColor?: string;
}) {
  return (
    <RelationshipReportCard title={labels.cardTitle} accentColor={accentColor}>
      <RelationshipReportBody>
        <VoiceBlock label={labels.voiceMe} voice={vm.meNature} />
        <VoiceBlock label={labels.voicePartner} voice={vm.partnerNature} />
        {vm.gapSignal ? (
          <RelationshipReportInset>
            <RelationshipReportLabel>{labels.pattern}</RelationshipReportLabel>
            {vm.gapSignal.matchNote ? (
              <RelationshipReportParagraph className="mt-1.5">
                {vm.gapSignal.matchNote}
              </RelationshipReportParagraph>
            ) : null}
            {vm.gapSignal.meBody ? (
              <RelationshipReportParagraph className="mt-1.5">
                {vm.gapSignal.meBody}
              </RelationshipReportParagraph>
            ) : null}
            {vm.gapSignal.partnerBody ? (
              <RelationshipReportParagraph className="mt-1.5">
                {vm.gapSignal.partnerBody}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportInset>
        ) : null}
        <AdviceBlock label={labels.adviceMe} tips={vm.adviceForMe} />
        <AdviceBlock label={labels.advicePartner} tips={vm.adviceForPartner} />
        {vm.together ? (
          <RelationshipReportInset>
            <RelationshipReportLabel>{labels.together}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {vm.together}
            </RelationshipReportParagraph>
            {vm.togetherStarter ? (
              <RelationshipReportParagraph className="mt-1.5 italic">
                “{vm.togetherStarter}”
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportInset>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

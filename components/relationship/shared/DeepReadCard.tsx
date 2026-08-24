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
  const cleanLabel = label.replace(/^▫\s*/, "");
  return (
    <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 sm:p-6 shadow-sm space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
        {cleanLabel}
      </p>
      {voice.voice ? (
        <p className="font-rel-sans text-sm font-bold text-rel-ink leading-relaxed">
          “{voice.voice}”
        </p>
      ) : null}
      {voice.description ? (
        <p className="font-rel-sans text-xs text-rel-ink-soft leading-relaxed">
          {voice.description}
        </p>
      ) : null}
    </div>
  );
}

function AdviceBlock({
  label,
  tips,
  personName,
}: {
  label: string;
  tips: DeepReadViewModel["adviceForMe"];
  personName?: string;
}) {
  if (!tips.length) return null;
  const cleanLabel = label.replace(/^▫\s*/, "");
  return (
    <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 sm:p-6 shadow-sm space-y-4">
      {personName ? (
        <div>
          <span className="inline-block rounded-full bg-rel-taupe-soft/60 px-3.5 py-1 text-xs font-semibold text-rel-ink border border-rel-line/40">
            {personName}
          </span>
        </div>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
          {cleanLabel}
        </p>
      )}

      <ul className="space-y-3.5">
        {tips.map((tip, i) => (
          <li key={`${tip.actionTitle}-${i}`} className="space-y-1.5">
            <div className="flex items-start gap-2.5">
              <span className="text-rel-deep text-sm font-bold shrink-0 mt-0.5">•</span>
              <div className="space-y-1">
                {tip.actionTitle ? (
                  <p className="font-rel-sans text-sm font-bold text-rel-ink leading-relaxed">
                    {tip.actionTitle}
                  </p>
                ) : null}
                {tip.reason ? (
                  <p className="font-rel-sans text-xs sm:text-[13.5px] text-rel-ink-soft leading-relaxed">
                    {tip.reason}
                  </p>
                ) : null}
              </div>
            </div>
            {tip.speechTip ? (
              <div className="ml-5 mt-2 rounded-xl bg-rel-taupe-soft/40 p-3.5 border border-rel-line">
                <p className="font-rel-sans text-xs text-rel-ink font-medium leading-relaxed flex items-start gap-1.5">
                  <span className="not-italic shrink-0">💬</span>
                  <span>“{tip.speechTip}”</span>
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DeepReadCard({
  vm,
  labels,
  accentColor,
  personNames,
}: {
  vm: DeepReadViewModel;
  labels: DeepReadLabels;
  accentColor?: string;
  personNames?: {
    me?: string;
    partner?: string;
  };
}) {
  const cleanPattern = labels.pattern.replace(/^▫\s*/, "");
  const cleanTogether = labels.together.replace(/^▫\s*/, "");

  return (
    <div className="space-y-6">
      <VoiceBlock label={labels.voiceMe} voice={vm.meNature} />
      <VoiceBlock label={labels.voicePartner} voice={vm.partnerNature} />
      {vm.gapSignal ? (
        <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 sm:p-6 shadow-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
            {cleanPattern}
          </p>
          {vm.gapSignal.matchNote ? (
            <p className="font-rel-sans text-sm font-bold text-rel-ink leading-relaxed">
              {vm.gapSignal.matchNote}
            </p>
          ) : null}
          {vm.gapSignal.meBody ? (
            <p className="font-rel-sans text-xs text-rel-ink-soft leading-relaxed">
              {vm.gapSignal.meBody}
            </p>
          ) : null}
          {vm.gapSignal.partnerBody ? (
            <p className="font-rel-sans text-xs text-rel-ink-soft leading-relaxed">
              {vm.gapSignal.partnerBody}
            </p>
          ) : null}
        </div>
      ) : null}
      <AdviceBlock
        label={labels.adviceMe}
        tips={vm.adviceForMe}
        personName={personNames?.me}
      />
      <AdviceBlock
        label={labels.advicePartner}
        tips={vm.adviceForPartner}
        personName={personNames?.partner}
      />
      {vm.together ? (
        <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 sm:p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
            {cleanTogether}
          </p>
          <p className="font-rel-sans text-xs sm:text-[13.5px] text-rel-ink leading-relaxed font-medium">
            {vm.together}
          </p>
          {vm.togetherStarter ? (
            <div className="rounded-xl bg-rel-taupe-soft/40 p-3.5 border border-rel-line">
              <p className="font-rel-sans text-xs text-rel-ink font-medium leading-relaxed flex items-start gap-1.5">
                <span className="not-italic shrink-0">💬</span>
                <span>“{vm.togetherStarter}”</span>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

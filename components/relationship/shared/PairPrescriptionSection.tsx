"use client";

import type {
  PairPrescriptionDomain,
  PairPrescriptionItem,
  PairPrescriptionPack,
} from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import {
  PAIR_PRESCRIPTION_DOMAIN_FOOTNOTE,
  resolveTopicMeta,
} from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import {
  RelationshipReportCard,
  RelationshipReportParagraph,
} from "@/components/relationship/reportLayout";
import { useLocale, useMessages } from "@/lib/i18n/LocaleProvider";

function ChecklistColumn({
  variant,
  title,
  items,
}: {
  variant: "do" | "dont";
  title: string;
  items: string[];
}) {
  const isDo = variant === "do";
  return (
    <div
      className={[
        "rounded-xl border p-4",
        isDo
          ? "border-emerald-400/30 bg-emerald-950/20"
          : "border-rose-400/30 bg-rose-950/20",
      ].join(" ")}
    >
      <p
        className={[
          "text-sm font-bold tracking-wide",
          isDo ? "text-emerald-200" : "text-rose-200",
        ].join(" ")}
      >
        {title}
      </p>
      <ul className="mt-3 space-y-3" role="list">
        {items.map((item, index) => (
          <li key={`${variant}-${index}`} className="flex gap-2.5 text-left">
            <span
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                isDo
                  ? "bg-emerald-500/25 text-emerald-200"
                  : "bg-rose-500/25 text-rose-200",
              ].join(" ")}
              aria-hidden
            >
              {isDo ? "✓" : "✕"}
            </span>
            <p className="text-[14px] leading-relaxed text-white/90">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrescriptionTopicCard({
  item,
  accentColor,
}: {
  item: PairPrescriptionItem;
  accentColor: string;
}) {
  const t = useMessages().relationshipDrilldown.layout;
  const { locale } = useLocale();
  const meta = resolveTopicMeta(item.topic, locale);

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/35 via-fuchsia-950/20 to-rose-950/25 shadow-[0_0_40px_-16px_rgba(212,165,232,0.35)]">
      <div
        className="border-b border-white/10 px-5 py-4"
        style={{
          background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 60%)`,
        }}
      >
        <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-0.5 text-xs font-semibold text-white/80">
          {meta.emoji} {meta.label}
        </span>
        <h4 className="mt-2 text-base font-bold leading-snug text-white/95">
          {item.headline}
        </h4>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-violet-300/20 bg-violet-950/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/80">
            {t.prescriptionWhyLabel}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-violet-50/95">
            {item.evidence.summary}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChecklistColumn
            variant="do"
            title={t.prescriptionDoLabel}
            items={item.do_list}
          />
          <ChecklistColumn
            variant="dont"
            title={t.prescriptionDontLabel}
            items={item.dont_list}
          />
        </div>
      </div>
    </article>
  );
}

export default function PairPrescriptionSection({
  pack,
  accentColor,
  domain,
  titleOverride,
}: {
  pack: PairPrescriptionPack | null | undefined;
  accentColor: string;
  domain: PairPrescriptionDomain;
  /** Domain catalog title when provided (e.g. family Part5). */
  titleOverride?: string;
}) {
  const t = useMessages().relationshipDrilldown.layout;
  const { locale } = useLocale();
  if (!pack?.items.length) return null;

  return (
    <RelationshipReportCard
      id={`pair-prescription-${domain}`}
      title={titleOverride ?? t.prescriptionCardTitle}
      accentColor={accentColor}
      variant="accent"
      className="scroll-mt-6 border-violet-400/35 bg-gradient-to-b from-violet-950/25 to-transparent"
    >
      <RelationshipReportParagraph className="text-white/88">
        {pack.intro_line}
      </RelationshipReportParagraph>
      <p className="mt-2 text-xs text-white/50">
        {PAIR_PRESCRIPTION_DOMAIN_FOOTNOTE[locale][domain]}
      </p>
      <div className="mt-5 space-y-5">
        {pack.items.map((item) => (
          <PrescriptionTopicCard
            key={`${item.topic}-${item.headline}`}
            item={item}
            accentColor={accentColor}
          />
        ))}
      </div>
    </RelationshipReportCard>
  );
}

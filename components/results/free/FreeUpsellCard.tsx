"use client";

import type { FreeReportUiStrings } from "@/components/results/free/freeReportUiStrings";

const GOLD = "#c4a482";

/** 로버블 FreeUpsell 이식 — 심화 리포트로 유도하는 다크 카드 */
export function FreeUpsellCard({
  t,
  onClick,
}: {
  t: FreeReportUiStrings["upsell"];
  onClick: () => void;
}) {
  return (
    <aside className="border-on-surface bg-on-surface mt-10 border px-6 py-8 sm:px-8 sm:py-10">
      <div
        className="text-[10px] tracking-[0.24em] uppercase"
        style={{ color: GOLD }}
      >
        {t.kicker}
      </div>
      <h3
        className="mt-3 text-[24px] leading-[1.15] text-surface"
        style={{ fontFamily: "var(--font-stitch-serif)" }}
      >
        {t.headline}
      </h3>
      <p className="text-surface/75 mt-3 max-w-[52ch] text-[14px] leading-[1.7]">{t.body}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 inline-flex items-center gap-2 border px-4 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors"
        style={{ borderColor: GOLD, color: GOLD }}
      >
        {t.cta}
        <span aria-hidden>→</span>
      </button>
    </aside>
  );
}

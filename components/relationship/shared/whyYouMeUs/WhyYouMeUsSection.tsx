"use client";

/**
 * Shared "Why You / Why Me / Why Us" chapter — golden reference: Romantic
 * V4's AttractionSection (components/relationship/romantic/v4/ChaptersA.tsx,
 * chapter c2_attraction "서로를 선택한 이유"). Structure and visual design
 * ported verbatim; content comes entirely from `WhyYouMeUsData`, which each
 * domain builds from its own evidence (see
 * lib/relationship/shared/whyYouMeUs/whyYouMeUsTypes.ts).
 *
 * Applies to Romantic / Marriage / Friend only — Family and Work don't get
 * this chapter (per product decision, not a technical limitation).
 */
import type { WhyYouMeUsData } from "@/lib/relationship/shared/whyYouMeUs/whyYouMeUsTypes";
import {
  ArrowRight,
  Bridge,
  ChapterSection,
  PersonTag,
  Pull,
  Reveal,
  SubHeading,
  ec,
} from "@/components/relationship/shared/editorial/EditorialPrimitives";
import type { Locale } from "@/lib/i18n/locale";

export type WhyYouMeUsSectionProps = {
  id: string;
  n?: string;
  eyebrow: string;
  title: string;
  data: WhyYouMeUsData;
  names: { a: string; b: string };
  locale: Locale;
  children?: React.ReactNode;
};

export function WhyYouMeUsSection({ id, n, eyebrow, title, data, names, locale, children }: WhyYouMeUsSectionProps) {
  const dirs = [data.whyYou, data.whyMe];

  return (
    <ChapterSection id={id} n={n} label={eyebrow} title={title}>
      <div className="mt-2 grid gap-6 md:grid-cols-2">
        {dirs.map((d, i) => (
          <Reveal key={`${d.from}-${d.to}`} delay={i * 80}>
            <article
              className={`h-full rounded-2xl border bg-rel-surface p-6 shadow-sm sm:p-7 ${
                d.from === "a" ? "border-v4-a/25" : "border-v4-b/30"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 font-rel-sans text-[11px] tracking-[0.1em] text-rel-ink-mute">
                <PersonTag name={names[d.from]} side={d.from} />
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                <PersonTag name={names[d.to]} side={d.to} />
              </div>
              <h3 className="mt-4 font-rel-serif text-[20px] leading-[1.35] tracking-[-0.01em] text-rel-ink">
                {d.title}
              </h3>
              <p className="mt-3 font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink-soft">{d.body}</p>
              {d.scene && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 ${
                    d.from === "a" ? "bg-v4-a-soft" : "bg-v4-b-soft"
                  }`}
                >
                  <div
                    className={`font-rel-sans text-[10px] uppercase tracking-[0.16em] ${
                      d.from === "a" ? "text-v4-a" : "text-v4-b"
                    }`}
                  >
                    {ec(locale, "What this looks like", "이럴 때, 이런 모습")}
                  </div>
                  <p className="mt-1.5 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">{d.scene}</p>
                </div>
              )}
              {d.signals && d.signals.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-rel-line pt-4">
                  {d.signals.map((s) => (
                    <li key={s} className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          d.from === "a" ? "bg-v4-a" : "bg-v4-b"
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 font-rel-sans text-[13px] leading-[1.6] text-rel-ink-soft">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-8 rounded-2xl bg-rel-deep p-7 sm:p-10">
          <SubHeading title={data.whyUs.title} invert tag={ec(locale, "Why us", "우리이기에")} />
          <p className="mt-5 max-w-[62ch] font-rel-sans text-[15px] leading-[1.9] text-white/80">
            {data.whyUs.body}
          </p>
          {data.whyUs.mechanism && data.whyUs.mechanism.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.whyUs.mechanism.map((m) => (
                <div
                  key={m}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-rel-sans text-[13px] leading-[1.7] text-white/85"
                >
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {data.moment && (
        <Reveal>
          <figure className="mt-10 border-y border-rel-line py-9">
            <blockquote>
              <Pull>{data.moment.line}</Pull>
            </blockquote>
            <figcaption className="mx-auto mt-5 max-w-[54ch] text-center font-rel-sans text-[13px] leading-[1.75] text-rel-ink-mute">
              {data.moment.scene}
            </figcaption>
          </figure>
        </Reveal>
      )}

      {data.bridge && <Bridge text={data.bridge} label={ec(locale, "Meanwhile", "그런데")} />}
      {children}
    </ChapterSection>
  );
}

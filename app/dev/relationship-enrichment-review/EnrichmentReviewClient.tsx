"use client";

import Link from "next/link";
import type { EnrichmentReviewPackage } from "@/lib/relationship/enrichment/buildEnrichmentReviewPackage";
import type { EnrichmentDomain, CorpusCaseId } from "@/lib/relationship/enrichment/corpusCases";
import type { Locale } from "@/lib/i18n/locale";
import { buildFriendReportViewModel } from "@/lib/relationship/friend/viewModel/buildFriendReportViewModel";
import { FriendReportViewModelView } from "@/components/relationship/friend/sections/SectionRenderer";
import { buildWorkReportViewModel } from "@/lib/relationship/workColleague/viewModel/buildWorkReportViewModel";
import { WorkReportViewModelView } from "@/components/relationship/workColleague/sections/SectionRenderer";
import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import { FamilyReportViewModelView } from "@/components/relationship/familyParent/sections/SectionRenderer";
import { buildMarriageReportViewModel } from "@/lib/relationship/marriage/viewModel/buildMarriageReportViewModel";
import { MarriageReportViewModelView } from "@/components/relationship/marriage/sections/SectionRenderer";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";

type Mode =
  | "current"
  | "current_enriched"
  | "v1"
  | "dev_evidence"
  | "previous_dev"
  | "final_dev"
  | "dev";

type Props = {
  domain: EnrichmentDomain;
  caseId: CorpusCaseId;
  locale: Locale;
  mode: Mode;
  pkg: EnrichmentReviewPackage | null;
  error: string | null;
  cases: Array<{ id: string; label_ko: string; label_en: string }>;
  domains: EnrichmentDomain[];
};

function qs(
  next: Partial<{ domain: string; case: string; locale: string; mode: string }>,
  cur: Props,
) {
  const p = new URLSearchParams({
    domain: next.domain ?? cur.domain,
    case: next.case ?? cur.caseId,
    locale: next.locale ?? cur.locale,
    mode: next.mode ?? cur.mode,
  });
  return `?${p.toString()}`;
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-amber-300 text-black shadow-sm"
          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold tracking-wide text-amber-200/90">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pre({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/50 p-4 text-[11px] leading-relaxed text-white/80 font-mono">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function CurrentRenderedReport({
  domain,
  locale,
  report,
  names,
}: {
  domain: EnrichmentDomain;
  locale: Locale;
  report: unknown;
  names: { a: string; b: string };
}) {
  const params = {
    viewerIsReportA: true,
    myName: names.a,
    partnerName: names.b,
    locale,
  };
  if (domain === "friend") {
    const vm = buildFriendReportViewModel(report as FriendReportBody, params);
    return <FriendReportViewModelView vm={vm} viewerIsReportA={true} />;
  }
  if (domain === "work") {
    const vm = buildWorkReportViewModel(report as WorkColleagueReportBody, params);
    return <WorkReportViewModelView vm={vm} />;
  }
  if (domain === "family") {
    const vm = buildFamilyReportViewModel(report as FamilyParentReportBody, params);
    return <FamilyReportViewModelView vm={vm} />;
  }
  const vm = buildMarriageReportViewModel(report as MarriageReportBody, params);
  return <MarriageReportViewModelView vm={vm} viewerIsReportA={true} />;
}

export function EnrichmentReviewClient(props: Props) {
  const { pkg, error, mode, locale } = props;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Disclaimer Banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200/95 flex items-center justify-between">
        <span className="font-semibold">
          ⚠️ DEV 테스트 사례이며 실제 사용자 등급이 아닙니다. (DEV test fixture — not a real user rating.)
        </span>
        <span className="text-[11px] text-amber-300/70 font-mono">
          Production Untouched
        </span>
      </div>

      <header className="space-y-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-mono">
            DEV · Relationship Incremental Enrichment
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Product Director Review Package
          </h1>
          <p className="text-sm text-white/60 mt-1">
            <span className="text-amber-300 font-medium">Current Enriched</span> preserves the exact production report design while merging approved copy improvements.
          </p>
        </div>

        {/* Domain Selection */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="mr-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Domain
          </span>
          {props.domains.map((d) => (
            <Pill key={d} href={qs({ domain: d }, props)} active={props.domain === d}>
              {d.toUpperCase()}
            </Pill>
          ))}
        </div>

        {/* Test Case Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Fixture Case
          </span>
          {props.cases.map((c) => (
            <Pill
              key={c.id}
              href={qs({ case: c.id }, props)}
              active={props.caseId === c.id}
            >
              {locale === "en-US" ? c.label_en : c.label_ko}
            </Pill>
          ))}
        </div>

        {/* Locale and Mode Selection */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="mr-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Locale
          </span>
          <Pill href={qs({ locale: "ko-KR" }, props)} active={locale === "ko-KR"}>
            KO (한국어)
          </Pill>
          <Pill href={qs({ locale: "en-US" }, props)} active={locale === "en-US"}>
            EN (English)
          </Pill>

          <span className="mx-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Review Mode
          </span>
          <Pill
            href={qs({ mode: "current" }, props)}
            active={mode === "current"}
          >
            1. Current (기존 원본)
          </Pill>
          <Pill
            href={qs({ mode: "current_enriched" }, props)}
            active={mode === "current_enriched"}
          >
            2. Current Enriched (심층 개선본)
          </Pill>
          <Pill href={qs({ mode: "v1" }, props)} active={mode === "v1"}>
            3. V1 Gold (참조용)
          </Pill>
          <Pill
            href={qs({ mode: "dev_evidence" }, props)}
            active={
              mode === "dev_evidence" ||
              mode === "final_dev" ||
              mode === "previous_dev" ||
              mode === "dev"
            }
          >
            4. DEV Evidence (내부 도구)
          </Pill>
        </div>
      </header>

      {error ? (
        <Block title="Build error">
          <Pre value={error} />
        </Block>
      ) : null}

      {pkg ? (
        <>
          {/* MODE 1: CURRENT BASELINE */}
          {mode === "current" ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-sky-400/20 bg-sky-500/5 p-4 text-xs text-sky-200">
                <span className="font-semibold text-sky-100">
                  [Current Production Report]
                </span>{" "}
                기존 프로덕션 레이아웃 및 원본 카피입니다.
              </div>
              <Block title="Current — Rendered Production Layout">
                <CurrentRenderedReport
                  domain={pkg.domain}
                  locale={pkg.locale}
                  report={pkg.current.report}
                  names={{
                    a: pkg.case_meta.birth.nicknameA,
                    b: pkg.case_meta.birth.nicknameB,
                  }}
                />
              </Block>
              <Block title="Current — Schema Summary & ViewModel Sections">
                <Pre
                  value={{
                    summary: pkg.current.summary,
                    sections: pkg.current.view_model_sections,
                  }}
                />
              </Block>
            </div>
          ) : null}

          {/* MODE 2: CURRENT ENRICHED */}
          {mode === "current_enriched" ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                <div className="font-bold text-amber-100 mb-1">
                  ✨ [Current Enriched Report — Candidate for Production]
                </div>
                <div>
                  프로덕션의 기존 <strong>페이지 디자인, 섹션 순서, 카드 레이아웃, 차트, 여백, 인터랙션</strong>을 100% 동일하게 유지하면서,
                  각 섹션 내부의 텍스트와 통찰을 검토 승인된 V1/DEV 개선본으로 업그레이드한 화면입니다.
                </div>
              </div>

              <Block title="Current Enriched — Rendered Report (Identical Design, Enriched Content)">
                <CurrentRenderedReport
                  domain={pkg.domain}
                  locale={pkg.locale}
                  report={pkg.current_enriched.report}
                  names={{
                    a: pkg.case_meta.birth.nicknameA,
                    b: pkg.case_meta.birth.nicknameB,
                  }}
                />
              </Block>

              <Block title="Enriched Content Summary & ViewModel Sections">
                <Pre
                  value={{
                    summary: pkg.current_enriched.summary,
                    sections: pkg.current_enriched.view_model_sections,
                  }}
                />
              </Block>
            </div>
          ) : null}

          {/* MODE 3: V1 GOLD */}
          {mode === "v1" ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-purple-400/20 bg-purple-500/5 p-4 text-xs text-purple-200">
                <span className="font-semibold text-purple-100">
                  [V1 Gold Migration Reference]
                </span>{" "}
                V1 자산 인벤토리 및 마이그레이션 투영 데이터입니다.
              </div>
              <Block title="V1 Migration Inventory">
                <Pre value={pkg.v1.inventory} />
              </Block>
              <Block title="V1 Gold — Canonical Projections">
                <Pre value={pkg.v1.projections} />
              </Block>
            </div>
          ) : null}

          {/* MODE 4: DEV EVIDENCE MATRIX */}
          {mode === "dev_evidence" ||
          mode === "final_dev" ||
          mode === "previous_dev" ||
          mode === "dev" ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-xs text-rose-200">
                <div className="font-bold text-rose-100 mb-1">
                  🔬 [내부 연구 도구 전용] 7-Scene / Pair CE Lens Evidence Matrix
                </div>
                <div>
                  <strong>주의:</strong> 본 뷰는 엔진 증거 패킷 분석 및 카피 개발용 내부 도구이며, 최종 사용자 대상 리포트 디자인이 아닙니다.
                </div>
              </div>

              <Block title="Evidence Packet (Pair CE)">
                <Pre
                  value={{
                    evidence: pkg.dev_evidence.evidence,
                    personal_ce: pkg.dev_evidence.personal_ce,
                    packets: pkg.dev_evidence.pair_ce_packets,
                  }}
                />
              </Block>

              <Block title="Domain Lenses (Raw Evaluation)">
                <div className="space-y-3">
                  {pkg.dev_evidence.lenses.map((l) => (
                    <div
                      key={l.lens_id}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                    >
                      <div className="mb-1 flex flex-wrap gap-2 text-[11px] text-white/45">
                        <span className="font-mono">{l.lens_id}</span>
                        <span>confidence: {l.confidence}</span>
                        <span>tension: {l.tension_level}</span>
                        {l.is_abstaining ? (
                          <span className="text-rose-300 font-semibold">abstain</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white/50">{l.question_ko}</p>
                      <p className="mt-1 text-sm font-semibold text-amber-200">{l.headline_ko}</p>
                      <p className="mt-1 text-sm text-white/70 leading-relaxed">{l.narrative_ko}</p>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="Story Planner Plan">
                <Pre value={pkg.dev_evidence.story_planner} />
              </Block>

              <Block title="Internal 7-Scene / 4-Beat Narrative Matrix">
                {(() => {
                  const narrative = (pkg.dev_evidence.narrative ?? (pkg.final_dev as any)?.narrative) as any;
                  if (!narrative || !narrative.scenes) return <Pre value={pkg.dev_evidence.narrative} />;
                  return (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                            {locale === "en-US"
                              ? narrative.overview.core_vibe_badge_en
                              : narrative.overview.core_vibe_badge_ko}
                          </span>
                          <span className="text-xs text-white/50">
                            Confidence: {narrative.overall_confidence}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-white">
                          {locale === "en-US"
                            ? narrative.overview.headline_en
                            : narrative.overview.headline_ko}
                        </h3>
                        <p className="mt-1 text-sm text-white/70">
                          {locale === "en-US"
                            ? narrative.overview.summary_en
                            : narrative.overview.summary_ko}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {narrative.scenes.map((scene: any) => (
                          <div
                            key={scene.scene_id}
                            className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-amber-200">
                                  Scene {scene.scene_number}
                                </span>
                                <h4 className="text-sm font-semibold text-white">
                                  {locale === "en-US" ? scene.title_en : scene.title_ko}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-white/40">
                                <span>Tension: {scene.tension_level}</span>
                                <span>·</span>
                                <span>Primary Lens: {scene.primary_lens_id}</span>
                              </div>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-amber-100">
                              {locale === "en-US" ? scene.headline_en : scene.headline_ko}
                            </p>

                            <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                              <div className="space-y-1 rounded bg-black/30 p-3">
                                <span className="font-semibold text-sky-300">
                                  [1. 인지 / Recognition]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.recognition_en
                                    : scene.recognition_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/30 p-3">
                                <span className="font-semibold text-indigo-300">
                                  [2. 번역 / Translation]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.translation_en
                                    : scene.translation_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/30 p-3">
                                <span className="font-semibold text-emerald-300">
                                  [3. 재해석 / Reframing]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.reframing_en
                                    : scene.reframing_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/30 p-3">
                                <span className="font-semibold text-amber-300">
                                  [4. 실천 가이드 / Action Guidance]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.action_guidance_en
                                    : scene.action_guidance_ko}
                                </p>
                              </div>
                            </div>

                            {scene.scripts?.length ? (
                              <div className="mt-3 rounded border border-purple-500/20 bg-purple-500/5 p-3 text-xs">
                                <span className="font-semibold text-purple-300">
                                  [실천 대화 스크립트 / Dialogue Script]
                                </span>
                                {scene.scripts.map((script: any, idx: number) => (
                                  <div key={idx} className="mt-2 space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-purple-200">
                                        Speaker: {script.speaker}
                                      </span>
                                      <span>
                                        {locale === "en-US"
                                          ? script.title_en
                                          : script.title_ko}
                                      </span>
                                    </div>
                                    <p className="italic text-purple-100/90 pl-1">
                                      "{locale === "en-US"
                                        ? script.dialogue_en
                                        : script.dialogue_ko}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </Block>
            </div>
          ) : null}

          {/* Side-by-side quick compare card */}
          <Block title="Side-by-side Quick Compare">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-sky-300">1. Current (기존 원본)</p>
                <Pre
                  value={{
                    headline: pkg.current.summary.headline,
                    sections: pkg.current.view_model_sections.map((s) => s.type),
                  }}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-amber-300">2. Current Enriched (개선본)</p>
                <Pre
                  value={{
                    headline: pkg.current_enriched.summary.headline,
                    sections: pkg.current_enriched.view_model_sections.map((s) => s.type),
                  }}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-rose-300">4. DEV Evidence (내부 증거)</p>
                <Pre
                  value={{
                    active_lenses: pkg.dev_evidence.evidence.active_lenses,
                    abstained: pkg.dev_evidence.evidence.abstained_lenses,
                    packets: pkg.dev_evidence.evidence.packet_count,
                  }}
                />
              </div>
            </div>
          </Block>
        </>
      ) : null}
    </div>
  );
}

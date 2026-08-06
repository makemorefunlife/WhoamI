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

type Mode = "current" | "v1" | "previous_dev" | "final_dev" | "dev";

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
      className={`rounded px-2.5 py-1 text-xs ${
        active
          ? "bg-white text-black"
          : "bg-white/10 text-white/80 hover:bg-white/20"
      }`}
    >
      {children}
    </Link>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-amber-200/90">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pre({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded bg-black/40 p-3 text-[11px] leading-relaxed text-white/75">
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

function enrichmentHighlights(pkg: EnrichmentReviewPackage) {
  const added: string[] = [];
  const report = pkg.current.report as Record<string, any>;
  const friendSnap = report?.friend?.section_snapshot?.shine_when_best;
  const money = report?.household?.section_money_chores?.mental_load_note;
  const praise = report?.family?.section_child_dna?.praise_trigger_note;
  if (friendSnap) added.push(`Friend snapshot.shine_when_best: ${friendSnap}`);
  if (money) added.push(`Partner money_chores.mental_load_note: ${money}`);
  if (praise) added.push(`Family child_dna.praise_trigger_note: ${praise}`);
  return added;
}

export function EnrichmentReviewClient(props: Props) {
  const { pkg, error, mode, locale } = props;
  const added = pkg ? enrichmentHighlights(pkg) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-3 border-b border-white/10 pb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          DEV · Relationship Incremental Enrichment
        </p>
        <h1 className="text-2xl font-semibold">Review Package</h1>
        <p className="text-sm text-white/55">
          Current = CE report UI · V1 = gold inventory/projections · DEV = Lens →
          Story → Narrative. Production untouched.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="mr-1 self-center text-xs text-white/40">Domain</span>
          {props.domains.map((d) => (
            <Pill key={d} href={qs({ domain: d }, props)} active={props.domain === d}>
              {d}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-white/40">Case</span>
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
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-white/40">Locale</span>
          <Pill href={qs({ locale: "ko-KR" }, props)} active={locale === "ko-KR"}>
            KO
          </Pill>
          <Pill href={qs({ locale: "en-US" }, props)} active={locale === "en-US"}>
            EN
          </Pill>
          <span className="mx-2 self-center text-xs text-white/40">Source</span>
          <Pill href={qs({ mode: "current" }, props)} active={mode === "current"}>
            Current
          </Pill>
          <Pill href={qs({ mode: "v1" }, props)} active={mode === "v1"}>
            V1 Gold
          </Pill>
          <Pill
            href={qs({ mode: "previous_dev" }, props)}
            active={mode === "previous_dev"}
          >
            Previous DEV
          </Pill>
          <Pill
            href={qs({ mode: "final_dev" }, props)}
            active={mode === "final_dev" || mode === "dev"}
          >
            Final DEV
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
          {added.length ? (
            <Block title="Added (this DEV branch)">
              <ul className="space-y-2 text-sm text-emerald-200/90">
                {added.map((a) => (
                  <li key={a.slice(0, 40)}>{a}</li>
                ))}
              </ul>
            </Block>
          ) : (
            <Block title="Added (this DEV branch)">
              <p className="text-sm text-white/50">
                No enrichment fields on this domain/case (Work has no new CE fields
                yet; review DEV lenses instead).
              </p>
            </Block>
          )}

          {mode === "current" ? (
            <>
              <Block title="Current CE — rendered report">
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
              <Block title="Current CE — summary + section ids">
                <Pre
                  value={{
                    summary: pkg.current.summary,
                    sections: pkg.current.view_model_sections,
                  }}
                />
              </Block>
            </>
          ) : null}

          {mode === "v1" ? (
            <>
              <Block title="V1 Migration Inventory">
                <Pre value={pkg.v1.inventory} />
              </Block>
              <Block title="V1 Gold — canonical_projections">
                <Pre value={pkg.v1.projections} />
              </Block>
            </>
          ) : null}

          {mode === "previous_dev" ? (
            <>
              <Block title="Previous DEV — Evidence Packet (Pair CE)">
                <Pre
                  value={{
                    evidence: pkg.previous_dev.evidence,
                    lenses_count: pkg.previous_dev.lenses.length,
                  }}
                />
              </Block>
              <Block title="Previous DEV — Domain Lenses (Raw)">
                <div className="space-y-3">
                  {pkg.previous_dev.lenses.map((l) => (
                    <div
                      key={l.lens_id}
                      className="rounded border border-white/10 p-3"
                    >
                      <div className="mb-1 flex flex-wrap gap-2 text-[11px] text-white/45">
                        <span>{l.lens_id}</span>
                        <span>{l.confidence}</span>
                        <span>tension {l.tension_level}</span>
                        {l.is_abstaining ? (
                          <span className="text-rose-300">abstain</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white/50">{l.question_ko}</p>
                      <p className="mt-1 text-sm font-medium">{l.headline_ko}</p>
                      <p className="mt-1 text-sm text-white/70">{l.narrative_ko}</p>
                    </div>
                  ))}
                </div>
              </Block>
              <Block title="Previous DEV — Story Planner Plan">
                <Pre value={pkg.previous_dev.story_planner} />
              </Block>
            </>
          ) : null}

          {mode === "final_dev" || mode === "dev" ? (
            <>
              <Block title="Evidence Packet (Pair CE)">
                <Pre
                  value={{
                    evidence: pkg.dev.evidence,
                    personal_ce: pkg.dev.personal_ce,
                    packets: pkg.dev.pair_ce_packets,
                  }}
                />
              </Block>
              <Block title="Domain Lenses">
                <div className="space-y-3">
                  {pkg.dev.lenses.map((l) => (
                    <div
                      key={l.lens_id}
                      className="rounded border border-white/10 p-3"
                    >
                      <div className="mb-1 flex flex-wrap gap-2 text-[11px] text-white/45">
                        <span>{l.lens_id}</span>
                        <span>{l.confidence}</span>
                        <span>tension {l.tension_level}</span>
                        {l.is_abstaining ? (
                          <span className="text-rose-300">abstain</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white/50">{l.question_ko}</p>
                      <p className="mt-1 text-sm font-medium">{l.headline_ko}</p>
                      <p className="mt-1 text-sm text-white/70">{l.narrative_ko}</p>
                    </div>
                  ))}
                </div>
              </Block>
              <Block title="Story Planner">
                <Pre value={pkg.dev.story_planner} />
              </Block>
              <Block title="Final DEV 7-Scene Narrative (Rendered Product View)">
                {(() => {
                  const narrative = pkg.final_dev?.narrative as any || pkg.dev.narrative as any;
                  if (!narrative || !narrative.scenes) return <Pre value={pkg.dev.narrative} />;
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
                            className="rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
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
                              <div className="space-y-1 rounded bg-black/20 p-2.5">
                                <span className="font-semibold text-sky-300">
                                  [1. 인지 / Recognition]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.recognition_en
                                    : scene.recognition_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/20 p-2.5">
                                <span className="font-semibold text-indigo-300">
                                  [2. 번역 / Translation]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.translation_en
                                    : scene.translation_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/20 p-2.5">
                                <span className="font-semibold text-emerald-300">
                                  [3. 재해석 / Reframing]
                                </span>
                                <p className="text-white/75 leading-relaxed">
                                  {locale === "en-US"
                                    ? scene.reframing_en
                                    : scene.reframing_ko}
                                </p>
                              </div>
                              <div className="space-y-1 rounded bg-black/20 p-2.5">
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
                              <div className="mt-3 rounded border border-white/5 bg-white/[0.03] p-2.5 text-xs">
                                <span className="font-semibold text-purple-300">
                                  [실천 대화 스크립트 / Dialogue Script]
                                </span>
                                {scene.scripts.map((script: any, idx: number) => (
                                  <div key={idx} className="mt-1.5 space-y-0.5">
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
                                    <p className="italic text-purple-100/90">
                                      {locale === "en-US"
                                        ? script.dialogue_en
                                        : script.dialogue_ko}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {narrative.action_playbook ? (
                        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-4">
                          <h4 className="text-sm font-bold text-emerald-300">
                            [Action Playbook & Golden Rules]
                          </h4>
                          <p className="mt-1 text-xs text-white/70">
                            {locale === "en-US"
                              ? narrative.action_playbook.summary_en
                              : narrative.action_playbook.summary_ko}
                          </p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-emerald-100/90">
                            {(locale === "en-US"
                              ? narrative.action_playbook.golden_rules_en
                              : narrative.action_playbook.golden_rules_ko
                            ).map((rule: string, idx: number) => (
                              <li key={idx}>{rule}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </Block>
              <Block title="Final Narrative (Raw JSON)">
                <Pre value={pkg.dev.narrative} />
              </Block>
            </>
          ) : null}

          <Block title="Side-by-side quick compare">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-emerald-300/80">Current</p>
                <Pre
                  value={{
                    headline: pkg.current.summary.headline,
                    sections: pkg.current.view_model_sections.map((s) => s.type),
                  }}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-sky-300/80">V1</p>
                <Pre
                  value={{
                    assets: pkg.v1.inventory.map((a) => a.asset_id),
                    projections: pkg.v1.projections
                      ? Object.keys(pkg.v1.projections as object)
                      : [],
                  }}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-violet-300/80">DEV</p>
                <Pre
                  value={{
                    active: pkg.dev.evidence.active_lenses,
                    abstained: pkg.dev.evidence.abstained_lenses,
                    scenes: (pkg.dev.narrative as { scenes?: unknown[] })?.scenes
                      ?.length,
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

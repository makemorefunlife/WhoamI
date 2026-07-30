"use client";

import PsychMatchRadarChart from "@/components/relationship/reportLayout/PsychMatchRadarChart";
import type { RomanticV3PrototypePayload } from "@/lib/relationship/romantic/prototypeV3/types";

type Props = {
  payload: RomanticV3PrototypePayload;
  debug?: boolean;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f1e5d8] px-2.5 py-1 text-[11px] font-semibold text-[#704f32]">
      {children}
    </span>
  );
}

export default function PrototypeClient({ payload, debug = false }: Props) {
  const isComplete = payload.variant === "complete";
  const enSmoke = payload.locale === "en-US";
  const personA = enSmoke ? "Person A" : payload.pair.personA;
  const personB = enSmoke ? "Person B" : payload.pair.personB;
  const t = (text: string) => (enSmoke ? "[EN smoke content block]" : text);
  return (
    <main data-v3-prototype-root className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9e7d5d]">
          Romantic Premium Report V3 Content Acceptance Prototype
        </p>
        <h1 className="mt-2 font-serif text-3xl text-[#2c3e35]">
          {personA} & {personB}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>locale: {payload.locale}</Badge>
          <Badge>variant: {payload.variant}</Badge>
          <Badge>route: {payload.routeLabel}</Badge>
        </div>
      </section>

      {isComplete ? (
        <>
          {debug && payload.preNarrativeContract ? (
            <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl text-[#2c3e35]">
                Four-CE Sibling Narrative Input Contract
              </h2>
              <p className="mt-2 text-sm text-[#5b5148]">
                A Individual CE + B Individual CE + Pair CE + Romantic CE를 sibling 입력으로 결합한 pre-narrative payload
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl bg-[#faf7f3] p-3 text-sm">
                  <p className="font-semibold">A Individual CE</p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    {payload.preNarrativeContract.siblingInputs.individualCeA.source}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    present: {payload.preNarrativeContract.siblingInputs.individualCeA.output.status === "available" ? "yes" : "no"}
                  </p>
                </article>
                <article className="rounded-xl bg-[#faf7f3] p-3 text-sm">
                  <p className="font-semibold">B Individual CE</p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    {payload.preNarrativeContract.siblingInputs.individualCeB.source}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    present: {payload.preNarrativeContract.siblingInputs.individualCeB.output.status === "available" ? "yes" : "no"}
                  </p>
                </article>
                <article className="rounded-xl bg-[#faf7f3] p-3 text-sm">
                  <p className="font-semibold">Pair CE Common</p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    {payload.preNarrativeContract.siblingInputs.pairCeCommon.source}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    present: {payload.preNarrativeContract.siblingInputs.pairCeCommon.output.status === "available" ? "yes" : "no"}
                  </p>
                </article>
                <article className="rounded-xl bg-[#faf7f3] p-3 text-sm">
                  <p className="font-semibold">Romantic CE Specific</p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    {payload.preNarrativeContract.siblingInputs.romanticCeSpecific.source}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6154]">
                    present: {payload.preNarrativeContract.siblingInputs.romanticCeSpecific.output.status === "available" ? "yes" : "no"}
                  </p>
                </article>
              </div>
              {payload.fourCeInfluenceAudit?.length ? (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#3f3832]">
                  {payload.fourCeInfluenceAudit.map((row) => (
                    <li key={row.evidenceId}>
                      {row.evidenceId}: {t(row.impact)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">Table of Contents</h2>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-[#5b5148]">
              {payload.toc.map((item) => (
                <li key={item.chapter}>{item.label}</li>
              ))}
            </ol>
          </section>

          {payload.chapters
            .filter((c) => c.blocks.length > 0)
            .map((chapter) => (
              <section
                key={chapter.chapter}
                className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8"
              >
                <h2 className="font-serif text-2xl text-[#2c3e35]">{chapter.title}</h2>
                <div className="mt-5 space-y-4">
                  {chapter.blocks.map((block) => (
                    <article key={block.blockId} className="rounded-2xl bg-[#faf7f3] p-4">
                      <p className="text-sm font-semibold text-[#6c543f]">{t(block.label)}</p>
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[#3f3832]">
                        {t(block.content)}
                      </p>
                      {debug ? (
                        <p className="mt-2 text-[11px] text-[#8f7f71]">
                          source: {block.sourceKind} · evidence: {block.evidenceIds.join(", ")}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">
              2A. Saju-based Comparison Table
            </h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f7f0e8] text-left text-[#4a4038]">
                    <th className="border border-[#eadfce] p-3">{enSmoke ? "Relationship question" : "관계 질문"}</th>
                    <th className="border border-[#eadfce] p-3">{personA}</th>
                    <th className="border border-[#eadfce] p-3">{personB}</th>
                    <th className="border border-[#eadfce] p-3">{enSmoke ? "How this appears in relationship" : "관계에서 나타나는 방식"}</th>
                    <th className="border border-[#eadfce] p-3">{enSmoke ? "What helps understanding" : "서로를 이해하는 포인트"}</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.comparisonTable.map((row) => (
                    <tr key={row.rowId} className="align-top text-[#3f3832]">
                      <td className="border border-[#eadfce] p-3 font-semibold">{t(row.relationshipQuestion)}</td>
                      <td className="border border-[#eadfce] p-3">{t(row.personA)}</td>
                      <td className="border border-[#eadfce] p-3">{t(row.personB)}</td>
                      <td className="border border-[#eadfce] p-3">{t(row.relationshipManifestation)}</td>
                      <td className="border border-[#eadfce] p-3">{t(row.understandingPoint)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">2B. 11-Axis Spider Overview</h2>
            <div className="mt-5">
              <PsychMatchRadarChart
                axisResults={payload.axisOverview}
                personALabel={personA}
                personBLabel={personB}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">2C. Selected Axis Insights</h2>
            {debug && payload.axisSelectionAudit ? (
              <p className="mt-2 text-sm text-[#6c5a4b]">
                {t(payload.axisSelectionAudit.selectedReason)}
              </p>
            ) : null}
            <div className="mt-5 space-y-4">
              {payload.selectedAxisInsights.map((axis) => (
                <article key={axis.axisKey} className="rounded-2xl bg-[#faf7f3] p-4">
                  <p className="text-sm font-semibold text-[#6c543f]">
                    {axis.axisLabel} · {enSmoke ? "effect" : axis.relationshipEffect} · gap {axis.gap}
                  </p>
                  <p className="mt-2 text-sm text-[#3f3832]">
                    {personA}: {t(axis.personAPattern)} / {personB}: {t(axis.personBPattern)}
                  </p>
                  <p className="mt-2 text-[#3f3832]">{t(axis.whyItMatters)}</p>
                  <p className="mt-1 text-[#3f3832]">{enSmoke ? "Daily scene" : "일상 장면"}: {t(axis.dailyManifestation)}</p>
                  {debug ? (
                    <p className="mt-2 text-[11px] text-[#8f7f71]">
                      confidence: {axis.confidence} · evidence: {axis.evidenceIds.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
            {debug && payload.axisSelectionAudit?.rejected.length ? (
              <article className="mt-5 rounded-2xl bg-[#fff6f2] p-4">
                <h3 className="font-semibold text-[#7b4b32]">Rejected candidates</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3f3832]">
                  {payload.axisSelectionAudit.rejected.map((r) => (
                    <li key={`${r.axisKey}-${r.reason}`}>
                      {r.axisKey} · {r.reason} · {t(r.detail)}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">4. Relationship Flow</h2>
            <p className="mt-3 text-[#3f3832]">{t(payload.relationshipFlow.title)}</p>
            <ol className="mt-4 space-y-2 text-[#3f3832]">
              {payload.relationshipFlow.steps.map((s, i) => (
                <li key={`${i}-${s}`} className="rounded-xl bg-[#faf7f3] p-3">
                  {t(s)}
                  {i < payload.relationshipFlow.steps.length - 1 ? (
                    <span className="ml-2 text-[#9e7d5d]">→</span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-[#f3ece4] p-3 text-[#3f3832]">
              {t(payload.relationshipFlow.pivotPoint)}
            </p>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">5. When We Miss Each Other</h2>
            <div className="mt-4 space-y-5">
              {payload.conflicts.map((c) => (
                <article key={c.patternId} className="rounded-2xl bg-[#faf7f3] p-4">
                  <h3 className="font-semibold text-[#5b4736]">{t(c.trigger)}</h3>
                  <dl className="mt-3 grid gap-2 text-sm text-[#3f3832] sm:grid-cols-2">
                    <div><dt className="font-semibold">What I meant</dt><dd>{t(c.whatIMeant)}</dd></div>
                    <div><dt className="font-semibold">What you heard</dt><dd>{t(c.whatYouHeard)}</dd></div>
                    <div><dt className="font-semibold">Hidden need</dt><dd>{t(c.hiddenNeed)}</dd></div>
                    <div><dt className="font-semibold">Better words</dt><dd>{t(c.betterWords)}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-semibold">Repair timing</dt><dd>{t(c.repairTiming)}</dd></div>
                  </dl>
                  {debug ? (
                    <p className="mt-2 text-[11px] text-[#8f7f71]">
                      confidence: {c.confidence} · evidence: {c.evidenceIds.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-[#fffaf5] p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">6. Hidden Heart</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-white p-4">
                <h3 className="font-semibold text-[#5b4736]">{personA}</h3>
                <p className="mt-2 whitespace-pre-wrap text-[#3f3832]">{t(payload.hiddenHeart.personA)}</p>
                <p className="mt-2 text-sm italic text-[#5f5449]">
                  &quot;{t(payload.hiddenHeart.personAOneLineForPartner)}&quot;
                </p>
              </article>
              <article className="rounded-2xl bg-white p-4">
                <h3 className="font-semibold text-[#5b4736]">{personB}</h3>
                <p className="mt-2 whitespace-pre-wrap text-[#3f3832]">{t(payload.hiddenHeart.personB)}</p>
                <p className="mt-2 text-sm italic text-[#5f5449]">
                  &quot;{t(payload.hiddenHeart.personBOneLineForPartner)}&quot;
                </p>
              </article>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">7. Repair Guide</h2>
            <ol className="mt-4 space-y-2 text-[#3f3832]">
              {payload.repairGuide.sequence.map((step) => (
                <li key={step} className="rounded-xl bg-[#faf7f3] p-3">{t(step)}</li>
              ))}
            </ol>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <article className="rounded-xl bg-[#f3ece4] p-3">
                <h3 className="font-semibold text-[#5b4736]">{enSmoke ? `What helps ${personA}` : `${personA}에게 도움`}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#3f3832]">
                  {payload.repairGuide.sideBySide.helpsA.map((item) => <li key={item}>{t(item)}</li>)}
                </ul>
              </article>
              <article className="rounded-xl bg-[#f3ece4] p-3">
                <h3 className="font-semibold text-[#5b4736]">{enSmoke ? `What helps ${personB}` : `${personB}에게 도움`}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#3f3832]">
                  {payload.repairGuide.sideBySide.helpsB.map((item) => <li key={item}>{t(item)}</li>)}
                </ul>
              </article>
              <article className="rounded-xl bg-[#f3ece4] p-3">
                <h3 className="font-semibold text-[#5b4736]">{enSmoke ? "Shared commitments" : "함께 지킬 약속"}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#3f3832]">
                  {payload.repairGuide.sideBySide.together.map((item) => <li key={item}>{t(item)}</li>)}
                </ul>
              </article>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">8. Love in Real Life</h2>
            <div className="mt-4 space-y-4">
              {payload.realLifeScenes.map((scene) => (
                <article key={scene.sceneId} className="rounded-2xl bg-[#faf7f3] p-4">
                  <h3 className="font-semibold text-[#5b4736]">{t(scene.sceneTitle)}</h3>
                  <p className="mt-2 text-[#3f3832]"><strong>{enSmoke ? "What commonly happens" : "무엇이 자주 일어나는가"}:</strong> {t(scene.whatHappens)}</p>
                  <p className="mt-1 text-[#3f3832]"><strong>{enSmoke ? "Why this happens for this pair" : "왜 이 커플에게서 생기는가"}:</strong> {t(scene.whyForThisPair)}</p>
                  <p className="mt-1 text-[#3f3832]"><strong>{enSmoke ? `What ${personA} can do` : `${personA}가 할 것`}:</strong> {t(scene.whatACanDo)}</p>
                  <p className="mt-1 text-[#3f3832]"><strong>{enSmoke ? `What ${personB} can do` : `${personB}가 할 것`}:</strong> {t(scene.whatBCanDo)}</p>
                  <p className="mt-1 text-[#3f3832]"><strong>{enSmoke ? "Small shared agreement" : "작은 공동 합의"}:</strong> {t(scene.sharedAgreement)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">9. Our Next Chapter</h2>
            {debug ? <p className="mt-2 text-[#5b4736]">mode: {payload.nextChapterMode}</p> : null}
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[#3f3832]">
              {payload.nextChapter.map((item) => (
                <li key={item}>{t(item)}</li>
              ))}
            </ul>
            {debug && payload.timingModeAudit ? (
              <article className="mt-4 rounded-xl bg-[#faf7f3] p-3 text-sm text-[#3f3832]">
                <p>
                  confidence: {payload.timingModeAudit.confidence} · rationale:{" "}
                  {t(payload.timingModeAudit.rationale)}
                </p>
                <p className="mt-1">
                  safety rules: {payload.timingModeAudit.safetyRulesPassed.join(" | ")}
                </p>
                <p className="mt-1 text-xs text-[#8f7f71]">
                  evidence: {payload.timingModeAudit.evidenceIds.join(", ") || "none"}
                </p>
              </article>
            ) : null}
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-[#fffaf5] p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">10. Closing / Save and Share</h2>
            <p className="mt-4 text-[#3f3832]">{t(payload.closing.concludingStatement)}</p>
            <p className="mt-2 text-[#3f3832]">{t(payload.closing.rememberA)}</p>
            <p className="mt-1 text-[#3f3832]">{t(payload.closing.rememberB)}</p>
            <h3 className="mt-4 font-semibold text-[#5b4736]">Share lines</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[#3f3832]">
              {payload.closing.shareLines.map((line) => (
                <li key={line}>{t(line)}</li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-white p-3 text-[#3f3832]">
              Reflection question: {t(payload.closing.reflectionQuestion)}
            </p>
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-[#2c3e35]">
            Anti-overfitting Check ({payload.variant})
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl bg-[#faf7f3] p-4">
              <h3 className="font-semibold text-[#5b4736]">Selected comparison rows</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.selectedComparisonRows.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
            <article className="rounded-xl bg-[#faf7f3] p-4">
              <h3 className="font-semibold text-[#5b4736]">Selected axis insights</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.selectedAxisInsights.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
            <article className="rounded-xl bg-[#faf7f3] p-4">
              <h3 className="font-semibold text-[#5b4736]">Selected conflict patterns</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.selectedConflictPatterns.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
            <article className="rounded-xl bg-[#faf7f3] p-4">
              <h3 className="font-semibold text-[#5b4736]">Selected real-life scenes</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.selectedRealLifeScenes.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
          </div>
          <p className="mt-4 text-sm text-[#3f3832]">
            Next chapter mode: {payload.antiOverfitCheck?.nextChapterMode}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl bg-[#fff6f2] p-4">
              <h3 className="font-semibold text-[#7b4b32]">Omitted</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.omitted.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
            <article className="rounded-xl bg-[#fff6f2] p-4">
              <h3 className="font-semibold text-[#7b4b32]">Evidence gaps</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.evidenceGaps.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </article>
            <article className="rounded-xl bg-[#fff6f2] p-4 sm:col-span-2">
              <h3 className="font-semibold text-[#7b4b32]">Rejected axis candidates</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#3f3832]">
                {payload.antiOverfitCheck?.axisRejected.map((v) => (
                  <li key={`${v.axisKey}-${v.reason}`}>
                    {v.axisKey} · {v.reason} · {v.detail}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      )}

      {isComplete && debug ? (
        <>
          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">Insight Ownership Table</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f7f0e8] text-left text-[#4a4038]">
                    <th className="border border-[#eadfce] p-3">Insight ID</th>
                    <th className="border border-[#eadfce] p-3">Phenomenon</th>
                    <th className="border border-[#eadfce] p-3">Evidence IDs</th>
                    <th className="border border-[#eadfce] p-3">Confidence</th>
                    <th className="border border-[#eadfce] p-3">Primary</th>
                    <th className="border border-[#eadfce] p-3">Supporting purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.insightOwnership.map((row) => (
                    <tr key={row.insightId} className="align-top text-[#3f3832]">
                      <td className="border border-[#eadfce] p-3 font-mono text-xs">{row.insightId}</td>
                      <td className="border border-[#eadfce] p-3">{t(row.phenomenon)}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">{row.evidenceIds.join(", ")}</td>
                      <td className="border border-[#eadfce] p-3">{row.confidence}</td>
                      <td className="border border-[#eadfce] p-3">{row.primaryChapter}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">
                        {row.supportingChapters
                          .map((s) => `${s.chapter}: ${t(s.purpose)}`)
                          .join(" | ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">Evidence Trace</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f7f0e8] text-left text-[#4a4038]">
                    <th className="border border-[#eadfce] p-3">Block</th>
                    <th className="border border-[#eadfce] p-3">Chapter</th>
                    <th className="border border-[#eadfce] p-3">Source kind</th>
                    <th className="border border-[#eadfce] p-3">Text</th>
                    <th className="border border-[#eadfce] p-3">Evidence IDs</th>
                    <th className="border border-[#eadfce] p-3">Planner instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.evidenceTrace.map((row) => (
                    <tr key={`${row.chapter}-${row.blockId}`} className="align-top text-[#3f3832]">
                      <td className="border border-[#eadfce] p-3 font-mono text-xs">{row.blockId}</td>
                      <td className="border border-[#eadfce] p-3">{row.chapter}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">{row.sourceKind}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">{t(row.text)}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">{row.evidenceIds.join(", ")}</td>
                      <td className="border border-[#eadfce] p-3 text-xs">{row.plannerInstruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e9dccf] bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-[#2c3e35]">Omitted Content & Missing Evidence</h2>
            <ul className="mt-4 space-y-3 text-[#3f3832]">
              {payload.omittedContent.map((row) => (
                <li key={`${row.chapter}-${row.omittedField}`} className="rounded-xl bg-[#fff6f2] p-3">
                  <p className="font-semibold">{row.chapter} · {t(row.omittedField)}</p>
                  <p className="text-sm">{t(row.reason)}</p>
                  <p className="mt-1 text-xs text-[#8f7f71]">{row.missingEvidence.join(", ")}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}

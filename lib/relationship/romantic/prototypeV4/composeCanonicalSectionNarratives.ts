/**
 * Section narratives derived only from Canonical Relationship Story Plan.
 */
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type { ExpertSynthesisResult } from "./expertSynthesisTypes";
import {
  subjectP,
  topicP,
  sanitizeParticles,
  pick,
  type NarrativeLocale,
} from "./narrativeLocale";

export type CanonicalChapterId =
  | "c1_hero"
  | "c2_attraction"
  | "c3_dynamics"
  | "c4_conflict"
  | "c5_misunderstanding"
  | "c6_hidden_hearts"
  | "c7_repair"
  | "c8_strength_vulnerability"
  | "c9_daily_life"
  | "c10_future_timing"
  | "c11_reflection"
  | "c12_choice";

export type CanonicalSectionBlock = {
  blockId: string;
  title: string;
  body: string;
  evidenceIds: string[];
  structuredData?: any;
  expertSynthesis?: ExpertSynthesisResult;
};

export type CanonicalSection = {
  chapterId: CanonicalChapterId;
  title: string;
  userQuestion: string;
  visible: boolean;
  hideReason?: string;
  blocks: CanonicalSectionBlock[];
  primaryEvidenceIds: string[];
};

const TITLES_KO: Record<CanonicalChapterId, { title: string; userQuestion: string }> = {
  c1_hero: {
    title: "우리는 어떤 커플인가",
    userQuestion: "What is the core definition and bond of this relationship?",
  },
  c2_attraction: {
    title: "왜 서로에게 끌렸는가",
    userQuestion: "Why are we drawn to each other?",
  },
  c3_dynamics: {
    title: "우리가 관계를 맺는 방식",
    userQuestion: "How do we show up in private, under responsibility, and under stress?",
  },
  c4_conflict: {
    title: "실제로 자주 부딪히는 순간",
    userQuestion: "What is our recurring loop and how does it start?",
  },
  c5_misunderstanding: {
    title: "마음이 잘못 번역되는 순간",
    userQuestion: "Why do we misread each other and what do we actually need?",
  },
  c6_hidden_hearts: {
    title: "가장 깊은 곳, 숨은 마음",
    userQuestion: "What are the hidden fears and unspoken needs beneath the surface?",
  },
  c7_repair: {
    title: "다시 가까워지는 방법",
    userQuestion: "How can we safely de-escalate and repair after a fight?",
  },
  c8_strength_vulnerability: {
    title: "함께라서 강해지는 것과 취약해지는 것",
    userQuestion: "What is our greatest power and vulnerability as a couple?",
  },
  c9_daily_life: {
    title: "현실에서 마주하는 장면들",
    userQuestion: "Where do our differences show up in everyday habits and decisions?",
  },
  c10_future_timing: {
    title: "올해 우리 관계의 흐름",
    userQuestion: "What cycles and transitions should we watch for?",
  },
  c11_reflection: {
    title: "관계를 통해 배우는 것",
    userQuestion: "What is this relationship teaching me about myself?",
  },
  c12_choice: {
    title: "이해한 뒤 우리가 선택할 것",
    userQuestion: "What will I do with this understanding?",
  },
};

const TITLES_EN: Record<CanonicalChapterId, { title: string; userQuestion: string }> = {
  c1_hero: {
    title: "Who We Are as a Couple",
    userQuestion: "What is the core definition and bond of this relationship?",
  },
  c2_attraction: {
    title: "Why We Were Drawn to Each Other",
    userQuestion: "Why are we drawn to each other?",
  },
  c3_dynamics: {
    title: "How We Show Up With Each Other",
    userQuestion: "How do we show up in private, under responsibility, and under stress?",
  },
  c4_conflict: {
    title: "Where We Actually Keep Clashing",
    userQuestion: "What is our recurring loop and how does it start?",
  },
  c5_misunderstanding: {
    title: "Where Our Hearts Get Lost in Translation",
    userQuestion: "Why do we misread each other and what do we actually need?",
  },
  c6_hidden_hearts: {
    title: "The Deepest Place, Our Hidden Hearts",
    userQuestion: "What are the hidden fears and unspoken needs beneath the surface?",
  },
  c7_repair: {
    title: "How We Find Our Way Back to Each Other",
    userQuestion: "How can we safely de-escalate and repair after a fight?",
  },
  c8_strength_vulnerability: {
    title: "What Makes Us Strong Together, and Where We're Vulnerable",
    userQuestion: "What is our greatest power and vulnerability as a couple?",
  },
  c9_daily_life: {
    title: "Where This Shows Up in Real Life",
    userQuestion: "Where do our differences show up in everyday habits and decisions?",
  },
  c10_future_timing: {
    title: "How Our Relationship Flows This Year",
    userQuestion: "What cycles and transitions should we watch for?",
  },
  c11_reflection: {
    title: "What This Relationship Is Teaching Us",
    userQuestion: "What is this relationship teaching me about myself?",
  },
  c12_choice: {
    title: "What We Choose, Now That We Understand",
    userQuestion: "What will I do with this understanding?",
  },
};

function titlesFor(locale: NarrativeLocale): Record<CanonicalChapterId, { title: string; userQuestion: string }> {
  return locale === "en-US" ? TITLES_EN : TITLES_KO;
}

function ids(plan: CanonicalRelationshipStoryPlan, paths: string[]): string[] {
  return paths.filter((p) => plan.connectedEvidenceIds.includes(p) || p.includes("story_plan"));
}

export function composeCanonicalSectionNarratives(
  plan: CanonicalRelationshipStoryPlan,
  expertSyntheses?: Record<string, ExpertSynthesisResult>,
): CanonicalSection[] {
  const { a, b } = plan.names;
  const locale = plan.locale;
  const TITLES = titlesFor(locale);
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const unitA = plan.attraction.units?.aToB;
  const unitB = plan.attraction.units?.bToA;
  const unitMutual = plan.attraction.units?.mutual;

  // Expert synthesis lookups
  const synthAttrA = expertSyntheses?.["c2_attraction.a_to_b"];
  const synthAttrB = expertSyntheses?.["c2_attraction.b_to_a"];
  const synthAttrMutual = expertSyntheses?.["c2_attraction.mutual"];

  const synthDynPrivate = expertSyntheses?.["c3_dynamics.private"];
  const synthDynResp = expertSyntheses?.["c3_dynamics.responsibility"];
  const synthDynStress = expertSyntheses?.["c3_dynamics.stress"];

  const synthHiddenA = expertSyntheses?.["c6_hidden_hearts.a"];
  const synthHiddenB = expertSyntheses?.["c6_hidden_hearts.b"];

  const synthGiftAtoB = expertSyntheses?.["c8_strength_vulnerability.a_to_b"];
  const synthGiftBtoA = expertSyntheses?.["c8_strength_vulnerability.b_to_a"];
  const synthShared = expertSyntheses?.["c8_strength_vulnerability.shared"];


  const sections: CanonicalSection[] = [
    {
      chapterId: "c1_hero",
      ...TITLES.c1_hero,
      visible: true,
      primaryEvidenceIds: ["section_1_summary"],
      blocks: [
        {
          blockId: "def.core",
          title: L("관계의 핵심 정의", "The Core of This Relationship"),
          body: plan.relationshipDefinition,
          evidenceIds: ["section_1_summary"],
        },
        {
          blockId: "def.bond",
          title: L("기본 결합 방식", "How You Come Together"),
          body: plan.bondMode,
          evidenceIds: ["canonical_projections.balance_of_power"],
        }
      ],
    },
    {
      chapterId: "c2_attraction",
      ...TITLES.c2_attraction,
      visible: true,
      primaryEvidenceIds: Array.from(
        new Set([
          ...plan.attraction.provenance.map((p) => p.evidenceId),
          ...(synthAttrA?.usedEvidenceIds ?? []),
          ...(synthAttrB?.usedEvidenceIds ?? []),
          ...(synthAttrMutual?.usedEvidenceIds ?? []),
        ]),
      ),
      blocks: [
        {
          blockId: "attr.a",
          title: L(`${subjectP(a, locale)} 끌리는 지점`, `What Draws ${a} In`),
          body: unitA
            ? [
                `${unitA.recognition}\n${unitA.emotionalMeaning}`,
                unitA.partnerEvidence.join(" "),
                unitA.scene ? L(`대표적인 순간: ${unitA.scene}`, `A telling moment: ${unitA.scene}`) : "",
                unitA.tensionBridge ? L(`주의할 지점: ${unitA.tensionBridge}`, `Something to watch for: ${unitA.tensionBridge}`) : "",
              ]
                .filter(Boolean)
                .join("\n\n")
            : [
                plan.attraction.aSeeks.seeksInPartner,
                plan.attraction.aSeeks.partnerMatchPoint,
                plan.attraction.aSeeks.cautionReasons?.length
                  ? L(`주의할 지점: ${plan.attraction.aSeeks.cautionReasons.join(" ")}`, `Something to watch for: ${plan.attraction.aSeeks.cautionReasons.join(" ")}`)
                  : "",
              ]
                .filter(Boolean)
                .join("\n\n"),
          structuredData: unitA,
          expertSynthesis: synthAttrA,
          evidenceIds: Array.from(
            new Set([
              ...plan.attraction.aSeeks.provenance.map((p) => p.evidenceId),
              ...(synthAttrA?.usedEvidenceIds ?? []),
            ]),
          ),
        },
        {
          blockId: "attr.b",
          title: L(`${subjectP(b, locale)} 끌리는 지점`, `What Draws ${b} In`),
          body: unitB
            ? [
                `${unitB.recognition}\n${unitB.emotionalMeaning}`,
                unitB.partnerEvidence.join(" "),
                unitB.scene ? L(`대표적인 순간: ${unitB.scene}`, `A telling moment: ${unitB.scene}`) : "",
                unitB.tensionBridge ? L(`주의할 지점: ${unitB.tensionBridge}`, `Something to watch for: ${unitB.tensionBridge}`) : "",
              ]
                .filter(Boolean)
                .join("\n\n")
            : [
                plan.attraction.bSeeks.seeksInPartner,
                plan.attraction.bSeeks.partnerMatchPoint,
                plan.attraction.bSeeks.cautionReasons?.length
                  ? L(`주의할 지점: ${plan.attraction.bSeeks.cautionReasons.join(" ")}`, `Something to watch for: ${plan.attraction.bSeeks.cautionReasons.join(" ")}`)
                  : "",
              ]
                .filter(Boolean)
                .join("\n\n"),
          structuredData: unitB,
          expertSynthesis: synthAttrB,
          evidenceIds: Array.from(
            new Set([
              ...plan.attraction.bSeeks.provenance.map((p) => p.evidenceId),
              ...(synthAttrB?.usedEvidenceIds ?? []),
            ]),
          ),
        },
        {
          blockId: "attr.unique",
          title: L("둘 사이에서만 나타나는 특별한 시너지", "The Special Synergy Only the Two of You Have"),
          body: unitMutual
            ? [
                `${unitMutual.recognition}\n${unitMutual.emotionalMeaning}`,
                unitMutual.partnerEvidence.length ? unitMutual.partnerEvidence.join(" ") : "",
                unitMutual.scene ? L(`대표적인 순간: ${unitMutual.scene}`, `A telling moment: ${unitMutual.scene}`) : "",
                unitMutual.tensionBridge ? L(`가장 강했던 끌림이 긴장으로 바뀔 때: ${unitMutual.tensionBridge}`, `When your strongest pull turns into tension: ${unitMutual.tensionBridge}`) : "",
              ]
                .filter(Boolean)
                .join("\n\n")
            : `${plan.attraction.uniqueCombination}\n\n${plan.attraction.flipsToConflictWhen}`,
          structuredData: unitMutual,
          expertSynthesis: synthAttrMutual,
          evidenceIds: Array.from(
            new Set([
              ...plan.attraction.provenance.map((p) => p.evidenceId),
              ...(synthAttrMutual?.usedEvidenceIds ?? []),
            ]),
          ),
        },
      ],
    },
    {
      chapterId: "c3_dynamics",
      ...TITLES.c3_dynamics,
      visible: true,
      primaryEvidenceIds: Array.from(
        new Set([
          ...plan.faces.flatMap((f) => f.provenance.map((p) => p.evidenceId)),
          ...(synthDynPrivate?.usedEvidenceIds ?? []),
          ...(synthDynResp?.usedEvidenceIds ?? []),
          ...(synthDynStress?.usedEvidenceIds ?? []),
        ]),
      ),
      blocks: plan.faces.map((f) => {
        const synth =
          f.situation === "private"
            ? synthDynPrivate
            : f.situation === "responsibility"
              ? synthDynResp
              : synthDynStress;
        return {
          blockId: `face.${f.situation}`,
          title:
            f.situation === "private"
              ? L("둘만 있을 때 드러나는 본래의 결", "Who You Are When It's Just the Two of You")
              : f.situation === "responsibility"
                ? L("현실과 책임을 다룰 때 마주하는 기준", "How You Handle Reality and Responsibility")
                : L("스트레스나 긴장이 생겼을 때의 자동 반응", "Your Automatic Reactions Under Stress or Tension"),
          body: [
            f.appearance,
            f.mechanism ? L(`상호작용의 원리: ${f.mechanism}`, `How this plays out between you: ${f.mechanism}`) : "",
            f.benefit ? L(`관계에서 얻는 긍정적 효과: ${f.benefit}`, `The upside for your relationship: ${f.benefit}`) : "",
            f.riskWhenExcess ? L(`주의할 균형점: ${f.riskWhenExcess}`, `A balance point to watch: ${f.riskWhenExcess}`) : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          structuredData: f,
          expertSynthesis: synth,
          evidenceIds: Array.from(
            new Set([
              ...f.provenance.map((p) => p.evidenceId),
              ...(synth?.usedEvidenceIds ?? []),
            ]),
          ),
        };
      }),
    },
    {
      chapterId: "c4_conflict",
      ...TITLES.c4_conflict,
      visible: true,
      primaryEvidenceIds: plan.recurringLoop.provenance.map((p) => p.evidenceId),
      blocks: [
        {
          blockId: "loop.trigger",
          title: L("시작 상황", "How It Starts"),
          body: L(
            `이런 장면에서 나타날 가능성이 있어요: ${plan.recurringLoop.triggerScene}`,
            `This tends to show up in a scene like: ${plan.recurringLoop.triggerScene}`,
          ),
          evidenceIds: plan.recurringLoop.provenance.map((p) => p.evidenceId),
        },
        {
          blockId: "loop.steps",
          title: L("반복 흐름", "The Repeating Pattern"),
          body: plan.recurringLoop.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
          evidenceIds: plan.recurringLoop.provenance.map((p) => p.evidenceId),
        }
      ],
    },
    {
      chapterId: "c5_misunderstanding",
      ...TITLES.c5_misunderstanding,
      visible: true,
      primaryEvidenceIds: plan.topDifferences.flatMap((d) => d.evidenceRefs.map((p) => p.evidenceId)),
      blocks: [
        ...plan.topDifferences.map((d) => ({
          blockId: `axis.diff.${d.axisKey}`,
          title: L(`큰 차이 · ${d.axisLabel}`, `A Big Difference · ${d.axisLabel}`),
          body: d.plainLanguageDefinition,
          structuredData: d,
          evidenceIds: d.evidenceRefs.map((p) => p.evidenceId),
        })),
        ...plan.misreads.map((m) => {
          const label =
            m.direction === "a_observes_b"
              ? L(`${a}이/가 겪은 ${b}의 행동`, `${b}'s Behavior, as ${a} Experiences It`)
              : L(`${b}이/가 겪은 ${a}의 행동`, `${a}'s Behavior, as ${b} Experiences It`);
          return {
            blockId: `misread.${m.direction}`,
            title: label,
            body: [
              L(`겉에서 일어난 일: ${m.observedBehavior}`, `What happens on the outside: ${m.observedBehavior}`),
              L(`내리기 쉬운 해석: ${m.commonNegativeReading}`, `The easy misreading: ${m.commonNegativeReading}`),
              L(`의미의 차이: ${m.meaningGap}`, `What it actually means: ${m.meaningGap}`),
            ].join("\n"),
            evidenceIds: m.provenance.map((p) => p.evidenceId),
          };
        })
      ],
    },
    {
      chapterId: "c6_hidden_hearts",
      ...TITLES.c6_hidden_hearts,
      visible: true,
      primaryEvidenceIds: Array.from(
        new Set([
          ...plan.hiddenHearts.flatMap((h) => h.provenance.map((p) => p.evidenceId)),
          ...(synthHiddenA?.usedEvidenceIds ?? []),
          ...(synthHiddenB?.usedEvidenceIds ?? []),
        ]),
      ),
      blocks: plan.hiddenHearts.map((h) => {
        const personName = h.person === "a" ? a : b;
        const synth = h.person === "a" ? synthHiddenA : synthHiddenB;
        return {
          blockId: `hidden.${h.person}`,
          title: L(`${personName}의 숨은 마음`, `${personName}'s Hidden Heart`),
          body: [
            L(`겉으로 드러나는 모습: ${h.visibleReaction}`, `What shows on the surface: ${h.visibleReaction}`),
            L(`마음 깊은 곳의 실제 감정: ${h.innerFeeling}`, `What they actually feel deep down: ${h.innerFeeling}`),
            L(`가장 조심스러운 두려움: ${h.fear}`, `Their most guarded fear: ${h.fear}`),
            L(`상대가 알아주었으면 하는 온전한 바람: ${h.unspokenNeed}`, `What they most wish their partner understood: ${h.unspokenNeed}`),
            L(`상대에게 진정으로 도움이 되는 태도: ${h.whatHelps}`, `What genuinely helps, from their partner: ${h.whatHelps}`),
          ].join("\n\n"),
          structuredData: h,
          expertSynthesis: synth,
          evidenceIds: Array.from(
            new Set([
              ...h.provenance.map((p) => p.evidenceId),
              ...(synth?.usedEvidenceIds ?? []),
            ]),
          ),
        };
      }),
    },
    {
      chapterId: "c7_repair",
      ...TITLES.c7_repair,
      visible: true,
      primaryEvidenceIds: plan.repair?.provenance?.map((p) => p.evidenceId) ?? [],
      blocks: [
        {
          blockId: "repair.sequence",
          title: L("회복 순서", "How to Repair, Step by Step"),
          body: (plan.repair?.sequence ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n"),
          evidenceIds: plan.repair?.provenance?.map((p) => p.evidenceId) ?? [],
        },
        {
          blockId: "repair.helpsA",
          title: L(`${a}에게 도움이 되는 것`, `What Helps ${a}`),
          body: (plan.repair?.helpsA ?? []).map((s) => `• ${s}`).join("\n"),
          evidenceIds: plan.repair?.provenance?.map((p) => p.evidenceId) ?? [],
        },
        {
          blockId: "repair.helpsB",
          title: L(`${b}에게 도움이 되는 것`, `What Helps ${b}`),
          body: (plan.repair?.helpsB ?? []).map((s) => `• ${s}`).join("\n"),
          evidenceIds: plan.repair?.provenance?.map((p) => p.evidenceId) ?? [],
        }
      ],
    },
    {
      chapterId: "c8_strength_vulnerability",
      ...TITLES.c8_strength_vulnerability,
      visible: true,
      primaryEvidenceIds: Array.from(
        new Set([
          ...(plan.bilateralChanges ?? []).flatMap((c) =>
            c.provenance.map((p) => p.evidenceId),
          ),
          "ce.pair.common",
          "canonical_projections.pair_ce_bonding",
          "ce.pair.tension",
          "canonical_projections.pair_ce_tension",
          ...(synthGiftAtoB?.usedEvidenceIds ?? []),
          ...(synthGiftBtoA?.usedEvidenceIds ?? []),
          ...(synthShared?.usedEvidenceIds ?? []),
        ]),
      ),
      blocks: [
        ...(plan.bilateralChanges ?? []).map((c) => {
          const synth = c.from === "a" ? synthGiftAtoB : synthGiftBtoA;
          return {
            blockId: `gift.${c.from}_to_${c.to}`,
            title: c.from === "a"
              ? L(`${a} → ${b} 서로에게 주는 영향`, `${a} → ${b}: The Impact You Have on Each Other`)
              : L(`${b} → ${a} 서로에게 주는 영향`, `${b} → ${a}: The Impact You Have on Each Other`),
            body: L(
              `${c.change}\n\n과해질 때의 취약점: ${c.excessVulnerability}`,
              `${c.change}\n\nThe vulnerability when this goes too far: ${c.excessVulnerability}`,
            ),
            structuredData: c,
            expertSynthesis: synth,
            evidenceIds: Array.from(
              new Set([
                ...c.provenance.map((p) => p.evidenceId),
                ...(synth?.usedEvidenceIds ?? []),
              ]),
            ),
          };
        }),
        {
          blockId: "shared.strength",
          title: L("둘이 함께 만들어내는 가장 큰 강점", "Your Greatest Strength Together"),
          body: plan.sharedStrength,
          expertSynthesis: synthShared,
          evidenceIds: Array.from(
            new Set([
              "ce.pair.common",
              "canonical_projections.pair_ce_bonding",
              ...(synthShared?.usedEvidenceIds ?? []),
            ]),
          ),
        },
        {
          blockId: "shared.vulnerability",
          title: L("함께 경계해야 할 공동의 취약점", "The Shared Vulnerability to Watch For"),
          body: plan.sharedVulnerability,
          expertSynthesis: synthShared,
          evidenceIds: Array.from(
            new Set([
              "ce.pair.tension",
              "canonical_projections.pair_ce_tension",
              ...(synthShared?.usedEvidenceIds ?? []),
            ]),
          ),
        },
      ],
    },
    {
      chapterId: "c9_daily_life",
      ...TITLES.c9_daily_life,
      visible: (plan.realLifeDomains ?? []).length > 0,
      primaryEvidenceIds: (plan.realLifeDomains ?? []).flatMap((d) =>
        d.provenance.map((p) => p.evidenceId),
      ),
      blocks: (plan.realLifeDomains ?? []).map((d) => ({
        blockId: `life.${d.domainId}`,
        title: d.title,
        // structuredData carries difference/agreement/usableLine as separate
        // fields — adaptDailyLife (components/relationship/romantic/v4/adaptCanonicalSection.ts)
        // must read those instead of parsing the "차이:"/"합의:"/"문장:" labels
        // below out of body, since those labels are Korean-only literals here
        // and would silently return nothing once this body is in English.
        body: L(
          [`차이: ${d.difference}`, `합의: ${d.agreement}`, `문장: ${d.usableLine}`].join("\n"),
          [`Difference: ${d.difference}`, `Agreement: ${d.agreement}`, `Try saying: ${d.usableLine}`].join("\n"),
        ),
        structuredData: d,
        evidenceIds: d.provenance.map((p) => p.evidenceId),
      })),
    },
    {
      chapterId: "c10_future_timing",
      ...TITLES.c10_future_timing,
      visible: Boolean(plan.timing?.available),
      hideReason: plan.timing?.available
        ? undefined
        : (plan.timing?.hideReason ?? L(
            "2026년 관계 타이밍 분석 데이터가 연결되지 않아 해당 챕터를 비공개 처리합니다.",
            "This chapter is hidden because no relationship-timing analysis data is connected for 2026.",
          )),
      primaryEvidenceIds: plan.timing?.provenance?.map((p) => p.evidenceId) || [],
      blocks: plan.timing?.available
        ? [
            ...(plan.timing.theme ? [{
              blockId: "timing.theme",
              title: L(`${plan.timing.year}년 테마`, `${plan.timing.year} Theme`),
              body: plan.timing.theme,
              evidenceIds: plan.timing.provenance.map((p) => p.evidenceId),
            }] : []),
            ...((plan.timing.favorableWindows ?? []).length > 0 ? [{
              blockId: "timing.favorable",
              title: L("유리한 시기", "Favorable Windows"),
              body: plan.timing.favorableWindows.join("\n"),
              evidenceIds: plan.timing.provenance.map((p) => p.evidenceId),
            }] : []),
            ...((plan.timing.cautionWindows ?? []).length > 0 ? [{
              blockId: "timing.caution",
              title: L("주의가 필요한 시기", "Windows to Watch"),
              body: plan.timing.cautionWindows.join("\n"),
              evidenceIds: plan.timing.provenance.map((p) => p.evidenceId),
            }] : [])
          ]
        : [],
    },
    {
      chapterId: "c11_reflection",
      ...TITLES.c11_reflection,
      visible: true,
      primaryEvidenceIds: [],
      blocks: [
        {
          blockId: "close.questions",
          title: L("스스로 판단할 질문", "Questions to Sit With"),
          body: (plan.closing?.decisionQuestions ?? []).map((q) => `• ${q}`).join("\n"),
          evidenceIds: [],
        }
      ]
    },
    {
      chapterId: "c12_choice",
      ...TITLES.c12_choice,
      visible: true,
      primaryEvidenceIds: ["story_plan.repair"],
      blocks: [
        {
          blockId: "close.possibility",
          title: L("지금의 가능성", "What's Possible From Here"),
          body: plan.closing?.presentPossibility ?? "",
          evidenceIds: ids(plan, ["story_plan.repair"]),
        },
        {
          blockId: "close.remember",
          title: L("기억할 문장", "A Line to Remember"),
          body: `${plan.closing?.rememberA ?? ""}\n${plan.closing?.rememberB ?? ""}`,
          evidenceIds: [],
        }
      ],
    }
  ];

  return sections;
}

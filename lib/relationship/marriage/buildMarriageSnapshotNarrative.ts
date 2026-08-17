import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import type {
  SnapshotTopicNarrative,
  SnapshotNarrative,
} from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import type { RelationshipTopicGauge } from "@/lib/relationship/triScoreSnapshot/types";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { subjectParticle } from "@/lib/relationship/koreanParticles";

// Part2① 종합 관계 지수 11축 확인문구 — 로맨틱 Batch 2(관계공감/갈등직면성)와
// 같은 non-invasive 원칙: 판정 점수(computeMarriageMasterScores)는 안 건드리고
// intimacy/stability 토픽에만 확인/유보 문구를 별도로 얹는다. conflict(홈
// 리스크)는 스펙이 축을 지정하지 않아 대상 아님.
const AXIS_NOTE_HIGH = 60;
const AXIS_NOTE_LOW = 40;

function axisScore(
  psych: PsychMasterJson | null | undefined,
  key: SecondaryAxisKey,
): number | null {
  const v = psych?.secondary_axes?.[key];
  return typeof v === "number" ? v : null;
}

/** intimacy(로맨틱 핏) — 관계공감(empathy) 평균으로 확인/유보 */
function resolveRomanticFitAxisNote(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
): string | null {
  const empathyA = axisScore(psychA, "empathy");
  const empathyB = axisScore(psychB, "empathy");
  if (empathyA == null || empathyB == null) return null;
  const avg = (empathyA + empathyB) / 2;
  if (avg >= AXIS_NOTE_HIGH) {
    return pick(
      locale,
      "Your empathy axis scores are both on the high side, so the romantic fit your charts show has a good chance of coming through as real affection.",
      "관계공감 축도 둘 다 높은 편이라, 사주로 보이는 로맨틱 핏이 실제 애정 표현으로도 잘 이어질 가능성이 커요.",
    );
  }
  if (avg <= AXIS_NOTE_LOW) {
    return pick(
      locale,
      "Your empathy axis is on the low side, so even with good fit, it may take a bit more conscious effort for it to come through as affection.",
      "관계공감 축은 낮은 편이라, 핏이 좋아도 애정 표현으로 이어지려면 조금 더 의식적인 노력이 필요할 수 있어요.",
    );
  }
  return null;
}

/** stability(라이프 시너지) — 계획구조화(structure) 평균으로 확인/유보 */
function resolveLifeSynergyAxisNote(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
): string | null {
  const structureA = axisScore(psychA, "structure");
  const structureB = axisScore(psychB, "structure");
  if (structureA == null || structureB == null) return null;
  const avg = (structureA + structureB) / 2;
  if (avg >= AXIS_NOTE_HIGH) {
    return pick(
      locale,
      "Your planning-structure axis scores are both on the high side, a good combination for turning chores, finances, and childcare into a working system together.",
      "계획구조화 축도 둘 다 높은 편이라, 가사·재정·육아를 시스템으로 맞춰 가기 유리한 조합이에요.",
    );
  }
  if (avg <= AXIS_NOTE_LOW) {
    return pick(
      locale,
      "Your planning-structure axis is on the low side, so without putting your role agreements into writing or routine, the synergy can fizzle out.",
      "계획구조화 축은 낮은 편이라, 역할 합의를 문서·루틴으로 명시해 두지 않으면 시너지가 흐지부지될 수 있어요.",
    );
  }
  return null;
}

function interpretMarriageTopic(
  gauge: RelationshipTopicGauge,
  ctx: MarriageRuleContext,
  psychA?: PsychMasterJson | null,
  psychB?: PsychMasterJson | null,
  /** patched section_money_chores.cfo_nickname — omit → base fallback */
  finalCfoNickname?: string | null,
): SnapshotTopicNarrative {
  const locale = ctx.locale ?? LEGACY_FALLBACK_LOCALE;
  const config = getTriScoreKindConfig("cohabitation", locale);
  const topicMeta = config.topics.find((t) => t.topic === gauge.topic);
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);
  const day = ctx.marriagePairAnalysis.dayBranch;

  if (gauge.topic === "intimacy") {
    const core = pick(
      locale,
      activation >= 70
        ? "Your bedroom and attachment rhythm align naturally. Touch and your nighttime frequency tend to match well."
        : activation >= 58
          ? "A combination where fit rises the closer you get. Just aligning pace and touch is enough."
          : "There's a body/emotion rhythm difference. Without conversation, nights can turn awkward.",
      activation >= 70
        ? "침실·애착 리듬이 자연스럽게 맞습니다. 스킨십과 밤의 주파수가 잘 맞는 편."
        : activation >= 58
          ? "가까워질수록 핏이 올라가는 조합. 속도·촉감만 맞추면 충분합니다."
          : "신체·정서 리듬 차이가 있습니다. 대화 없이는 밤이 어색해질 수 있어요.",
    );
    const bed = pick(
      locale,
      day.bedFitLevel === "excellent"
        ? " Your nighttime chemistry is especially strong."
        : day.bedFitLevel === "needs_tune"
          ? " Tuning your rhythm in the bedroom is essential."
          : "",
      day.bedFitLevel === "excellent"
        ? " 밤의 케미가 특히 강합니다."
        : day.bedFitLevel === "needs_tune"
          ? " 침실에서 리듬 조율이 필수입니다."
          : "",
    );
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "① Romantic Fit & Attachment", "① 로맨틱 핏·애착"),
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: `${core}${bed}`,
      isWarning: false,
      axisNote: resolveRomanticFitAxisNote(psychA, psychB, locale),
    };
  }

  if (gauge.topic === "stability") {
    const core = pick(
      locale,
      benefit >= 68
        ? "There's plenty of room for chores, finances, and childcare to mesh like gears."
        : benefit >= 50
          ? "You can raise this by agreeing on roles and designating a CFO."
          : "Friction over money, roles, and childcare can be frequent. Without a system, only hurt feelings pile up.",
      benefit >= 68
        ? "가사·재정·육아가 톱니바퀴처럼 맞물릴 여지가 큽니다."
        : benefit >= 50
          ? "역할 합의와 CFO 지정으로 끌어올릴 수 있습니다."
          : "돈·역할·육아에서 마찰이 잦을 수 있습니다. 시스템이 없으면 서운함만 쌓입니다.",
    );
    // final CFO(section_money_chores) 우선 — legacy/direct-call만 base fallback
    const cfo = finalCfoNickname?.trim() || ctx.tenGod.cfo.nickname;
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "② Life Synergy", "② 라이프 시너지"),
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: pick(
        locale,
        `${core} In your operating mix, having ${cfo} make the final call on the bank account and big spending is the more stable setup.`,
        `${core} 현재 두 사람의 운영 조합에서는 ${subjectParticle(cfo)} 통장·큰 지출의 최종 확인을 맡는 편이 안정적입니다.`,
      ),
      isWarning: false,
      axisNote: resolveLifeSynergyAxisNote(psychA, psychB, locale),
    };
  }

  const isWarning = risk >= 70;
  const core = pick(
    locale,
    risk >= 60
      ? "A pattern where household stress and conflict can easily rise."
      : risk >= 40
        ? "There's room to recover even when conflict comes up, but bringing up several topics at once causes a blow-up."
        : "Home risk is relatively low. Just keep the boundaries and the peace lasts long.",
    risk >= 60
      ? "집 안 스트레스·갈등이 올라가기 쉬운 패턴입니다."
      : risk >= 40
        ? "갈등이 와도 회복 여지는 있지만, 한 번에 여러 주제를 꺼내면 폭발합니다."
        : "홈 리스크는 비교적 낮은 편. 경계만 지키면 평화가 길어집니다.",
  );
  const tip = pick(
    locale,
    risk >= 55
      ? " Just one of childcare, chores, or money at a time. No heavy conversation right after getting home from work."
      : "",
    risk >= 55
      ? " 육아·가사·돈은 한 번에 하나만. 퇴근 직후 무거운 대화 금지."
      : "",
  );

  return {
    topic: gauge.topic,
    title: topicMeta?.cardTitle ?? pick(locale, "③ Home Risk", "③ 홈 리스크"),
    subtitle: topicMeta?.cardSubtitle ?? "",
    activation,
    benefit,
    risk,
    interpretation: `${core}${tip}`,
    isWarning,
  };
}

export function buildMarriageSnapshotNarrative(params: {
  ctx: MarriageRuleContext;
  relationshipGauges: RelationshipTopicGauge[];
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  /** canonical refined CFO from section_money_chores; omit → ctx.tenGod.cfo */
  finalCfoNickname?: string | null;
}): SnapshotNarrative {
  return {
    topics: params.relationshipGauges.map((g) =>
      interpretMarriageTopic(
        g,
        params.ctx,
        params.psychA,
        params.psychB,
        params.finalCfoNickname,
      ),
    ),
  };
}

export function buildMarriageSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
): SnapshotNarrative {
  const stubCtx = {
    marriagePairAnalysis: { dayBranch: { bedFitLevel: "good" } },
    tenGod: { cfo: { nickname: "파트너" } },
  } as MarriageRuleContext;

  return {
    topics: gauges.map((g) => interpretMarriageTopic(g, stubCtx)),
  };
}

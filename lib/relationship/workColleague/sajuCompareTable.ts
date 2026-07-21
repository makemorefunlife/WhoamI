import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import {
  dominantElement,
  resolveWorkCategory,
  sanitizeOfficeText,
  ELEMENT_OFFICE,
} from "./officeLanguage";
import type { TenGodCategory } from "./tenGodComplement";

/**
 * "한눈에 비교" 표 — 팀 회의에서 확정한 6개 협업 비교축.
 *
 * 설문(11축 심리) 기반이 아니라 **사주 신호가 메인**이 되도록 설계했다(제품
 * 방향: 심리 설문 11축은 Part 3 레이더로 그대로 두고, 이 표는 사주를 읽는
 * 자리). 6행 중 5개는 이미 다른 곳에서 계산되고 있던 신호를 재사용하고,
 * 양간/음간(보고·협업 리듬)만 이번에 새로 추가했다.
 *
 * | 행 | 신호 | 근거 |
 * |---|---|---|
 * | 공사 구분선 | 격국(십신 범주) | resolveWorkCategory — officeLanguage.ts SSOT |
 * | 피드백 수용 | 격국(십신 범주) | 위와 동일 신호, 다른 해석 |
 * | 협업 시너지 포지션 | 오행(일간 기준 우세 오행) | dominantElement — ELEMENT_OFFICE 라벨 재사용 |
 * | 번아웃 대처 | 일지(day branch) | BRANCH_CRISIS_STYLE과 동일 소스, 표용 짧은 라벨만 신규 |
 * | 딜메이킹·추진 기질 | 신강/신약(일간 강약) | ctx.strengthA/B — 이미 계산돼 있던 값(경계 문구에서만 쓰이던 것) |
 * | 보고·협업 리듬 | 일간 양간/음간 | 신규 — 이번에 추가한 유일한 새 신호 |
 */

export type WorkCompareRowId =
  | "boundary"
  | "feedback"
  | "synergy_position"
  | "burnout"
  | "risk_taking"
  | "reporting_rhythm";

export type WorkCompareRow = {
  id: WorkCompareRowId;
  label: string;
  personA: { nickname: string; shortLabel: string };
  personB: { nickname: string; shortLabel: string };
  meaning: string;
};

// ---- 행 1·2: 격국(십신 범주) 기반 -----------------------------------------

const BOUNDARY_LABEL: Record<Locale, Record<TenGodCategory, string>> = {
  "ko-KR": {
    재성: "실속형 — 필요한 스몰토크만",
    관성: "공사 구분형 — 일은 일, 사는 사",
    식상: "사교형 — 잡담도 업무 에너지",
    인성: "관망형 — 편할 때만 조용히 참여",
    비겁: "동료 밀착형 — 분위기·스몰토크 중요",
  },
  "en-US": {
    재성: "Efficiency-first — small talk only when useful",
    관성: "Boundary-keeper — work is work, life is life",
    식상: "Social connector — chatter is part of the energy",
    인성: "Low-key observer — joins in only when comfortable",
    비겁: "Team-bonder — mood and small talk matter",
  },
};

const FEEDBACK_LABEL: Record<Locale, Record<TenGodCategory, string>> = {
  "ko-KR": {
    비겁: "자존심 스위치형 — 인정이 먼저 필요",
    인성: "이성적 수용형 — 시간 주면 스스로 정리",
    관성: "근거 확인형 — 기준부터 짚고 넘어감",
    식상: "즉시 반응형 — 그 자리에서 바로 표현",
    재성: "결과 중심형 — 손해·성과로 설득되면 수긍",
  },
  "en-US": {
    비겁: "Pride-sensitive — needs recognition first",
    인성: "Rational processor — sorts it out alone, given time",
    관성: "Fact-checker — wants the standard clarified first",
    식상: "Instant reactor — responds right on the spot",
    재성: "Outcome-focused — convinced by cost/results, not words",
  },
};

// ---- 행 3: 오행(우세 원소) 기반 --------------------------------------------

const ELEMENT_SYNERGY_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same:
      "같은 오행 결을 갖고 있어서, 새 프로젝트를 대하는 태도(개척 vs 안정)가 비슷해요. 같은 유형의 일을 두고 경쟁하지 않게 영역만 나누면 좋아요.",
    diff:
      "한쪽은 새 판을 짜는 데, 다른 쪽은 이미 있는 룰을 정교하게 다듬는 데 강해요. 신사업·개척은 앞쪽에, 리스크 점검·운영은 뒤쪽에 맡기면 시너지가 나요.",
  },
  "en-US": {
    same:
      "You share the same elemental lean, so your instinct toward new projects (pioneering vs. steady) is similar. Split territory so you're not competing over the same type of work.",
    diff:
      "One of you is stronger at building something new, the other at refining existing rules. Hand new-business/pioneering work to the first and risk-checking/operations to the second for real synergy.",
  },
};

// ---- 행 4: 일지(day branch) 기반 -------------------------------------------

const BRANCH_BURNOUT_LABEL: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    ja: "정면돌파형 — 판을 바꾸며 푼다",
    chuk: "인내축적형 — 버티다 조용히 방향 전환",
    in: "홀로해소형 — 자리 비우고 혼자 정리",
    myo: "거리두기형 — 예민해지면 조용히 멀어짐",
    jin: "재구성형 — 구조부터 다시 짜려 함",
    sa: "속도전형 — 빨리 끝내고 털어냄",
    o: "표출형 — 동료와 말하며 에너지 발산",
    mi: "방어형 — 방어적으로 굳고 혼자 시간 필요",
    sin: "즉시지적형 — 기준 무너지면 바로 표현",
    yu: "완벽민감형 — 디테일 하나로 예민해짐",
    sul: "선긋기형 — 영역 침범당하면 단호히 거리",
    hae: "잠행형 — 회피하다 뒤늦게 몰아서 표출",
  },
  "en-US": {
    ja: "Head-on type — changes the board to cope",
    chuk: "Endurance type — grinds it out, then quietly shifts",
    in: "Solo-processor — steps away to sort it out alone",
    myo: "Distancer — grows sensitive, quietly pulls back",
    jin: "Rebuilder — wants to restructure from the ground up",
    sa: "Speed-runner — rushes to finish and shake it off",
    o: "Expresser — talks it out with coworkers to release energy",
    mi: "Defender — gets guarded, needs alone time",
    sin: "Instant-caller — flags it the moment a standard slips",
    yu: "Perfection-sensitive — one small detail can tip the mood",
    sul: "Line-drawer — draws a firm boundary if territory is crossed",
    hae: "Avoider — dodges it, then releases it all at once later",
  },
};

const BURNOUT_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "스트레스를 푸는 리듬이 비슷해서, 힘든 시기에 서로 방식을 오해할 일이 적어요.",
    diff: "한쪽은 표현하며 풀고 다른 쪽은 혼자 정리하는 편이라, 힘들어 보여도 방식이 다를 뿐 무관심이 아니라는 걸 서로 알아두면 좋아요.",
  },
  "en-US": {
    same: "You recharge in a similar rhythm, so there's little room for misreading each other during hard stretches.",
    diff: "One of you releases stress by talking it out, the other by processing alone — worth remembering that's just a different style, not disinterest.",
  },
};

// ---- 행 5: 신강/신약(일간 강약) 기반 ---------------------------------------

type RiskBand = "strong" | "weak" | "balanced";

function resolveRiskBand(strengthLabel: string): RiskBand {
  if (strengthLabel.includes("신강")) return "strong";
  if (strengthLabel.includes("신약")) return "weak";
  return "balanced";
}

const RISK_LABEL: Record<Locale, Record<RiskBand, string>> = {
  "ko-KR": {
    strong: "돌격형 — 리스크 감수하고 밀어붙임",
    weak: "신중형 — 리스크 최소화하며 확인",
    balanced: "상황대응형 — 판마다 다르게 움직임",
  },
  "en-US": {
    strong: "Risk-taker — pushes forward and accepts the risk",
    weak: "Risk-minimizer — double-checks before moving",
    balanced: "Context-adaptive — shifts approach case by case",
  },
};

const RISK_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "리스크를 대하는 온도가 비슷해서, 큰 결정에서 속도가 안 어긋나요.",
    diff: "한쪽이 문을 열고 다른 쪽이 리스크를 점검하면 균형 잡힌 딜메이킹이 가능해요 — 역할을 미리 정해두면 충돌이 줄어요.",
  },
  "en-US": {
    same: "You're at a similar temperature on risk, so big decisions don't clash on pace.",
    diff: "One of you opens the door while the other checks the risk — that split makes for balanced deal-making if you agree on roles ahead of time.",
  },
};

// ---- 행 6: 일간 양간/음간 --------------------------------------------------

const YANG_STEMS = new Set(["gap", "byeong", "mu", "gyeong", "im"]);

type RhythmBand = "yang" | "yin";

function resolveRhythmBand(dayStemCode: string): RhythmBand {
  return YANG_STEMS.has(dayStemCode) ? "yang" : "yin";
}

const RHYTHM_LABEL: Record<Locale, Record<RhythmBand, string>> = {
  "ko-KR": {
    yang: "결론 우선형 — 핵심부터 짚고 세부는 나중",
    yin: "맥락 설명형 — 과정과 배경을 함께 짚어야 이해",
  },
  "en-US": {
    yang: "Conclusion-first — leads with the point, details later",
    yin: "Context-first — needs the process and background explained",
  },
};

const RHYTHM_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "보고·회의에서 원하는 정보량이 비슷해서 대화 리듬이 잘 맞아요.",
    diff: "보고할 때 한쪽은 결론부터, 다른 쪽은 맥락부터 원해요. '결론 한 줄 + 필요하면 배경 설명' 순서로 합의하면 서로 답답함이 줄어요.",
  },
  "en-US": {
    same: "You want a similar amount of detail in reports and meetings, so your conversation rhythm matches naturally.",
    diff: "One of you wants the conclusion first, the other wants context first. Agreeing on 'headline first, background on request' cuts down on frustration for both.",
  },
};

// ---- 빌더 ------------------------------------------------------------------

export function buildWorkSajuCompareTable(
  ctx: WorkColleagueContext,
): WorkCompareRow[] {
  const locale = ctx.locale ?? LEGACY_FALLBACK_LOCALE;

  const categoryA = resolveWorkCategory(ctx.tenGodsA, ctx.workSignalsA);
  const categoryB = resolveWorkCategory(ctx.tenGodsB, ctx.workSignalsB);

  const elementA = dominantElement(ctx.workPairAnalysis.chartA);
  const elementB = dominantElement(ctx.workPairAnalysis.chartB);

  const branchA = ctx.workPairAnalysis.chartA.dayBranchCode;
  const branchB = ctx.workPairAnalysis.chartB.dayBranchCode;

  const riskBandA = resolveRiskBand(ctx.strengthA.label);
  const riskBandB = resolveRiskBand(ctx.strengthB.label);

  const rhythmBandA = resolveRhythmBand(ctx.workPairAnalysis.chartA.dayStemCode);
  const rhythmBandB = resolveRhythmBand(ctx.workPairAnalysis.chartB.dayStemCode);

  const row = (
    id: WorkCompareRowId,
    label: string,
    shortLabelA: string,
    shortLabelB: string,
    meaning: string,
  ): WorkCompareRow => ({
    id,
    label,
    personA: { nickname: ctx.nicknameA, shortLabel: sanitizeOfficeText(shortLabelA) },
    personB: { nickname: ctx.nicknameB, shortLabel: sanitizeOfficeText(shortLabelB) },
    meaning: sanitizeOfficeText(meaning),
  });

  return [
    row(
      "boundary",
      pick(locale, "Work/Life Boundary", "공사 구분선"),
      BOUNDARY_LABEL[locale][categoryA],
      BOUNDARY_LABEL[locale][categoryB],
      categoryA === categoryB
        ? pick(
            locale,
            "You draw the line between work and personal chat in a similar place, so there's little friction there.",
            "일과 사적인 대화의 경계를 비슷한 곳에 긋는 편이라 이 지점에서는 마찰이 적어요.",
          )
        : pick(
            locale,
            "One of you treats small talk as part of the work rhythm, the other keeps it separate — knowing this up front avoids reading the other as cold or unfocused.",
            "한쪽은 스몰토크를 업무 리듬의 일부로 여기고, 다른 쪽은 분리해요 — 서로 냉정하다/산만하다고 오해하지 않으려면 이 차이를 미리 알아두면 좋아요.",
          ),
    ),
    row(
      "feedback",
      pick(locale, "Feedback Receptivity", "피드백 수용 스타일"),
      FEEDBACK_LABEL[locale][categoryA],
      FEEDBACK_LABEL[locale][categoryB],
      categoryA === categoryB
        ? pick(
            locale,
            "You process feedback in a similar way, so corrections rarely turn into hurt feelings between you.",
            "피드백을 받아들이는 방식이 비슷해서, 지적이 감정싸움으로 잘 안 번져요.",
          )
        : pick(
            locale,
            "Give feedback to each other differently — one needs recognition alongside the correction, the other just wants the standard stated plainly.",
            "피드백 전달 방식을 다르게 가져가세요 — 한쪽에는 지적과 함께 인정을 얹고, 다른 쪽에는 기준만 담백하게 말하는 게 더 잘 통해요.",
          ),
    ),
    row(
      "synergy_position",
      pick(locale, "Collaboration Synergy Position", "협업 시너지 포지션"),
      ELEMENT_OFFICE[locale][elementA] ?? elementA,
      ELEMENT_OFFICE[locale][elementB] ?? elementB,
      elementA === elementB
        ? ELEMENT_SYNERGY_MEANING[locale].same
        : ELEMENT_SYNERGY_MEANING[locale].diff,
    ),
    row(
      "burnout",
      pick(locale, "Office Burnout Coping", "오피스 번아웃 대처"),
      BRANCH_BURNOUT_LABEL[locale][branchA] ?? branchA,
      BRANCH_BURNOUT_LABEL[locale][branchB] ?? branchB,
      branchA === branchB ? BURNOUT_MEANING[locale].same : BURNOUT_MEANING[locale].diff,
    ),
    row(
      "risk_taking",
      pick(locale, "Deal-Making & Risk Appetite", "딜메이킹 & 추진 기질"),
      RISK_LABEL[locale][riskBandA],
      RISK_LABEL[locale][riskBandB],
      riskBandA === riskBandB ? RISK_MEANING[locale].same : RISK_MEANING[locale].diff,
    ),
    row(
      "reporting_rhythm",
      pick(locale, "Reporting & Collaboration Rhythm", "보고·협업 리듬"),
      RHYTHM_LABEL[locale][rhythmBandA],
      RHYTHM_LABEL[locale][rhythmBandB],
      rhythmBandA === rhythmBandB
        ? RHYTHM_MEANING[locale].same
        : RHYTHM_MEANING[locale].diff,
    ),
  ];
}

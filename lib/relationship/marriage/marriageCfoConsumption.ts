/**
 * Part2③ 자산 관리 주도권(CFO) & 소비 스위치 — 사양서의 "정재/관성(미래 안정)
 * vs 편재/식상(현재 삶의 질)" 소비가치관 분리 + 11축[현실실리/자기통제] 확인문구.
 * 둘 다 기존 CFO 판정(`pickHouseholdCfo`)이나 `WEALTH_GODS` 합산 로직은 안
 * 건드리고, 별도 확인/보강 텍스트만 만든다(Batch 2와 동일한 non-invasive 원칙).
 */
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

type SpendingLean = "stability" | "experience" | "balanced";

function resolveSpendingLean(counts: TenGodCounts): SpendingLean {
  const jeongJae = counts["정재"] ?? 0;
  const pyeonJae = counts["편재"] ?? 0;
  if (jeongJae === pyeonJae) return "balanced";
  return jeongJae > pyeonJae ? "stability" : "experience";
}

/** 정재(안정 지향) vs 편재(경험 지향) — 사주 전용, psych 불필요 */
export function resolveSpendingStyleNote(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  const leanA = resolveSpendingLean(countsA);
  const leanB = resolveSpendingLean(countsB);

  if (leanA === leanB) {
    if (leanA === "stability") {
      return pick(
        locale,
        `${nicknameA} & ${nicknameB} both lean toward saving and future security — agree on a shared savings target early so neither feels the other is "too tight."`,
        `${nicknameA} & ${nicknameB} 둘 다 적금·미래 대비 쪽으로 기우는 편이에요 — 공동 저축 목표를 미리 합의해 두면 서로 "너무 짠 거 아니야?" 하는 서운함이 안 생겨요.`,
      );
    }
    if (leanA === "experience") {
      return pick(
        locale,
        `${nicknameA} & ${nicknameB} both lean toward spending on experiences and quality of life — set a monthly "fun budget" cap together so enjoying life doesn't quietly drain savings.`,
        `${nicknameA} & ${nicknameB} 둘 다 경험·삶의 질에 지출하는 쪽으로 기우는 편이에요 — 매달 "즐거움 예산" 상한을 같이 정해 두면 즐기다가 저축이 조용히 줄어드는 일을 막을 수 있어요.`,
      );
    }
    return pick(
      locale,
      `${nicknameA} & ${nicknameB} are both fairly balanced between saving and spending — no strong tendency to correct, just keep checking in occasionally.`,
      `${nicknameA} & ${nicknameB} 둘 다 저축·소비 사이에서 비교적 균형 잡힌 편이에요 — 딱히 교정할 성향은 없고, 가끔 서로 확인만 하면 돼요.`,
    );
  }

  const [stableName, otherName, otherLean] =
    leanA === "stability" ? [nicknameA, nicknameB, leanB] : [nicknameB, nicknameA, leanA];

  if (otherLean === "experience") {
    return pick(
      locale,
      `${stableName} leans toward saving and future security, while ${otherName} leans toward spending on today's experiences — split the budget into a "future" pot and a "today" pot so neither side's values get overridden.`,
      `${stableName}은(는) 저축·미래 대비 쪽, ${otherName}은(는) 오늘의 경험·삶의 질 쪽으로 기울어요 — 예산을 "미래" 통장과 "오늘" 통장으로 나눠 두면 어느 한쪽 가치관이 눌리지 않아요.`,
    );
  }

  return pick(
    locale,
    `${stableName} leans toward saving, and ${otherName} is fairly balanced — ${stableName}'s instinct toward security can guide shared savings, with room for ${otherName}'s occasional splurges.`,
    `${stableName}은(는) 저축 쪽으로 기울고 ${otherName}은(는) 비교적 균형 잡힌 편이에요 — ${stableName}의 안정 감각을 공동 저축 기준으로 삼되, ${otherName}의 가끔의 지출은 여유를 둬도 좋아요.`,
  );
}

const AXIS_NOTE_GAP_HIGH = 20;
const AXIS_NOTE_GAP_LOW = 8;

/**
 * CFO로 뽑힌 사람의 현실실리(practicality)/자기통제(self_control) 평균이
 * 파트너보다 뚜렷이 높으면 확인, 오히려 낮으면 유보 문구. 격차가 작으면 null
 * (억지로 안 붙임). `pickHouseholdCfo`의 기존 판정 자체는 안 건드림.
 */
export function resolveCfoAxisNote(
  psychMatch: PsychMatchResult | null,
  cfoIsA: boolean,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychMatch) return null;
  const practicality = psychMatch.axis_results.find((r) => r.axis_key === "practicality");
  const selfControl = psychMatch.axis_results.find((r) => r.axis_key === "self_control");
  if (!practicality || !selfControl) return null;

  const cfoScore =
    ((cfoIsA ? practicality.score_a : practicality.score_b) +
      (cfoIsA ? selfControl.score_a : selfControl.score_b)) /
    2;
  const partnerScore =
    ((cfoIsA ? practicality.score_b : practicality.score_a) +
      (cfoIsA ? selfControl.score_b : selfControl.score_a)) /
    2;
  const diff = cfoScore - partnerScore;

  if (diff >= AXIS_NOTE_GAP_HIGH) {
    return pick(
      locale,
      "The 11-axis survey backs this up too — this person's practicality and self-control scores run clearly higher, so the CFO role fits the psychological data as well.",
      "11축 설문에서도 확인돼요 — 이 사람의 현실실리·자기통제 점수가 뚜렷하게 높아서, CFO 역할이 심리 데이터로도 뒷받침돼요.",
    );
  }
  if (diff <= AXIS_NOTE_GAP_LOW * -1) {
    return pick(
      locale,
      "Survey scores actually lean the other way on practicality/self-control — the saju-based pick may need a second look together before locking it in.",
      "설문 점수는 오히려 반대로 나와요(현실실리·자기통제) — 사주 기반 CFO 지정을 그대로 확정하기 전에 둘이 한 번 더 확인해 보세요.",
    );
  }
  return null;
}
